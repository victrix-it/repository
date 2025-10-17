import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTicketSchema, insertChangeRequestSchema, insertConfigurationItemSchema, insertKnowledgeBaseSchema, insertCommentSchema, insertEmailMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Ticket routes
  app.get('/api/tickets', isAuthenticated, async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/tickets/:id', isAuthenticated, async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(validatedData, userId);
      res.json(ticket);
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      res.status(400).json({ message: error.message || "Failed to create ticket" });
    }
  });

  app.patch('/api/tickets/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateTicketStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Failed to update ticket status" });
    }
  });

  app.post('/api/tickets/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCommentSchema.parse({
        content: req.body.content,
        ticketId: req.params.id,
      });
      const comment = await storage.createComment({
        ...validatedData,
        createdById: userId,
      });
      res.json(comment);
    } catch (error: any) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: error.message || "Failed to create comment" });
    }
  });

  // Change Request routes
  app.get('/api/changes', isAuthenticated, async (req, res) => {
    try {
      const changes = await storage.getAllChangeRequests();
      res.json(changes);
    } catch (error) {
      console.error("Error fetching changes:", error);
      res.status(500).json({ message: "Failed to fetch changes" });
    }
  });

  app.get('/api/changes/:id', isAuthenticated, async (req, res) => {
    try {
      const change = await storage.getChangeRequest(req.params.id);
      if (!change) {
        return res.status(404).json({ message: "Change request not found" });
      }
      res.json(change);
    } catch (error) {
      console.error("Error fetching change:", error);
      res.status(500).json({ message: "Failed to fetch change" });
    }
  });

  app.post('/api/changes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChangeRequestSchema.parse(req.body);
      const change = await storage.createChangeRequest(validatedData, userId);
      res.json(change);
    } catch (error: any) {
      console.error("Error creating change:", error);
      res.status(400).json({ message: error.message || "Failed to create change" });
    }
  });

  app.patch('/api/changes/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateChangeStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating change status:", error);
      res.status(500).json({ message: "Failed to update change status" });
    }
  });

  // Configuration Item routes
  app.get('/api/configuration-items', isAuthenticated, async (req, res) => {
    try {
      const cis = await storage.getAllConfigurationItems();
      res.json(cis);
    } catch (error) {
      console.error("Error fetching CIs:", error);
      res.status(500).json({ message: "Failed to fetch configuration items" });
    }
  });

  app.get('/api/configuration-items/:id', isAuthenticated, async (req, res) => {
    try {
      const ci = await storage.getConfigurationItem(req.params.id);
      if (!ci) {
        return res.status(404).json({ message: "Configuration item not found" });
      }
      res.json(ci);
    } catch (error) {
      console.error("Error fetching CI:", error);
      res.status(500).json({ message: "Failed to fetch configuration item" });
    }
  });

  app.post('/api/configuration-items', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertConfigurationItemSchema.parse(req.body);
      const ci = await storage.createConfigurationItem(validatedData);
      res.json(ci);
    } catch (error: any) {
      console.error("Error creating CI:", error);
      res.status(400).json({ message: error.message || "Failed to create configuration item" });
    }
  });

  // Knowledge Base routes
  app.get('/api/knowledge', isAuthenticated, async (req, res) => {
    try {
      const articles = await storage.getAllKnowledgeBase();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      res.status(500).json({ message: "Failed to fetch knowledge base" });
    }
  });

  app.get('/api/knowledge/:id', isAuthenticated, async (req, res) => {
    try {
      const article = await storage.getKnowledgeBase(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      await storage.incrementKBViews(req.params.id);
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post('/api/knowledge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertKnowledgeBaseSchema.parse(req.body);
      const article = await storage.createKnowledgeBase(validatedData, userId);
      res.json(article);
    } catch (error: any) {
      console.error("Error creating article:", error);
      res.status(400).json({ message: error.message || "Failed to create article" });
    }
  });

  // Email routes
  app.get('/api/emails', isAuthenticated, async (req, res) => {
    try {
      const emails = await storage.getAllEmailMessages();
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.post('/api/emails', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEmailMessageSchema.parse(req.body);
      const email = await storage.createEmailMessage(validatedData);
      res.json(email);
    } catch (error: any) {
      console.error("Error creating email:", error);
      res.status(400).json({ message: error.message || "Failed to create email" });
    }
  });

  app.post('/api/emails/:id/convert', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticket = await storage.convertEmailToTicket(req.params.id, userId);
      res.json(ticket);
    } catch (error: any) {
      console.error("Error converting email:", error);
      res.status(400).json({ message: error.message || "Failed to convert email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
