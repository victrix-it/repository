import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDiscoveryCredentialSchema, insertDiscoveryJobSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Key, Server, Plus, Trash2, Play, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import type { DiscoveryCredential, DiscoveryJob } from "@shared/schema";
import { z } from "zod";

export default function NetworkDiscovery() {
  const { toast } = useToast();
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);

  const { data: credentials = [], isLoading: credentialsLoading } = useQuery<DiscoveryCredential[]>({
    queryKey: ['/api/discovery/credentials'],
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<DiscoveryJob[]>({
    queryKey: ['/api/discovery/jobs'],
  });

  const credentialForm = useForm({
    resolver: zodResolver(insertDiscoveryCredentialSchema),
    defaultValues: {
      name: "",
      credentialType: "ssh-password",
      username: "",
      password: "",
      privateKey: "",
      port: 22,
      description: "",
    },
  });

  const jobForm = useForm({
    resolver: zodResolver(insertDiscoveryJobSchema.extend({
      credentialIds: z.array(z.string()).min(1, "Select at least one credential"),
    })),
    defaultValues: {
      name: "",
      subnet: "",
      credentialIds: [],
    },
  });

  const createCredentialMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/discovery/credentials', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discovery/credentials'] });
      toast({ title: "Credential created" });
      setCredentialDialogOpen(false);
      credentialForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create credential", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/discovery/credentials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discovery/credentials'] });
      toast({ title: "Credential deleted" });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/discovery/jobs', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discovery/jobs'] });
      toast({ 
        title: "Discovery job started", 
        description: "The network scan is now running in the background" 
      });
      setJobDialogOpen(false);
      jobForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to start discovery", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/discovery/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discovery/jobs'] });
      toast({ title: "Job deleted" });
    },
  });

  const onSubmitCredential = credentialForm.handleSubmit((data) => {
    createCredentialMutation.mutate(data);
  });

  const onSubmitJob = jobForm.handleSubmit((data) => {
    createJobMutation.mutate(data);
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'completed': 'default',
      'failed': 'destructive',
      'running': 'default',
      'pending': 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'} data-testid={`badge-status-${status}`}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Network Discovery</h1>
        <p className="text-muted-foreground">
          Scan your network to automatically discover devices and populate the CMDB
        </p>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs" data-testid="tab-jobs">Discovery Jobs</TabsTrigger>
          <TabsTrigger value="credentials" data-testid="tab-credentials">Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {jobs.length} discovery {jobs.length === 1 ? 'job' : 'jobs'}
            </p>
            <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-job">
                  <Play className="h-4 w-4 mr-2" />
                  New Discovery Scan
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-new-job">
                <DialogHeader>
                  <DialogTitle>Start Network Discovery</DialogTitle>
                </DialogHeader>
                <Form {...jobForm}>
                  <form onSubmit={onSubmitJob} className="space-y-4">
                    <FormField
                      control={jobForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Production Network Scan" data-testid="input-job-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={jobForm.control}
                      name="subnet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subnet (CIDR)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="192.168.1.0/24" data-testid="input-subnet" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={jobForm.control}
                      name="credentialIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credentials to Try</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const current = (field.value || []) as string[];
                              if (!current.includes(value)) {
                                field.onChange([...current, value]);
                              }
                            }}
                          >
                            <SelectTrigger data-testid="select-credentials">
                              <SelectValue placeholder="Select credentials" />
                            </SelectTrigger>
                            <SelectContent>
                              {credentials.map((cred) => (
                                <SelectItem key={cred.id} value={cred.id} data-testid={`option-credential-${cred.id}`}>
                                  {cred.name} ({cred.credentialType})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {((field.value || []) as string[]).map((credId: string) => {
                              const cred = credentials.find(c => c.id === credId);
                              return cred ? (
                                <Badge key={credId} variant="secondary" data-testid={`badge-selected-credential-${credId}`}>
                                  {cred.name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      field.onChange(((field.value || []) as string[]).filter((id: string) => id !== credId));
                                    }}
                                    className="ml-2"
                                    data-testid={`button-remove-credential-${credId}`}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={createJobMutation.isPending} data-testid="button-submit-job">
                      {createJobMutation.isPending ? "Starting..." : "Start Discovery"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {jobsLoading ? (
            <div className="text-center py-8">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No discovery jobs yet. Start your first network scan.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id} data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <CardTitle className="text-lg" data-testid={`text-job-name-${job.id}`}>{job.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(job.status)}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteJobMutation.mutate(job.id)}
                          data-testid={`button-delete-job-${job.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription data-testid={`text-job-subnet-${job.id}`}>
                      Subnet: {job.subnet} • {job.discoveredCount || 0}/{job.totalHosts || 0} devices discovered
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {job.status === 'running' && (job.totalHosts || 0) > 0 && (
                      <Progress 
                        value={(job.discoveredCount || 0) / (job.totalHosts || 1) * 100} 
                        className="mb-4"
                        data-testid={`progress-job-${job.id}`}
                      />
                    )}
                    {job.error && (
                      <p className="text-sm text-destructive mb-2" data-testid={`text-job-error-${job.id}`}>
                        Error: {job.error}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Started:</span>{" "}
                        <span data-testid={`text-job-started-${job.id}`}>
                          {job.startedAt ? new Date(job.startedAt).toLocaleString() : "Not started"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completed:</span>{" "}
                        <span data-testid={`text-job-completed-${job.id}`}>
                          {job.completedAt ? new Date(job.completedAt).toLocaleString() : "-"}
                        </span>
                      </div>
                    </div>
                    {job.status === 'completed' && (job.discoveredCount || 0) > 0 && (
                      <Button 
                        asChild 
                        className="mt-4" 
                        variant="secondary"
                        data-testid={`button-view-results-${job.id}`}
                      >
                        <a href={`/admin/discovery/${job.id}`}>
                          View Discovered Devices
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {credentials.length} {credentials.length === 1 ? 'credential' : 'credentials'} configured
            </p>
            <Dialog open={credentialDialogOpen} onOpenChange={setCredentialDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-credential">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credential
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-new-credential">
                <DialogHeader>
                  <DialogTitle>Add Discovery Credential</DialogTitle>
                </DialogHeader>
                <Form {...credentialForm}>
                  <form onSubmit={onSubmitCredential} className="space-y-4">
                    <FormField
                      control={credentialForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Production SSH Key" data-testid="input-credential-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={credentialForm.control}
                      name="credentialType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger data-testid="select-credential-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ssh-password" data-testid="option-ssh-password">SSH Password</SelectItem>
                              <SelectItem value="ssh-key" data-testid="option-ssh-key">SSH Key</SelectItem>
                              <SelectItem value="snmp" data-testid="option-snmp">SNMP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={credentialForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="admin" data-testid="input-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {credentialForm.watch("credentialType") === "ssh-password" && (
                      <FormField
                        control={credentialForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} data-testid="input-password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {credentialForm.watch("credentialType") === "ssh-key" && (
                      <FormField
                        control={credentialForm.control}
                        name="privateKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Private Key</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={5} placeholder="-----BEGIN RSA PRIVATE KEY-----" data-testid="input-private-key" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={credentialForm.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              data-testid="input-port"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={credentialForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} data-testid="input-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={createCredentialMutation.isPending} data-testid="button-submit-credential">
                      {createCredentialMutation.isPending ? "Adding..." : "Add Credential"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {credentialsLoading ? (
            <div className="text-center py-8">Loading credentials...</div>
          ) : credentials.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No credentials configured. Add credentials to start discovering devices.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {credentials.map((credential) => (
                <Card key={credential.id} data-testid={`card-credential-${credential.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg" data-testid={`text-credential-name-${credential.id}`}>
                          {credential.name}
                        </CardTitle>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteCredentialMutation.mutate(credential.id)}
                        data-testid={`button-delete-credential-${credential.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      {credential.credentialType} • Port {credential.port}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Username:</span>{" "}
                        <span data-testid={`text-credential-username-${credential.id}`}>{credential.username || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>{" "}
                        <Badge variant="outline" data-testid={`badge-credential-type-${credential.id}`}>
                          {credential.credentialType}
                        </Badge>
                      </div>
                    </div>
                    {credential.description && (
                      <p className="text-sm text-muted-foreground mt-2" data-testid={`text-credential-description-${credential.id}`}>
                        {credential.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
