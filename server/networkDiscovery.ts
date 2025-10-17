import { Client as SSHClient } from 'ssh2';
import { Address4, Address6 } from 'ip-address';
import { storage } from './storage';
import type { DiscoveryCredential } from '@shared/schema';

interface DeviceInfo {
  hostname?: string;
  ipAddress: string;
  subnetMask?: string;
  serialNumber?: string;
  deviceType?: string;
  osVersion?: string;
  manufacturer?: string;
  model?: string;
  discoveryMethod: string;
  rawData?: any;
}

// Generate list of IP addresses from subnet
function generateIPList(subnet: string): string[] {
  const ips: string[] = [];
  
  try {
    // Try IPv4 first
    const addr = new Address4(subnet);
    if (addr.isValid()) {
      const start = addr.startAddress().bigInteger();
      const end = addr.endAddress().bigInteger();
      
      // Limit to reasonable subnet sizes (max /24 = 256 hosts)
      const maxHosts = 256;
      let count = 0;
      
      for (let i = start; i <= end && count < maxHosts; i++) {
        const ip = Address4.fromBigInteger(i).address;
        // Skip network and broadcast addresses
        if (ip !== addr.startAddress().address && ip !== addr.endAddress().address) {
          ips.push(ip);
          count++;
        }
      }
      return ips;
    }
  } catch (e) {
    // Not a valid IPv4, try IPv6
    try {
      const addr = new Address6(subnet);
      if (addr.isValid()) {
        // IPv6 scanning is complex, just return the base address for now
        return [addr.address];
      }
    } catch (e) {
      // Not valid IPv6 either
    }
  }
  
  // If not a CIDR, treat as single IP
  return [subnet];
}

// Test TCP connection to a port (basic reachability)
function testConnection(ip: string, port: number, timeout: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    
    socket.setTimeout(timeout);
    socket.once('error', onError);
    socket.once('timeout', onError);
    
    socket.connect(port, ip, () => {
      socket.destroy();
      resolve(true);
    });
  });
}

// Discover device via SSH
async function discoverViaSSH(
  ip: string, 
  credential: DiscoveryCredential
): Promise<DeviceInfo | null> {
  return new Promise((resolve) => {
    const conn = new SSHClient();
    const deviceInfo: DeviceInfo = {
      ipAddress: ip,
      discoveryMethod: 'ssh',
      rawData: {},
    };
    
    const connectionTimeout = setTimeout(() => {
      conn.end();
      resolve(null);
    }, 10000); // 10 second timeout
    
    conn.on('ready', () => {
      clearTimeout(connectionTimeout);
      
      // Execute commands to gather device information
      const commands = [
        { name: 'hostname', cmd: 'hostname' },
        { name: 'os_release', cmd: 'cat /etc/os-release 2>/dev/null || uname -a' },
        { name: 'serial', cmd: 'dmidecode -s system-serial-number 2>/dev/null || cat /sys/class/dmi/id/product_serial 2>/dev/null || echo "N/A"' },
        { name: 'ip_info', cmd: 'ip addr show 2>/dev/null || ifconfig 2>/dev/null' },
        { name: 'manufacturer', cmd: 'dmidecode -s system-manufacturer 2>/dev/null || cat /sys/class/dmi/id/sys_vendor 2>/dev/null || echo "N/A"' },
        { name: 'model', cmd: 'dmidecode -s system-product-name 2>/dev/null || cat /sys/class/dmi/id/product_name 2>/dev/null || echo "N/A"' },
      ];
      
      let completedCommands = 0;
      
      commands.forEach((cmdObj) => {
        conn.exec(cmdObj.cmd, (err, stream) => {
          if (err) {
            completedCommands++;
            if (completedCommands === commands.length) {
              conn.end();
              resolve(deviceInfo);
            }
            return;
          }
          
          let output = '';
          stream.on('data', (data: Buffer) => {
            output += data.toString();
          });
          
          stream.on('close', () => {
            deviceInfo.rawData[cmdObj.name] = output.trim();
            
            // Parse the output
            switch (cmdObj.name) {
              case 'hostname':
                deviceInfo.hostname = output.trim().split('\n')[0];
                break;
              case 'os_release':
                deviceInfo.deviceType = 'linux';
                deviceInfo.osVersion = output.trim();
                break;
              case 'serial':
                const serial = output.trim();
                if (serial && serial !== 'N/A' && !serial.includes('Permission denied')) {
                  deviceInfo.serialNumber = serial;
                }
                break;
              case 'manufacturer':
                const mfg = output.trim();
                if (mfg && mfg !== 'N/A' && !mfg.includes('Permission denied')) {
                  deviceInfo.manufacturer = mfg;
                }
                break;
              case 'model':
                const mdl = output.trim();
                if (mdl && mdl !== 'N/A' && !mdl.includes('Permission denied')) {
                  deviceInfo.model = mdl;
                }
                break;
              case 'ip_info':
                // Extract subnet mask from IP info
                const subnetMatch = output.match(/netmask\s+(\d+\.\d+\.\d+\.\d+)|\/(\d+)/);
                if (subnetMatch) {
                  deviceInfo.subnetMask = subnetMatch[1] || `/${subnetMatch[2]}`;
                }
                break;
            }
            
            completedCommands++;
            if (completedCommands === commands.length) {
              conn.end();
              resolve(deviceInfo);
            }
          });
        });
      });
    });
    
    conn.on('error', (err) => {
      clearTimeout(connectionTimeout);
      console.log(`[discovery] SSH connection failed to ${ip}:`, err.message);
      resolve(null);
    });
    
    // Connect with credentials
    const config: any = {
      host: ip,
      port: credential.port || 22,
      username: credential.username,
      readyTimeout: 10000,
    };
    
    if (credential.credentialType === 'ssh-password') {
      config.password = credential.password;
    } else if (credential.credentialType === 'ssh-key') {
      config.privateKey = credential.privateKey;
    }
    
    try {
      conn.connect(config);
    } catch (err) {
      clearTimeout(connectionTimeout);
      resolve(null);
    }
  });
}

// Scan a single host with multiple credentials
async function scanHost(
  ip: string, 
  credentials: DiscoveryCredential[]
): Promise<DeviceInfo | null> {
  // First check if SSH port is open
  const sshOpen = await testConnection(ip, 22, 2000);
  
  if (!sshOpen) {
    console.log(`[discovery] No SSH service on ${ip}`);
    return null;
  }
  
  // Try each credential until one works
  for (const credential of credentials) {
    if (credential.credentialType.startsWith('ssh')) {
      console.log(`[discovery] Trying SSH on ${ip} with credential: ${credential.name}`);
      const deviceInfo = await discoverViaSSH(ip, credential);
      
      if (deviceInfo) {
        console.log(`[discovery] Successfully discovered ${ip} as ${deviceInfo.hostname || 'unknown'}`);
        return deviceInfo;
      }
    }
  }
  
  return null;
}

// Main discovery function
export async function runNetworkDiscovery(
  jobId: string,
  subnet: string,
  credentialIds: string[]
): Promise<void> {
  try {
    console.log(`[discovery] Starting network discovery for job ${jobId}, subnet: ${subnet}`);
    
    // Update job status
    await storage.updateDiscoveryJob(jobId, {
      status: 'running',
      startedAt: new Date(),
    });
    
    // Get credentials
    const credentials = await storage.getDiscoveryCredentialsByIds(credentialIds);
    
    if (credentials.length === 0) {
      throw new Error('No valid credentials found');
    }
    
    // Generate IP list
    const ipList = generateIPList(subnet);
    console.log(`[discovery] Generated ${ipList.length} IPs to scan`);
    
    await storage.updateDiscoveryJob(jobId, {
      totalHosts: ipList.length,
    });
    
    let discoveredCount = 0;
    
    // Scan each host (sequential to avoid overwhelming the network)
    for (const ip of ipList) {
      try {
        const deviceInfo = await scanHost(ip, credentials);
        
        if (deviceInfo) {
          // Save discovered device
          await storage.createDiscoveredDevice({
            jobId,
            hostname: deviceInfo.hostname,
            ipAddress: deviceInfo.ipAddress,
            subnetMask: deviceInfo.subnetMask,
            serialNumber: deviceInfo.serialNumber,
            deviceType: deviceInfo.deviceType,
            osVersion: deviceInfo.osVersion,
            manufacturer: deviceInfo.manufacturer,
            model: deviceInfo.model,
            imported: 'false',
            discoveryMethod: deviceInfo.discoveryMethod,
            rawData: deviceInfo.rawData,
          });
          
          discoveredCount++;
          
          // Update progress
          await storage.updateDiscoveryJob(jobId, {
            discoveredCount,
          });
        }
      } catch (error: any) {
        console.error(`[discovery] Error scanning ${ip}:`, error.message);
      }
    }
    
    // Complete the job
    await storage.updateDiscoveryJob(jobId, {
      status: 'completed',
      completedAt: new Date(),
      discoveredCount,
    });
    
    console.log(`[discovery] Discovery job ${jobId} completed. Found ${discoveredCount} devices.`);
    
  } catch (error: any) {
    console.error(`[discovery] Job ${jobId} failed:`, error);
    
    await storage.updateDiscoveryJob(jobId, {
      status: 'failed',
      completedAt: new Date(),
      error: error.message,
    });
  }
}

// Import discovered device to CMDB
export async function importDeviceToCMDB(
  discoveredDeviceId: string,
  ciType: string = 'server'
): Promise<string> {
  const device = await storage.getDiscoveredDevice(discoveredDeviceId);
  
  if (!device) {
    throw new Error('Discovered device not found');
  }
  
  if (device.imported === 'true') {
    throw new Error('Device already imported');
  }
  
  // Create CI
  const ci = await storage.createConfigurationItem({
    name: device.hostname || device.ipAddress,
    type: ciType as any,
    description: `Discovered via ${device.discoveryMethod} - ${device.deviceType || 'Unknown type'}`,
    status: 'active',
    ipAddress: device.ipAddress,
    subnetMask: device.subnetMask,
    serialNumber: device.serialNumber,
    discoveredVia: device.discoveryMethod,
    lastDiscovered: device.discoveredAt,
    properties: {
      manufacturer: device.manufacturer,
      model: device.model,
      osVersion: device.osVersion,
      discoveryData: device.rawData,
    },
  });
  
  // Mark device as imported
  await storage.updateDiscoveredDevice(discoveredDeviceId, {
    imported: 'true',
    importedCiId: ci.id,
  });
  
  return ci.id;
}
