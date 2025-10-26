import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { SystemSetting } from "@shared/schema";

interface EmailFormData {
  enabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpSecure: boolean;
}

export default function EmailSettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: settings } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings"],
  });

  const settingsMap = settings?.reduce((acc, s) => {
    acc[s.key] = s.value || '';
    return acc;
  }, {} as Record<string, string>) || {};

  const form = useForm<EmailFormData>({
    defaultValues: {
      enabled: settingsMap['smtp_enabled'] === 'true',
      smtpHost: settingsMap['smtp_host'] || '',
      smtpPort: settingsMap['smtp_port'] || '587',
      smtpUser: settingsMap['smtp_user'] || '',
      smtpPassword: settingsMap['smtp_password'] || '',
      smtpFromEmail: settingsMap['smtp_from_email'] || '',
      smtpFromName: settingsMap['smtp_from_name'] || 'Victrix Servicedesk',
      smtpSecure: settingsMap['smtp_secure'] === 'true',
    },
    values: {
      enabled: settingsMap['smtp_enabled'] === 'true',
      smtpHost: settingsMap['smtp_host'] || '',
      smtpPort: settingsMap['smtp_port'] || '587',
      smtpUser: settingsMap['smtp_user'] || '',
      smtpPassword: settingsMap['smtp_password'] || '',
      smtpFromEmail: settingsMap['smtp_from_email'] || '',
      smtpFromName: settingsMap['smtp_from_name'] || 'Victrix Servicedesk',
      smtpSecure: settingsMap['smtp_secure'] === 'true',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const settingsToSave = [
        { key: 'smtp_enabled', value: data.enabled ? 'true' : 'false' },
        { key: 'smtp_host', value: data.smtpHost },
        { key: 'smtp_port', value: data.smtpPort },
        { key: 'smtp_user', value: data.smtpUser },
        { key: 'smtp_password', value: data.smtpPassword },
        { key: 'smtp_from_email', value: data.smtpFromEmail },
        { key: 'smtp_from_name', value: data.smtpFromName },
        { key: 'smtp_secure', value: data.smtpSecure ? 'true' : 'false' },
      ];

      return await apiRequest('POST', '/api/settings/bulk', { settings: settingsToSave });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Email settings saved",
        description: "SMTP configuration has been updated successfully. Server restart may be required for changes to take effect.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/email/test', {});
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "Check your inbox to verify email delivery.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailFormData) => {
    saveMutation.mutate(data);
  };

  const isEnabled = form.watch('enabled');
  const isSecure = form.watch('smtpSecure');

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/admin')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" data-testid="page-title">
            Email Settings
          </h1>
          <p className="text-muted-foreground">
            Configure SMTP settings for email notifications
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  SMTP Configuration
                </CardTitle>
                <CardDescription>
                  Configure email sending for notifications and alerts
                </CardDescription>
              </div>
              {isEnabled && (
                <Badge variant="default" data-testid="status-enabled">
                  Enabled
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Email Notifications</FormLabel>
                        <FormDescription>
                          Turn on email notifications for changes, incidents, and approvals
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isEnabled && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">SMTP Server Settings</h3>
                      
                      <FormField
                        control={form.control}
                        name="smtpHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="smtp.example.com"
                                data-testid="input-smtp-host"
                              />
                            </FormControl>
                            <FormDescription>
                              Your SMTP server address (e.g., smtp.sendgrid.net, smtp.gmail.com)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="smtpPort"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Port</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder="587"
                                  data-testid="input-smtp-port"
                                />
                              </FormControl>
                              <FormDescription>
                                {isSecure ? '465 (SSL)' : '587 (TLS) or 25'}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="smtpSecure"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-md border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Use SSL</FormLabel>
                                <FormDescription>
                                  Enable for port 465
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-smtp-secure"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="smtpUser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Username</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="apikey or username"
                                data-testid="input-smtp-user"
                              />
                            </FormControl>
                            <FormDescription>
                              Your SMTP username or API key
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="smtpPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="••••••••"
                                data-testid="input-smtp-password"
                              />
                            </FormControl>
                            <FormDescription>
                              Your SMTP password or API key secret
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Sender Information</h3>
                      
                      <FormField
                        control={form.control}
                        name="smtpFromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="no-reply@servicedesk.victrix-it.com"
                                data-testid="input-smtp-from-email"
                              />
                            </FormControl>
                            <FormDescription>
                              Email address that notifications will be sent from
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="smtpFromName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Victrix Servicedesk"
                                data-testid="input-smtp-from-name"
                              />
                            </FormControl>
                            <FormDescription>
                              Display name for email notifications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => testEmailMutation.mutate()}
                        disabled={testEmailMutation.isPending}
                        data-testid="button-test-email"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        data-testid="button-save"
                      >
                        {saveMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </>
                )}

                {!isEnabled && (
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={saveMutation.isPending}
                      data-testid="button-save"
                    >
                      {saveMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                )}
              </form>
            </Form>

            {isEnabled && (
              <div className="mt-6 p-4 bg-muted/50 rounded-md">
                <h4 className="font-medium mb-2">Email Notification Types</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Change approval requests to customer approvers</li>
                  <li>• CI owner notifications when incidents/changes are raised</li>
                  <li>• Service request status updates</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recommended SMTP Providers</CardTitle>
            <CardDescription>
              Free and paid options for sending emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Badge variant="outline">SendGrid</Badge>
                <p className="text-muted-foreground">
                  100 free emails/day, excellent deliverability
                  <br />
                  <code className="text-xs">smtp.sendgrid.net:587</code>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline">Mailgun</Badge>
                <p className="text-muted-foreground">
                  5,000 free emails/month for 3 months
                  <br />
                  <code className="text-xs">smtp.mailgun.org:587</code>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline">Amazon SES</Badge>
                <p className="text-muted-foreground">
                  Very affordable, $0.10 per 1,000 emails
                  <br />
                  <code className="text-xs">email-smtp.[region].amazonaws.com:587</code>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline">Postmark</Badge>
                <p className="text-muted-foreground">
                  Premium deliverability for transactional emails
                  <br />
                  <code className="text-xs">smtp.postmarkapp.com:587</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
