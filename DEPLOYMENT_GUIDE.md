# Helpdesk & CMDB Deployment Guide for Rocky Linux 9.6 (Air-Gapped)

This guide walks you through deploying the Helpdesk application to an air-gapped Rocky Linux 9.6 server.

---

## Overview

**Your Application Stack:**
- Frontend: React + Vite (needs building)
- Backend: Node.js 20 + Express + TypeScript
- Database: PostgreSQL 15 (Neon driver adapted for standard PostgreSQL)
- Authentication: Replit OIDC (needs to be replaced or configured)

**Deployment Phases:**
1. **PREPARATION** (on internet-connected machine)
2. **TRANSFER** (move files to air-gapped VM)
3. **INSTALLATION** (on Rocky Linux VM)
4. **CONFIGURATION** (database, environment, services)
5. **VERIFICATION** (testing and validation)

---

## PHASE 1: PREPARATION (Internet-Connected Machine)

### Step 1.1: Clone/Download This Project

```bash
# If you have git access
git clone <your-repo-url> helpdesk-deploy
cd helpdesk-deploy

# Or download and extract the project files
```

### Step 1.2: Install Build Dependencies

```bash
# Install Node.js 20 (if not already installed)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify versions
node --version  # Should be v20.x.x
npm --version   # Should be v10.x.x
```

### Step 1.3: Build the Application

```bash
# Install all dependencies
npm install

# Build the frontend and backend
npm run build

# This creates:
# - dist/ folder with compiled backend
# - client/dist/ folder with built frontend
```

### Step 1.4: Bundle Dependencies for Offline Installation

**Option A: Bundle entire node_modules (Simplest)**

```bash
# Install production dependencies only
npm ci --production

# Create tarball of node_modules
tar -czf node_modules.tar.gz node_modules/

# Restore dev dependencies for local work (optional)
npm install
```

**Option B: Create offline npm cache (More flexible)**

```bash
# Install all dependencies to populate npm cache
npm install

# Create offline cache bundle
tar -czf npm-cache.tar.gz -C ~/.npm .

# Create package bundle
npm pack
```

### Step 1.5: Download Node.js RPMs for Rocky Linux 9

```bash
# Create directory for RPMs
mkdir -p rocky-packages

# Method 1: Download from NodeSource repo
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf download --resolve --destdir=rocky-packages nodejs

# Method 2: Use Rocky Linux module (Node 20 available in AppStream)
sudo dnf module reset nodejs -y
sudo dnf module enable nodejs:20 -y
sudo dnf download --resolve --destdir=rocky-packages nodejs npm

# List downloaded RPMs
ls -lh rocky-packages/
```

### Step 1.6: Download PostgreSQL RPMs

```bash
# Download PostgreSQL 15 from official repo
wget https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm -P rocky-packages/

# Or download PostgreSQL from Rocky repos (version 13)
sudo dnf download --resolve --destdir=rocky-packages postgresql-server postgresql-contrib
```

### Step 1.7: Create Deployment Package

```bash
# Create deployment structure
mkdir -p helpdesk-deployment/{app,packages,scripts}

# Copy built application
cp -r dist/ helpdesk-deployment/app/
cp -r client/dist/ helpdesk-deployment/app/public/
cp package.json package-lock.json helpdesk-deployment/app/
cp -r shared/ helpdesk-deployment/app/
cp -r server/ helpdesk-deployment/app/

# Copy dependencies
cp node_modules.tar.gz helpdesk-deployment/packages/

# Copy system packages
cp rocky-packages/*.rpm helpdesk-deployment/packages/

# Create environment template
cat > helpdesk-deployment/app/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://helpdesk_user:CHANGE_ME@localhost:5432/helpdesk_production
PGHOST=localhost
PGPORT=5432
PGUSER=helpdesk_user
PGPASSWORD=CHANGE_ME
PGDATABASE=helpdesk_production

# Session Security
SESSION_SECRET=GENERATE_RANDOM_STRING_HERE

# Application Settings
NODE_ENV=production
PORT=5000

# Authentication (if using Replit Auth, configure or replace)
# ISSUER_URL=https://replit.com
# CLIENT_ID=your-client-id
# CLIENT_SECRET=your-client-secret
EOF

# Create systemd service file
cat > helpdesk-deployment/scripts/helpdesk.service << 'EOF'
[Unit]
Description=Helpdesk & CMDB Application
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=helpdesk
Group=helpdesk
WorkingDirectory=/opt/helpdesk
Environment="NODE_ENV=production"
EnvironmentFile=/opt/helpdesk/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=helpdesk

[Install]
WantedBy=multi-user.target
EOF

# Create installation script
cat > helpdesk-deployment/scripts/install.sh << 'EOF'
#!/bin/bash
set -e

echo "=== Helpdesk Installation Script for Rocky Linux 9.6 ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (sudo)"
  exit 1
fi

# Install Node.js RPMs
echo "Step 1: Installing Node.js 20..."
cd packages
dnf install -y nodejs-*.rpm npm-*.rpm
cd ..

# Install PostgreSQL
echo "Step 2: Installing PostgreSQL..."
cd packages
dnf install -y pgdg-redhat-repo-*.rpm || true
dnf -qy module disable postgresql || true
dnf install -y postgresql*-server*.rpm postgresql*-contrib*.rpm
cd ..

# Initialize PostgreSQL
echo "Step 3: Initializing PostgreSQL..."
if [ -d "/var/lib/pgsql/15" ]; then
  /usr/pgsql-15/bin/postgresql-15-setup initdb || echo "Already initialized"
  systemctl enable postgresql-15
  systemctl start postgresql-15
else
  postgresql-setup --initdb || echo "Already initialized"
  systemctl enable postgresql
  systemctl start postgresql
fi

# Create application user
echo "Step 4: Creating application user..."
useradd -r -m -d /opt/helpdesk -s /bin/bash helpdesk || echo "User already exists"

# Create application directory
echo "Step 5: Setting up application files..."
mkdir -p /opt/helpdesk
cp -r app/* /opt/helpdesk/
cd /opt/helpdesk

# Extract node_modules
echo "Step 6: Installing dependencies..."
tar -xzf ../packages/node_modules.tar.gz

# Set permissions
chown -R helpdesk:helpdesk /opt/helpdesk

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Next steps:"
echo "1. Configure database (see DEPLOYMENT_GUIDE.md)"
echo "2. Edit /opt/helpdesk/.env with your settings"
echo "3. Run database migrations: sudo -u helpdesk npm run db:push"
echo "4. Install systemd service: cp scripts/helpdesk.service /etc/systemd/system/"
echo "5. Start service: systemctl start helpdesk"
EOF

chmod +x helpdesk-deployment/scripts/install.sh

# Create database setup script
cat > helpdesk-deployment/scripts/setup-database.sh << 'EOF'
#!/bin/bash
set -e

echo "=== PostgreSQL Database Setup ==="
echo ""

# Variables
DB_NAME="helpdesk_production"
DB_USER="helpdesk_user"
DB_PASS="$(openssl rand -base64 32)"

echo "Creating database and user..."

# Create user and database
sudo -u postgres psql << SQL
-- Create user
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASS}';

-- Create database
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
SQL

echo ""
echo "Database created successfully!"
echo ""
echo "Database credentials:"
echo "  Database: ${DB_NAME}"
echo "  Username: ${DB_USER}"
echo "  Password: ${DB_PASS}"
echo ""
echo "Add this to /opt/helpdesk/.env:"
echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
echo "PGHOST=localhost"
echo "PGPORT=5432"
echo "PGUSER=${DB_USER}"
echo "PGPASSWORD=${DB_PASS}"
echo "PGDATABASE=${DB_NAME}"
EOF

chmod +x helpdesk-deployment/scripts/setup-database.sh

# Create final deployment archive
tar -czf helpdesk-deployment.tar.gz helpdesk-deployment/

echo ""
echo "✅ Deployment package created: helpdesk-deployment.tar.gz"
echo "   Size: $(du -h helpdesk-deployment.tar.gz | cut -f1)"
echo ""
echo "Transfer this file to your Rocky Linux 9.6 VM"
```

---

## PHASE 2: TRANSFER TO AIR-GAPPED VM

### Step 2.1: Copy Deployment Package

**Option A: USB Drive**
```bash
# Copy to USB
cp helpdesk-deployment.tar.gz /media/usb/

# On Rocky Linux VM
cp /media/usb/helpdesk-deployment.tar.gz ~/
```

**Option B: SCP (if temporary network access)**
```bash
scp helpdesk-deployment.tar.gz user@rocky-vm-ip:~/
```

**Option C: Physical media burn**
```bash
# Burn to CD/DVD or copy to external drive
```

---

## PHASE 3: INSTALLATION ON ROCKY LINUX 9.6

### Step 3.1: Extract Deployment Package

```bash
# On Rocky Linux VM
cd ~
tar -xzf helpdesk-deployment.tar.gz
cd helpdesk-deployment
```

### Step 3.2: Run Installation Script

```bash
# Run as root
sudo bash scripts/install.sh

# This installs:
# - Node.js 20
# - PostgreSQL 15
# - Creates helpdesk user
# - Extracts application files to /opt/helpdesk
```

### Step 3.3: Configure PostgreSQL

```bash
# Run database setup script
sudo bash scripts/setup-database.sh

# Save the output - you'll need the password!
```

**Manual PostgreSQL Configuration (if needed):**

```bash
# Edit pg_hba.conf to allow local connections
sudo nano /var/lib/pgsql/15/data/pg_hba.conf

# Change these lines from 'peer' to 'md5':
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# Restart PostgreSQL
sudo systemctl restart postgresql-15
```

### Step 3.4: Configure Environment Variables

```bash
# Edit environment file
sudo nano /opt/helpdesk/.env

# Update with your database credentials from setup-database.sh
# Generate SESSION_SECRET:
SESSION_SECRET=$(openssl rand -base64 32)

# Example .env:
DATABASE_URL=postgresql://helpdesk_user:YOUR_PASSWORD@localhost:5432/helpdesk_production
SESSION_SECRET=your_generated_secret_here
NODE_ENV=production
PORT=5000
```

### Step 3.5: Initialize Database Schema

```bash
# Run as helpdesk user
sudo -u helpdesk bash -c 'cd /opt/helpdesk && npm run db:push'

# If that fails, try:
sudo -u helpdesk bash -c 'cd /opt/helpdesk && npm run db:push -- --force'
```

---

## PHASE 4: CONFIGURE SYSTEMD SERVICE

### Step 4.1: Install Service File

```bash
# Copy service file
sudo cp scripts/helpdesk.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable helpdesk

# Start service
sudo systemctl start helpdesk

# Check status
sudo systemctl status helpdesk
```

### Step 4.2: Configure Firewall

```bash
# Allow HTTP access
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-port=5000/tcp

# Reload firewall
sudo firewall-cmd --reload

# List rules
sudo firewall-cmd --list-all
```

### Step 4.3: Configure SELinux (if enforcing)

```bash
# Check SELinux status
getenforce

# If Enforcing, allow Node.js to bind to port
sudo semanage port -a -t http_port_t -p tcp 5000

# Or temporarily set to permissive for testing
sudo setenforce 0
```

---

## PHASE 5: INSTALL NGINX (OPTIONAL BUT RECOMMENDED)

### Step 5.1: Install Nginx

```bash
# Install from Rocky repos
sudo dnf install -y nginx

# Start and enable
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 5.2: Configure Nginx Reverse Proxy

```bash
# Create configuration
sudo nano /etc/nginx/conf.d/helpdesk.conf
```

Add this configuration:

```nginx
upstream helpdesk_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name helpdesk.yourcompany.local;  # Change to your hostname

    client_max_body_size 20M;

    # Serve static assets directly
    location /uploads {
        alias /opt/helpdesk/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Node.js backend
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
```

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Update firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## PHASE 6: AUTHENTICATION CONFIGURATION

**IMPORTANT:** This application uses Replit OIDC authentication by default, which won't work in an air-gapped environment.

### Option A: Local Password Authentication (Recommended for Air-Gapped)

The application includes a default admin account:
- **Username:** `admin@helpdesk.local`
- **Password:** `admin`

**⚠️ CRITICAL:** On first login, you'll be forced to change this password.

### Option B: LDAP/Active Directory Integration

The application has LDAP support built-in. Configure in the admin panel after initial setup.

### Option C: Disable OIDC (Code Changes Required)

If you need to modify authentication, we can update the code to use only local authentication. Let me know if you need this.

---

## PHASE 7: VERIFICATION & TESTING

### Step 7.1: Access the Application

```bash
# From Rocky Linux VM (text browser)
curl http://localhost:5000

# From another machine on same network
http://rocky-vm-ip:5000
# or
http://rocky-vm-ip  # if using Nginx on port 80
```

### Step 7.2: Check Logs

```bash
# Application logs
sudo journalctl -u helpdesk -f

# PostgreSQL logs
sudo journalctl -u postgresql-15 -f

# Nginx logs (if installed)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Step 7.3: Test Login

1. Navigate to `http://your-server-ip:5000`
2. Log in with: `admin@helpdesk.local` / `admin`
3. You'll be forced to change password
4. Set a strong password following the policy:
   - Minimum 8 characters
   - Must include uppercase, lowercase, number, and special character

### Step 7.4: Verify Features

- ✅ Create a ticket
- ✅ Create a configuration item in CMDB
- ✅ Create a change request
- ✅ Add a knowledge base article
- ✅ View reports
- ✅ Manage users and roles

---

## TROUBLESHOOTING

### Application won't start

```bash
# Check service status
sudo systemctl status helpdesk

# View detailed logs
sudo journalctl -u helpdesk -n 100 --no-pager

# Check if Node.js is installed
node --version

# Check if port is in use
sudo netstat -tulpn | grep 5000
```

### Database connection errors

```bash
# Test PostgreSQL connection
sudo -u postgres psql -l

# Check PostgreSQL is running
sudo systemctl status postgresql-15

# Test connection with credentials
psql -h localhost -U helpdesk_user -d helpdesk_production
```

### Permission errors

```bash
# Fix ownership
sudo chown -R helpdesk:helpdesk /opt/helpdesk

# Check SELinux denials
sudo ausearch -m avc -ts recent
```

### Nginx errors

```bash
# Test configuration
sudo nginx -t

# Check SELinux (allow Nginx to connect to backend)
sudo setsebool -P httpd_can_network_connect 1
```

---

## BACKUP & MAINTENANCE

### Database Backup Script

```bash
# Create backup directory
sudo mkdir -p /backups/helpdesk
sudo chown helpdesk:helpdesk /backups/helpdesk

# Create backup script
sudo nano /usr/local/bin/backup-helpdesk.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/backups/helpdesk"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U helpdesk_user helpdesk_production > ${BACKUP_DIR}/helpdesk_${DATE}.sql
gzip ${BACKUP_DIR}/helpdesk_${DATE}.sql

# Keep only last 30 days
find ${BACKUP_DIR} -name "helpdesk_*.sql.gz" -mtime +30 -delete

echo "Backup completed: helpdesk_${DATE}.sql.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-helpdesk.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-helpdesk.sh
```

### Update Application

```bash
# Stop service
sudo systemctl stop helpdesk

# Backup current version
sudo cp -r /opt/helpdesk /opt/helpdesk.backup.$(date +%Y%m%d)

# Extract new version
# (transfer new build and extract)

# Restart service
sudo systemctl start helpdesk
```

---

## SECURITY CHECKLIST

- ✅ Changed default admin password
- ✅ PostgreSQL uses strong passwords
- ✅ SESSION_SECRET is randomly generated
- ✅ Firewall configured (only necessary ports open)
- ✅ SELinux configured (if enforcing)
- ✅ Application runs as non-root user
- ✅ Regular backups scheduled
- ✅ Nginx configured with proper headers
- ✅ File upload directory has correct permissions

---

## Quick Reference Commands

```bash
# Start/Stop/Restart Application
sudo systemctl start helpdesk
sudo systemctl stop helpdesk
sudo systemctl restart helpdesk
sudo systemctl status helpdesk

# View Logs
sudo journalctl -u helpdesk -f

# Database Access
sudo -u postgres psql -d helpdesk_production

# Backup Database
pg_dump -h localhost -U helpdesk_user helpdesk_production > backup.sql

# Check Listening Ports
sudo netstat -tulpn | grep node
```

---

## Support & Next Steps

**After successful deployment:**

1. Configure company branding (logo, footer text) in Settings
2. Create additional user accounts
3. Set up teams and assign users
4. Configure SLA templates for customers
5. Set up alert integrations if needed
6. Configure LDAP/AD if using directory services

**Questions or Issues?**
- Check logs: `sudo journalctl -u helpdesk -n 100`
- Review PostgreSQL logs: `sudo journalctl -u postgresql-15`
- Verify environment variables: `sudo cat /opt/helpdesk/.env`

---

**Deployment Complete! 🎉**

Your Helpdesk & CMDB system should now be running on Rocky Linux 9.6 in your air-gapped environment.
