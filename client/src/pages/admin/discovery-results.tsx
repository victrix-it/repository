import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Server, CheckCircle, Download, ArrowLeft } from "lucide-react";
import type { DiscoveredDevice, DiscoveryJob } from "@shared/schema";

export default function DiscoveryResults() {
  const { toast } = useToast();
  const [, params] = useRoute("/admin/discovery/:jobId");
  const jobId = params?.jobId;
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [importType, setImportType] = useState<string>("server");

  const { data: job, isLoading: jobLoading } = useQuery<DiscoveryJob>({
    queryKey: ['/api/discovery/jobs', jobId],
    enabled: !!jobId,
  });

  const { data: devices = [], isLoading: devicesLoading } = useQuery<DiscoveredDevice[]>({
    queryKey: ['/api/discovery/jobs', jobId, 'devices'],
    enabled: !!jobId,
  });

  const importDeviceMutation = useMutation({
    mutationFn: async ({ deviceId, ciType }: { deviceId: string; ciType: string }) => {
      return await apiRequest(`/api/discovery/devices/${deviceId}/import`, 'POST', { ciType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discovery/jobs', jobId, 'devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cmdb'] });
      toast({ title: "Device imported to CMDB" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to import device", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleToggleDevice = (deviceId: string) => {
    const newSet = new Set(selectedDevices);
    if (newSet.has(deviceId)) {
      newSet.delete(deviceId);
    } else {
      newSet.add(deviceId);
    }
    setSelectedDevices(newSet);
  };

  const handleToggleAll = () => {
    if (selectedDevices.size === devices.filter(d => d.imported === 'false').length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(devices.filter(d => d.imported === 'false').map(d => d.id)));
    }
  };

  const handleImportSelected = async () => {
    const deviceIds = Array.from(selectedDevices);
    for (const deviceId of deviceIds) {
      await importDeviceMutation.mutateAsync({ deviceId, ciType: importType });
    }
    setSelectedDevices(new Set());
  };

  if (jobLoading || devicesLoading) {
    return <div className="container mx-auto p-6 text-center">Loading...</div>;
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Discovery job not found
          </CardContent>
        </Card>
      </div>
    );
  }

  const notImportedDevices = devices.filter(d => d.imported === 'false');
  const importedDevices = devices.filter(d => d.imported === 'true');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <a href="/admin/network-discovery">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">{job.name}</h1>
          <p className="text-muted-foreground">
            Discovered {devices.length} device{devices.length !== 1 ? 's' : ''} from {job.subnet}
          </p>
        </div>
      </div>

      {notImportedDevices.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Import Devices</CardTitle>
                <CardDescription>
                  Select devices to import into the CMDB
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger className="w-40" data-testid="select-import-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server" data-testid="option-server">Server</SelectItem>
                    <SelectItem value="application" data-testid="option-application">Application</SelectItem>
                    <SelectItem value="database" data-testid="option-database">Database</SelectItem>
                    <SelectItem value="network" data-testid="option-network">Network Device</SelectItem>
                    <SelectItem value="storage" data-testid="option-storage">Storage</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleImportSelected}
                  disabled={selectedDevices.size === 0 || importDeviceMutation.isPending}
                  data-testid="button-import-selected"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import Selected ({selectedDevices.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Checkbox
                checked={selectedDevices.size === notImportedDevices.length && notImportedDevices.length > 0}
                onCheckedChange={handleToggleAll}
                data-testid="checkbox-select-all"
              />
              <span className="text-sm text-muted-foreground">
                Select all ({notImportedDevices.length})
              </span>
            </div>
            <div className="grid gap-3">
              {notImportedDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center gap-3 p-3 border rounded-md hover-elevate"
                  data-testid={`card-device-${device.id}`}
                >
                  <Checkbox
                    checked={selectedDevices.has(device.id)}
                    onCheckedChange={() => handleToggleDevice(device.id)}
                    data-testid={`checkbox-device-${device.id}`}
                  />
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium" data-testid={`text-hostname-${device.id}`}>
                        {device.hostname || device.ipAddress}
                      </span>
                      {device.deviceType && (
                        <Badge variant="outline" data-testid={`badge-device-type-${device.id}`}>
                          {device.deviceType}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4">
                      <span data-testid={`text-ip-${device.id}`}>IP: {device.ipAddress}</span>
                      {device.serialNumber && (
                        <span data-testid={`text-serial-${device.id}`}>Serial: {device.serialNumber}</span>
                      )}
                      {device.manufacturer && (
                        <span data-testid={`text-manufacturer-${device.id}`}>{device.manufacturer}</span>
                      )}
                      {device.model && (
                        <span data-testid={`text-model-${device.id}`}>{device.model}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {importedDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Already Imported</CardTitle>
            <CardDescription>
              These devices have been imported to the CMDB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {importedDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center gap-3 p-3 border rounded-md bg-muted/30"
                  data-testid={`card-imported-device-${device.id}`}
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium" data-testid={`text-imported-hostname-${device.id}`}>
                        {device.hostname || device.ipAddress}
                      </span>
                      {device.deviceType && (
                        <Badge variant="outline" data-testid={`badge-imported-device-type-${device.id}`}>
                          {device.deviceType}
                        </Badge>
                      )}
                      <Badge variant="default">Imported</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4">
                      <span data-testid={`text-imported-ip-${device.id}`}>IP: {device.ipAddress}</span>
                      {device.serialNumber && (
                        <span data-testid={`text-imported-serial-${device.id}`}>Serial: {device.serialNumber}</span>
                      )}
                    </div>
                  </div>
                  {device.importedCiId && (
                    <Button variant="outline" size="sm" asChild data-testid={`button-view-ci-${device.id}`}>
                      <a href={`/cmdb/${device.importedCiId}`}>
                        View in CMDB
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {devices.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No devices discovered in this scan
          </CardContent>
        </Card>
      )}
    </div>
  );
}
