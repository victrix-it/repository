import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Key, AlertCircle, CheckCircle2, Calendar, Users, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export default function LicensePage() {
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState('');

  const { data: licenseStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/licenses/status'],
  });

  const { data: licenses, isLoading: licensesLoading } = useQuery({
    queryKey: ['/api/licenses'],
  });

  const activateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/licenses/activate', data);
    },
    onSuccess: () => {
      toast({
        title: 'License activated',
        description: 'License has been activated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/licenses/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/licenses'] });
      setLicenseKey('');
    },
    onError: (error: any) => {
      toast({
        title: 'Activation failed',
        description: error.message || 'Failed to activate license',
        variant: 'destructive',
      });
    },
  });

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    // Only send the license key - the rest is verified from the signature
    activateMutation.mutate({
      licenseKey,
    });
  };

  if (statusLoading || licensesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">License Management</h1>
          <p className="text-muted-foreground">Loading license information...</p>
        </div>
      </div>
    );
  }

  const isLicenseActive = licenseStatus?.active && !licenseStatus?.isExpired;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">License Management</h1>
        <p className="text-muted-foreground">Manage system licenses and activation</p>
      </div>

      {/* Current License Status */}
      <Card data-testid="card-license-status">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isLicenseActive ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Active License
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-600" />
                No Active License
              </>
            )}
          </CardTitle>
          <CardDescription>Current system license status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLicenseActive ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium" data-testid="text-company-name">{licenseStatus.companyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Expiration Date</p>
                  <p className="font-medium" data-testid="text-expiration-date">
                    {format(new Date(licenseStatus.expirationDate), 'PPP')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Maximum Users</p>
                  <p className="font-medium" data-testid="text-max-users">{licenseStatus.maxUsers}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No active license found. Please activate a license to use the system.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activate New License */}
      <Card data-testid="card-activate-license">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Activate License
          </CardTitle>
          <CardDescription>
            Enter license information to activate or update the system license
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleActivate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licenseKey">License Key *</Label>
              <Input
                id="licenseKey"
                data-testid="input-license-key"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the complete license key provided by Victrix IT Ltd. The system will automatically verify and extract license information.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              data-testid="button-activate"
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? 'Activating...' : 'Activate License'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* License History */}
      {licenses && licenses.length > 0 && (
        <Card data-testid="card-license-history">
          <CardHeader>
            <CardTitle>License History</CardTitle>
            <CardDescription>Previously activated licenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {licenses.map((license: any) => (
                <div
                  key={license.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                  data-testid={`license-item-${license.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{license.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {license.licenseKey} • Expires: {format(new Date(license.expirationDate), 'PPP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {license.isActive === 'true' ? (
                      <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
