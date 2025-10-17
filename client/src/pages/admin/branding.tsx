import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Palette } from "lucide-react";
import type { SystemSetting } from "@shared/schema";

interface BrandingFormData {
  systemName: string;
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  tagline: string;
}

export default function BrandingPage() {
  const { toast } = useToast();

  const { data: settings } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings"],
  });

  const settingsMap = settings?.reduce((acc, s) => {
    acc[s.key] = s.value || '';
    return acc;
  }, {} as Record<string, string>) || {};

  const form = useForm<BrandingFormData>({
    defaultValues: {
      systemName: settingsMap['system_name'] || 'Helpdesk & CMDB',
      companyName: settingsMap['company_name'] || 'Your Company',
      logoUrl: settingsMap['logo_url'] || '',
      primaryColor: settingsMap['primary_color'] || '#3b82f6',
      tagline: settingsMap['tagline'] || 'IT Service Management',
    },
    values: {
      systemName: settingsMap['system_name'] || 'Helpdesk & CMDB',
      companyName: settingsMap['company_name'] || 'Your Company',
      logoUrl: settingsMap['logo_url'] || '',
      primaryColor: settingsMap['primary_color'] || '#3b82f6',
      tagline: settingsMap['tagline'] || 'IT Service Management',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: BrandingFormData) => {
      const settingsToSave = [
        { key: 'system_name', value: data.systemName },
        { key: 'company_name', value: data.companyName },
        { key: 'logo_url', value: data.logoUrl },
        { key: 'primary_color', value: data.primaryColor },
        { key: 'tagline', value: data.tagline },
      ];

      for (const setting of settingsToSave) {
        await apiRequest("POST", "/api/settings", setting);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Branding settings saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
          <Palette className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-semibold" data-testid="page-title">Branding & Appearance</h1>
        </div>
        <p className="text-muted-foreground">
          Customize your helpdesk system's appearance and branding
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
              <CardDescription>
                Configure your organization's branding and visual identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="systemName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Helpdesk & CMDB" {...field} data-testid="input-system-name" />
                        </FormControl>
                        <FormDescription>
                          The name displayed in the browser tab and header
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company" {...field} data-testid="input-company-name" />
                        </FormControl>
                        <FormDescription>
                          Your organization's name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline</FormLabel>
                        <FormControl>
                          <Input placeholder="IT Service Management" {...field} data-testid="input-tagline" />
                        </FormControl>
                        <FormDescription>
                          A short description or slogan
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} data-testid="input-logo-url" />
                        </FormControl>
                        <FormDescription>
                          URL to your company logo image (leave empty for text-only branding)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <div className="flex gap-3">
                          <FormControl>
                            <Input type="color" {...field} className="w-20 h-10" data-testid="input-primary-color" />
                          </FormControl>
                          <Input value={field.value} onChange={field.onChange} placeholder="#3b82f6" data-testid="input-primary-color-text" />
                        </div>
                        <FormDescription>
                          The primary brand color used throughout the system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save">
                      {saveMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                      data-testid="button-reset"
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
              <CardDescription>See how your branding will look</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex items-center gap-3 mb-3">
                  {form.watch('logoUrl') ? (
                    <img 
                      src={form.watch('logoUrl')} 
                      alt="Logo" 
                      className="h-8 w-auto"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div 
                      className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: form.watch('primaryColor') }}
                    >
                      {form.watch('companyName').charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{form.watch('systemName')}</p>
                    <p className="text-xs text-muted-foreground">{form.watch('tagline')}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {form.watch('companyName')}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Color Palette</p>
                <div className="flex gap-2">
                  <div
                    className="h-12 flex-1 rounded-md border"
                    style={{ backgroundColor: form.watch('primaryColor') }}
                    title="Primary Color"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
