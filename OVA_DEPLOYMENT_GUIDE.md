# Helpdesk & CMDB - OVA Deployment Guide

This guide shows you how to create a redistributable Rocky Linux 9.6 OVA with the Helpdesk application pre-installed.

---

## Overview

**Deployment Strategy:**
1. **Phase 1**: Build the "golden image" VM with internet access
2. **Phase 2**: Prepare VM for OVA export (clean up, generalize)
3. **Phase 3**: Export as OVA file
4. **Phase 4**: Deploy OVA at customer sites (air-gapped or networked)

**What You'll End Up With:**
- A single `.ova` file (~3-5 GB) containing everything pre-configured
- Customers can import and run immediately with minimal setup
- All dependencies, database, and application pre-installed

---

# PHASE 1: BUILD THE GOLDEN IMAGE

## Prerequisites

- Rocky Linux 9.6 VM running
- Internet connectivity
- At least 20GB disk space
- 4GB RAM minimum (8GB recommended)
- VMware, VirtualBox, or KVM hypervisor

---

## Step 1.1: Update System

```bash
# Update all packages
sudo dnf update -y

# Install essential tools
sudo dnf install -y epel-release wget curl git vim nano net-tools

# Reboot if kernel was updated
sudo reboot
```

---

## Step 1.2: Install Node.js 20

```bash
# Install from Rocky Linux AppStream (recommended)
sudo dnf module reset nodejs -y
sudo dnf module install -y nodejs:20/common

# Verify installation
node --version   # Should show v20.x.x
npm --version    # Should show v10.x.x
```

**Alternative: Use NodeSource for latest patches**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

---

## Step 1.3: Install PostgreSQL 15

```bash
# Add PostgreSQL official repository
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Disable built-in PostgreSQL module
sudo dnf -qy module disable postgresql

# Install PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15-contrib

# Initialize database
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# Start and enable PostgreSQL
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15

# Verify
sudo systemctl status postgresql-15
```

---

## Step 1.4: Configure PostgreSQL

```bash
# Configure authentication
sudo sed -i 's/peer/md5/g' /var/lib/pgsql/15/data/pg_hba.conf
sudo sed -i 's/ident/md5/g' /var/lib/pgsql/15/data/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql-15

# Set postgres password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'TempPassword123!';"
```

---

## Step 1.5: Create Application User and Directory

```bash
# Create dedicated user
sudo useradd -r -m -d /opt/helpdesk -s /bin/bash helpdesk

# Create application directory structure
sudo mkdir -p /opt/helpdesk/{app,uploads/branding}
sudo chown -R helpdesk:helpdesk /opt/helpdesk
```

---

## Step 1.6: Deploy Application Code

### Option A: Clone from Git Repository

```bash
# Switch to helpdesk user
sudo su - helpdesk

# Clone your repository
cd /opt/helpdesk
git clone <your-repo-url> app
cd app

# Install dependencies
npm install

# Build the application
npm run build

# Exit back to regular user
exit
```

### Option B: Upload Application Files

```bash
# From your development machine, create deployment package
tar -czf helpdesk-app.tar.gz \
  package.json package-lock.json \
  dist/ \
  client/dist/ \
  shared/ \
  server/ \
  drizzle.config.ts

# Transfer to VM
scp helpdesk-app.tar.gz user@rocky-vm:/tmp/

# On the VM, extract as helpdesk user
sudo su - helpdesk
cd /opt/helpdesk/app
tar -xzf /tmp/helpdesk-app.tar.gz

# Install dependencies
npm install --production

exit
```

---

## Step 1.7: Configure Environment Variables

```bash
# Generate secure credentials
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
SESSION_SECRET=$(openssl rand -base64 48 | tr -d "=+/")

# Create .env file
sudo tee /opt/helpdesk/app/.env > /dev/null << EOF
# Database Configuration
DATABASE_URL=postgresql://helpdesk_user:${DB_PASSWORD}@localhost:5432/helpdesk_production
PGHOST=localhost
PGPORT=5432
PGUSER=helpdesk_user
PGPASSWORD=${DB_PASSWORD}
PGDATABASE=helpdesk_production

# Session Security
SESSION_SECRET=${SESSION_SECRET}

# Application Settings
NODE_ENV=production
PORT=5000

# License (optional - can be configured post-deployment)
# Customers will activate their own license
EOF

# Save credentials for later reference
echo "Database Password: ${DB_PASSWORD}" | sudo tee /root/helpdesk-credentials.txt
echo "Session Secret: ${SESSION_SECRET}" | sudo tee -a /root/helpdesk-credentials.txt
sudo chmod 600 /root/helpdesk-credentials.txt

# Set proper permissions
sudo chown helpdesk:helpdesk /opt/helpdesk/app/.env
sudo chmod 600 /opt/helpdesk/app/.env
```

---

## Step 1.8: Create Database

```bash
# Extract database password from .env
DB_PASSWORD=$(grep PGPASSWORD /opt/helpdesk/app/.env | cut -d'=' -f2)

# Create database and user
sudo -u postgres psql << EOF
CREATE USER helpdesk_user WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
CREATE DATABASE helpdesk_production OWNER helpdesk_user;
GRANT ALL PRIVILEGES ON DATABASE helpdesk_production TO helpdesk_user;

-- Connect to the database and grant schema privileges
\c helpdesk_production
GRANT ALL ON SCHEMA public TO helpdesk_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO helpdesk_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO helpdesk_user;
EOF

# Initialize database schema
sudo -u helpdesk bash -c 'cd /opt/helpdesk/app && npm run db:push'
```

---

## Step 1.9: Create systemd Service

```bash
# Create service file
sudo tee /etc/systemd/system/helpdesk.service > /dev/null << 'EOF'
[Unit]
Description=Helpdesk & CMDB Application
Documentation=https://github.com/yourorg/helpdesk
After=network.target postgresql-15.service
Requires=postgresql-15.service

[Service]
Type=simple
User=helpdesk
Group=helpdesk
WorkingDirectory=/opt/helpdesk/app
EnvironmentFile=/opt/helpdesk/app/.env
ExecStart=/usr/bin/node dist/index.js

# Restart configuration
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/helpdesk

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=helpdesk

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable helpdesk
sudo systemctl start helpdesk

# Check status
sudo systemctl status helpdesk

# View logs
sudo journalctl -u helpdesk -f
```

---

## Step 1.10: Install and Configure Nginx (Recommended)

```bash
# Install Nginx
sudo dnf install -y nginx

# Create configuration
sudo tee /etc/nginx/conf.d/helpdesk.conf > /dev/null << 'EOF'
upstream helpdesk_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    # Static file serving for uploads
    location /uploads {
        alias /opt/helpdesk/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy all other requests to Node.js
    location / {
        proxy_pass http://helpdesk_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Remove default server block
sudo rm -f /etc/nginx/nginx.conf.default
sudo sed -i '/server {/,/^}/d' /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Step 1.11: Configure Firewall

```bash
# Configure firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Reload firewall
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

---

## Step 1.12: Configure SELinux

```bash
# Allow Nginx to connect to Node.js backend
sudo setsebool -P httpd_can_network_connect 1

# Allow Nginx to read/write uploads directory
sudo chcon -R -t httpd_sys_rw_content_t /opt/helpdesk/uploads
```

---

## Step 1.13: Test the Application

```bash
# Test from localhost
curl http://localhost

# Check logs
sudo journalctl -u helpdesk -n 50
sudo journalctl -u nginx -n 50

# Access from browser
# http://<vm-ip-address>

# Test login
# Default credentials: admin@helpdesk.local / admin
# (You'll be forced to change password on first login)
```

---

## Step 1.14: Create First-Boot Configuration Script

This script will run on first boot at customer sites to configure hostname, network, etc.

```bash
# Create first-boot script
sudo tee /usr/local/bin/helpdesk-firstboot.sh > /dev/null << 'EOF'
#!/bin/bash
# Helpdesk First-Boot Configuration Script

MARKER=/var/lib/helpdesk-configured

# Only run once
if [ -f "$MARKER" ]; then
    exit 0
fi

echo "============================================"
echo "  Helpdesk & CMDB - First Boot Setup"
echo "============================================"
echo ""

# Get network configuration
read -p "Enter hostname for this server [helpdesk]: " HOSTNAME
HOSTNAME=${HOSTNAME:-helpdesk}
hostnamectl set-hostname $HOSTNAME

# Display network info
echo ""
echo "Network Configuration:"
ip addr show | grep "inet " | grep -v 127.0.0.1

echo ""
echo "Installation complete!"
echo ""
echo "Access the application at: http://$(hostname -I | awk '{print $1}')"
echo "Default login: admin@helpdesk.local / admin"
echo "You must change the password on first login."
echo ""

# Create marker file
touch $MARKER

echo "Setup complete. Rebooting in 5 seconds..."
sleep 5
reboot
EOF

sudo chmod +x /usr/local/bin/helpdesk-firstboot.sh

# Create systemd service for first boot
sudo tee /etc/systemd/system/helpdesk-firstboot.service > /dev/null << 'EOF'
[Unit]
Description=Helpdesk First Boot Configuration
After=network.target
Before=display-manager.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/helpdesk-firstboot.sh
StandardInput=tty
StandardOutput=tty
TTYPath=/dev/console
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

# Enable the service (it will run once, then disable itself)
sudo systemctl enable helpdesk-firstboot.service
```

---

# PHASE 2: PREPARE VM FOR OVA EXPORT

Before creating the OVA, we need to clean up and generalize the VM.

## Step 2.1: Create README for Customers

```bash
# Create README that will be displayed at first login
sudo tee /etc/motd > /dev/null << 'EOF'
===============================================================================
                    HELPDESK & CMDB SYSTEM - Ready to Use
===============================================================================

 Default Credentials:
   Username: admin@helpdesk.local
   Password: admin (MUST be changed on first login)

 Services:
   - Helpdesk Application: http://THIS_SERVER_IP
   - PostgreSQL Database: localhost:5432
   - All services start automatically

 Important Files:
   - Application: /opt/helpdesk/app
   - Uploads: /opt/helpdesk/uploads
   - Logs: journalctl -u helpdesk
   - Configuration: /opt/helpdesk/app/.env

 Support:
   - Documentation: /opt/helpdesk/README.md
   - Logs: sudo journalctl -u helpdesk -f

===============================================================================
EOF
```

---

## Step 2.2: Create Deployment Documentation

```bash
# Create comprehensive README
sudo tee /opt/helpdesk/README.md > /dev/null << 'EOF'
# Helpdesk & CMDB System - Deployment Guide

## Quick Start

1. **Access the Application**
   - Open browser: http://<this-server-ip>
   - Default login: admin@helpdesk.local / admin
   - Change password on first login

2. **Network Configuration**
   - Set static IP: `nmtui` or edit /etc/NetworkManager/system-connections/
   - Configure DNS in your network settings
   - Update firewall if needed

3. **License Activation**
   - Navigate to Admin → License
   - Enter your license key
   - System will verify and activate

## Service Management

```bash
# Start/Stop Application
sudo systemctl start helpdesk
sudo systemctl stop helpdesk
sudo systemctl restart helpdesk

# View Logs
sudo journalctl -u helpdesk -f

# Check Status
sudo systemctl status helpdesk
sudo systemctl status postgresql-15
sudo systemctl status nginx
```

## Database Management

```bash
# Access Database
sudo -u postgres psql -d helpdesk_production

# Backup Database
sudo -u postgres pg_dump helpdesk_production > backup_$(date +%Y%m%d).sql

# Restore Database
sudo -u postgres psql helpdesk_production < backup.sql
```

## Troubleshooting

**Application won't start:**
```bash
sudo journalctl -u helpdesk -n 100
```

**Database connection errors:**
```bash
sudo systemctl status postgresql-15
cat /opt/helpdesk/app/.env | grep DATABASE_URL
```

**Nginx issues:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Configured firewall rules
- [ ] Set up regular database backups
- [ ] Reviewed SELinux settings
- [ ] Updated system packages
- [ ] Configured SSL/TLS (if needed)

## System Requirements

- Rocky Linux 9.6
- 4GB RAM minimum (8GB recommended)
- 20GB disk space minimum
- Network connectivity for users

## Support

For assistance:
- Check logs: `sudo journalctl -u helpdesk -f`
- Review configuration: `/opt/helpdesk/app/.env`
- Database credentials: `/root/helpdesk-credentials.txt`

EOF
```

---

## Step 2.3: Clean Up for OVA Export

```bash
# Stop services temporarily
sudo systemctl stop helpdesk
sudo systemctl stop nginx

# Clean package cache
sudo dnf clean all

# Remove temporary files
sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*

# Clean logs (optional - keeps recent logs)
sudo journalctl --vacuum-time=1d

# Or clear all logs
# sudo journalctl --vacuum-size=1M

# Remove SSH host keys (will be regenerated on first boot)
sudo rm -f /etc/ssh/ssh_host_*

# Remove machine-id (will be regenerated)
sudo rm -f /etc/machine-id
sudo touch /etc/machine-id

# Clean bash history
history -c
cat /dev/null > ~/.bash_history
sudo cat /dev/null > /root/.bash_history

# Remove network-specific configuration (optional)
# sudo rm -f /etc/NetworkManager/system-connections/*

# Zero out free space (optional, reduces OVA size)
# WARNING: This can take a long time!
# sudo dd if=/dev/zero of=/EMPTY bs=1M || true
# sudo rm -f /EMPTY

# Restart services
sudo systemctl start nginx
sudo systemctl start helpdesk
```

---

## Step 2.4: Final Verification

```bash
# Verify all services are running
sudo systemctl status helpdesk
sudo systemctl status postgresql-15
sudo systemctl status nginx

# Test web access
curl -I http://localhost

# Check enabled services
sudo systemctl list-unit-files | grep enabled | grep -E 'helpdesk|postgresql|nginx'
```

---

## Step 2.5: Shutdown VM for Export

```bash
# Graceful shutdown
sudo shutdown -h now
```

---

# PHASE 3: EXPORT AS OVA

Choose your hypervisor:

## For VMware ESXi / vSphere

```bash
# Using ovftool (from VMware workstation)
ovftool \
  --name="Helpdesk-CMDB-v1.0" \
  --diskMode=thin \
  --exportFlags=noDevices \
  vi://username@esxi-host/vm-name \
  helpdesk-cmdb-v1.0.ova
```

**Or via vSphere Web UI:**
1. Right-click VM → Export → Export OVF Template
2. Choose format: OVA (Single file)
3. Download

---

## For VirtualBox

1. **Via GUI:**
   - File → Export Appliance
   - Select the VM
   - Format: OVA
   - Include manifest
   - Export

2. **Via Command Line:**
```bash
VBoxManage export "Helpdesk VM" \
  --output helpdesk-cmdb-v1.0.ova \
  --manifest \
  --vsys 0 \
  --product "Helpdesk & CMDB System" \
  --version "1.0.0" \
  --vendor "Your Company" \
  --description "Enterprise IT Service Management with ITIL workflows"
```

---

## For KVM / QEMU

```bash
# Convert to OVA format
virt-v2v -i libvirt helpdesk-vm -o local -of ova -os /export/path/

# Or export to OVF then package as OVA
virsh dumpxml helpdesk-vm > helpdesk-vm.xml
qemu-img convert -O vmdk /var/lib/libvirt/images/helpdesk-vm.qcow2 helpdesk-vm.vmdk

# Create OVF descriptor (requires manual OVF file creation)
# Then package:
tar -cvf helpdesk-cmdb-v1.0.ova helpdesk-vm.ovf helpdesk-vm.vmdk
```

---

# PHASE 4: DEPLOY OVA AT CUSTOMER SITES

## Step 4.1: Import OVA

### VMware
```bash
# Via ovftool
ovftool --name="Customer-Helpdesk" helpdesk-cmdb-v1.0.ova vi://username@esxi-host/

# Or via vSphere UI
# File → Deploy OVF Template → Browse → helpdesk-cmdb-v1.0.ova
```

### VirtualBox
```bash
# GUI: File → Import Appliance → Browse → helpdesk-cmdb-v1.0.ova

# CLI:
VBoxManage import helpdesk-cmdb-v1.0.ova \
  --vsys 0 \
  --vmname "Customer Helpdesk" \
  --cpus 4 \
  --memory 8192
```

### KVM
```bash
# Extract OVA
tar -xvf helpdesk-cmdb-v1.0.ova

# Convert VMDK to QCOW2
qemu-img convert -f vmdk -O qcow2 helpdesk-vm.vmdk /var/lib/libvirt/images/helpdesk-vm.qcow2

# Create VM from image
virt-install \
  --name helpdesk-customer \
  --memory 8192 \
  --vcpus 4 \
  --disk /var/lib/libvirt/images/helpdesk-vm.qcow2 \
  --import \
  --os-variant rhel9.0 \
  --network bridge=br0
```

---

## Step 4.2: First Boot at Customer Site

1. **Power on VM**
2. **First-boot script runs** (if configured)
3. **Access web interface:** `http://<vm-ip>`
4. **Login:** admin@helpdesk.local / admin
5. **Change password** (forced)
6. **Activate license** (if using license system)

---

## Step 4.3: Customer-Specific Configuration

### Network Configuration
```bash
# Set static IP
sudo nmtui

# Or edit connection directly
sudo nmcli con mod "System eth0" \
  ipv4.addresses "192.168.1.100/24" \
  ipv4.gateway "192.168.1.1" \
  ipv4.dns "192.168.1.1" \
  ipv4.method manual

sudo nmcli con up "System eth0"
```

### Hostname
```bash
sudo hostnamectl set-hostname helpdesk.customer.local
```

### Firewall (if more restrictive)
```bash
# Allow only specific IPs
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" accept'
sudo firewall-cmd --reload
```

---

# OVA BEST PRACTICES

## Size Optimization

1. **Thin Provision Disks** - Only use space needed
2. **Minimal Install** - Remove unnecessary packages
3. **Zero Free Space** - Run `dd` command before export (reduces compression)
4. **Compress** - Use gzip on final OVA

```bash
# Compress OVA after export
gzip helpdesk-cmdb-v1.0.ova
# Result: helpdesk-cmdb-v1.0.ova.gz (much smaller)
```

## Security

- ✅ No default passwords (force change on first login)
- ✅ Unique machine-id per deployment
- ✅ Regenerate SSH keys on first boot
- ✅ Firewall enabled by default
- ✅ SELinux enforcing
- ✅ All services run as non-root

## Documentation

Include in your OVA distribution:
- README.md with deployment instructions
- System requirements
- Default credentials
- Network configuration guide
- Troubleshooting section
- License agreement (if applicable)

---

# QUICK REFERENCE

## OVA Creation Checklist

- [ ] All services installed and tested
- [ ] Default admin password set (will be changed on first login)
- [ ] Database initialized and working
- [ ] Firewall configured
- [ ] SELinux configured
- [ ] README created at /opt/helpdesk/README.md
- [ ] MOTD updated with helpful info
- [ ] Logs cleaned
- [ ] SSH keys removed
- [ ] machine-id removed
- [ ] Temporary files cleaned
- [ ] Services enabled for auto-start
- [ ] VM shutdown gracefully
- [ ] OVA exported successfully
- [ ] OVA tested in clean environment

## Typical OVA Sizes

- Minimal install: ~2-3 GB
- With logs cleaned: ~3-4 GB
- After gzip compression: ~1-2 GB

## Deployment Time

- Import OVA: 5-10 minutes
- First boot: 2-3 minutes
- Initial configuration: 5 minutes
- **Total: ~15-20 minutes** to running system

---

**Your redistributable OVA is complete!** 🎉

Customers can now deploy your Helpdesk & CMDB system in minutes, whether they have internet access or are completely air-gapped.
