import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'resolved', 'closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['p1', 'p2', 'p3', 'p4', 'p5']);
export const changeStatusEnum = pgEnum('change_status', ['draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'implemented', 'cancelled']);
export const changeTypeEnum = pgEnum('change_type', ['normal', 'emergency', 'retrospective']);
export const changePriorityEnum = pgEnum('change_priority', ['p1', 'p2', 'p3', 'p4']);
export const ciTypeEnum = pgEnum('ci_type', ['server', 'application', 'database', 'network', 'storage', 'other']);
export const ciStatusEnum = pgEnum('ci_status', ['active', 'inactive', 'maintenance', 'decommissioned']);
export const kbTypeEnum = pgEnum('kb_type', ['sop', 'known_issue']);
export const userRoleEnum = pgEnum('user_role', ['user', 'support', 'admin']);
export const problemStatusEnum = pgEnum('problem_status', ['open', 'investigating', 'known_error', 'resolved', 'closed']);
export const problemPriorityEnum = pgEnum('problem_priority', ['p1', 'p2', 'p3', 'p4']);
export const slaStatusEnum = pgEnum('sla_status', ['within_sla', 'at_risk', 'breached']);
export const impactEnum = pgEnum('impact', ['high', 'medium', 'low']);
export const urgencyEnum = pgEnum('urgency', ['critical', 'high', 'medium', 'low']);
export const serviceCategoryEnum = pgEnum('service_category', ['access_management', 'hardware', 'software', 'network', 'general']);
export const serviceRequestStatusEnum = pgEnum('service_request_status', ['submitted', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled']);

// Roles table - for custom role-based access control
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  
  // Permissions
  canCreateTickets: varchar("can_create_tickets", { length: 10 }).default('true').notNull(),
  canUpdateOwnTickets: varchar("can_update_own_tickets", { length: 10 }).default('true').notNull(),
  canUpdateAllTickets: varchar("can_update_all_tickets", { length: 10 }).default('false').notNull(),
  canCloseTickets: varchar("can_close_tickets", { length: 10 }).default('false').notNull(),
  canViewAllTickets: varchar("can_view_all_tickets", { length: 10 }).default('false').notNull(),
  canApproveChanges: varchar("can_approve_changes", { length: 10 }).default('false').notNull(),
  canManageKnowledgebase: varchar("can_manage_knowledgebase", { length: 10 }).default('false').notNull(),
  canManageServiceCatalog: varchar("can_manage_service_catalog", { length: 10 }).default('false').notNull(),
  canRunReports: varchar("can_run_reports", { length: 10 }).default('false').notNull(),
  canManageUsers: varchar("can_manage_users", { length: 10 }).default('false').notNull(),
  canManageRoles: varchar("can_manage_roles", { length: 10 }).default('false').notNull(),
  canManageCMDB: varchar("can_manage_cmdb", { length: 10 }).default('false').notNull(),
  canViewCMDB: varchar("can_view_cmdb", { length: 10 }).default('true').notNull(),
  isTenantScoped: varchar("is_tenant_scoped", { length: 10 }).default('false').notNull(), // Limits user to their own company only
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for Replit Auth, extended for helpdesk)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('user').notNull(), // Legacy role field - kept for backwards compatibility
  roleId: varchar("role_id").references(() => roles.id), // Primary role reference (for compatibility)
  customerId: varchar("customer_id").references(() => customers.id), // Company/tenant assignment
  authProvider: varchar("auth_provider", { length: 20 }).default('replit').notNull(), // replit, ldap, saml, local
  passwordHash: varchar("password_hash", { length: 255 }), // For local auth only
  ldapDn: varchar("ldap_dn"), // Distinguished Name from LDAP
  samlNameId: varchar("saml_name_id"), // NameID from SAML
  status: varchar("status", { length: 20 }).default('active').notNull(), // active, disabled
  mustChangePassword: varchar("must_change_password", { length: 10 }).default('false').notNull(), // Force password change on next login
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Roles (many-to-many relationship for multiple roles per user)
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: varchar("role_id").references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  customerId: varchar("customer_id").references(() => customers.id), // For multi-customer support
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Team members (many-to-many relationship)
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customers (for multi-tenancy support)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).unique(), // Short code/abbreviation for customer
  description: text("description"),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  isActive: varchar("is_active", { length: 10 }).default('true').notNull(),
  slaTemplateId: varchar("sla_template_id").references(() => slaTemplates.id), // Link to SLA template
  changeApproverIds: text("change_approver_ids").array(), // Array of user IDs who can approve changes for this customer
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Resolution categories
export const resolutionCategories = pgTable("resolution_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System settings (branding, configuration)
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// License table for system licensing
export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseKey: varchar("license_key", { length: 255 }).unique().notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  issuedDate: timestamp("issued_date").defaultNow().notNull(),
  expirationDate: timestamp("expiration_date").notNull(),
  maxUsers: integer("max_users").notNull(),
  isActive: varchar("is_active", { length: 10 }).default('false').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SLA Templates
export const slaTemplates = pgTable("sla_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  isDefault: varchar("is_default", { length: 10 }).default('false').notNull(),
  
  // Incident SLAs (P1-P5) - in minutes
  incidentP1Response: integer("incident_p1_response").default(15).notNull(),
  incidentP1Resolution: integer("incident_p1_resolution").default(240).notNull(),
  incidentP2Response: integer("incident_p2_response").default(30).notNull(),
  incidentP2Resolution: integer("incident_p2_resolution").default(480).notNull(),
  incidentP3Response: integer("incident_p3_response").default(60).notNull(),
  incidentP3Resolution: integer("incident_p3_resolution").default(1440).notNull(),
  incidentP4Response: integer("incident_p4_response").default(240).notNull(),
  incidentP4Resolution: integer("incident_p4_resolution").default(4320).notNull(), // 3 business days
  incidentP5Response: integer("incident_p5_response").default(1440).notNull(), // 1 business day
  incidentP5Resolution: integer("incident_p5_resolution").notNull(), // As agreed (null or custom)
  
  // Change SLAs (P1-P4) - in minutes
  changeP1Approval: integer("change_p1_approval").default(30).notNull(),
  changeP1Implementation: integer("change_p1_implementation").default(60).notNull(),
  changeP2Approval: integer("change_p2_approval").default(1440).notNull(), // 1 business day
  changeP2Implementation: integer("change_p2_implementation").default(2880).notNull(), // 2 business days
  changeP3Approval: integer("change_p3_approval").default(2880).notNull(),
  changeP3Implementation: integer("change_p3_implementation").default(7200).notNull(), // 5 business days
  changeP4Approval: integer("change_p4_approval").default(7200).notNull(),
  changeP4Implementation: integer("change_p4_implementation").notNull(), // Scheduled as available
  
  // Problem SLAs (P1-P4) - in minutes
  problemP1Response: integer("problem_p1_response").default(30).notNull(),
  problemP1RcaTarget: integer("problem_p1_rca_target").default(2880).notNull(), // 2 business days
  problemP1Resolution: integer("problem_p1_resolution").default(7200).notNull(), // 5 business days
  problemP2Response: integer("problem_p2_response").default(60).notNull(),
  problemP2RcaTarget: integer("problem_p2_rca_target").default(7200).notNull(),
  problemP2Resolution: integer("problem_p2_resolution").default(14400).notNull(), // 10 business days
  problemP3Response: integer("problem_p3_response").default(240).notNull(),
  problemP3RcaTarget: integer("problem_p3_rca_target").default(14400).notNull(),
  problemP3Resolution: integer("problem_p3_resolution").default(28800).notNull(), // 20 business days
  problemP4Response: integer("problem_p4_response").default(1440).notNull(),
  problemP4RcaTarget: integer("problem_p4_rca_target").default(28800).notNull(),
  problemP4Resolution: integer("problem_p4_resolution").notNull(), // As scheduled
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Alert integrations (webhook configurations for monitoring systems)
export const alertIntegrations = pgTable("alert_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  enabled: varchar("enabled", { length: 10 }).default('true').notNull(),
  webhookUrl: varchar("webhook_url", { length: 500 }).unique().notNull(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  sourceSystem: varchar("source_system", { length: 100 }), // e.g., 'solarwinds', 'nagios', 'zabbix'
  defaultPriority: ticketPriorityEnum("default_priority").default('p3').notNull(),
  defaultCategory: varchar("default_category", { length: 100 }),
  autoAssignTeamId: varchar("auto_assign_team_id").references(() => teams.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Alert filter rules (to prevent certain alerts from creating tickets)
export const alertFilterRules = pgTable("alert_filter_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").references(() => alertIntegrations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  enabled: varchar("enabled", { length: 10 }).default('true').notNull(),
  filterType: varchar("filter_type", { length: 50 }).notNull(), // 'include' or 'exclude'
  fieldPath: varchar("field_path", { length: 255 }).notNull(), // JSON path to field, e.g., 'severity', 'host.name'
  operator: varchar("operator", { length: 50 }).notNull(), // 'equals', 'contains', 'regex', 'greater_than', etc.
  value: text("value").notNull(),
  priority: integer("priority").default(0).notNull(), // Lower number = higher priority
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alert field mappings (map alert fields to ticket fields)
export const alertFieldMappings = pgTable("alert_field_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").references(() => alertIntegrations.id).notNull(),
  ticketField: varchar("ticket_field", { length: 100 }).notNull(), // 'title', 'description', 'priority', 'category'
  alertFieldPath: varchar("alert_field_path", { length: 255 }).notNull(), // JSON path in alert payload
  transform: varchar("transform", { length: 50 }), // 'uppercase', 'lowercase', 'trim', 'severity_to_priority'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Discovery credentials (for network scanning)
export const discoveryCredentials = pgTable("discovery_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  credentialType: varchar("credential_type", { length: 50 }).notNull(), // 'ssh-password', 'ssh-key', 'snmp'
  username: varchar("username", { length: 255 }),
  password: text("password"), // Encrypted in production
  privateKey: text("private_key"), // For SSH key-based auth
  snmpCommunity: varchar("snmp_community", { length: 255 }), // For SNMP
  port: integer("port").default(22), // SSH port, SNMP port, etc.
  description: text("description"),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Discovery jobs (network scan jobs)
export const discoveryJobs = pgTable("discovery_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  subnet: varchar("subnet", { length: 100 }).notNull(), // e.g., 192.168.1.0/24
  status: varchar("status", { length: 50 }).default('pending').notNull(), // pending, running, completed, failed
  credentialIds: text("credential_ids").array(), // Multiple credentials to try
  discoveredCount: integer("discovered_count").default(0),
  totalHosts: integer("total_hosts").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Discovered devices (temporary storage before import to CMDB)
export const discoveredDevices = pgTable("discovered_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => discoveryJobs.id).notNull(),
  hostname: varchar("hostname", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  subnetMask: varchar("subnet_mask", { length: 45 }),
  serialNumber: varchar("serial_number", { length: 255 }),
  deviceType: varchar("device_type", { length: 100 }), // 'linux', 'windows', 'network', 'unknown'
  osVersion: varchar("os_version", { length: 255 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  imported: varchar("imported", { length: 10 }).default('false'), // Whether imported to CMDB
  importedCiId: varchar("imported_ci_id").references(() => configurationItems.id),
  discoveryMethod: varchar("discovery_method", { length: 50 }), // 'ssh', 'snmp', 'ping'
  rawData: jsonb("raw_data"), // Complete discovery data
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
});

// CI Types - Custom configuration item types
export const ciTypes = pgTable("ci_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Icon name from lucide-react
  isActive: varchar("is_active", { length: 10 }).default('true').notNull(),
  isDefault: varchar("is_default", { length: 10 }).default('false').notNull(), // Default types cannot be deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Configuration Items (CMDB)
export const configurationItems = pgTable("configuration_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciNumber: varchar("ci_number", { length: 20 }).unique(), // e.g., CI000001
  name: varchar("name", { length: 255 }).notNull(), // Hostname
  typeId: varchar("type_id").references(() => ciTypes.id).notNull(),
  description: text("description"),
  status: ciStatusEnum("status").default('active').notNull(),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  subnetMask: varchar("subnet_mask", { length: 45 }), // e.g., 255.255.255.0 or /24
  serialNumber: varchar("serial_number", { length: 255 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  supportDetails: text("support_details"), // 3rd party support contracts and vendor contact details
  customerId: varchar("customer_id").references(() => customers.id), // For multi-customer support
  ownerId: varchar("owner_id").references(() => users.id),
  ownerTeamId: varchar("owner_team_id").references(() => teams.id),
  properties: jsonb("properties"), // Flexible field for CI-specific properties
  discoveredVia: varchar("discovered_via", { length: 50 }), // 'manual', 'ssh', 'snmp', 'discovery'
  lastDiscovered: timestamp("last_discovered"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ci_type").on(table.typeId),
  index("idx_ci_status").on(table.status),
  index("idx_ci_customer").on(table.customerId),
  index("idx_ci_owner").on(table.ownerId),
  index("idx_ci_created").on(table.createdAt),
]);

// Support Tickets
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number", { length: 20 }).unique().notNull(), // e.g., TKT-00001
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").default('open').notNull(),
  priority: ticketPriorityEnum("priority").default('p3').notNull(),
  impact: impactEnum("impact").default('medium').notNull(), // For priority matrix
  urgency: urgencyEnum("urgency").default('medium').notNull(), // For priority matrix
  category: varchar("category", { length: 100 }), // e.g., Hardware, Software, Network, Access
  tags: text("tags").array(), // Flexible tagging system
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  assignedToTeamId: varchar("assigned_to_team_id").references(() => teams.id),
  resolutionCategoryId: varchar("resolution_category_id").references(() => resolutionCategories.id),
  resolutionNotes: text("resolution_notes"),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  linkedCiId: varchar("linked_ci_id").references(() => configurationItems.id),
  linkedProblemId: varchar("linked_problem_id"), // References problems table
  customerId: varchar("customer_id").references(() => customers.id), // For multi-customer support
  emailMessageId: varchar("email_message_id"), // Reference to email if created from email
  // SLA Tracking
  responseDueAt: timestamp("response_due_at"), // When first response is due
  resolutionDueAt: timestamp("resolution_due_at"), // When resolution is due
  slaStatus: slaStatusEnum("sla_status").default('within_sla'), // Current SLA status
  firstResponseAt: timestamp("first_response_at"), // When first response was made
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("idx_ticket_status").on(table.status),
  index("idx_ticket_priority").on(table.priority),
  index("idx_ticket_assigned").on(table.assignedToId),
  index("idx_ticket_customer").on(table.customerId),
  index("idx_ticket_created").on(table.createdAt),
  index("idx_ticket_sla_status").on(table.slaStatus),
]);

// Change Requests
export const changeRequests = pgTable("change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  changeNumber: varchar("change_number", { length: 20 }).unique().notNull(), // e.g., CHG-00001
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: changeStatusEnum("status").default('draft').notNull(),
  changeType: changeTypeEnum("change_type").default('normal').notNull(),
  priority: changePriorityEnum("priority").default('p3').notNull(),
  impact: impactEnum("impact").default('medium').notNull(), // For priority matrix
  urgency: urgencyEnum("urgency").default('medium').notNull(), // For priority matrix
  reason: text("reason"), // Reason for change
  prerequisites: text("prerequisites"), // Steps needed before the change
  communicationPlan: text("communication_plan"), // Who to contact and when
  testPlan: text("test_plan"), // Detailed test plan
  implementorDetails: text("implementor_details"), // Person doing the change and contact details
  rollbackPlan: text("rollback_plan"), // Rollback details
  impactAssessment: text("impact_assessment"), // Service impact, downtime, affected services
  requestedById: varchar("requested_by_id").references(() => users.id).notNull(),
  approvedById: varchar("approved_by_id").references(() => users.id),
  linkedCiId: varchar("linked_ci_id").references(() => configurationItems.id),
  customerId: varchar("customer_id").references(() => customers.id), // For multi-customer support
  scheduledDate: timestamp("scheduled_date"),
  implementedAt: timestamp("implemented_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_change_status").on(table.status),
  index("idx_change_priority").on(table.priority),
  index("idx_change_customer").on(table.customerId),
  index("idx_change_created").on(table.createdAt),
  index("idx_change_scheduled").on(table.scheduledDate),
]);

// Knowledge Base Articles
export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  type: kbTypeEnum("type").notNull(),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  views: integer("views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Problems (for problem management - ITIL)
export const problems = pgTable("problems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  problemNumber: varchar("problem_number", { length: 20 }).unique().notNull(), // e.g., PRB-00001
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: problemStatusEnum("status").default('open').notNull(),
  priority: problemPriorityEnum("priority").default('p3').notNull(),
  impact: impactEnum("impact").default('medium').notNull(), // For priority matrix
  urgency: urgencyEnum("urgency").default('medium').notNull(), // For priority matrix
  rootCause: text("root_cause"), // Root cause analysis
  workaround: text("workaround"), // Temporary workaround
  solution: text("solution"), // Permanent solution
  impactAssessment: text("impact_assessment"), // Impact and affected services
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  assignedToTeamId: varchar("assigned_to_team_id").references(() => teams.id),
  linkedCiId: varchar("linked_ci_id").references(() => configurationItems.id), // Affected CI
  customerId: varchar("customer_id").references(() => customers.id), // For multi-customer support
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("idx_problem_status").on(table.status),
  index("idx_problem_priority").on(table.priority),
  index("idx_problem_customer").on(table.customerId),
  index("idx_problem_created").on(table.createdAt),
]);

// Comments (for both tickets and change requests)
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  changeRequestId: varchar("change_request_id").references(() => changeRequests.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_comment_ticket").on(table.ticketId),
  index("idx_comment_change").on(table.changeRequestId),
  index("idx_comment_created").on(table.createdAt),
]);

// Email Messages (for email ticket creation)
export const emailMessages = pgTable("email_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAddress: varchar("from_address", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  ticketId: varchar("ticket_id").references(() => tickets.id), // Null until converted
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  convertedAt: timestamp("converted_at"),
});

// File Attachments
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(), // Size in bytes
  filePath: varchar("file_path", { length: 500 }).notNull(), // Storage path
  uploadedById: varchar("uploaded_by_id").references(() => users.id).notNull(),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  changeRequestId: varchar("change_request_id").references(() => changeRequests.id),
  knowledgeBaseId: varchar("knowledge_base_id").references(() => knowledgeBase.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_attachment_ticket").on(table.ticketId),
  index("idx_attachment_change").on(table.changeRequestId),
]);

// Contacts (vendor/support contacts)
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  company: varchar("company", { length: 255 }),
  role: varchar("role", { length: 100 }),
  notes: text("notes"),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ISO 27001 Compliance - Audit Logs
export const auditEventTypeEnum = pgEnum('audit_event_type', [
  'login_success',
  'login_failure',
  'logout',
  'password_change',
  'user_created',
  'user_updated',
  'user_deactivated',
  'user_activated',
  'role_assigned',
  'role_removed',
  'permission_changed',
  'access_granted',
  'access_revoked',
  'session_terminated',
  'unauthorized_access_attempt'
]);

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: auditEventTypeEnum("event_type").notNull(),
  userId: varchar("user_id").references(() => users.id), // Null for failed logins
  username: varchar("username", { length: 255 }), // Store username even if user doesn't exist
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  success: varchar("success", { length: 10 }).notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata"), // Additional context (e.g., changed fields, target user)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_user").on(table.userId),
  index("idx_audit_event_type").on(table.eventType),
  index("idx_audit_created").on(table.createdAt),
  index("idx_audit_ip").on(table.ipAddress),
]);

// ISO 27001 Compliance - Failed Login Tracking (for account lockout)
export const failedLoginAttempts = pgTable("failed_login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  attemptCount: integer("attempt_count").default(1).notNull(),
  lockedUntil: timestamp("locked_until"), // When the account lockout expires
  lastAttemptAt: timestamp("last_attempt_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ISO 27001 Compliance - Access Reviews (track access rights reviews)
export const accessReviews = pgTable("access_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reviewedById: varchar("reviewed_by_id").references(() => users.id).notNull(),
  reviewType: varchar("review_type", { length: 50 }).notNull(), // 'regular', 'privileged', 'termination'
  findings: text("findings"), // Any issues or recommendations
  accessApproved: varchar("access_approved", { length: 10 }).notNull(), // 'true' or 'false'
  nextReviewDate: timestamp("next_review_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ISO 27001 Compliance - User Sessions (track active sessions for monitoring)
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }).unique().notNull(), // Reference to sessions table sid
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  loginAt: timestamp("login_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  logoutAt: timestamp("logout_at"),
  isActive: varchar("is_active", { length: 10 }).default('true').notNull(),
});

// ITIL Service Catalog - Service Catalog Items (pre-defined services)
export const serviceCatalogItems = pgTable("service_catalog_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: serviceCategoryEnum("category").notNull(),
  icon: varchar("icon", { length: 100 }), // lucide-react icon name
  estimatedCompletionMinutes: integer("estimated_completion_minutes"), // SLA estimate
  requiresApproval: varchar("requires_approval", { length: 10 }).default('false').notNull(),
  isActive: varchar("is_active", { length: 10 }).default('true').notNull(),
  cost: integer("cost"), // Optional cost tracking (in cents)
  customerId: varchar("customer_id").references(() => customers.id), // For multi-customer specific services
  formFields: jsonb("form_fields"), // Custom form fields definition (JSON array)
  assignedToTeamId: varchar("assigned_to_team_id").references(() => teams.id), // Default team assignment
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ITIL Service Catalog - Service Requests (actual service request instances)
export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: varchar("request_number", { length: 20 }).unique().notNull(), // Auto-generated: SR00001, SR00002
  serviceCatalogItemId: varchar("service_catalog_item_id").references(() => serviceCatalogItems.id).notNull(),
  requestedById: varchar("requested_by_id").references(() => users.id).notNull(),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  assignedToTeamId: varchar("assigned_to_team_id").references(() => teams.id),
  status: serviceRequestStatusEnum("status").default('submitted').notNull(),
  priority: ticketPriorityEnum("priority").default('p3').notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  formData: jsonb("form_data"), // User-submitted form data (JSON object)
  approvalNotes: text("approval_notes"), // Notes from approver
  completionNotes: text("completion_notes"), // Notes from fulfiller
  approvedById: varchar("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_service_request_status").on(table.status),
  index("idx_service_request_customer").on(table.customerId),
  index("idx_service_request_created").on(table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ticketsCreated: many(tickets, { relationName: 'createdBy' }),
  ticketsAssigned: many(tickets, { relationName: 'assignedTo' }),
  changesRequested: many(changeRequests, { relationName: 'requestedBy' }),
  changesApproved: many(changeRequests, { relationName: 'approvedBy' }),
  knowledgeBaseArticles: many(knowledgeBase),
  comments: many(comments),
  ownedCIs: many(configurationItems),
  userRoles: many(userRoles),
  primaryRole: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  customer: one(customers, {
    fields: [users.customerId],
    references: [customers.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const ciTypesRelations = relations(ciTypes, ({ many }) => ({
  configurationItems: many(configurationItems),
}));

export const configurationItemsRelations = relations(configurationItems, ({ one, many }) => ({
  ciType: one(ciTypes, {
    fields: [configurationItems.typeId],
    references: [ciTypes.id],
  }),
  owner: one(users, {
    fields: [configurationItems.ownerId],
    references: [users.id],
  }),
  tickets: many(tickets),
  changeRequests: many(changeRequests),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tickets.createdById],
    references: [users.id],
    relationName: 'createdBy',
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
    relationName: 'assignedTo',
  }),
  linkedCI: one(configurationItems, {
    fields: [tickets.linkedCiId],
    references: [configurationItems.id],
  }),
  comments: many(comments),
  attachments: many(attachments),
}));

export const changeRequestsRelations = relations(changeRequests, ({ one, many }) => ({
  requestedBy: one(users, {
    fields: [changeRequests.requestedById],
    references: [users.id],
    relationName: 'requestedBy',
  }),
  approvedBy: one(users, {
    fields: [changeRequests.approvedById],
    references: [users.id],
    relationName: 'approvedBy',
  }),
  linkedCI: one(configurationItems, {
    fields: [changeRequests.linkedCiId],
    references: [configurationItems.id],
  }),
  comments: many(comments),
  attachments: many(attachments),
}));

export const knowledgeBaseRelations = relations(knowledgeBase, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [knowledgeBase.createdById],
    references: [users.id],
  }),
  attachments: many(attachments),
}));

export const problemsRelations = relations(problems, ({ one }) => ({
  createdBy: one(users, {
    fields: [problems.createdById],
    references: [users.id],
    relationName: 'createdBy',
  }),
  assignedTo: one(users, {
    fields: [problems.assignedToId],
    references: [users.id],
    relationName: 'assignedTo',
  }),
  linkedCI: one(configurationItems, {
    fields: [problems.linkedCiId],
    references: [configurationItems.id],
  }),
  customer: one(customers, {
    fields: [problems.customerId],
    references: [customers.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  createdBy: one(users, {
    fields: [comments.createdById],
    references: [users.id],
  }),
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  changeRequest: one(changeRequests, {
    fields: [comments.changeRequestId],
    references: [changeRequests.id],
  }),
}));

export const emailMessagesRelations = relations(emailMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [emailMessages.ticketId],
    references: [tickets.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [attachments.uploadedById],
    references: [users.id],
  }),
  ticket: one(tickets, {
    fields: [attachments.ticketId],
    references: [tickets.id],
  }),
  changeRequest: one(changeRequests, {
    fields: [attachments.changeRequestId],
    references: [changeRequests.id],
  }),
  knowledgeBaseArticle: one(knowledgeBase, {
    fields: [attachments.knowledgeBaseId],
    references: [knowledgeBase.id],
  }),
}));

export const serviceCatalogItemsRelations = relations(serviceCatalogItems, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [serviceCatalogItems.createdById],
    references: [users.id],
  }),
  assignedToTeam: one(teams, {
    fields: [serviceCatalogItems.assignedToTeamId],
    references: [teams.id],
  }),
  customer: one(customers, {
    fields: [serviceCatalogItems.customerId],
    references: [customers.id],
  }),
  serviceRequests: many(serviceRequests),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  serviceCatalogItem: one(serviceCatalogItems, {
    fields: [serviceRequests.serviceCatalogItemId],
    references: [serviceCatalogItems.id],
  }),
  requestedBy: one(users, {
    fields: [serviceRequests.requestedById],
    references: [users.id],
    relationName: 'requestedBy',
  }),
  assignedTo: one(users, {
    fields: [serviceRequests.assignedToId],
    references: [users.id],
    relationName: 'assignedTo',
  }),
  approvedBy: one(users, {
    fields: [serviceRequests.approvedById],
    references: [users.id],
    relationName: 'approvedBy',
  }),
  assignedToTeam: one(teams, {
    fields: [serviceRequests.assignedToTeamId],
    references: [teams.id],
  }),
  customer: one(customers, {
    fields: [serviceRequests.customerId],
    references: [customers.id],
  }),
}));

// Insert schemas and types
export const insertConfigurationItemSchema = createInsertSchema(configurationItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketNumber: true,
  createdById: true,
  emailMessageId: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertChangeRequestSchema = createInsertSchema(changeRequests).omit({
  id: true,
  changeNumber: true,
  requestedById: true,
  approvedById: true,
  createdAt: true,
  updatedAt: true,
  implementedAt: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdById: true,
  views: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProblemSchema = createInsertSchema(problems).omit({
  id: true,
  problemNumber: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdById: true,
  createdAt: true,
});

export const insertEmailMessageSchema = createInsertSchema(emailMessages).omit({
  id: true,
  ticketId: true,
  receivedAt: true,
  convertedAt: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  uploadedById: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertResolutionCategorySchema = createInsertSchema(resolutionCategories).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  createdAt: true,
});

export const insertSlaTemplateSchema = createInsertSchema(slaTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertIntegrationSchema = createInsertSchema(alertIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertFilterRuleSchema = createInsertSchema(alertFilterRules).omit({
  id: true,
  createdAt: true,
});

export const insertAlertFieldMappingSchema = createInsertSchema(alertFieldMappings).omit({
  id: true,
  createdAt: true,
});

export const insertDiscoveryCredentialSchema = createInsertSchema(discoveryCredentials).omit({
  id: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiscoveryJobSchema = createInsertSchema(discoveryJobs).omit({
  id: true,
  createdById: true,
  createdAt: true,
});

export const insertDiscoveredDeviceSchema = createInsertSchema(discoveredDevices).omit({
  id: true,
  discoveredAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
});

export const insertServiceCatalogItemSchema = createInsertSchema(serviceCatalogItems).omit({
  id: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  requestNumber: true,
  requestedById: true,
  approvedById: true,
  approvedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertResolutionCategory = z.infer<typeof insertResolutionCategorySchema>;
export type ResolutionCategory = typeof resolutionCategories.$inferSelect;

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licenses.$inferSelect;

export type InsertSlaTemplate = z.infer<typeof insertSlaTemplateSchema>;
export type SlaTemplate = typeof slaTemplates.$inferSelect;

export type InsertAlertIntegration = z.infer<typeof insertAlertIntegrationSchema>;
export type AlertIntegration = typeof alertIntegrations.$inferSelect;

export type InsertAlertFilterRule = z.infer<typeof insertAlertFilterRuleSchema>;
export type AlertFilterRule = typeof alertFilterRules.$inferSelect;

export type InsertAlertFieldMapping = z.infer<typeof insertAlertFieldMappingSchema>;
export type AlertFieldMapping = typeof alertFieldMappings.$inferSelect;

export type InsertDiscoveryCredential = z.infer<typeof insertDiscoveryCredentialSchema>;
export type DiscoveryCredential = typeof discoveryCredentials.$inferSelect;

export type InsertDiscoveryJob = z.infer<typeof insertDiscoveryJobSchema>;
export type DiscoveryJob = typeof discoveryJobs.$inferSelect;

export type InsertDiscoveredDevice = z.infer<typeof insertDiscoveredDeviceSchema>;
export type DiscoveredDevice = typeof discoveredDevices.$inferSelect;

export type InsertConfigurationItem = z.infer<typeof insertConfigurationItemSchema>;
export type ConfigurationItem = typeof configurationItems.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export type InsertChangeRequest = z.infer<typeof insertChangeRequestSchema>;
export type ChangeRequest = typeof changeRequests.$inferSelect;

export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;

export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Problem = typeof problems.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertEmailMessage = z.infer<typeof insertEmailMessageSchema>;
export type EmailMessage = typeof emailMessages.$inferSelect;

export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

export const insertCiTypeSchema = createInsertSchema(ciTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCiType = z.infer<typeof insertCiTypeSchema>;
export type CiType = typeof ciTypes.$inferSelect;

// ISO 27001 Compliance Insert Schemas
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export const insertFailedLoginAttemptSchema = createInsertSchema(failedLoginAttempts).omit({
  id: true,
  createdAt: true,
});
export type InsertFailedLoginAttempt = z.infer<typeof insertFailedLoginAttemptSchema>;
export type FailedLoginAttempt = typeof failedLoginAttempts.$inferSelect;

export const insertAccessReviewSchema = createInsertSchema(accessReviews).omit({
  id: true,
  createdAt: true,
});
export type InsertAccessReview = z.infer<typeof insertAccessReviewSchema>;
export type AccessReview = typeof accessReviews.$inferSelect;

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  loginAt: true,
  lastActivityAt: true,
});
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

// Service Catalog Types
export type InsertServiceCatalogItem = z.infer<typeof insertServiceCatalogItemSchema>;
export type ServiceCatalogItem = typeof serviceCatalogItems.$inferSelect;

export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
