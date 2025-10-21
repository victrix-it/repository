#!/usr/bin/env tsx
/**
 * License Key Generator Utility
 * 
 * Usage:
 *   npm run generate-license -- --company "Acme Corp" --email "admin@acme.com" --users 100 --days 365
 * 
 * Or run with tsx:
 *   tsx scripts/generate-license.ts --company "Acme Corp" --email "admin@acme.com" --users 100 --days 365
 */

import crypto from 'crypto';

interface LicenseConfig {
  company: string;
  email: string;
  maxUsers: number;
  days: number;
}

function generateLicenseKey(): string {
  // Generate a random license key in format: XXXX-XXXX-XXXX-XXXX
  const segments: string[] = [];
  for (let i = 0; i < 4; i++) {
    const randomBytes = crypto.randomBytes(2);
    const segment = randomBytes.toString('hex').toUpperCase();
    segments.push(segment);
  }
  return segments.join('-');
}

function generateLicense(config: LicenseConfig) {
  const licenseKey = generateLicenseKey();
  const issuedDate = new Date();
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + config.days);

  const license = {
    licenseKey,
    companyName: config.company,
    contactEmail: config.email,
    issuedDate: issuedDate.toISOString(),
    expirationDate: expirationDate.toISOString(),
    maxUsers: config.maxUsers,
    isActive: 'true',
  };

  return license;
}

function parseArgs(): LicenseConfig | null {
  const args = process.argv.slice(2);
  const config: Partial<LicenseConfig> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--company':
        config.company = value;
        break;
      case '--email':
        config.email = value;
        break;
      case '--users':
        config.maxUsers = parseInt(value, 10);
        break;
      case '--days':
        config.days = parseInt(value, 10);
        break;
      case '--help':
        console.log(`
License Key Generator

Usage:
  tsx scripts/generate-license.ts [options]

Options:
  --company <name>    Company name (required)
  --email <email>     Contact email (required)
  --users <number>    Maximum number of users (default: 50)
  --days <number>     License validity in days (default: 365)
  --help              Show this help message

Example:
  tsx scripts/generate-license.ts --company "Acme Corp" --email "admin@acme.com" --users 100 --days 365
        `);
        process.exit(0);
    }
  }

  if (!config.company || !config.email) {
    console.error('Error: --company and --email are required');
    console.log('Run with --help for usage information');
    return null;
  }

  return {
    company: config.company,
    email: config.email,
    maxUsers: config.maxUsers || 50,
    days: config.days || 365,
  };
}

function main() {
  const config = parseArgs();
  
  if (!config) {
    process.exit(1);
  }

  const license = generateLicense(config);

  console.log('\n=== LICENSE GENERATED ===\n');
  console.log(`License Key:      ${license.licenseKey}`);
  console.log(`Company:          ${license.companyName}`);
  console.log(`Contact Email:    ${license.contactEmail}`);
  console.log(`Maximum Users:    ${license.maxUsers}`);
  console.log(`Issued Date:      ${new Date(license.issuedDate).toLocaleDateString()}`);
  console.log(`Expiration Date:  ${new Date(license.expirationDate).toLocaleDateString()}`);
  console.log(`Valid For:        ${config.days} days`);
  console.log('\n=== ACTIVATION COMMAND ===\n');
  console.log('To activate this license, use the License Management page in the admin panel');
  console.log('or make a POST request to /api/licenses/activate with the following JSON:\n');
  console.log(JSON.stringify(license, null, 2));
  console.log('\n');
}

main();
