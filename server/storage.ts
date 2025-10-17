import {
  users,
  tickets,
  changeRequests,
  configurationItems,
  knowledgeBase,
  comments,
  emailMessages,
  attachments,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  
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
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
        return { ...ticket, createdBy, assignedTo };
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
    await db.update(changeRequests).set({ status, updatedAt: new Date() }).where(eq(changeRequests.id, id));
  }

  // Configuration Item operations
  async createConfigurationItem(ci: InsertConfigurationItem): Promise<ConfigurationItem> {
    const [newCI] = await db.insert(configurationItems).values(ci).returning();
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

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
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
        priority: 'medium',
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
      .where(eq(tickets.priority, 'critical'));

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
