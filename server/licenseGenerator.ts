import crypto from 'crypto';

// This is the RSA public key for license verification
// The corresponding private key should be kept secure and used only by authorized staff
// To generate a new key pair: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem
export const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmJLJf84pIic36aWLvRwO
qi/QQssPOxy9oU1N+zD30JUsg8Svvyf097W068U7PoCVcCsUducOX3uKxZstHO0n
5jPi24pm8o0d6K9i/eo7dGVWxYMLBH22zmAGb9GWs3pNefe7WSiHdI0wkOqftr5S
2/RtAYapeuoQZ5UwHsPQJU/7DfmLkUmvWXLt0hr5khKkQ3XqfYQ+wqKDCOxdckk2
OBRfK0qnrKKVzf5yo1utE2s8oMMDi5HybD3aYV9U/VlDQ926ntNmmff6vMawm7bX
EF6flWr8vgvK5S43kuS1bWCJUzG2Lp1WbEtgVkQrxuhMl0kl9/bVP1cBCt52ujyz
QQIDAQAB
-----END PUBLIC KEY-----`;

export interface LicenseData {
  companyName: string;
  contactEmail: string;
  expirationDate: string; // ISO date string
  maxUsers: number;
  features?: string[]; // Optional features array
}

/**
 * Generate a license key from license data using private key
 * This function should ONLY be used by Victrix IT Ltd staff
 * NEVER expose the private key in the customer-facing application
 */
export function generateLicenseKey(licenseData: LicenseData, privateKey: string): string {
  // Create a canonical string representation of the license data
  const dataString = JSON.stringify({
    company: licenseData.companyName,
    email: licenseData.contactEmail,
    expires: licenseData.expirationDate,
    users: licenseData.maxUsers,
    features: licenseData.features || [],
  });

  // Sign the data with the private key
  const sign = crypto.createSign('SHA256');
  sign.update(dataString);
  sign.end();
  const signature = sign.sign(privateKey, 'base64');

  // Combine data and signature into a license key
  const licensePayload = {
    data: Buffer.from(dataString).toString('base64'),
    signature: signature,
  };

  // Create final license key (formatted for readability)
  const licenseKey = Buffer.from(JSON.stringify(licensePayload)).toString('base64');
  
  // Format as XXXX-XXXX-XXXX-XXXX
  return formatLicenseKey(licenseKey);
}

/**
 * Verify and decode a license key using the public key
 * This runs in the customer's self-hosted installation
 */
export function verifyLicenseKey(licenseKey: string): { valid: boolean; data?: LicenseData; error?: string } {
  try {
    // Remove formatting dashes
    const cleanKey = licenseKey.replace(/-/g, '');
    
    // Decode the license key
    const licensePayload = JSON.parse(Buffer.from(cleanKey, 'base64').toString('utf8'));
    const dataString = Buffer.from(licensePayload.data, 'base64').toString('utf8');
    const signature = licensePayload.signature;

    // Verify the signature using the public key
    const verify = crypto.createVerify('SHA256');
    verify.update(dataString);
    verify.end();
    const isValid = verify.verify(PUBLIC_KEY, signature, 'base64');

    if (!isValid) {
      return { valid: false, error: 'Invalid license signature' };
    }

    // Parse the license data
    const parsedData = JSON.parse(dataString);
    const licenseData: LicenseData = {
      companyName: parsedData.company,
      contactEmail: parsedData.email,
      expirationDate: parsedData.expires,
      maxUsers: parsedData.users,
      features: parsedData.features,
    };

    return { valid: true, data: licenseData };
  } catch (error: any) {
    return { valid: false, error: `License key format error: ${error.message}` };
  }
}

/**
 * Format license key into readable format: XXXX-XXXX-XXXX-XXXX...
 */
function formatLicenseKey(key: string): string {
  const chunks: string[] = [];
  for (let i = 0; i < key.length; i += 4) {
    chunks.push(key.substring(i, i + 4));
  }
  return chunks.join('-');
}

/**
 * Check if a license is expired
 */
export function isLicenseExpired(expirationDate: string): boolean {
  const now = new Date();
  const expiry = new Date(expirationDate);
  return now > expiry;
}

/**
 * Generate RSA key pair for new installations
 * This should be run ONCE to create your private/public key pair
 * Store the private key SECURELY and NEVER commit it to the repository
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { privateKey, publicKey };
}
