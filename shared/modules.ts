export type ModuleKey = 
  | 'incidents'
  | 'problems'
  | 'changes'
  | 'cmdb'
  | 'knowledge'
  | 'service_catalog'
  | 'email_inbox'
  | 'reports'
  | 'network_discovery';

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  description: string;
  settingKey: string;
  defaultEnabled: boolean;
  category: 'core' | 'itil' | 'advanced';
}

export const MODULES: Record<ModuleKey, ModuleDefinition> = {
  incidents: {
    key: 'incidents',
    name: 'Incident Management',
    description: 'Track and resolve IT incidents and helpdesk tickets',
    settingKey: 'module_incidents_enabled',
    defaultEnabled: true,
    category: 'core',
  },
  problems: {
    key: 'problems',
    name: 'Problem Management',
    description: 'Identify and manage root causes of recurring incidents',
    settingKey: 'module_problems_enabled',
    defaultEnabled: false,
    category: 'itil',
  },
  changes: {
    key: 'changes',
    name: 'Change Management',
    description: 'Plan and track IT changes with approval workflows',
    settingKey: 'module_changes_enabled',
    defaultEnabled: false,
    category: 'itil',
  },
  cmdb: {
    key: 'cmdb',
    name: 'Configuration Management Database',
    description: 'Manage IT assets and configuration items',
    settingKey: 'module_cmdb_enabled',
    defaultEnabled: true,
    category: 'core',
  },
  knowledge: {
    key: 'knowledge',
    name: 'Knowledge Base',
    description: 'Create and manage knowledge articles and documentation',
    settingKey: 'module_knowledge_enabled',
    defaultEnabled: true,
    category: 'core',
  },
  service_catalog: {
    key: 'service_catalog',
    name: 'Service Catalog',
    description: 'ITIL service request fulfillment and catalog management',
    settingKey: 'module_service_catalog_enabled',
    defaultEnabled: true,
    category: 'itil',
  },
  email_inbox: {
    key: 'email_inbox',
    name: 'Email Inbox',
    description: 'Email integration for ticket creation',
    settingKey: 'module_email_inbox_enabled',
    defaultEnabled: false,
    category: 'advanced',
  },
  reports: {
    key: 'reports',
    name: 'Reporting & Analytics',
    description: 'Generate reports and view analytics dashboards',
    settingKey: 'module_reports_enabled',
    defaultEnabled: true,
    category: 'core',
  },
  network_discovery: {
    key: 'network_discovery',
    name: 'Network Discovery',
    description: 'Automated network device and asset discovery',
    settingKey: 'module_network_discovery_enabled',
    defaultEnabled: false,
    category: 'advanced',
  },
};

export function getModulesByCategory(category: 'core' | 'itil' | 'advanced'): ModuleDefinition[] {
  return Object.values(MODULES).filter(m => m.category === category);
}
