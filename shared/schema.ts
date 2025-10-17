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
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'critical']);
export const changeStatusEnum = pgEnum('change_status', ['draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'implemented', 'cancelled']);
export const changeTypeEnum = pgEnum('change_type', ['normal', 'emergency', 'retrospective']);
export const changePriorityEnum = pgEnum('change_priority', ['low', 'medium', 'high', 'critical']);
export const ciTypeEnum = pgEnum('ci_type', ['server', 'application', 'database', 'network', 'storage', 'other']);
export const ciStatusEnum = pgEnum('ci_status', ['active', 'inactive', 'maintenance', 'decommissioned']);
export const kbTypeEnum = pgEnum('kb_type', ['sop', 'known_issue']);
export const userRoleEnum = pgEnum('user_role', ['user', 'support', 'admin']);

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
  role: userRoleEnum("role").default('user').notNull(),
  authProvider: varchar("auth_provider", { length: 20 }).default('replit').notNull(), // replit, ldap, saml, local
  passwordHash: varchar("password_hash", { length: 255 }), // For local auth only
  ldapDn: varchar("ldap_dn"), // Distinguished Name from LDAP
  samlNameId: varchar("saml_name_id"), // NameID from SAML
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
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

// Alert integrations (webhook configurations for monitoring systems)
export const alertIntegrations = pgTable("alert_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  enabled: varchar("enabled", { length: 10 }).default('true').notNull(),
  webhookUrl: varchar("webhook_url", { length: 500 }).unique().notNull(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  sourceSystem: varchar("source_system", { length: 100 }), // e.g., 'solarwinds', 'nagios', 'zabbix'
  defaultPriority: ticketPriorityEnum("default_priority").default('medium').notNull(),
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

// Configuration Items (CMDB)
export const configurationItems = pgTable("configuration_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciNumber: varchar("ci_number", { length: 20 }).unique(), // e.g., CI000001
  name: varchar("name", { length: 255 }).notNull(), // Hostname
  type: ciTypeEnum("type").notNull(),
  description: text("description"),
  status: ciStatusEnum("status").default('active').notNull(),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  subnetMask: varchar("subnet_mask", { length: 45 }), // e.g., 255.255.255.0 or /24
  serialNumber: varchar("serial_number", { length: 255 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  supportDetails: text("support_details"), // 3rd party support contracts and vendor contact details
  ownerId: varchar("owner_id").references(() => users.id),
  properties: jsonb("properties"), // Flexible field for CI-specific properties
  discoveredVia: varchar("discovered_via", { length: 50 }), // 'manual', 'ssh', 'snmp', 'discovery'
  lastDiscovered: timestamp("last_discovered"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support Tickets
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number", { length: 20 }).unique().notNull(), // e.g., TKT-00001
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").default('open').notNull(),
  priority: ticketPriorityEnum("priority").default('medium').notNull(),
  category: varchar("category", { length: 100 }), // e.g., Hardware, Software, Network, Access
  tags: text("tags").array(), // Flexible tagging system
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  assignedToTeamId: varchar("assigned_to_team_id").references(() => teams.id),
  resolutionCategoryId: varchar("resolution_category_id").references(() => resolutionCategories.id),
  resolutionNotes: text("resolution_notes"),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  linkedCiId: varchar("linked_ci_id").references(() => configurationItems.id),
  emailMessageId: varchar("email_message_id"), // Reference to email if created from email
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// Change Requests
export const changeRequests = pgTable("change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  changeNumber: varchar("change_number", { length: 20 }).unique().notNull(), // e.g., CHG-00001
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: changeStatusEnum("status").default('draft').notNull(),
  changeType: changeTypeEnum("change_type").default('normal').notNull(),
  priority: changePriorityEnum("priority").default('medium').notNull(),
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
  scheduledDate: timestamp("scheduled_date"),
  implementedAt: timestamp("implemented_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

// Comments (for both tickets and change requests)
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  changeRequestId: varchar("change_request_id").references(() => changeRequests.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
});

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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ticketsCreated: many(tickets, { relationName: 'createdBy' }),
  ticketsAssigned: many(tickets, { relationName: 'assignedTo' }),
  changesRequested: many(changeRequests, { relationName: 'requestedBy' }),
  changesApproved: many(changeRequests, { relationName: 'approvedBy' }),
  knowledgeBaseArticles: many(knowledgeBase),
  comments: many(comments),
  ownedCIs: many(configurationItems),
}));

export const configurationItemsRelations = relations(configurationItems, ({ one, many }) => ({
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertResolutionCategory = z.infer<typeof insertResolutionCategorySchema>;
export type ResolutionCategory = typeof resolutionCategories.$inferSelect;

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

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

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertEmailMessage = z.infer<typeof insertEmailMessageSchema>;
export type EmailMessage = typeof emailMessages.$inferSelect;

export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
