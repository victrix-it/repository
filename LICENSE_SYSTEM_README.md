# Victrix Servicedesk License System

## Overview

The Victrix Servicedesk includes a cryptographic license system that allows you to generate and validate licenses for self-hosted/air-gapped customer installations. Licenses are RSA-signed and cannot be forged without access to your private key.

## How It Works

### For Victrix IT Ltd (License Generation)

1. **One-Time Setup: Generate RSA Key Pair**
   - Navigate to Admin > Settings > License Generator
   - Click "Generate RSA Key Pair"
   - This downloads a JSON file containing your public and private keys
   - **CRITICAL**: Store the private key securely (password manager, encrypted vault)
   - Update `server/licenseGenerator.ts` with the PUBLIC_KEY from the file
   - Rebuild and deploy the application

2. **Generate Customer Licenses**
   - Navigate to Admin > Settings > License Generator
   - Fill in customer details:
     - Company Name
     - Contact Email
     - Expiration Date
     - Maximum Users
   - Paste your private key (from step 1)
   - Click "Generate License Key"
   - Copy the generated license key or download the license file
   - Send the license key to your customer

### For Customers (License Activation)

1. **Activate License**
   - Navigate to Admin > Settings > License Management
   - Enter the complete license key provided by Victrix IT Ltd
   - Click "Activate License"
   - The system automatically:
     - Verifies the cryptographic signature
     - Extracts company name, expiration date, and user limits
     - Activates the license if valid

2. **License Verification**
   - Licenses are verified using the embedded public key
   - Invalid or tampered licenses are rejected
   - Expired licenses are clearly marked

## Security Model

### Cryptographic Signing

- **Private Key**: Used by Victrix IT Ltd to sign licenses (NEVER shared)
- **Public Key**: Embedded in customer installations to verify licenses
- **Algorithm**: RSA-2048 with SHA-256 signatures

### What Can Be Verified

✅ License is signed by Victrix IT Ltd  
✅ Company name hasn't been tampered with  
✅ Expiration date is authentic  
✅ User limit is genuine  
✅ License data hasn't been modified  

### What Cannot Be Faked

❌ Generate new licenses without the private key  
❌ Modify existing license parameters  
❌ Extend expiration dates  
❌ Increase user limits  

## For SaaS Deployments

For SaaS customers, you can:
1. Generate licenses automatically via the API
2. Store private key securely in your deployment secrets
3. Integrate license generation into your billing/subscription system

## For Self-Hosted/Air-Gapped Deployments

For self-hosted customers:
1. Generate licenses manually via the License Generator page
2. Send license keys via email or secure file transfer
3. Customers activate licenses without internet connection
4. Licenses are validated entirely offline using the embedded public key

## Security Best Practices

### Private Key Security

⚠️ **CRITICAL**: Never commit your private key to version control  
⚠️ **CRITICAL**: Never share your private key publicly  
⚠️ **CRITICAL**: Store private key in encrypted vault or password manager  

### Recommended Storage

- **Development**: Local encrypted vault (1Password, LastPass, Bitwarden)
- **Production**: Cloud secrets manager (AWS Secrets Manager, Azure Key Vault)
- **Backup**: Encrypted offline backup in secure location

### Key Rotation

If your private key is compromised:
1. Generate a new key pair immediately
2. Update PUBLIC_KEY in `server/licenseGenerator.ts`
3. Rebuild and deploy to all customer installations
4. Re-issue all active customer licenses with new private key

## License File Format

Generated license keys are formatted as:
```
XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-...
```

The key contains:
- Base64-encoded license data
- RSA signature of the data
- Formatted for readability

## API Endpoints

### Customer-Facing (Public)
- `POST /api/licenses/activate` - Activate a license key
- `GET /api/licenses/status` - Check current license status

### Internal (Admin Only)
- `POST /api/admin/generate-license` - Generate new license
- `POST /api/admin/generate-keypair` - Generate RSA key pair
- `GET /api/licenses` - List all licenses
- `POST /api/licenses/:id/deactivate` - Deactivate a license

## Example Workflow

### Initial Setup (Once)
```
1. Login as admin
2. Go to: Admin > Settings > License Generator
3. Click: "Generate RSA Key Pair"
4. Download: license_keys_DO_NOT_SHARE.json
5. Store private key securely
6. Copy public key to server/licenseGenerator.ts
7. Rebuild application
```

### Generate License for Customer (Repeat as needed)
```
1. Login as admin
2. Go to: Admin > Settings > License Generator
3. Fill in:
   - Company: "Acme Corporation"
   - Email: "admin@acme.com"
   - Expires: "2026-12-31"
   - Users: 50
4. Paste private key
5. Click: "Generate License Key"
6. Copy or download license
7. Send to customer
```

### Customer Activates License
```
1. Customer receives license key
2. Login to their installation
3. Go to: Admin > Settings > License Management
4. Paste license key
5. Click: "Activate License"
6. System verifies and activates
```

## Troubleshooting

### "Invalid license signature"
- License key was tampered with or corrupted
- Public key in application doesn't match private key used to generate license
- Request a new license key

### "License expired"
- Expiration date has passed
- Contact Victrix IT Ltd for license renewal

### "Failed to activate license"
- Network issue (shouldn't happen for offline validation)
- Database error
- Check server logs for details

## Technical Details

### Files Modified
- `server/licenseGenerator.ts` - License generation/verification logic
- `server/routes.ts` - License API endpoints
- `client/src/pages/admin/license.tsx` - License activation page
- `client/src/pages/admin/license-generator.tsx` - License generation page
- `shared/schema.ts` - License database schema

### Database Schema
```typescript
licenses {
  id: UUID
  licenseKey: string (unique, contains signature)
  companyName: string (from verified signature)
  contactEmail: string (from verified signature)
  expirationDate: timestamp (from verified signature)
  maxUsers: integer (from verified signature)
  isActive: boolean
  issuedDate: timestamp
  createdAt: timestamp
}
```

## Support

For questions or issues with the license system, contact Victrix IT Ltd support.
