// Network Discovery Script Generator for SaaS deployments
// Generates PowerShell and Bash scripts that customers can run locally

interface ScriptOptions {
  subnet: string;
  sshUsername?: string;
  sshPassword?: string;
  sshPort?: number;
}

export function generatePowerShellScript(options: ScriptOptions): string {
  const { subnet, sshUsername = 'admin', sshPort = 22 } = options;
  
  return `<#
.SYNOPSIS
    Network Discovery Script for Victrix Servicedesk
.DESCRIPTION
    Scans the specified network range and discovers devices via SSH.
    Outputs results to a CSV file that can be imported into CMDB.
.PARAMETER Subnet
    Network subnet to scan (e.g., 192.168.1.0/24)
.PARAMETER Username
    SSH username for device access
.PARAMETER Password
    SSH password for device access
.PARAMETER Port
    SSH port (default: 22)
.EXAMPLE
    .\\NetworkDiscovery.ps1 -Subnet "192.168.1.0/24" -Username "admin" -Password "password"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Subnet = "${subnet}",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "${sshUsername}",
    
    [Parameter(Mandatory=$false)]
    [string]$Password,
    
    [Parameter(Mandatory=$false)]
    [int]$Port = ${sshPort}
)

# Output CSV file
$OutputFile = "discovered_devices_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Victrix Servicedesk - Network Discovery" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scanning subnet: $Subnet" -ForegroundColor Yellow
Write-Host "SSH Port: $Port" -ForegroundColor Yellow
Write-Host "Output file: $OutputFile" -ForegroundColor Yellow
Write-Host ""

# Initialize results array
$results = @()

# Function to parse CIDR and generate IP list
function Get-IPRange {
    param([string]$CIDR)
    
    $parts = $CIDR.Split('/')
    $ip = $parts[0]
    $prefix = [int]$parts[1]
    
    $ipBytes = [System.Net.IPAddress]::Parse($ip).GetAddressBytes()
    [Array]::Reverse($ipBytes)
    $ipInt = [System.BitConverter]::ToUInt32($ipBytes, 0)
    
    $maskInt = [uint32]([Math]::Pow(2, 32) - [Math]::Pow(2, 32 - $prefix))
    $networkInt = $ipInt -band $maskInt
    $broadcastInt = $networkInt -bor (-bnot $maskInt)
    
    $ips = @()
    for ($i = $networkInt + 1; $i -lt $broadcastInt -and $ips.Count -lt 254; $i++) {
        $bytes = [System.BitConverter]::GetBytes([uint32]$i)
        [Array]::Reverse($bytes)
        $ips += [System.Net.IPAddress]::new($bytes).ToString()
    }
    
    return $ips
}

# Function to test SSH connectivity
function Test-SSHConnection {
    param(
        [string]$IPAddress,
        [int]$Port
    )
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $tcpClient.BeginConnect($IPAddress, $Port, $null, $null)
        $wait = $asyncResult.AsyncWaitHandle.WaitOne(2000, $false)
        
        if ($wait) {
            $tcpClient.EndConnect($asyncResult)
            $tcpClient.Close()
            return $true
        } else {
            $tcpClient.Close()
            return $false
        }
    } catch {
        return $false
    }
}

# Function to discover device info (requires Posh-SSH module)
function Get-DeviceInfo {
    param(
        [string]$IPAddress,
        [string]$Username,
        [string]$Password,
        [int]$Port
    )
    
    $device = [PSCustomObject]@{
        Name = ""
        IPAddress = $IPAddress
        SerialNumber = ""
        AssetTag = ""
        Location = ""
        CIType = "server"
        Manufacturer = ""
        Model = ""
        OSVersion = ""
        Status = "active"
        Owner = ""
        Notes = "Discovered via network scan"
    }
    
    # Check if Posh-SSH is available
    if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
        Write-Host "  [!] Posh-SSH module not installed. Install with: Install-Module -Name Posh-SSH" -ForegroundColor Yellow
        Write-Host "      Using basic connectivity check only..." -ForegroundColor Yellow
        $device.Name = "Device-$IPAddress"
        return $device
    }
    
    try {
        # Import Posh-SSH
        Import-Module Posh-SSH -ErrorAction Stop
        
        # Create SSH session
        $secPassword = ConvertTo-SecureString $Password -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($Username, $secPassword)
        
        $session = New-SSHSession -ComputerName $IPAddress -Credential $credential -Port $Port -AcceptKey -ConnectionTimeout 5 -ErrorAction Stop
        
        if ($session) {
            # Get hostname
            $hostnameResult = Invoke-SSHCommand -SSHSession $session -Command "hostname" -TimeOut 5 -ErrorAction SilentlyContinue
            if ($hostnameResult) {
                $device.Name = $hostnameResult.Output.Trim()
            }
            
            # Get OS info
            $osResult = Invoke-SSHCommand -SSHSession $session -Command "cat /etc/os-release 2>/dev/null || uname -a" -TimeOut 5 -ErrorAction SilentlyContinue
            if ($osResult) {
                $device.OSVersion = ($osResult.Output -split "\\n")[0].Trim()
            }
            
            # Get hardware info (if dmidecode is available)
            $hwResult = Invoke-SSHCommand -SSHSession $session -Command "sudo dmidecode -s system-serial-number 2>/dev/null || echo 'N/A'" -TimeOut 5 -ErrorAction SilentlyContinue
            if ($hwResult -and $hwResult.Output -ne "N/A") {
                $device.SerialNumber = $hwResult.Output.Trim()
            }
            
            $mfgResult = Invoke-SSHCommand -SSHSession $session -Command "sudo dmidecode -s system-manufacturer 2>/dev/null || echo 'N/A'" -TimeOut 5 -ErrorAction SilentlyContinue
            if ($mfgResult -and $mfgResult.Output -ne "N/A") {
                $device.Manufacturer = $mfgResult.Output.Trim()
            }
            
            $modelResult = Invoke-SSHCommand -SSHSession $session -Command "sudo dmidecode -s system-product-name 2>/dev/null || echo 'N/A'" -TimeOut 5 -ErrorAction SilentlyContinue
            if ($modelResult -and $modelResult.Output -ne "N/A") {
                $device.Model = $modelResult.Output.Trim()
            }
            
            # Close session
            Remove-SSHSession -SSHSession $session | Out-Null
        }
    } catch {
        Write-Host "  [!] SSH connection failed: $($_.Exception.Message)" -ForegroundColor Red
        $device.Name = "Device-$IPAddress-NoSSH"
    }
    
    return $device
}

# Generate IP list
Write-Host "[*] Generating IP list from subnet..." -ForegroundColor Cyan
$ipList = Get-IPRange -CIDR $Subnet
Write-Host "[+] Found $($ipList.Count) IP addresses to scan" -ForegroundColor Green
Write-Host ""

# Scan each IP
$current = 0
foreach ($ip in $ipList) {
    $current++
    $percent = [math]::Round(($current / $ipList.Count) * 100)
    Write-Progress -Activity "Scanning network..." -Status "Testing $ip ($current/$($ipList.Count))" -PercentComplete $percent
    
    # Test SSH connectivity
    if (Test-SSHConnection -IPAddress $ip -Port $Port) {
        Write-Host "[$current/$($ipList.Count)] $ip - SSH Port Open" -ForegroundColor Green
        
        if ($Password) {
            Write-Host "  [*] Attempting SSH discovery..." -ForegroundColor Cyan
            $device = Get-DeviceInfo -IPAddress $ip -Username $Username -Password $Password -Port $Port
            $results += $device
            Write-Host "  [+] Discovered: $($device.Name)" -ForegroundColor Green
        } else {
            Write-Host "  [!] No password provided, skipping SSH discovery" -ForegroundColor Yellow
            $results += [PSCustomObject]@{
                Name = "Device-$ip"
                IPAddress = $ip
                SerialNumber = ""
                AssetTag = ""
                Location = ""
                CIType = "server"
                Manufacturer = ""
                Model = ""
                OSVersion = ""
                Status = "active"
                Owner = ""
                Notes = "SSH port open - credentials needed for full discovery"
            }
        }
    } else {
        Write-Host "[$current/$($ipList.Count)] $ip - No Response" -ForegroundColor DarkGray
    }
}

Write-Progress -Activity "Scanning network..." -Completed

# Export to CSV
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Discovery Complete" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Devices discovered: $($results.Count)" -ForegroundColor Green
Write-Host "Output file: $OutputFile" -ForegroundColor Green
Write-Host ""

if ($results.Count -gt 0) {
    $results | Export-Csv -Path $OutputFile -NoTypeInformation -Encoding UTF8
    Write-Host "[+] CSV file created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Review the CSV file: $OutputFile" -ForegroundColor White
    Write-Host "  2. Go to CMDB > Import CIs in Victrix Servicedesk" -ForegroundColor White
    Write-Host "  3. Upload this CSV file" -ForegroundColor White
    Write-Host "  4. Map columns and import" -ForegroundColor White
} else {
    Write-Host "[!] No devices discovered" -ForegroundColor Yellow
}

Write-Host ""
`;
}

export function generateBashScript(options: ScriptOptions): string {
  const { subnet, sshUsername = 'admin', sshPort = 22 } = options;
  
  return `#!/bin/bash
#
# Network Discovery Script for Victrix Servicedesk
# Scans the specified network range and discovers devices via SSH.
# Outputs results to a CSV file that can be imported into CMDB.
#
# Usage:
#   ./network_discovery.sh <subnet> [username] [password] [port]
#
# Example:
#   ./network_discovery.sh 192.168.1.0/24 admin mypassword 22
#

set -e

# Configuration
SUBNET="\${1:-${subnet}}"
SSH_USER="\${2:-${sshUsername}}"
SSH_PASS="\${3}"
SSH_PORT="\${4:-${sshPort}}"
OUTPUT_FILE="discovered_devices_$(date +%Y%m%d_%H%M%S).csv"

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
CYAN='\\033[0;36m'
NC='\\033[0m' # No Color

echo -e "\${CYAN}================================================\${NC}"
echo -e "\${CYAN}  Victrix Servicedesk - Network Discovery\${NC}"
echo -e "\${CYAN}================================================\${NC}"
echo ""
echo -e "\${YELLOW}Scanning subnet: \$SUBNET\${NC}"
echo -e "\${YELLOW}SSH Port: \$SSH_PORT\${NC}"
echo -e "\${YELLOW}Output file: \$OUTPUT_FILE\${NC}"
echo ""

# Check for required tools
if ! command -v nmap &> /dev/null; then
    echo -e "\${RED}[!] nmap not found. Please install: apt-get install nmap (Debian/Ubuntu) or yum install nmap (RHEL/CentOS)\${NC}"
    echo -e "\${YELLOW}[*] Falling back to basic ping sweep...\${NC}"
    USE_NMAP=0
else
    USE_NMAP=1
fi

if ! command -v sshpass &> /dev/null && [ -n "\$SSH_PASS" ]; then
    echo -e "\${YELLOW}[!] sshpass not found. Install for automatic SSH: apt-get install sshpass\${NC}"
    echo -e "\${YELLOW}[*] Will only detect SSH availability, not gather device info\${NC}"
    USE_SSHPASS=0
else
    USE_SSHPASS=1
fi

# Function to generate IP list from CIDR
generate_ip_list() {
    local subnet=\$1
    local ips=()
    
    # Use nmap to generate IP list if available
    if [ \$USE_NMAP -eq 1 ]; then
        nmap -sL -n "\$subnet" | grep "Nmap scan report" | awk '{print \$NF}' | tr -d '()'
    else
        # Basic implementation for /24 networks
        local base_ip=\$(echo "\$subnet" | cut -d'/' -f1 | cut -d'.' -f1-3)
        local prefix=\$(echo "\$subnet" | cut -d'/' -f2)
        
        if [ "\$prefix" -eq 24 ]; then
            for i in {1..254}; do
                echo "\${base_ip}.\$i"
            done
        else
            echo -e "\${RED}[!] Only /24 networks supported in basic mode. Please install nmap.\${NC}"
            exit 1
        fi
    fi
}

# Function to test SSH connectivity
test_ssh() {
    local ip=\$1
    local port=\$2
    timeout 2 bash -c "echo > /dev/tcp/\$ip/\$port" 2>/dev/null && return 0 || return 1
}

# Function to discover device info via SSH
discover_device() {
    local ip=\$1
    local name="Device-\$ip"
    local serial=""
    local manufacturer=""
    local model=""
    local os_version=""
    
    if [ \$USE_SSHPASS -eq 1 ] && [ -n "\$SSH_PASS" ]; then
        # Get hostname
        hostname_out=\$(sshpass -p "\$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p "\$SSH_PORT" "\$SSH_USER@\$ip" "hostname" 2>/dev/null || echo "")
        if [ -n "\$hostname_out" ]; then
            name=\$(echo "\$hostname_out" | tr -d '\\r\\n')
        fi
        
        # Get OS info
        os_out=\$(sshpass -p "\$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p "\$SSH_PORT" "\$SSH_USER@\$ip" "cat /etc/os-release 2>/dev/null | head -1 || uname -a" 2>/dev/null || echo "")
        if [ -n "\$os_out" ]; then
            os_version=\$(echo "\$os_out" | head -1 | tr -d '\\r\\n' | sed 's/PRETTY_NAME=//g' | tr -d '"')
        fi
        
        # Get hardware info (requires sudo)
        serial=\$(sshpass -p "\$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p "\$SSH_PORT" "\$SSH_USER@\$ip" "sudo dmidecode -s system-serial-number 2>/dev/null" 2>/dev/null | tr -d '\\r\\n' || echo "")
        manufacturer=\$(sshpass -p "\$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p "\$SSH_PORT" "\$SSH_USER@\$ip" "sudo dmidecode -s system-manufacturer 2>/dev/null" 2>/dev/null | tr -d '\\r\\n' || echo "")
        model=\$(sshpass -p "\$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p "\$SSH_PORT" "\$SSH_USER@\$ip" "sudo dmidecode -s system-product-name 2>/dev/null" 2>/dev/null | tr -d '\\r\\n' || echo "")
    fi
    
    # Output CSV row
    echo "\"\$name\",\"\$ip\",\"\$serial\",,,,server,\"\$manufacturer\",\"\$model\",\"\$os_version\",active,,\"Discovered via network scan\""
}

# Create CSV header
echo "Name,IPAddress,SerialNumber,AssetTag,Location,Department,CIType,Manufacturer,Model,OSVersion,Status,Owner,Notes" > "\$OUTPUT_FILE"

# Generate IP list
echo -e "\${CYAN}[*] Generating IP list from subnet...\${NC}"
mapfile -t ip_list < <(generate_ip_list "\$SUBNET")
total=\${#ip_list[@]}
echo -e "\${GREEN}[+] Found \$total IP addresses to scan\${NC}"
echo ""

# Scan each IP
current=0
discovered=0
for ip in "\${ip_list[@]}"; do
    ((current++))
    percent=\$((current * 100 / total))
    printf "\\r[%3d%%] Scanning... %d/%d" "\$percent" "\$current" "\$total"
    
    # Test SSH connectivity
    if test_ssh "\$ip" "\$SSH_PORT"; then
        echo ""
        echo -e "\${GREEN}[\$current/\$total] \$ip - SSH Port Open\${NC}"
        
        if [ -n "\$SSH_PASS" ] && [ \$USE_SSHPASS -eq 1 ]; then
            echo -e "\${CYAN}  [*] Attempting SSH discovery...\${NC}"
            device_row=\$(discover_device "\$ip")
            echo "\$device_row" >> "\$OUTPUT_FILE"
            device_name=\$(echo "\$device_row" | cut -d',' -f1 | tr -d '"')
            echo -e "\${GREEN}  [+] Discovered: \$device_name\${NC}"
        else
            echo "\\"Device-\$ip\\",\\"\$ip\\",\\"\\",,,,server,,,,,active,,\\"SSH port open - credentials needed for full discovery\\"" >> "\$OUTPUT_FILE"
        fi
        ((discovered++))
    fi
done

echo ""
echo ""
echo -e "\${CYAN}================================================\${NC}"
echo -e "\${CYAN}  Discovery Complete\${NC}"
echo -e "\${CYAN}================================================\${NC}"
echo ""
echo -e "\${GREEN}Devices discovered: \$discovered\${NC}"
echo -e "\${GREEN}Output file: \$OUTPUT_FILE\${NC}"
echo ""

if [ \$discovered -gt 0 ]; then
    echo -e "\${GREEN}[+] CSV file created successfully!\${NC}"
    echo ""
    echo -e "\${YELLOW}Next steps:\${NC}"
    echo -e "  1. Review the CSV file: \$OUTPUT_FILE"
    echo -e "  2. Go to CMDB > Import CIs in Victrix Servicedesk"
    echo -e "  3. Upload this CSV file"
    echo -e "  4. Map columns and import"
else
    echo -e "\${YELLOW}[!] No devices discovered\${NC}"
fi

echo ""
`;
}
