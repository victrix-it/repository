import { parse } from 'csv-parse/sync';
import { storage } from './storage';
import { insertConfigurationItemSchema } from '@shared/schema';
import { z } from 'zod';

interface CsvImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  created: any[];
}

// CSV column mapping - flexible to handle different column names
const columnMappings: Record<string, string[]> = {
  name: ['name', 'hostname', 'device name', 'ci name'],
  type: ['type', 'ci type', 'category', 'device type'],
  description: ['description', 'desc', 'notes'],
  status: ['status', 'state'],
  ipAddress: ['ip', 'ip address', 'ipaddress', 'ip_address'],
  subnetMask: ['subnet', 'subnet mask', 'subnetmask', 'subnet_mask', 'mask'],
  serialNumber: ['serial', 'serial number', 'serialnumber', 'serial_number', 's/n'],
  manufacturer: ['manufacturer', 'vendor', 'make', 'mfg'],
  model: ['model', 'model number', 'modelnumber'],
  supportDetails: ['support', 'support details', 'supportdetails', 'support_details', 'warranty'],
};

function findColumnValue(row: any, fieldName: string): string | undefined {
  const possibleNames = columnMappings[fieldName] || [fieldName];
  
  for (const name of possibleNames) {
    // Try exact match (case-insensitive)
    for (const key in row) {
      if (key.toLowerCase().trim() === name.toLowerCase()) {
        return row[key];
      }
    }
  }
  
  return undefined;
}

function parseRow(row: any, rowNumber: number): any {
  const name = findColumnValue(row, 'name');
  const type = findColumnValue(row, 'type');
  
  if (!name || !type) {
    throw new Error(`Missing required fields: ${!name ? 'name' : ''} ${!type ? 'type' : ''}`);
  }

  // Map type to valid enum value
  const typeMap: Record<string, string> = {
    'server': 'server',
    'application': 'application',
    'app': 'application',
    'database': 'database',
    'db': 'database',
    'network': 'network',
    'storage': 'storage',
    'other': 'other',
  };

  const normalizedType = typeMap[type.toLowerCase().trim()] || 'other';

  return {
    name: name.trim(),
    type: normalizedType,
    description: findColumnValue(row, 'description') || null,
    status: findColumnValue(row, 'status')?.toLowerCase() || 'active',
    ipAddress: findColumnValue(row, 'ipAddress') || null,
    subnetMask: findColumnValue(row, 'subnetMask') || null,
    serialNumber: findColumnValue(row, 'serialNumber') || null,
    manufacturer: findColumnValue(row, 'manufacturer') || null,
    model: findColumnValue(row, 'model') || null,
    supportDetails: findColumnValue(row, 'supportDetails') || null,
  };
}

export async function importCIsFromCsv(fileContent: string): Promise<CsvImportResult> {
  const result: CsvImportResult = {
    success: 0,
    errors: [],
    created: [],
  };

  try {
    // Parse CSV with various configurations to handle different formats
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle UTF-8 BOM
    });

    if (records.length === 0) {
      throw new Error('CSV file is empty or has no valid data rows');
    }

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed
      
      try {
        const parsedRow = parseRow(records[i], rowNumber);
        
        // Validate with Zod schema
        const validatedData = insertConfigurationItemSchema.parse(parsedRow);
        
        // Create CI
        const ci = await storage.createConfigurationItem(validatedData);
        
        result.success++;
        result.created.push(ci);
      } catch (error: any) {
        result.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
          data: records[i],
        });
      }
    }

    return result;
  } catch (error: any) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
}

// Generate a sample CSV template
export function generateCsvTemplate(): string {
  const headers = [
    'Name',
    'Type',
    'Description',
    'Status',
    'IP Address',
    'Subnet Mask',
    'Serial Number',
    'Manufacturer',
    'Model',
    'Support Details'
  ];

  const exampleRows = [
    [
      'WEB-SERVER-01',
      'server',
      'Production web server',
      'active',
      '192.168.1.10',
      '255.255.255.0',
      'SN12345678',
      'Dell',
      'PowerEdge R740',
      'Support contract #12345 - Dell ProSupport - expires 2026-12-31'
    ],
    [
      'DATABASE-01',
      'database',
      'Main PostgreSQL database',
      'active',
      '192.168.1.20',
      '255.255.255.0',
      'SN87654321',
      'HP',
      'ProLiant DL380',
      'HP 24/7 Support - contact: support@hp.com'
    ],
    [
      'FIREWALL-01',
      'network',
      'Edge firewall',
      'active',
      '192.168.1.1',
      '255.255.255.0',
      'FW-2024-001',
      'Cisco',
      'ASA 5525-X',
      'Cisco TAC Premium - case #98765'
    ],
  ];

  const rows = [headers, ...exampleRows];
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}
