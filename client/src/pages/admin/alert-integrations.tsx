import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Copy, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface AlertIntegration {
  id: string;
  name: string;
  description: string | null;
  enabled: string;
  webhookUrl: string;
  apiKey: string;
  sourceSystem: string | null;
  defaultPriority: string;
  defaultCategory: string | null;
  autoAssignTeamId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FilterRule {
  id: string;
  integrationId: string;
  name: string;
  description: string | null;
  enabled: string;
  filterType: string;
  fieldPath: string;
  operator: string;
  value: string;
  priority: number;
}

interface FieldMapping {
  id: string;
  integrationId: string;
  ticketField: string;
  alertFieldPath: string;
  transform: string | null;
}

export default function AlertIntegrationsPage() {
  const { toast } = useToast();
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});

  const { data: integrations = [], isLoading } = useQuery<AlertIntegration[]>({
    queryKey: ['/api/alert-integrations'],
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ['/api/teams'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/alert-integrations', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alert-integrations'] });
      toast({ title: "Success", description: "Alert integration created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/alert-integrations/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alert-integrations'] });
      toast({ title: "Success", description: "Alert integration updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/alert-integrations/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alert-integrations'] });
      toast({ title: "Success", description: "Alert integration deleted" });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const getWebhookId = (webhookUrl: string) => {
    return webhookUrl.split('/').pop() || '';
  };

  const getFullWebhookUrl = (webhookUrl: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${webhookUrl}`;
  };

  return (
    <div className="p-8">
      <Link href="/admin">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-to-admin">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </Link>
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="page-title">Alert Integrations</h1>
          <p className="text-muted-foreground">
            Configure webhooks for monitoring systems to automatically create tickets
          </p>
        </div>
        <CreateIntegrationDialog onCreate={(data) => createMutation.mutate(data)} teams={teams} />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading alert integrations...</p>
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No alert integrations configured</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first integration to start receiving alerts from monitoring systems
            </p>
            <CreateIntegrationDialog onCreate={(data) => createMutation.mutate(data)} teams={teams} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id} data-testid={`integration-${integration.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{integration.name}</CardTitle>
                      <Badge variant={integration.enabled === 'true' ? 'default' : 'secondary'}>
                        {integration.enabled === 'true' ? 'Enabled' : 'Disabled'}
                      </Badge>
                      {integration.sourceSystem && (
                        <Badge variant="outline">{integration.sourceSystem}</Badge>
                      )}
                    </div>
                    {integration.description && (
                      <CardDescription>{integration.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integration.enabled === 'true'}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({
                          id: integration.id,
                          data: { enabled: checked ? 'true' : 'false' },
                        })
                      }
                      data-testid={`toggle-${integration.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(integration.id)}
                      data-testid={`delete-${integration.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Webhook Configuration</div>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                              {getFullWebhookUrl(integration.webhookUrl)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(getFullWebhookUrl(integration.webhookUrl), 'Webhook URL')}
                              data-testid={`copy-webhook-${integration.id}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">API Key</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                              {showApiKey[integration.id] ? integration.apiKey : '•'.repeat(32)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setShowApiKey((prev) => ({ ...prev, [integration.id]: !prev[integration.id] }))
                              }
                              data-testid={`toggle-api-key-${integration.id}`}
                            >
                              {showApiKey[integration.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(integration.apiKey, 'API Key')}
                              data-testid={`copy-api-key-${integration.id}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Default Priority</Label>
                      <p className="text-sm font-medium mt-1 capitalize">{integration.defaultPriority}</p>
                    </div>
                    {integration.defaultCategory && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Default Category</Label>
                        <p className="text-sm font-medium mt-1">{integration.defaultCategory}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIntegration(integration.id)}
                      data-testid={`configure-${integration.id}`}
                    >
                      Configure Filters & Mappings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedIntegration && (
        <IntegrationDetailsDialog
          integrationId={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
        />
      )}
    </div>
  );
}

function CreateIntegrationDialog({ onCreate, teams }: { onCreate: (data: any) => void; teams: any[] }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceSystem: '',
    defaultPriority: 'medium',
    defaultCategory: 'Other',
    autoAssignTeamId: '',
    enabled: 'true',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    setOpen(false);
    setFormData({
      name: '',
      description: '',
      sourceSystem: '',
      defaultPriority: 'medium',
      defaultCategory: 'Other',
      autoAssignTeamId: '',
      enabled: 'true',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-integration">
          <Plus className="h-4 w-4 mr-2" />
          Create Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Alert Integration</DialogTitle>
          <DialogDescription>
            Configure a new webhook endpoint for your monitoring system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Integration Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Production SolarWinds"
              required
              data-testid="input-name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this integration..."
              data-testid="input-description"
            />
          </div>

          <div>
            <Label htmlFor="sourceSystem">Source System</Label>
            <Select
              value={formData.sourceSystem}
              onValueChange={(value) => setFormData({ ...formData, sourceSystem: value })}
            >
              <SelectTrigger data-testid="select-source-system">
                <SelectValue placeholder="Select monitoring system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solarwinds">SolarWinds</SelectItem>
                <SelectItem value="nagios">Nagios</SelectItem>
                <SelectItem value="zabbix">Zabbix</SelectItem>
                <SelectItem value="prtg">PRTG</SelectItem>
                <SelectItem value="datadog">Datadog</SelectItem>
                <SelectItem value="prometheus">Prometheus</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultPriority">Default Priority</Label>
              <Select
                value={formData.defaultPriority}
                onValueChange={(value) => setFormData({ ...formData, defaultPriority: value })}
              >
                <SelectTrigger data-testid="select-default-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="defaultCategory">Default Category</Label>
              <Select
                value={formData.defaultCategory}
                onValueChange={(value) => setFormData({ ...formData, defaultCategory: value })}
              >
                <SelectTrigger data-testid="select-default-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                  <SelectItem value="Access">Access</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {teams.length > 0 && (
            <div>
              <Label htmlFor="autoAssignTeamId">Auto-assign Team (optional)</Label>
              <Select
                value={formData.autoAssignTeamId}
                onValueChange={(value) => setFormData({ ...formData, autoAssignTeamId: value })}
              >
                <SelectTrigger data-testid="select-team">
                  <SelectValue placeholder="No auto-assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No auto-assignment</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit">Create Integration</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationDetailsDialog({ integrationId, onClose }: { integrationId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('filters');

  const { data: filters = [] } = useQuery<FilterRule[]>({
    queryKey: ['/api/alert-integrations', integrationId, 'filters'],
  });

  const { data: mappings = [] } = useQuery<FieldMapping[]>({
    queryKey: ['/api/alert-integrations', integrationId, 'mappings'],
  });

  const createFilterMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/alert-integrations/${integrationId}/filters`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alert-integrations', integrationId, 'filters'] });
      toast({ title: "Success", description: "Filter rule created" });
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/alert-filters/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alert-integrations', integrationId, 'filters'] });
      toast({ title: "Success", description: "Filter rule deleted" });
    },
  });

  const createMappingMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/alert-integrations/${integrationId}/mappings`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alert-integrations', integrationId, 'mappings'] });
      toast({ title: "Success", description: "Field mapping created" });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/alert-mappings/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alert-integrations', integrationId, 'mappings'] });
      toast({ title: "Success", description: "Field mapping deleted" });
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Integration</DialogTitle>
          <DialogDescription>
            Set up filter rules and field mappings for this integration
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters">Filter Rules ({filters.length})</TabsTrigger>
            <TabsTrigger value="mappings">Field Mappings ({mappings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Filter rules determine which alerts create tickets
              </p>
              <FilterRuleForm onSubmit={(data) => createFilterMutation.mutate(data)} />
            </div>

            <div className="space-y-2">
              {filters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No filter rules configured. All alerts will create tickets.
                </p>
              ) : (
                filters.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">{rule.name}</p>
                            <Badge variant={rule.filterType === 'include' ? 'default' : 'secondary'}>
                              {rule.filterType}
                            </Badge>
                            <Badge variant={rule.enabled === 'true' ? 'outline' : 'secondary'}>
                              {rule.enabled === 'true' ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                          )}
                          <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {rule.fieldPath} {rule.operator} "{rule.value}"
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFilterMutation.mutate(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="mappings" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Field mappings extract data from alerts into ticket fields
              </p>
              <FieldMappingForm onSubmit={(data) => createMappingMutation.mutate(data)} />
            </div>

            <div className="space-y-2">
              {mappings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No field mappings configured. Using default values.
                </p>
              ) : (
                mappings.map((mapping) => (
                  <Card key={mapping.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <code className="font-mono bg-muted px-2 py-1 rounded">{mapping.alertFieldPath}</code>
                            <span className="text-muted-foreground">→</span>
                            <code className="font-mono bg-muted px-2 py-1 rounded">{mapping.ticketField}</code>
                            {mapping.transform && (
                              <>
                                <span className="text-muted-foreground">via</span>
                                <Badge variant="outline">{mapping.transform}</Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMappingMutation.mutate(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FilterRuleForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    filterType: 'exclude',
    fieldPath: '',
    operator: 'equals',
    value: '',
    priority: 0,
    enabled: 'true',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setOpen(false);
    setFormData({
      name: '',
      description: '',
      filterType: 'exclude',
      fieldPath: '',
      operator: 'equals',
      value: '',
      priority: 0,
      enabled: 'true',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Filter Rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Rule Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Exclude Info Alerts"
              required
            />
          </div>

          <div>
            <Label>Filter Type</Label>
            <Select
              value={formData.filterType}
              onValueChange={(value) => setFormData({ ...formData, filterType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exclude">Exclude (don't create ticket)</SelectItem>
                <SelectItem value="include">Include (create ticket)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Field Path (JSON path)</Label>
            <Input
              value={formData.fieldPath}
              onChange={(e) => setFormData({ ...formData, fieldPath: e.target.value })}
              placeholder="e.g., severity or alert.level"
              required
            />
          </div>

          <div>
            <Label>Operator</Label>
            <Select
              value={formData.operator}
              onValueChange={(value) => setFormData({ ...formData, operator: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not Equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="not_contains">Not Contains</SelectItem>
                <SelectItem value="regex">Regex Match</SelectItem>
                <SelectItem value="greater_than">Greater Than</SelectItem>
                <SelectItem value="less_than">Less Than</SelectItem>
                <SelectItem value="exists">Field Exists</SelectItem>
                <SelectItem value="not_exists">Field Not Exists</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Value</Label>
            <Input
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="Value to compare against"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Rule</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldMappingForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    ticketField: 'title',
    alertFieldPath: '',
    transform: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setOpen(false);
    setFormData({
      ticketField: 'title',
      alertFieldPath: '',
      transform: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Mapping
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Field Mapping</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Ticket Field</Label>
            <Select
              value={formData.ticketField}
              onValueChange={(value) => setFormData({ ...formData, ticketField: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Alert Field Path (JSON path)</Label>
            <Input
              value={formData.alertFieldPath}
              onChange={(e) => setFormData({ ...formData, alertFieldPath: e.target.value })}
              placeholder="e.g., message or alert.description"
              required
            />
          </div>

          <div>
            <Label>Transform (optional)</Label>
            <Select
              value={formData.transform}
              onValueChange={(value) => setFormData({ ...formData, transform: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No transformation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No transformation</SelectItem>
                <SelectItem value="uppercase">Uppercase</SelectItem>
                <SelectItem value="lowercase">Lowercase</SelectItem>
                <SelectItem value="trim">Trim whitespace</SelectItem>
                <SelectItem value="severity_to_priority">Severity to Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Mapping</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
