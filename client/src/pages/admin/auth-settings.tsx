import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Shield, Server, Key } from "lucide-react";
import type { SystemSetting } from "@shared/schema";

export default function AuthSettingsPage() {
  const { toast } = useToast();

  const { data: settings } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings"],
  });

  const settingsMap = settings?.reduce((acc, s) => {
    acc[s.key] = s.value || '';
    return acc;
  }, {} as Record<string, string>) || {};

  // LDAP Form
  const ldapForm = useForm({
    defaultValues: {
      enabled: settingsMap['auth_ldap_enabled'] === 'true',
      url: settingsMap['auth_ldap_url'] || '',
      bindDn: settingsMap['auth_ldap_bind_dn'] || '',
      bindPassword: settingsMap['auth_ldap_bind_password'] || '',
      searchBase: settingsMap['auth_ldap_search_base'] || '',
      searchFilter: settingsMap['auth_ldap_search_filter'] || '(uid={{username}})',
    },
    values: {
      enabled: settingsMap['auth_ldap_enabled'] === 'true',
      url: settingsMap['auth_ldap_url'] || '',
      bindDn: settingsMap['auth_ldap_bind_dn'] || '',
      bindPassword: settingsMap['auth_ldap_bind_password'] || '',
      searchBase: settingsMap['auth_ldap_search_base'] || '',
      searchFilter: settingsMap['auth_ldap_search_filter'] || '(uid={{username}})',
    },
  });

  // SAML Form
  const samlForm = useForm({
    defaultValues: {
      enabled: settingsMap['auth_saml_enabled'] === 'true',
      entryPoint: settingsMap['auth_saml_entry_point'] || '',
      issuer: settingsMap['auth_saml_issuer'] || '',
      callbackUrl: settingsMap['auth_saml_callback_url'] || '',
      cert: settingsMap['auth_saml_cert'] || '',
    },
    values: {
      enabled: settingsMap['auth_saml_enabled'] === 'true',
      entryPoint: settingsMap['auth_saml_entry_point'] || '',
      issuer: settingsMap['auth_saml_issuer'] || '',
      callbackUrl: settingsMap['auth_saml_callback_url'] || '',
      cert: settingsMap['auth_saml_cert'] || '',
    },
  });

  // Local Auth Form
  const localForm = useForm({
    defaultValues: {
      enabled: settingsMap['auth_local_enabled'] === 'true',
    },
    values: {
      enabled: settingsMap['auth_local_enabled'] === 'true',
    },
  });

  const saveLdapMutation = useMutation({
    mutationFn: async (data: any) => {
      const settingsToSave = [
        { key: 'auth_ldap_enabled', value: data.enabled ? 'true' : 'false' },
        { key: 'auth_ldap_url', value: data.url },
        { key: 'auth_ldap_bind_dn', value: data.bindDn },
        { key: 'auth_ldap_bind_password', value: data.bindPassword },
        { key: 'auth_ldap_search_base', value: data.searchBase },
        { key: 'auth_ldap_search_filter', value: data.searchFilter },
      ];

      for (const setting of settingsToSave) {
        await apiRequest("POST", "/api/settings", setting);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Success", description: "LDAP settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveSamlMutation = useMutation({
    mutationFn: async (data: any) => {
      const settingsToSave = [
        { key: 'auth_saml_enabled', value: data.enabled ? 'true' : 'false' },
        { key: 'auth_saml_entry_point', value: data.entryPoint },
        { key: 'auth_saml_issuer', value: data.issuer },
        { key: 'auth_saml_callback_url', value: data.callbackUrl },
        { key: 'auth_saml_cert', value: data.cert },
      ];

      for (const setting of settingsToSave) {
        await apiRequest("POST", "/api/settings", setting);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Success", description: "SAML settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveLocalMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/settings", {
        key: 'auth_local_enabled',
        value: data.enabled ? 'true' : 'false',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Success", description: "Local auth settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-8">
      <Link href="/admin">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-semibold" data-testid="page-title">Authentication Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure authentication methods for your helpdesk system
        </p>
      </div>

      <Tabs defaultValue="local" className="space-y-6">
        <TabsList>
          <TabsTrigger value="local" data-testid="tab-local">Local Auth</TabsTrigger>
          <TabsTrigger value="ldap" data-testid="tab-ldap">LDAP</TabsTrigger>
          <TabsTrigger value="saml" data-testid="tab-saml">SAML</TabsTrigger>
        </TabsList>

        {/* Local Auth Tab */}
        <TabsContent value="local">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Key className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Local Authentication</CardTitle>
                  <CardDescription>Username/password authentication</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...localForm}>
                <form onSubmit={localForm.handleSubmit((data) => saveLocalMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={localForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Local Authentication</FormLabel>
                          <FormDescription>
                            Allow users to register and login with email/password
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-local-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={saveLocalMutation.isPending} data-testid="button-save-local">
                    {saveLocalMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LDAP Tab */}
        <TabsContent value="ldap">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Server className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>LDAP Configuration</CardTitle>
                  <CardDescription>Connect to LDAP/Active Directory</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...ldapForm}>
                <form onSubmit={ldapForm.handleSubmit((data) => saveLdapMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={ldapForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Enable LDAP Authentication</FormLabel>
                          <FormDescription>
                            Allow users to login with LDAP credentials
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-ldap-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ldapForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LDAP Server URL</FormLabel>
                        <FormControl>
                          <Input placeholder="ldap://ldap.example.com:389" {...field} data-testid="input-ldap-url" />
                        </FormControl>
                        <FormDescription>
                          The URL of your LDAP server
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ldapForm.control}
                    name="bindDn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bind DN</FormLabel>
                        <FormControl>
                          <Input placeholder="cn=admin,dc=example,dc=com" {...field} data-testid="input-ldap-bind-dn" />
                        </FormControl>
                        <FormDescription>
                          Distinguished Name for binding to LDAP
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ldapForm.control}
                    name="bindPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bind Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="input-ldap-bind-password" />
                        </FormControl>
                        <FormDescription>
                          Password for the bind DN
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ldapForm.control}
                    name="searchBase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Base</FormLabel>
                        <FormControl>
                          <Input placeholder="ou=users,dc=example,dc=com" {...field} data-testid="input-ldap-search-base" />
                        </FormControl>
                        <FormDescription>
                          Base DN for user searches
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ldapForm.control}
                    name="searchFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Filter</FormLabel>
                        <FormControl>
                          <Input placeholder="(uid={{username}})" {...field} data-testid="input-ldap-search-filter" />
                        </FormControl>
                        <FormDescription>
                          LDAP filter for finding users. Use {"{{username}}"} as placeholder
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={saveLdapMutation.isPending} data-testid="button-save-ldap">
                    {saveLdapMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAML Tab */}
        <TabsContent value="saml">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>SAML Configuration</CardTitle>
                  <CardDescription>Enterprise SSO with SAML 2.0</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...samlForm}>
                <form onSubmit={samlForm.handleSubmit((data) => saveSamlMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={samlForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Enable SAML Authentication</FormLabel>
                          <FormDescription>
                            Allow users to login via SAML SSO
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-saml-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={samlForm.control}
                    name="entryPoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SSO Entry Point</FormLabel>
                        <FormControl>
                          <Input placeholder="https://idp.example.com/saml/sso" {...field} data-testid="input-saml-entry-point" />
                        </FormControl>
                        <FormDescription>
                          The Identity Provider's SSO URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={samlForm.control}
                    name="issuer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuer / Entity ID</FormLabel>
                        <FormControl>
                          <Input placeholder="https://helpdesk.example.com/saml/metadata" {...field} data-testid="input-saml-issuer" />
                        </FormControl>
                        <FormDescription>
                          Your service provider entity ID
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={samlForm.control}
                    name="callbackUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Callback URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://helpdesk.example.com/api/auth/saml/callback" {...field} data-testid="input-saml-callback-url" />
                        </FormControl>
                        <FormDescription>
                          The URL where SAML responses are sent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={samlForm.control}
                    name="cert"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IdP Certificate</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            className="font-mono text-xs"
                            {...field}
                            data-testid="input-saml-cert"
                            rows={8}
                          />
                        </FormControl>
                        <FormDescription>
                          The Identity Provider's X.509 certificate (PEM format)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={saveSamlMutation.isPending} data-testid="button-save-saml">
                    {saveSamlMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
