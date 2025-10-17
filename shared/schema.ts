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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Configuration Items (CMDB)
export const configurationItems = pgTable("configuration_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  type: ciTypeEnum("type").notNull(),
  description: text("description"),
  status: ciStatusEnum("status").default('active').notNull(),
  ownerId: varchar("owner_id").references(() => users.id),
  properties: jsonb("properties"), // Flexible field for CI-specific properties
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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
