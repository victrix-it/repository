import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Settings, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { MODULES, getModulesByCategory, type ModuleKey } from "@shared/modules";
import type { SystemSetting } from "@shared/schema";
import { Link } from "wouter";

export default function ModulesPage() {
  const { toast } = useToast();
  const [savingModule, setSavingModule] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings"],
  });

  const settingsMap = settings?.reduce((acc, s) => {
    acc[s.key] = s.value || '';
    return acc;
  }, {} as Record<string, string>) || {};

  const toggleMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("POST", `/api/settings`, { key, value });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Module updated",
        description: "Module settings saved successfully",
      });
      setSavingModule(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update module settings",
      });
      setSavingModule(null);
    },
  });

  const isModuleEnabled = (moduleKey: ModuleKey): boolean => {
    const module = MODULES[moduleKey];
    const settingValue = settingsMap[module.settingKey];
    
    if (settingValue === undefined || settingValue === null || settingValue === '') {
      return module.defaultEnabled;
    }
    
    return settingValue === 'true';
  };

  const handleToggle = async (moduleKey: ModuleKey, enabled: boolean) => {
    const module = MODULES[moduleKey];
    setSavingModule(module.settingKey);
    
    toggleMutation.mutate({
      key: module.settingKey,
      value: enabled ? 'true' : 'false',
    });
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'core':
        return 'default';
      case 'itil':
        return 'secondary';
      case 'advanced':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const coreModules = getModulesByCategory('core');
  const itilModules = getModulesByCategory('itil');
  const advancedModules = getModulesByCategory('advanced');

  return (
    <div className="p-6 space-y-6">
      <Link href="/admin">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-to-admin">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </Link>
      
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-modules-title">
          <Settings className="h-8 w-8" />
          Module Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Enable or disable system modules to customize your helpdesk installation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Modules</CardTitle>
          <CardDescription>
            Essential features for basic helpdesk operation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {coreModules.map((module, index) => {
            const enabled = isModuleEnabled(module.key);
            const isSaving = savingModule === module.settingKey;

            return (
              <div key={module.key}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={module.key} className="text-base font-medium cursor-pointer">
                        {module.name}
                      </Label>
                      <Badge variant={getCategoryBadgeVariant(module.category)}>
                        {module.category}
                      </Badge>
                      {enabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" data-testid={`icon-enabled-${module.key}`} />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" data-testid={`icon-disabled-${module.key}`} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Switch
                      id={module.key}
                      checked={enabled}
                      onCheckedChange={(checked) => handleToggle(module.key, checked)}
                      disabled={isSaving}
                      data-testid={`switch-module-${module.key}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ITIL Modules</CardTitle>
          <CardDescription>
            ITIL-compliant service management processes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {itilModules.map((module, index) => {
            const enabled = isModuleEnabled(module.key);
            const isSaving = savingModule === module.settingKey;

            return (
              <div key={module.key}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={module.key} className="text-base font-medium cursor-pointer">
                        {module.name}
                      </Label>
                      <Badge variant={getCategoryBadgeVariant(module.category)}>
                        {module.category}
                      </Badge>
                      {enabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" data-testid={`icon-enabled-${module.key}`} />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" data-testid={`icon-disabled-${module.key}`} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Switch
                      id={module.key}
                      checked={enabled}
                      onCheckedChange={(checked) => handleToggle(module.key, checked)}
                      disabled={isSaving}
                      data-testid={`switch-module-${module.key}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Modules</CardTitle>
          <CardDescription>
            Optional features for enhanced functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {advancedModules.map((module, index) => {
            const enabled = isModuleEnabled(module.key);
            const isSaving = savingModule === module.settingKey;

            return (
              <div key={module.key}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={module.key} className="text-base font-medium cursor-pointer">
                        {module.name}
                      </Label>
                      <Badge variant={getCategoryBadgeVariant(module.category)}>
                        {module.category}
                      </Badge>
                      {enabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" data-testid={`icon-enabled-${module.key}`} />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" data-testid={`icon-disabled-${module.key}`} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Switch
                      id={module.key}
                      checked={enabled}
                      onCheckedChange={(checked) => handleToggle(module.key, checked)}
                      disabled={isSaving}
                      data-testid={`switch-module-${module.key}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
