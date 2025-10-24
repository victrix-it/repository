import { useQuery } from "@tanstack/react-query";
import { MODULES, type ModuleKey } from "@shared/modules";
import type { SystemSetting } from "@shared/schema";

export function useModules() {
  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings"],
  });

  const settingsMap = settings?.reduce((acc, s) => {
    acc[s.key] = s.value || '';
    return acc;
  }, {} as Record<string, string>) || {};

  const isModuleEnabled = (moduleKey: ModuleKey): boolean => {
    const module = MODULES[moduleKey];
    if (!module) return false;
    
    const settingValue = settingsMap[module.settingKey];
    
    // If no setting exists, use default
    if (settingValue === undefined || settingValue === null || settingValue === '') {
      return module.defaultEnabled;
    }
    
    return settingValue === 'true';
  };

  const getEnabledModules = (): ModuleKey[] => {
    return Object.keys(MODULES).filter(key => 
      isModuleEnabled(key as ModuleKey)
    ) as ModuleKey[];
  };

  return {
    isModuleEnabled,
    getEnabledModules,
    isLoading,
    settingsMap,
  };
}
