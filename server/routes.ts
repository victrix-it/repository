import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTicketSchema, insertChangeRequestSchema, insertConfigurationItemSchema, insertKnowledgeBaseSchema, insertCommentSchema, insertEmailMessageSchema, insertTeamSchema, insertCustomerSchema, insertTeamMemberSchema, insertResolutionCategorySchema, insertSystemSettingSchema, insertAlertIntegrationSchema, insertAlertFilterRuleSchema, insertAlertFieldMappingSchema, insertDiscoveryCredentialSchema, insertDiscoveryJobSchema, insertContactSchema, insertProblemSchema, insertSlaTemplateSchema } from "@shared/schema";
import { registerAttachmentRoutes } from "./attachmentRoutes";
import { registerAlertWebhookRoutes, generateWebhookId, generateApiKey } from "./alertWebhook";
import { runNetworkDiscovery, importDeviceToCMDB } from "./networkDiscovery";
import { importCIsFromCsv, generateCsvTemplate } from "./csvImport";
import { importUsersFromCsv, generateUserCsvTemplate } from "./userCsvImport";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Multer configuration for CSV uploads
  const csvUpload = multer({ storage: multer.memoryStorage() });

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

  app.post('/api/users', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Role routes
  app.get('/api/roles', isAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post('/api/roles', isAuthenticated, async (req, res) => {
    try {
      const role = await storage.createRole(req.body);
      res.json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.patch('/api/roles/:id', isAuthenticated, async (req, res) => {
    try {
      const role = await storage.updateRole(req.params.id, req.body);
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // User CSV Import routes
  app.get('/api/users/csv/template', isAuthenticated, (req, res) => {
    try {
      const template = generateUserCsvTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="user-import-template.csv"');
      res.send(template);
    } catch (error) {
      console.error("Error generating user CSV template:", error);
      res.status(500).json({ message: "Failed to generate CSV template" });
    }
  });

  app.post('/api/users/csv/import', isAuthenticated, csvUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const result = await importUsersFromCsv(fileContent);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error importing user CSV:", error);
      res.status(400).json({ message: error.message || "Failed to import CSV" });
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
      const comment = await storage.createComment(validatedData, userId);
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

  // CSV Import routes
  app.get('/api/configuration-items/csv/template', isAuthenticated, (req, res) => {
    try {
      const template = generateCsvTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ci-import-template.csv"');
      res.send(template);
    } catch (error) {
      console.error("Error generating CSV template:", error);
      res.status(500).json({ message: "Failed to generate CSV template" });
    }
  });

  app.post('/api/configuration-items/csv/import', isAuthenticated, csvUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const result = await importCIsFromCsv(fileContent);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error importing CSV:", error);
      res.status(400).json({ message: error.message || "Failed to import CSV" });
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

  // Problem routes
  app.get('/api/problems', isAuthenticated, async (req, res) => {
    try {
      const problems = await storage.getAllProblems();
      res.json(problems);
    } catch (error) {
      console.error("Error fetching problems:", error);
      res.status(500).json({ message: "Failed to fetch problems" });
    }
  });

  // Detect recurring incidents (must come before /:id route)
  app.get('/api/problems/detect-recurring', isAuthenticated, async (req, res) => {
    try {
      const suggestions = await storage.detectRecurringIncidents();
      res.json(suggestions);
    } catch (error) {
      console.error("Error detecting recurring incidents:", error);
      res.status(500).json({ message: "Failed to detect recurring incidents" });
    }
  });

  app.get('/api/problems/:id', isAuthenticated, async (req, res) => {
    try {
      const problem = await storage.getProblem(req.params.id);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }
      res.json(problem);
    } catch (error) {
      console.error("Error fetching problem:", error);
      res.status(500).json({ message: "Failed to fetch problem" });
    }
  });

  app.post('/api/problems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProblemSchema.parse(req.body);
      const problem = await storage.createProblem(validatedData, userId);
      res.json(problem);
    } catch (error: any) {
      console.error("Error creating problem:", error);
      res.status(400).json({ message: error.message || "Failed to create problem" });
    }
  });

  app.patch('/api/problems/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProblemSchema.partial().parse(req.body);
      const problem = await storage.updateProblem(req.params.id, validatedData);
      res.json(problem);
    } catch (error: any) {
      console.error("Error updating problem:", error);
      res.status(400).json({ message: error.message || "Failed to update problem" });
    }
  });

  app.patch('/api/problems/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateProblemStatus(req.params.id, status);
      res.json({ message: "Problem status updated successfully" });
    } catch (error) {
      console.error("Error updating problem status:", error);
      res.status(500).json({ message: "Failed to update problem status" });
    }
  });

  // Link ticket to problem
  app.post('/api/problems/:problemId/link-ticket/:ticketId', isAuthenticated, async (req, res) => {
    try {
      await storage.linkTicketToProblem(req.params.ticketId, req.params.problemId);
      res.json({ message: "Ticket linked to problem successfully" });
    } catch (error) {
      console.error("Error linking ticket to problem:", error);
      res.status(500).json({ message: "Failed to link ticket to problem" });
    }
  });

  // Unlink ticket from problem
  app.post('/api/problems/:problemId/unlink-ticket/:ticketId', isAuthenticated, async (req, res) => {
    try {
      await storage.unlinkTicketFromProblem(req.params.ticketId);
      res.json({ message: "Ticket unlinked from problem successfully" });
    } catch (error) {
      console.error("Error unlinking ticket from problem:", error);
      res.status(500).json({ message: "Failed to unlink ticket from problem" });
    }
  });

  // Get linked tickets for a problem
  app.get('/api/problems/:problemId/linked-tickets', isAuthenticated, async (req, res) => {
    try {
      const tickets = await storage.getLinkedTicketsForProblem(req.params.problemId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching linked tickets:", error);
      res.status(500).json({ message: "Failed to fetch linked tickets" });
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

  // Team routes
  app.get('/api/teams', isAuthenticated, async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post('/api/teams', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.json(team);
    } catch (error: any) {
      console.error("Error creating team:", error);
      res.status(400).json({ message: error.message || "Failed to create team" });
    }
  });

  app.patch('/api/teams/:id', isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateTeam(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating team:", error);
      res.status(400).json({ message: error.message || "Failed to update team" });
    }
  });

  app.delete('/api/teams/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTeam(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  app.get('/api/teams/:id/members', isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getTeamMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post('/api/teams/:id/members', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse({
        teamId: req.params.id,
        userId: req.body.userId,
      });
      const member = await storage.addTeamMember(validatedData);
      res.json(member);
    } catch (error: any) {
      console.error("Error adding team member:", error);
      res.status(400).json({ message: error.message || "Failed to add team member" });
    }
  });

  app.delete('/api/teams/:teamId/members/:userId', isAuthenticated, async (req, res) => {
    try {
      await storage.removeTeamMember(req.params.teamId, req.params.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: error.message || "Failed to create customer" });
    }
  });

  app.patch('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateCustomer(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: error.message || "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // SLA Template routes
  app.get('/api/sla-templates', isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getAllSlaTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching SLA templates:", error);
      res.status(500).json({ message: "Failed to fetch SLA templates" });
    }
  });

  app.get('/api/sla-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const template = await storage.getSlaTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "SLA template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching SLA template:", error);
      res.status(500).json({ message: "Failed to fetch SLA template" });
    }
  });

  app.post('/api/sla-templates', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSlaTemplateSchema.parse(req.body);
      const template = await storage.createSlaTemplate(validatedData);
      res.json(template);
    } catch (error: any) {
      console.error("Error creating SLA template:", error);
      res.status(400).json({ message: error.message || "Failed to create SLA template" });
    }
  });

  app.patch('/api/sla-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateSlaTemplate(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating SLA template:", error);
      res.status(400).json({ message: error.message || "Failed to update SLA template" });
    }
  });

  app.delete('/api/sla-templates/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSlaTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting SLA template:", error);
      res.status(500).json({ message: "Failed to delete SLA template" });
    }
  });

  app.post('/api/sla-templates/:id/set-default', isAuthenticated, async (req, res) => {
    try {
      await storage.setDefaultSlaTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default SLA template:", error);
      res.status(500).json({ message: "Failed to set default SLA template" });
    }
  });

  // Resolution category routes
  app.get('/api/resolution-categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getAllResolutionCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching resolution categories:", error);
      res.status(500).json({ message: "Failed to fetch resolution categories" });
    }
  });

  app.post('/api/resolution-categories', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertResolutionCategorySchema.parse(req.body);
      const category = await storage.createResolutionCategory(validatedData);
      res.json(category);
    } catch (error: any) {
      console.error("Error creating resolution category:", error);
      res.status(400).json({ message: error.message || "Failed to create resolution category" });
    }
  });

  app.patch('/api/resolution-categories/:id', isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateResolutionCategory(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating resolution category:", error);
      res.status(400).json({ message: error.message || "Failed to update resolution category" });
    }
  });

  app.delete('/api/resolution-categories/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteResolutionCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting resolution category:", error);
      res.status(500).json({ message: "Failed to delete resolution category" });
    }
  });

  // Ticket self-assignment route (placeholder - will implement properly later)
  app.post('/api/tickets/:id/assign-self', isAuthenticated, async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub;
      // TODO: Implement updateTicketAssignment method
      res.json({ success: true });
    } catch (error) {
      console.error("Error self-assigning ticket:", error);
      res.status(500).json({ message: "Failed to self-assign ticket" });
    }
  });

  // System settings routes
  app.get('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get('/api/settings/:key', async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.post('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSystemSettingSchema.parse(req.body);
      const setting = await storage.upsertSetting(validatedData);
      res.json(setting);
    } catch (error: any) {
      console.error("Error upserting setting:", error);
      res.status(400).json({ message: error.message || "Failed to save setting" });
    }
  });

  app.delete('/api/settings/:key', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSetting(req.params.key);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Alert integration routes
  app.get('/api/alert-integrations', isAuthenticated, async (req, res) => {
    try {
      const integrations = await storage.getAllAlertIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching alert integrations:", error);
      res.status(500).json({ message: "Failed to fetch alert integrations" });
    }
  });

  app.post('/api/alert-integrations', isAuthenticated, async (req, res) => {
    try {
      const webhookId = generateWebhookId();
      const apiKey = generateApiKey();
      
      const validatedData = insertAlertIntegrationSchema.parse({
        ...req.body,
        webhookUrl: `/api/webhooks/alerts/${webhookId}`,
        apiKey: apiKey,
      });
      
      const integration = await storage.createAlertIntegration(validatedData);
      res.json({ ...integration, webhookId, apiKey });
    } catch (error: any) {
      console.error("Error creating alert integration:", error);
      res.status(400).json({ message: error.message || "Failed to create alert integration" });
    }
  });

  app.patch('/api/alert-integrations/:id', isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateAlertIntegration(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating alert integration:", error);
      res.status(400).json({ message: error.message || "Failed to update alert integration" });
    }
  });

  app.delete('/api/alert-integrations/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAlertIntegration(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting alert integration:", error);
      res.status(500).json({ message: "Failed to delete alert integration" });
    }
  });

  // Alert filter rule routes
  app.get('/api/alert-integrations/:integrationId/filters', isAuthenticated, async (req, res) => {
    try {
      const rules = await storage.getFilterRulesByIntegration(req.params.integrationId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching filter rules:", error);
      res.status(500).json({ message: "Failed to fetch filter rules" });
    }
  });

  app.post('/api/alert-integrations/:integrationId/filters', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAlertFilterRuleSchema.parse({
        ...req.body,
        integrationId: req.params.integrationId,
      });
      const rule = await storage.createFilterRule(validatedData);
      res.json(rule);
    } catch (error: any) {
      console.error("Error creating filter rule:", error);
      res.status(400).json({ message: error.message || "Failed to create filter rule" });
    }
  });

  app.delete('/api/alert-filters/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteFilterRule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting filter rule:", error);
      res.status(500).json({ message: "Failed to delete filter rule" });
    }
  });

  // Alert field mapping routes
  app.get('/api/alert-integrations/:integrationId/mappings', isAuthenticated, async (req, res) => {
    try {
      const mappings = await storage.getFieldMappingsByIntegration(req.params.integrationId);
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching field mappings:", error);
      res.status(500).json({ message: "Failed to fetch field mappings" });
    }
  });

  app.post('/api/alert-integrations/:integrationId/mappings', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAlertFieldMappingSchema.parse({
        ...req.body,
        integrationId: req.params.integrationId,
      });
      const mapping = await storage.createFieldMapping(validatedData);
      res.json(mapping);
    } catch (error: any) {
      console.error("Error creating field mapping:", error);
      res.status(400).json({ message: error.message || "Failed to create field mapping" });
    }
  });

  app.delete('/api/alert-mappings/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteFieldMapping(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting field mapping:", error);
      res.status(500).json({ message: "Failed to delete field mapping" });
    }
  });

  // Discovery credential routes
  app.get('/api/discovery/credentials', isAuthenticated, async (req, res) => {
    try {
      const credentials = await storage.getAllDiscoveryCredentials();
      res.json(credentials);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  app.post('/api/discovery/credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDiscoveryCredentialSchema.parse(req.body);
      const credential = await storage.createDiscoveryCredential(validatedData, userId);
      res.json(credential);
    } catch (error: any) {
      console.error("Error creating credential:", error);
      res.status(400).json({ message: error.message || "Failed to create credential" });
    }
  });

  app.delete('/api/discovery/credentials/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDiscoveryCredential(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting credential:", error);
      res.status(500).json({ message: "Failed to delete credential" });
    }
  });

  // Discovery job routes
  app.get('/api/discovery/jobs', isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getAllDiscoveryJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post('/api/discovery/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDiscoveryJobSchema.parse(req.body);
      const job = await storage.createDiscoveryJob(validatedData, userId);
      
      // Start discovery in background
      runNetworkDiscovery(job.id, job.subnet, job.credentialIds || []).catch(error => {
        console.error(`[discovery] Background discovery failed for job ${job.id}:`, error);
      });
      
      res.json(job);
    } catch (error: any) {
      console.error("Error creating discovery job:", error);
      res.status(400).json({ message: error.message || "Failed to create discovery job" });
    }
  });

  app.get('/api/discovery/jobs/:id', isAuthenticated, async (req, res) => {
    try {
      const job = await storage.getDiscoveryJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.delete('/api/discovery/jobs/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDiscoveryJob(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Discovered devices routes
  app.get('/api/discovery/jobs/:jobId/devices', isAuthenticated, async (req, res) => {
    try {
      const devices = await storage.getDiscoveredDevicesByJob(req.params.jobId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching discovered devices:", error);
      res.status(500).json({ message: "Failed to fetch discovered devices" });
    }
  });

  app.post('/api/discovery/devices/:deviceId/import', isAuthenticated, async (req, res) => {
    try {
      const { ciType } = req.body;
      const ciId = await importDeviceToCMDB(req.params.deviceId, ciType);
      res.json({ success: true, ciId });
    } catch (error: any) {
      console.error("Error importing device:", error);
      res.status(400).json({ message: error.message || "Failed to import device" });
    }
  });

  // Contact routes
  app.get('/api/contacts', isAuthenticated, async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get('/api/contacts/:id', isAuthenticated, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData, userId);
      res.json(contact);
    } catch (error: any) {
      console.error("Error creating contact:", error);
      res.status(400).json({ message: error.message || "Failed to create contact" });
    }
  });

  app.patch('/api/contacts/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(req.params.id, validatedData);
      res.json(contact);
    } catch (error: any) {
      console.error("Error updating contact:", error);
      res.status(400).json({ message: error.message || "Failed to update contact" });
    }
  });

  app.delete('/api/contacts/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteContact(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Register attachment routes
  registerAttachmentRoutes(app);

  // Register alert webhook routes
  registerAlertWebhookRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
