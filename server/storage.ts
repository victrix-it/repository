import {
  users,
  tickets,
  changeRequests,
  configurationItems,
  knowledgeBase,
  comments,
  emailMessages,
  attachments,
  teams,
  teamMembers,
  customers,
  resolutionCategories,
  systemSettings,
  alertIntegrations,
  alertFilterRules,
  alertFieldMappings,
  discoveryCredentials,
  discoveryJobs,
  discoveredDevices,
  contacts,
  problems,
  roles,
  type User,
  type UpsertUser,
  type Ticket,
  type InsertTicket,
  type ChangeRequest,
  type InsertChangeRequest,
  type ConfigurationItem,
  type InsertConfigurationItem,
  type KnowledgeBase,
  type InsertKnowledgeBase,
  type Comment,
  type InsertComment,
  type EmailMessage,
  type InsertEmailMessage,
  type Attachment,
  type InsertAttachment,
  type Team,
  type InsertTeam,
  type Customer,
  type InsertCustomer,
  type TeamMember,
  type InsertTeamMember,
  type ResolutionCategory,
  type InsertResolutionCategory,
  type SystemSetting,
  type InsertSystemSetting,
  type AlertIntegration,
  type InsertAlertIntegration,
  type AlertFilterRule,
  type InsertAlertFilterRule,
  type AlertFieldMapping,
  type InsertAlertFieldMapping,
  type DiscoveryCredential,
  type InsertDiscoveryCredential,
  type DiscoveryJob,
  type InsertDiscoveryJob,
  type DiscoveredDevice,
  type InsertDiscoveredDevice,
  type Contact,
  type InsertContact,
  type Problem,
  type InsertProblem,
  type SlaTemplate,
  type InsertSlaTemplate,
  type Role,
  type InsertRole,
  slaTemplates,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Ticket operations
  createTicket(ticket: InsertTicket, createdById: string): Promise<Ticket>;
  getTicket(id: string): Promise<any>;
  getAllTickets(): Promise<any[]>;
  updateTicketStatus(id: string, status: string): Promise<void>;
  
  // Change Request operations
  createChangeRequest(change: InsertChangeRequest, requestedById: string): Promise<ChangeRequest>;
  getChangeRequest(id: string): Promise<any>;
  getAllChangeRequests(): Promise<any[]>;
  updateChangeStatus(id: string, status: string): Promise<void>;
  
  // Configuration Item operations
  createConfigurationItem(ci: InsertConfigurationItem): Promise<ConfigurationItem>;
  getConfigurationItem(id: string): Promise<any>;
  getAllConfigurationItems(): Promise<ConfigurationItem[]>;
  
  // Knowledge Base operations
  createKnowledgeBase(kb: InsertKnowledgeBase, createdById: string): Promise<KnowledgeBase>;
  getKnowledgeBase(id: string): Promise<any>;
  getAllKnowledgeBase(): Promise<any[]>;
  incrementKBViews(id: string): Promise<void>;
  
  // Problem operations
  createProblem(problem: InsertProblem, createdById: string): Promise<Problem>;
  getProblem(id: string): Promise<any>;
  getAllProblems(): Promise<any[]>;
  updateProblem(id: string, problem: Partial<InsertProblem>): Promise<Problem>;
  updateProblemStatus(id: string, status: string): Promise<void>;
  linkTicketToProblem(ticketId: string, problemId: string): Promise<void>;
  unlinkTicketFromProblem(ticketId: string): Promise<void>;
  getLinkedTicketsForProblem(problemId: string): Promise<any[]>;
  detectRecurringIncidents(): Promise<any[]>;
  
  // Comment operations
  createComment(comment: InsertComment, createdById: string): Promise<Comment>;
  
  // Email operations
  createEmailMessage(email: InsertEmailMessage): Promise<EmailMessage>;
  getAllEmailMessages(): Promise<EmailMessage[]>;
  convertEmailToTicket(emailId: string, createdById: string): Promise<Ticket>;
  
  // Attachment operations
  createAttachment(attachment: InsertAttachment, uploadedById: string): Promise<Attachment>;
  getAttachmentsByTicket(ticketId: string): Promise<Attachment[]>;
  getAttachmentsByChange(changeId: string): Promise<Attachment[]>;
  getAttachmentsByKB(kbId: string): Promise<Attachment[]>;
  getAttachment(id: string): Promise<Attachment | undefined>;
  deleteAttachment(id: string): Promise<void>;
  
  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getAllTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: string): Promise<void>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;
  getTeamMembers(teamId: string): Promise<any[]>;
  
  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // SLA Template operations
  createSlaTemplate(template: InsertSlaTemplate): Promise<SlaTemplate>;
  getAllSlaTemplates(): Promise<SlaTemplate[]>;
  getSlaTemplate(id: string): Promise<SlaTemplate | undefined>;
  updateSlaTemplate(id: string, template: Partial<InsertSlaTemplate>): Promise<SlaTemplate>;
  deleteSlaTemplate(id: string): Promise<void>;
  setDefaultSlaTemplate(id: string): Promise<void>;
  
  // Role operations
  createRole(role: InsertRole): Promise<Role>;
  getRole(id: string): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<void>;
  
  // Resolution category operations
  createResolutionCategory(category: InsertResolutionCategory): Promise<ResolutionCategory>;
  getAllResolutionCategories(): Promise<ResolutionCategory[]>;
  getResolutionCategory(id: string): Promise<ResolutionCategory | undefined>;
  updateResolutionCategory(id: string, category: Partial<InsertResolutionCategory>): Promise<ResolutionCategory>;
  deleteResolutionCategory(id: string): Promise<void>;
  
  // System settings operations
  getSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSettings(): Promise<SystemSetting[]>;
  upsertSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  deleteSetting(key: string): Promise<void>;
  
  // Alert integration operations
  createAlertIntegration(integration: InsertAlertIntegration): Promise<AlertIntegration>;
  getAllAlertIntegrations(): Promise<AlertIntegration[]>;
  getAlertIntegration(id: string): Promise<AlertIntegration | undefined>;
  getAlertIntegrationByWebhookId(webhookId: string): Promise<AlertIntegration | undefined>;
  updateAlertIntegration(id: string, integration: Partial<InsertAlertIntegration>): Promise<AlertIntegration>;
  deleteAlertIntegration(id: string): Promise<void>;
  
  // Alert filter rule operations
  createFilterRule(rule: InsertAlertFilterRule): Promise<AlertFilterRule>;
  getFilterRulesByIntegration(integrationId: string): Promise<AlertFilterRule[]>;
  updateFilterRule(id: string, rule: Partial<InsertAlertFilterRule>): Promise<AlertFilterRule>;
  deleteFilterRule(id: string): Promise<void>;
  
  // Alert field mapping operations
  createFieldMapping(mapping: InsertAlertFieldMapping): Promise<AlertFieldMapping>;
  getFieldMappingsByIntegration(integrationId: string): Promise<AlertFieldMapping[]>;
  updateFieldMapping(id: string, mapping: Partial<InsertAlertFieldMapping>): Promise<AlertFieldMapping>;
  deleteFieldMapping(id: string): Promise<void>;
  
  // System user for automated operations
  getOrCreateSystemUser(): Promise<string>;
  
  // Discovery credential operations
  createDiscoveryCredential(credential: InsertDiscoveryCredential, createdById: string): Promise<DiscoveryCredential>;
  getAllDiscoveryCredentials(): Promise<DiscoveryCredential[]>;
  getDiscoveryCredential(id: string): Promise<DiscoveryCredential | undefined>;
  getDiscoveryCredentialsByIds(ids: string[]): Promise<DiscoveryCredential[]>;
  updateDiscoveryCredential(id: string, credential: Partial<InsertDiscoveryCredential>): Promise<DiscoveryCredential>;
  deleteDiscoveryCredential(id: string): Promise<void>;
  
  // Discovery job operations
  createDiscoveryJob(job: InsertDiscoveryJob, createdById: string): Promise<DiscoveryJob>;
  getAllDiscoveryJobs(): Promise<DiscoveryJob[]>;
  getDiscoveryJob(id: string): Promise<DiscoveryJob | undefined>;
  updateDiscoveryJob(id: string, job: Partial<InsertDiscoveryJob>): Promise<DiscoveryJob>;
  deleteDiscoveryJob(id: string): Promise<void>;
  
  // Discovered device operations
  createDiscoveredDevice(device: InsertDiscoveredDevice): Promise<DiscoveredDevice>;
  getDiscoveredDevicesByJob(jobId: string): Promise<DiscoveredDevice[]>;
  getDiscoveredDevice(id: string): Promise<DiscoveredDevice | undefined>;
  updateDiscoveredDevice(id: string, device: Partial<InsertDiscoveredDevice>): Promise<DiscoveredDevice>;
  deleteDiscoveredDevice(id: string): Promise<void>;
  
  // Contact operations
  createContact(contact: InsertContact, createdById: string): Promise<Contact>;
  getAllContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(userData as any).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Ticket operations
  async createTicket(ticket: InsertTicket, createdById: string): Promise<Ticket> {
    // Generate ticket number
    const count = await db.select({ count: sql<number>`count(*)` }).from(tickets);
    const ticketNumber = `TKT-${String(count[0].count + 1).padStart(5, '0')}`;

    const [newTicket] = await db
      .insert(tickets)
      .values({
        ...ticket,
        ticketNumber,
        createdById,
      })
      .returning();
    return newTicket;
  }

  async getTicket(id: string): Promise<any> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id));

    if (!ticket) return null;

    // Get related data
    const [createdBy] = ticket.createdById 
      ? await db.select().from(users).where(eq(users.id, ticket.createdById))
      : [null];
    
    const [assignedTo] = ticket.assignedToId
      ? await db.select().from(users).where(eq(users.id, ticket.assignedToId))
      : [null];
    
    const [linkedCI] = ticket.linkedCiId
      ? await db.select().from(configurationItems).where(eq(configurationItems.id, ticket.linkedCiId))
      : [null];

    const ticketComments = await db
      .select()
      .from(comments)
      .where(eq(comments.ticketId, id))
      .orderBy(comments.createdAt);

    const commentsWithUsers = await Promise.all(
      ticketComments.map(async (comment) => {
        const [user] = await db.select().from(users).where(eq(users.id, comment.createdById));
        return { ...comment, createdBy: user };
      })
    );

    return {
      ...ticket,
      createdBy,
      assignedTo,
      linkedCI,
      comments: commentsWithUsers,
    };
  }

  async getAllTickets(): Promise<any[]> {
    const allTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    
    return await Promise.all(
      allTickets.map(async (ticket) => {
        const [createdBy] = ticket.createdById
          ? await db.select().from(users).where(eq(users.id, ticket.createdById))
          : [null];
        const [assignedTo] = ticket.assignedToId
          ? await db.select().from(users).where(eq(users.id, ticket.assignedToId))
          : [null];
        const [customer] = ticket.customerId
          ? await db.select().from(customers).where(eq(customers.id, ticket.customerId))
          : [null];
        const [assignedToTeam] = ticket.assignedToTeamId
          ? await db.select().from(teams).where(eq(teams.id, ticket.assignedToTeamId))
          : [null];
        return { ...ticket, createdBy, assignedTo, customer, assignedToTeam };
      })
    );
  }

  async updateTicketStatus(id: string, status: string): Promise<void> {
    const updates: any = { status, updatedAt: new Date() };
    if (status === 'resolved') {
      updates.resolvedAt = new Date();
    }
    await db.update(tickets).set(updates).where(eq(tickets.id, id));
  }

  // Change Request operations
  async createChangeRequest(change: InsertChangeRequest, requestedById: string): Promise<ChangeRequest> {
    const count = await db.select({ count: sql<number>`count(*)` }).from(changeRequests);
    const changeNumber = `CHG-${String(count[0].count + 1).padStart(5, '0')}`;

    const [newChange] = await db
      .insert(changeRequests)
      .values({
        ...change,
        changeNumber,
        requestedById,
      })
      .returning();
    return newChange;
  }

  async getChangeRequest(id: string): Promise<any> {
    const [change] = await db
      .select()
      .from(changeRequests)
      .where(eq(changeRequests.id, id));

    if (!change) return null;

    const [requestedBy] = change.requestedById
      ? await db.select().from(users).where(eq(users.id, change.requestedById))
      : [null];
    const [approvedBy] = change.approvedById
      ? await db.select().from(users).where(eq(users.id, change.approvedById))
      : [null];

    return { ...change, requestedBy, approvedBy };
  }

  async getAllChangeRequests(): Promise<any[]> {
    const allChanges = await db.select().from(changeRequests).orderBy(desc(changeRequests.createdAt));
    
    return await Promise.all(
      allChanges.map(async (change) => {
        const [requestedBy] = change.requestedById
          ? await db.select().from(users).where(eq(users.id, change.requestedById))
          : [null];
        const [approvedBy] = change.approvedById
          ? await db.select().from(users).where(eq(users.id, change.approvedById))
          : [null];
        return { ...change, requestedBy, approvedBy };
      })
    );
  }

  async updateChangeStatus(id: string, status: string): Promise<void> {
    await db.update(changeRequests).set({ 
      status: status as any, 
      updatedAt: new Date() 
    }).where(eq(changeRequests.id, id));
  }

  // Configuration Item operations
  async createConfigurationItem(ci: InsertConfigurationItem): Promise<ConfigurationItem> {
    // Auto-generate CI number if not provided
    let ciNumber = ci.ciNumber;
    if (!ciNumber) {
      // Get the highest existing CI number
      const lastCI = await db
        .select({ ciNumber: configurationItems.ciNumber })
        .from(configurationItems)
        .where(sql`${configurationItems.ciNumber} ~ '^CI[0-9]+$'`)
        .orderBy(sql`CAST(SUBSTRING(${configurationItems.ciNumber} FROM 3) AS INTEGER) DESC`)
        .limit(1);
      
      if (lastCI.length > 0 && lastCI[0].ciNumber) {
        const lastNumber = parseInt(lastCI[0].ciNumber.substring(2));
        ciNumber = `CI${String(lastNumber + 1).padStart(5, '0')}`;
      } else {
        ciNumber = 'CI00001';
      }
    }

    const [newCI] = await db.insert(configurationItems).values({
      ...ci,
      ciNumber,
    }).returning();
    return newCI;
  }

  async getConfigurationItem(id: string): Promise<any> {
    const [ci] = await db.select().from(configurationItems).where(eq(configurationItems.id, id));
    if (!ci) return null;

    const [owner] = ci.ownerId
      ? await db.select().from(users).where(eq(users.id, ci.ownerId))
      : [null];

    return { ...ci, owner };
  }

  async getAllConfigurationItems(): Promise<ConfigurationItem[]> {
    return await db.select().from(configurationItems).orderBy(configurationItems.name);
  }

  // Knowledge Base operations
  async createKnowledgeBase(kb: InsertKnowledgeBase, createdById: string): Promise<KnowledgeBase> {
    const [newKB] = await db
      .insert(knowledgeBase)
      .values({ ...kb, createdById })
      .returning();
    return newKB;
  }

  async getKnowledgeBase(id: string): Promise<any> {
    const [kb] = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, id));
    if (!kb) return null;

    const [createdBy] = kb.createdById
      ? await db.select().from(users).where(eq(users.id, kb.createdById))
      : [null];

    return { ...kb, createdBy };
  }

  async getAllKnowledgeBase(): Promise<any[]> {
    const allKB = await db.select().from(knowledgeBase).orderBy(desc(knowledgeBase.updatedAt));
    
    return await Promise.all(
      allKB.map(async (kb) => {
        const [createdBy] = kb.createdById
          ? await db.select().from(users).where(eq(users.id, kb.createdById))
          : [null];
        return { ...kb, createdBy };
      })
    );
  }

  async incrementKBViews(id: string): Promise<void> {
    await db
      .update(knowledgeBase)
      .set({ views: sql`${knowledgeBase.views} + 1` })
      .where(eq(knowledgeBase.id, id));
  }

  // Problem operations
  async createProblem(problem: InsertProblem, createdById: string): Promise<Problem> {
    const problemCount = await db.select({ count: sql<number>`count(*)` }).from(problems);
    const problemNumber = `PRB-${String(Number(problemCount[0].count) + 1).padStart(5, '0')}`;
    
    const [newProblem] = await db
      .insert(problems)
      .values({ ...problem, problemNumber, createdById })
      .returning();
    return newProblem;
  }

  async getProblem(id: string): Promise<any> {
    const [problem] = await db.select().from(problems).where(eq(problems.id, id));
    if (!problem) return null;

    const [createdBy] = problem.createdById
      ? await db.select().from(users).where(eq(users.id, problem.createdById))
      : [null];
    const [assignedTo] = problem.assignedToId
      ? await db.select().from(users).where(eq(users.id, problem.assignedToId))
      : [null];
    const [assignedToTeam] = problem.assignedToTeamId
      ? await db.select().from(teams).where(eq(teams.id, problem.assignedToTeamId))
      : [null];
    const [linkedCI] = problem.linkedCiId
      ? await db.select().from(configurationItems).where(eq(configurationItems.id, problem.linkedCiId))
      : [null];
    const [customer] = problem.customerId
      ? await db.select().from(customers).where(eq(customers.id, problem.customerId))
      : [null];

    return { ...problem, createdBy, assignedTo, assignedToTeam, linkedCI, customer };
  }

  async getAllProblems(): Promise<any[]> {
    const allProblems = await db.select().from(problems).orderBy(desc(problems.createdAt));
    
    return await Promise.all(
      allProblems.map(async (problem) => {
        const [createdBy] = problem.createdById
          ? await db.select().from(users).where(eq(users.id, problem.createdById))
          : [null];
        const [assignedTo] = problem.assignedToId
          ? await db.select().from(users).where(eq(users.id, problem.assignedToId))
          : [null];
        const [assignedToTeam] = problem.assignedToTeamId
          ? await db.select().from(teams).where(eq(teams.id, problem.assignedToTeamId))
          : [null];
        const [customer] = problem.customerId
          ? await db.select().from(customers).where(eq(customers.id, problem.customerId))
          : [null];
        return { ...problem, createdBy, assignedTo, assignedToTeam, customer };
      })
    );
  }

  async updateProblem(id: string, problem: Partial<InsertProblem>): Promise<Problem> {
    const [updatedProblem] = await db
      .update(problems)
      .set({ ...problem, updatedAt: new Date() })
      .where(eq(problems.id, id))
      .returning();
    return updatedProblem;
  }

  async updateProblemStatus(id: string, status: string): Promise<void> {
    const updates: any = { status, updatedAt: new Date() };
    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = new Date();
    }
    await db.update(problems).set(updates).where(eq(problems.id, id));
  }

  async linkTicketToProblem(ticketId: string, problemId: string): Promise<void> {
    await db.update(tickets)
      .set({ linkedProblemId: problemId, updatedAt: new Date() })
      .where(eq(tickets.id, ticketId));
  }

  async unlinkTicketFromProblem(ticketId: string): Promise<void> {
    await db.update(tickets)
      .set({ linkedProblemId: null, updatedAt: new Date() })
      .where(eq(tickets.id, ticketId));
  }

  async getLinkedTicketsForProblem(problemId: string): Promise<any[]> {
    const linkedTickets = await db
      .select({
        id: tickets.id,
        ticketNumber: tickets.ticketNumber,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
        createdAt: tickets.createdAt,
        createdBy: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.createdById, users.id))
      .where(eq(tickets.linkedProblemId, problemId))
      .orderBy(desc(tickets.createdAt));
    
    return linkedTickets;
  }

  async detectRecurringIncidents(): Promise<any[]> {
    // This query detects tickets with similar characteristics that might indicate a recurring problem
    // We'll look for patterns based on:
    // 1. Similar titles (using case-insensitive matching on key words)
    // 2. Same CI (linked configuration item)
    // 3. Same category
    // 4. Same customer
    // 5. Multiple occurrences within a time window (e.g., last 30 days)
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all tickets from the last 30 days that don't have a linked problem
    const recentTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          sql`${tickets.createdAt} >= ${thirtyDaysAgo}`,
          isNull(tickets.linkedProblemId)
        )
      )
      .orderBy(desc(tickets.createdAt));
    
    // Group tickets by potential patterns
    const patterns = new Map<string, any[]>();
    
    for (const ticket of recentTickets) {
      // Create pattern keys based on different criteria
      const keys: string[] = [];
      
      // Pattern 1: Same CI
      if (ticket.linkedCiId) {
        keys.push(`ci:${ticket.linkedCiId}`);
      }
      
      // Pattern 2: Same category
      if (ticket.category) {
        keys.push(`category:${ticket.category}`);
      }
      
      // Pattern 3: Same customer + category
      if (ticket.customerId && ticket.category) {
        keys.push(`customer-category:${ticket.customerId}:${ticket.category}`);
      }
      
      // Add ticket to all relevant patterns
      for (const key of keys) {
        if (!patterns.has(key)) {
          patterns.set(key, []);
        }
        patterns.get(key)!.push(ticket);
      }
    }
    
    // Filter patterns with 3 or more tickets (indicating recurring issue)
    const suggestions = [];
    for (const [patternKey, patternTickets] of Array.from(patterns.entries())) {
      if (patternTickets.length >= 3) {
        const [patternType, ...patternValues] = patternKey.split(':');
        suggestions.push({
          patternType,
          patternKey,
          count: patternTickets.length,
          tickets: patternTickets.slice(0, 5), // Return up to 5 examples
          suggestedTitle: `Recurring issue: ${patternTickets[0].category || 'Unknown category'}`,
          suggestedDescription: `${patternTickets.length} similar incidents detected in the last 30 days`,
        });
      }
    }
    
    // Sort by count (most recurring first)
    suggestions.sort((a, b) => b.count - a.count);
    
    return suggestions;
  }

  // Comment operations
  async createComment(comment: InsertComment, createdById: string): Promise<Comment> {
    const [newComment] = await db.insert(comments).values({
      ...comment,
      createdById,
    }).returning();
    return newComment;
  }

  // Email operations
  async createEmailMessage(email: InsertEmailMessage): Promise<EmailMessage> {
    const [newEmail] = await db.insert(emailMessages).values(email).returning();
    return newEmail;
  }

  async getAllEmailMessages(): Promise<EmailMessage[]> {
    return await db.select().from(emailMessages).orderBy(desc(emailMessages.receivedAt));
  }

  async convertEmailToTicket(emailId: string, createdById: string): Promise<Ticket> {
    const [email] = await db.select().from(emailMessages).where(eq(emailMessages.id, emailId));
    if (!email) throw new Error("Email not found");

    const count = await db.select({ count: sql<number>`count(*)` }).from(tickets);
    const ticketNumber = `TKT-${String(count[0].count + 1).padStart(5, '0')}`;

    const [ticket] = await db
      .insert(tickets)
      .values({
        ticketNumber,
        title: email.subject,
        description: `From: ${email.fromAddress}\n\n${email.body}`,
        status: 'open',
        priority: 'p3',
        createdById,
        emailMessageId: emailId,
      })
      .returning();

    await db
      .update(emailMessages)
      .set({ ticketId: ticket.id, convertedAt: new Date() })
      .where(eq(emailMessages.id, emailId));

    return ticket;
  }

  // Attachment operations
  async createAttachment(attachment: InsertAttachment, uploadedById: string): Promise<Attachment> {
    const [newAttachment] = await db
      .insert(attachments)
      .values({
        ...attachment,
        uploadedById,
      })
      .returning();
    return newAttachment;
  }

  async getAttachmentsByTicket(ticketId: string): Promise<Attachment[]> {
    return await db
      .select()
      .from(attachments)
      .where(eq(attachments.ticketId, ticketId))
      .orderBy(desc(attachments.createdAt));
  }

  async getAttachmentsByChange(changeId: string): Promise<Attachment[]> {
    return await db
      .select()
      .from(attachments)
      .where(eq(attachments.changeRequestId, changeId))
      .orderBy(desc(attachments.createdAt));
  }

  async getAttachmentsByKB(kbId: string): Promise<Attachment[]> {
    return await db
      .select()
      .from(attachments)
      .where(eq(attachments.knowledgeBaseId, kbId))
      .orderBy(desc(attachments.createdAt));
  }

  async getAttachment(id: string): Promise<Attachment | undefined> {
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id));
    return attachment;
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  // Team operations
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(teams.name);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team> {
    const [updated] = await db
      .update(teams)
      .set({ ...team, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updated;
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
    await db.delete(teams).where(eq(teams.id, id));
  }

  async addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(teamMember).returning();
    return newMember;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async getTeamMembers(teamId: string): Promise<any[]> {
    const members = await db
      .select({
        id: teamMembers.id,
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        createdAt: teamMembers.createdAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
    return members;
  }

  // Customer operations
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(customers.name);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // SLA Template operations
  async createSlaTemplate(template: InsertSlaTemplate): Promise<SlaTemplate> {
    const [newTemplate] = await db.insert(slaTemplates).values(template).returning();
    return newTemplate;
  }

  async getAllSlaTemplates(): Promise<SlaTemplate[]> {
    return await db.select().from(slaTemplates).orderBy(desc(slaTemplates.isDefault), slaTemplates.name);
  }

  async getSlaTemplate(id: string): Promise<SlaTemplate | undefined> {
    const [template] = await db.select().from(slaTemplates).where(eq(slaTemplates.id, id));
    return template;
  }

  async updateSlaTemplate(id: string, template: Partial<InsertSlaTemplate>): Promise<SlaTemplate> {
    const [updated] = await db
      .update(slaTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(slaTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteSlaTemplate(id: string): Promise<void> {
    await db.delete(slaTemplates).where(eq(slaTemplates.id, id));
  }

  async setDefaultSlaTemplate(id: string): Promise<void> {
    // First, set all templates to non-default
    await db.update(slaTemplates).set({ isDefault: 'false' });
    // Then set the specified template as default
    await db.update(slaTemplates).set({ isDefault: 'true' }).where(eq(slaTemplates.id, id));
  }

  // Role operations
  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updated] = await db
      .update(roles)
      .set({ ...role, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updated;
  }

  async deleteRole(id: string): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Resolution category operations
  async createResolutionCategory(category: InsertResolutionCategory): Promise<ResolutionCategory> {
    const [newCategory] = await db.insert(resolutionCategories).values(category).returning();
    return newCategory;
  }

  async getAllResolutionCategories(): Promise<ResolutionCategory[]> {
    return await db.select().from(resolutionCategories).orderBy(resolutionCategories.name);
  }

  async getResolutionCategory(id: string): Promise<ResolutionCategory | undefined> {
    const [category] = await db.select().from(resolutionCategories).where(eq(resolutionCategories.id, id));
    return category;
  }

  async updateResolutionCategory(id: string, category: Partial<InsertResolutionCategory>): Promise<ResolutionCategory> {
    const [updated] = await db
      .update(resolutionCategories)
      .set(category)
      .where(eq(resolutionCategories.id, id))
      .returning();
    return updated;
  }

  async deleteResolutionCategory(id: string): Promise<void> {
    await db.delete(resolutionCategories).where(eq(resolutionCategories.id, id));
  }

  // System settings operations
  async getSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async getAllSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async upsertSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [upserted] = await db
      .insert(systemSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(systemSettings).where(eq(systemSettings.key, key));
  }

  // Alert integration operations
  async createAlertIntegration(integration: InsertAlertIntegration): Promise<AlertIntegration> {
    const [newIntegration] = await db.insert(alertIntegrations).values(integration).returning();
    return newIntegration;
  }

  async getAllAlertIntegrations(): Promise<AlertIntegration[]> {
    return await db.select().from(alertIntegrations).orderBy(alertIntegrations.name);
  }

  async getAlertIntegration(id: string): Promise<AlertIntegration | undefined> {
    const [integration] = await db.select().from(alertIntegrations).where(eq(alertIntegrations.id, id));
    return integration;
  }

  async getAlertIntegrationByWebhookId(webhookId: string): Promise<AlertIntegration | undefined> {
    const [integration] = await db.select().from(alertIntegrations).where(eq(alertIntegrations.webhookUrl, `/api/webhooks/alerts/${webhookId}`));
    return integration;
  }

  async updateAlertIntegration(id: string, integration: Partial<InsertAlertIntegration>): Promise<AlertIntegration> {
    const [updated] = await db
      .update(alertIntegrations)
      .set({ ...integration, updatedAt: new Date() })
      .where(eq(alertIntegrations.id, id))
      .returning();
    return updated;
  }

  async deleteAlertIntegration(id: string): Promise<void> {
    // Delete related filter rules and field mappings
    await db.delete(alertFilterRules).where(eq(alertFilterRules.integrationId, id));
    await db.delete(alertFieldMappings).where(eq(alertFieldMappings.integrationId, id));
    await db.delete(alertIntegrations).where(eq(alertIntegrations.id, id));
  }

  // Alert filter rule operations
  async createFilterRule(rule: InsertAlertFilterRule): Promise<AlertFilterRule> {
    const [newRule] = await db.insert(alertFilterRules).values(rule).returning();
    return newRule;
  }

  async getFilterRulesByIntegration(integrationId: string): Promise<AlertFilterRule[]> {
    return await db.select().from(alertFilterRules)
      .where(eq(alertFilterRules.integrationId, integrationId))
      .orderBy(alertFilterRules.priority);
  }

  async updateFilterRule(id: string, rule: Partial<InsertAlertFilterRule>): Promise<AlertFilterRule> {
    const [updated] = await db
      .update(alertFilterRules)
      .set(rule)
      .where(eq(alertFilterRules.id, id))
      .returning();
    return updated;
  }

  async deleteFilterRule(id: string): Promise<void> {
    await db.delete(alertFilterRules).where(eq(alertFilterRules.id, id));
  }

  // Alert field mapping operations
  async createFieldMapping(mapping: InsertAlertFieldMapping): Promise<AlertFieldMapping> {
    const [newMapping] = await db.insert(alertFieldMappings).values(mapping).returning();
    return newMapping;
  }

  async getFieldMappingsByIntegration(integrationId: string): Promise<AlertFieldMapping[]> {
    return await db.select().from(alertFieldMappings)
      .where(eq(alertFieldMappings.integrationId, integrationId));
  }

  async updateFieldMapping(id: string, mapping: Partial<InsertAlertFieldMapping>): Promise<AlertFieldMapping> {
    const [updated] = await db
      .update(alertFieldMappings)
      .set(mapping)
      .where(eq(alertFieldMappings.id, id))
      .returning();
    return updated;
  }

  async deleteFieldMapping(id: string): Promise<void> {
    await db.delete(alertFieldMappings).where(eq(alertFieldMappings.id, id));
  }

  // System user for automated operations
  async getOrCreateSystemUser(): Promise<string> {
    const systemEmail = 'system@helpdesk.local';
    let user = await this.getUserByEmail(systemEmail);
    
    if (!user) {
      user = await this.createUser({
        email: systemEmail,
        firstName: 'System',
        lastName: 'Automation',
        role: 'support',
        authProvider: 'local',
      });
    }
    
    return user.id;
  }

  // Discovery credential operations
  async createDiscoveryCredential(credential: InsertDiscoveryCredential, createdById: string): Promise<DiscoveryCredential> {
    const [newCredential] = await db.insert(discoveryCredentials).values({ ...credential, createdById }).returning();
    return newCredential;
  }

  async getAllDiscoveryCredentials(): Promise<DiscoveryCredential[]> {
    return await db.select().from(discoveryCredentials).orderBy(discoveryCredentials.name);
  }

  async getDiscoveryCredential(id: string): Promise<DiscoveryCredential | undefined> {
    const [credential] = await db.select().from(discoveryCredentials).where(eq(discoveryCredentials.id, id));
    return credential;
  }

  async getDiscoveryCredentialsByIds(ids: string[]): Promise<DiscoveryCredential[]> {
    if (ids.length === 0) return [];
    return await db.select().from(discoveryCredentials).where(sql`${discoveryCredentials.id} = ANY(${ids})`);
  }

  async updateDiscoveryCredential(id: string, credential: Partial<InsertDiscoveryCredential>): Promise<DiscoveryCredential> {
    const [updated] = await db
      .update(discoveryCredentials)
      .set({ ...credential, updatedAt: new Date() })
      .where(eq(discoveryCredentials.id, id))
      .returning();
    return updated;
  }

  async deleteDiscoveryCredential(id: string): Promise<void> {
    await db.delete(discoveryCredentials).where(eq(discoveryCredentials.id, id));
  }

  // Discovery job operations
  async createDiscoveryJob(job: InsertDiscoveryJob, createdById: string): Promise<DiscoveryJob> {
    const [newJob] = await db.insert(discoveryJobs).values({ ...job, createdById }).returning();
    return newJob;
  }

  async getAllDiscoveryJobs(): Promise<DiscoveryJob[]> {
    return await db.select().from(discoveryJobs).orderBy(desc(discoveryJobs.createdAt));
  }

  async getDiscoveryJob(id: string): Promise<DiscoveryJob | undefined> {
    const [job] = await db.select().from(discoveryJobs).where(eq(discoveryJobs.id, id));
    return job;
  }

  async updateDiscoveryJob(id: string, job: Partial<InsertDiscoveryJob>): Promise<DiscoveryJob> {
    const [updated] = await db
      .update(discoveryJobs)
      .set(job)
      .where(eq(discoveryJobs.id, id))
      .returning();
    return updated;
  }

  async deleteDiscoveryJob(id: string): Promise<void> {
    // Delete associated discovered devices
    await db.delete(discoveredDevices).where(eq(discoveredDevices.jobId, id));
    await db.delete(discoveryJobs).where(eq(discoveryJobs.id, id));
  }

  // Discovered device operations
  async createDiscoveredDevice(device: InsertDiscoveredDevice): Promise<DiscoveredDevice> {
    const [newDevice] = await db.insert(discoveredDevices).values(device).returning();
    return newDevice;
  }

  async getDiscoveredDevicesByJob(jobId: string): Promise<DiscoveredDevice[]> {
    return await db.select().from(discoveredDevices)
      .where(eq(discoveredDevices.jobId, jobId))
      .orderBy(discoveredDevices.hostname);
  }

  async getDiscoveredDevice(id: string): Promise<DiscoveredDevice | undefined> {
    const [device] = await db.select().from(discoveredDevices).where(eq(discoveredDevices.id, id));
    return device;
  }

  async updateDiscoveredDevice(id: string, device: Partial<InsertDiscoveredDevice>): Promise<DiscoveredDevice> {
    const [updated] = await db
      .update(discoveredDevices)
      .set(device)
      .where(eq(discoveredDevices.id, id))
      .returning();
    return updated;
  }

  async deleteDiscoveredDevice(id: string): Promise<void> {
    await db.delete(discoveredDevices).where(eq(discoveredDevices.id, id));
  }

  // Contact operations
  async createContact(contact: InsertContact, createdById: string): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values({
        ...contact,
        createdById,
      })
      .returning();
    return newContact;
  }

  async getAllContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    const [updated] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const [openTickets] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(eq(tickets.status, 'open'));

    const [inProgressTickets] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(eq(tickets.status, 'in_progress'));

    const [criticalTickets] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(eq(tickets.priority, 'p1'));

    const [pendingChanges] = await db
      .select({ count: sql<number>`count(*)` })
      .from(changeRequests)
      .where(eq(changeRequests.status, 'pending_approval'));

    const [totalCIs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(configurationItems);

    const [kbArticles] = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeBase);

    return {
      openTickets: openTickets.count,
      inProgressTickets: inProgressTickets.count,
      criticalTickets: criticalTickets.count,
      pendingChanges: pendingChanges.count,
      totalCIs: totalCIs.count,
      kbArticles: kbArticles.count,
    };
  }
}

export const storage = new DatabaseStorage();
