import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, Download, AlertCircle, Shield } from 'lucide-react';
import { Link } from 'wouter';

export default function LicenseGeneratorPage() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [maxUsers, setMaxUsers] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [generatedLicense, setGeneratedLicense] = useState('');
  const [generatedData, setGeneratedData] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!privateKey.trim()) {
      toast({
        title: 'Error',
        description: 'Private key is required to generate licenses',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/generate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyName,
          contactEmail,
          expirationDate,
          maxUsers: parseInt(maxUsers),
          privateKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate license');
      }

      const data = await response.json();
      setGeneratedLicense(data.licenseKey);
      setGeneratedData(data.licenseData);

      toast({
        title: 'Success',
        description: 'License generated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Generation failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'License key copied to clipboard',
    });
  };

  const downloadLicenseFile = () => {
    const licenseInfo = {
      licenseKey: generatedLicense,
      companyName,
      contactEmail,
      expirationDate,
      maxUsers: parseInt(maxUsers),
      generatedAt: new Date().toISOString(),
      instructions: 'Navigate to Admin > License Management and enter this license key to activate your system.',
    };

    const blob = new Blob([JSON.stringify(licenseInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_license.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'License file downloaded successfully',
    });
  };

  const generateKeyPair = async () => {
    try {
      const response = await fetch('/api/admin/generate-keypair', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate key pair');
      }

      const data = await response.json();
      
      // Download the keys as a file
      const keyInfo = {
        publicKey: data.publicKey,
        privateKey: data.privateKey,
        generatedAt: new Date().toISOString(),
        warning: 'KEEP THE PRIVATE KEY SECURE! Never commit it to version control or share it publicly.',
      };

      const blob = new Blob([JSON.stringify(keyInfo, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'license_keys_DO_NOT_SHARE.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Key pair generated',
        description: 'Your public and private keys have been downloaded. KEEP THE PRIVATE KEY SECURE!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">License Generator</h1>
        <p className="text-muted-foreground">Generate cryptographically signed licenses for self-hosted installations</p>
      </div>

      {/* Security Warning */}
      <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertCircle className="w-5 h-5" />
            Victrix IT Ltd Internal Tool Only
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
          <p><strong>WARNING:</strong> This tool is for Victrix IT Ltd staff only. Never share your private key!</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>The private key must be kept absolutely secure</li>
            <li>Never commit the private key to version control</li>
            <li>Store it in a secure password manager or encrypted vault</li>
            <li>Only generate keys on secure, trusted systems</li>
            <li>The public key is embedded in the customer's application</li>
          </ul>
        </CardContent>
      </Card>

      {/* Key Pair Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Generate New Key Pair
          </CardTitle>
          <CardDescription>
            First-time setup: Generate a new RSA key pair. Do this ONCE and store the private key securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            After generating, you must update the PUBLIC_KEY in server/licenseGenerator.ts with the generated public key,
            then rebuild and deploy the application.
          </p>
          <Button onClick={generateKeyPair} variant="outline" data-testid="button-generate-keypair">
            <Key className="w-4 h-4 mr-2" />
            Generate RSA Key Pair
          </Button>
        </CardContent>
      </Card>

      {/* License Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate License</CardTitle>
          <CardDescription>
            Create a signed license key for a customer's self-hosted installation
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleGenerate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                data-testid="input-company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corporation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                data-testid="input-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@company.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date *</Label>
                <Input
                  id="expirationDate"
                  data-testid="input-expiration-date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Maximum Users *</Label>
                <Input
                  id="maxUsers"
                  data-testid="input-max-users"
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  placeholder="50"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key * (PEM format)</Label>
              <Textarea
                id="privateKey"
                data-testid="input-private-key"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                rows={6}
                className="font-mono text-xs"
                required
              />
              <p className="text-xs text-muted-foreground">
                Paste your RSA private key here. It will not be stored or transmitted anywhere.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" data-testid="button-generate">
              <Key className="w-4 h-4 mr-2" />
              Generate License Key
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Generated License Display */}
      {generatedLicense && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">License Generated Successfully!</CardTitle>
            <CardDescription className="text-green-800 dark:text-green-200">
              Provide this license key to the customer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>License Key</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLicense}
                  readOnly
                  className="font-mono text-sm bg-white dark:bg-gray-900"
                  data-testid="output-license-key"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generatedLicense)}
                  data-testid="button-copy"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium">{companyName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{contactEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expires</p>
                <p className="font-medium">{expirationDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max Users</p>
                <p className="font-medium">{maxUsers}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={downloadLicenseFile}
              className="w-full"
              data-testid="button-download"
            >
              <Download className="w-4 h-4 mr-2" />
              Download License File
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-start">
        <Link href="/admin">
          <Button variant="ghost">
            ← Back to Admin
          </Button>
        </Link>
      </div>
    </div>
  );
}
