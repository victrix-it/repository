import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { registerMultiAuthRoutes, isAuthenticated } from "./multiAuth";
import { getUserWithRole, requirePermission, optionalPermissionContext, getTenantFilter } from "./permissions";
import { insertTicketSchema, insertChangeRequestSchema, insertConfigurationItemSchema, insertKnowledgeBaseSchema, insertCommentSchema, insertEmailMessageSchema, insertTeamSchema, insertCustomerSchema, insertTeamMemberSchema, insertResolutionCategorySchema, insertSystemSettingSchema, insertAlertIntegrationSchema, insertAlertFilterRuleSchema, insertAlertFieldMappingSchema, insertDiscoveryCredentialSchema, insertDiscoveryJobSchema, insertContactSchema, insertProblemSchema, insertSlaTemplateSchema } from "@shared/schema";
import { registerAttachmentRoutes } from "./attachmentRoutes";
import { registerAlertWebhookRoutes, generateWebhookId, generateApiKey } from "./alertWebhook";
import { runNetworkDiscovery, importDeviceToCMDB } from "./networkDiscovery";
import { importCIsFromCsv, generateCsvTemplate } from "./csvImport";
import { importUsersFromCsv, generateUserCsvTemplate } from "./userCsvImport";
import { createAuditLog } from "./auditLog";
import multer from "multer";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Multi-auth routes (local, LDAP, SAML)
  await registerMultiAuthRoutes(app);

  // Multer configuration for CSV uploads
  const csvUpload = multer({ storage: multer.memoryStorage() });

  // Multer configuration for logo uploads
  const logoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = 'uploads/branding';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      cb(null, `logo-${Date.now()}.${ext}`);
    },
  });

  const logoUpload = multer({
    storage: logoStorage,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit
    },
    fileFilter: (_req, file, cb: any) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both Replit OIDC users and local/LDAP/SAML users
      const userId = req.user.claims?.sub || req.user.id;
      const userWithRole = await getUserWithRole(userId);
      
      if (!userWithRole) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Determine permissions
      let permissions = null;
      
      // Legacy admin role has all permissions
      if (userWithRole.role === 'admin') {
        permissions = {
          canCreateTickets: true,
          canUpdateOwnTickets: true,
          canUpdateAllTickets: true,
          canCloseTickets: true,
          canViewAllTickets: true,
          canApproveChanges: true,
          canManageKnowledgebase: true,
          canManageServiceCatalog: true,
          canRunReports: true,
          canManageUsers: true,
          canManageRoles: true,
          canManageCMDB: true,
          canViewCMDB: true,
          isTenantScoped: false,
        };
      } else if (userWithRole.roleDetails) {
        // Role-based permissions
        permissions = {
          canCreateTickets: userWithRole.roleDetails.canCreateTickets === 'true',
          canUpdateOwnTickets: userWithRole.roleDetails.canUpdateOwnTickets === 'true',
          canUpdateAllTickets: userWithRole.roleDetails.canUpdateAllTickets === 'true',
          canCloseTickets: userWithRole.roleDetails.canCloseTickets === 'true',
          canViewAllTickets: userWithRole.roleDetails.canViewAllTickets === 'true',
          canApproveChanges: userWithRole.roleDetails.canApproveChanges === 'true',
          canManageKnowledgebase: userWithRole.roleDetails.canManageKnowledgebase === 'true',
          canManageServiceCatalog: userWithRole.roleDetails.canManageServiceCatalog === 'true',
          canRunReports: userWithRole.roleDetails.canRunReports === 'true',
          canManageUsers: userWithRole.roleDetails.canManageUsers === 'true',
          canManageRoles: userWithRole.roleDetails.canManageRoles === 'true',
          canManageCMDB: userWithRole.roleDetails.canManageCMDB === 'true',
          canViewCMDB: userWithRole.roleDetails.canViewCMDB === 'true',
          isTenantScoped: userWithRole.roleDetails.isTenantScoped === 'true',
        };
      }
      
      // Return user with role permissions
      res.json({
        ...userWithRole,
        permissions,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users', isAuthenticated, requirePermission('canManageUsers'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requirePermission('canManageUsers'), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, requirePermission('canManageUsers'), async (req: any, res) => {
    try {
      const targetUserId = req.params.id;
      const updateData = req.body;
      
      // Get user before update for audit logging
      const originalUser = await storage.getUser(targetUserId);
      
      const user = await storage.updateUser(targetUserId, updateData);
      
      // ISO 27001 Control A.5.18 - Audit log role assignment changes
      if (updateData.roleId && originalUser && updateData.roleId !== originalUser.roleId) {
        await createAuditLog({
          eventType: 'role_assigned',
          userId: req.user.claims.sub,
          username: req.user.claims.email,
          success: true,
          reason: `Role assignment changed for user: ${user?.email}`,
          metadata: {
            targetUserId: targetUserId,
            targetUserEmail: user?.email,
            oldRoleId: originalUser.roleId,
            newRoleId: updateData.roleId,
          },
          req,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requirePermission('canManageUsers'), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ISO 27001 Control A.5.18 - User account deactivation/activation
  app.post('/api/users/:id/deactivate', isAuthenticated, requirePermission('canManageUsers'), async (req: any, res) => {
    try {
      const targetUserId = req.params.id;
      const targetUser = await storage.getUser(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const deactivatedUser = await storage.deactivateUser(targetUserId);
      
      // Audit log - user deactivated
      await createAuditLog({
        eventType: 'user_deactivated',
        userId: req.user.claims.sub,
        username: req.user.claims.email,
        success: true,
        reason: `Deactivated user: ${targetUser.email}`,
        metadata: {
          targetUserId: targetUserId,
          targetUserEmail: targetUser.email,
        },
        req,
      });
      
      res.json(deactivatedUser);
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  app.post('/api/users/:id/activate', isAuthenticated, requirePermission('canManageUsers'), async (req: any, res) => {
    try {
      const targetUserId = req.params.id;
      const targetUser = await storage.getUser(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const activatedUser = await storage.activateUser(targetUserId);
      
      // Audit log - user activated
      await createAuditLog({
        eventType: 'user_activated',
        userId: req.user.claims.sub,
        username: req.user.claims.email,
        success: true,
        reason: `Activated user: ${targetUser.email}`,
        metadata: {
          targetUserId: targetUserId,
          targetUserEmail: targetUser.email,
        },
        req,
      });
      
      res.json(activatedUser);
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ message: "Failed to activate user" });
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

  app.post('/api/roles', isAuthenticated, requirePermission('canManageRoles'), async (req, res) => {
    try {
      const role = await storage.createRole(req.body);
      res.json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.patch('/api/roles/:id', isAuthenticated, requirePermission('canManageRoles'), async (req, res) => {
    try {
      const role = await storage.updateRole(req.params.id, req.body);
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete('/api/roles/:id', isAuthenticated, requirePermission('canManageRoles'), async (req, res) => {
    try {
      await storage.deleteRole(req.params.id);
      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // ISO 27001 Audit Log routes (admin-only)
  app.get('/api/audit-logs', isAuthenticated, requirePermission('canManageUsers'), async (req, res) => {
    try {
      const { userId, eventType, limit, offset } = req.query;
      
      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (eventType) filters.eventType = eventType as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);
      
      const logs = await storage.getAuditLogs(filters);
      const total = await storage.getAuditLogsCount(filters);
      
      res.json({ logs, total });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
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

  // Reporting routes
  app.get('/api/reports/tickets-per-ci', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getTicketsPerCI();
      res.json(data);
    } catch (error) {
      console.error("Error fetching tickets per CI:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/changes-per-ci', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getChangesPerCI();
      res.json(data);
    } catch (error) {
      console.error("Error fetching changes per CI:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/problems-per-ci', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getProblemsPerCI();
      res.json(data);
    } catch (error) {
      console.error("Error fetching problems per CI:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/tickets-per-customer', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getTicketsPerCustomer();
      res.json(data);
    } catch (error) {
      console.error("Error fetching tickets per customer:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/changes-per-customer', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getChangesPerCustomer();
      res.json(data);
    } catch (error) {
      console.error("Error fetching changes per customer:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/problems-per-customer', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getProblemsPerCustomer();
      res.json(data);
    } catch (error) {
      console.error("Error fetching problems per customer:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/top-resolvers', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getTopResolvers();
      res.json(data);
    } catch (error) {
      console.error("Error fetching top resolvers:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/top-change-implementors', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getTopChangeImplementors();
      res.json(data);
    } catch (error) {
      console.error("Error fetching top change implementors:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/ticket-status-distribution', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getTicketStatusDistribution();
      res.json(data);
    } catch (error) {
      console.error("Error fetching ticket status distribution:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/change-status-distribution', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getChangeStatusDistribution();
      res.json(data);
    } catch (error) {
      console.error("Error fetching change status distribution:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/problem-status-distribution', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getProblemStatusDistribution();
      res.json(data);
    } catch (error) {
      console.error("Error fetching problem status distribution:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/tickets-by-priority', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getTicketsByPriority();
      res.json(data);
    } catch (error) {
      console.error("Error fetching tickets by priority:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get('/api/reports/most-problematic-cis', isAuthenticated, requirePermission('canRunReports'), async (req: any, res) => {
    try {
      const data = await storage.getMostProblematicCIs();
      res.json(data);
    } catch (error) {
      console.error("Error fetching most problematic CIs:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // CI Types routes
  app.get('/api/ci-types', isAuthenticated, async (req, res) => {
    try {
      const ciTypes = await storage.getAllCiTypes();
      res.json(ciTypes);
    } catch (error) {
      console.error("Error fetching CI types:", error);
      res.status(500).json({ message: "Failed to fetch CI types" });
    }
  });

  app.get('/api/ci-types/active', isAuthenticated, async (req, res) => {
    try {
      const ciTypes = await storage.getActiveCiTypes();
      res.json(ciTypes);
    } catch (error) {
      console.error("Error fetching active CI types:", error);
      res.status(500).json({ message: "Failed to fetch active CI types" });
    }
  });

  app.post('/api/ci-types', isAuthenticated, requirePermission('canManageCMDB'), async (req, res) => {
    try {
      const ciType = await storage.createCiType(req.body);
      res.status(201).json(ciType);
    } catch (error) {
      console.error("Error creating CI type:", error);
      res.status(500).json({ message: "Failed to create CI type" });
    }
  });

  app.patch('/api/ci-types/:id', isAuthenticated, requirePermission('canManageCMDB'), async (req, res) => {
    try {
      const updated = await storage.updateCiType(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "CI type not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating CI type:", error);
      res.status(500).json({ message: "Failed to update CI type" });
    }
  });

  app.delete('/api/ci-types/:id', isAuthenticated, requirePermission('canManageCMDB'), async (req, res) => {
    try {
      // Smart protection: Check if any configuration items reference this CI type
      const referenceCount = await storage.countCisByType(req.params.id);
      
      if (referenceCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete CI type: ${referenceCount} configuration item${referenceCount > 1 ? 's' : ''} ${referenceCount > 1 ? 'are' : 'is'} using this type`
        });
      }

      await storage.deleteCiType(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CI type:", error);
      res.status(500).json({ message: "Failed to delete CI type" });
    }
  });

  // License routes
  app.get('/api/licenses/status', async (req, res) => {
    try {
      const license = await storage.getActiveLicense();
      if (!license) {
        return res.json({ active: false, message: 'No active license' });
      }

      const now = new Date();
      const expirationDate = new Date(license.expirationDate);
      const isExpired = now > expirationDate;

      res.json({
        active: !isExpired,
        companyName: license.companyName,
        expirationDate: license.expirationDate,
        maxUsers: license.maxUsers,
        isExpired,
      });
    } catch (error) {
      console.error("Error fetching license status:", error);
      res.status(500).json({ message: "Failed to fetch license status" });
    }
  });

  app.post('/api/licenses/activate', async (req, res) => {
    try {
      const { licenseKey } = req.body;
      
      if (!licenseKey) {
        return res.status(400).json({ message: "License key is required" });
      }

      // Verify the license key cryptographically
      const { verifyLicenseKey } = await import('./licenseGenerator');
      const verification = verifyLicenseKey(licenseKey);
      
      if (!verification.valid) {
        return res.status(400).json({ 
          message: verification.error || "Invalid license key signature"
        });
      }

      const licenseData = verification.data!;

      // Check if license already exists
      const allLicenses = await storage.getAllLicenses();
      const existingLicense = allLicenses.find(l => l.licenseKey === licenseKey);

      if (existingLicense) {
        // Activate existing license
        const activated = await storage.activateLicense(licenseKey);
        return res.json(activated);
      }

      // Create new license from verified data
      const newLicense = await storage.createLicense({
        licenseKey,
        companyName: licenseData.companyName,
        contactEmail: licenseData.contactEmail,
        expirationDate: new Date(licenseData.expirationDate),
        maxUsers: licenseData.maxUsers,
        isActive: 'true',
      });

      // Deactivate all other licenses
      await storage.activateLicense(licenseKey);

      res.json(newLicense);
    } catch (error: any) {
      console.error("Error activating license:", error);
      res.status(500).json({ message: error.message || "Failed to activate license" });
    }
  });

  app.get('/api/licenses', isAuthenticated, requirePermission('canManageUsers'), async (req, res) => {
    try {
      const licenses = await storage.getAllLicenses();
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  app.post('/api/licenses/:id/deactivate', isAuthenticated, requirePermission('canManageUsers'), async (req, res) => {
    try {
      await storage.deactivateLicense(req.params.id);
      res.json({ message: 'License deactivated successfully' });
    } catch (error) {
      console.error("Error deactivating license:", error);
      res.status(500).json({ message: "Failed to deactivate license" });
    }
  });

  // License Generator routes (Victrix IT Ltd internal use only)
  app.post('/api/admin/generate-license', isAuthenticated, requirePermission('canManageUsers'), async (req, res) => {
    try {
      const { companyName, contactEmail, expirationDate, maxUsers, privateKey } = req.body;
      
      if (!companyName || !contactEmail || !expirationDate || !maxUsers || !privateKey) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { generateLicenseKey } = await import('./licenseGenerator');
      const licenseData = {
        companyName,
        contactEmail,
        expirationDate: new Date(expirationDate).toISOString(),
        maxUsers: parseInt(maxUsers),
      };

      const licenseKey = generateLicenseKey(licenseData, privateKey);
      
      res.json({
        licenseKey,
        licenseData,
      });
    } catch (error: any) {
      console.error("Error generating license:", error);
      res.status(500).json({ message: error.message || "Failed to generate license" });
    }
  });

  app.post('/api/admin/generate-keypair', isAuthenticated, requirePermission('canManageUsers'), async (req, res) => {
    try {
      const { generateKeyPair } = await import('./licenseGenerator');
      const keys = generateKeyPair();
      
      res.json(keys);
    } catch (error: any) {
      console.error("Error generating key pair:", error);
      res.status(500).json({ message: error.message || "Failed to generate key pair" });
    }
  });

  // ITIL Service Catalog routes
  app.get('/api/service-catalog', isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getActiveServiceCatalogItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching service catalog items:", error);
      res.status(500).json({ message: "Failed to fetch service catalog items" });
    }
  });

  app.get('/api/service-catalog/all', isAuthenticated, requirePermission('canManageServiceCatalog'), async (req, res) => {
    try {
      const items = await storage.getAllServiceCatalogItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching all service catalog items:", error);
      res.status(500).json({ message: "Failed to fetch service catalog items" });
    }
  });

  app.get('/api/service-catalog/:id', isAuthenticated, async (req, res) => {
    try {
      const item = await storage.getServiceCatalogItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Service catalog item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching service catalog item:", error);
      res.status(500).json({ message: "Failed to fetch service catalog item" });
    }
  });

  app.post('/api/service-catalog', isAuthenticated, requirePermission('canManageServiceCatalog'), async (req: any, res) => {
    try {
      const createdById = req.user.claims.sub;
      const item = await storage.createServiceCatalogItem(req.body, createdById);
      res.json(item);
    } catch (error) {
      console.error("Error creating service catalog item:", error);
      res.status(500).json({ message: "Failed to create service catalog item" });
    }
  });

  app.patch('/api/service-catalog/:id', isAuthenticated, requirePermission('canManageServiceCatalog'), async (req, res) => {
    try {
      const item = await storage.updateServiceCatalogItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating service catalog item:", error);
      res.status(500).json({ message: "Failed to update service catalog item" });
    }
  });

  app.delete('/api/service-catalog/:id', isAuthenticated, requirePermission('canManageServiceCatalog'), async (req, res) => {
    try {
      await storage.deleteServiceCatalogItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service catalog item:", error);
      res.status(500).json({ message: "Failed to delete service catalog item" });
    }
  });

  // Service Request routes
  app.get('/api/service-requests', isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getAllServiceRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching service requests:", error);
      res.status(500).json({ message: "Failed to fetch service requests" });
    }
  });

  app.get('/api/service-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const request = await storage.getServiceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching service request:", error);
      res.status(500).json({ message: "Failed to fetch service request" });
    }
  });

  app.post('/api/service-requests', isAuthenticated, async (req: any, res) => {
    try {
      const requestedById = req.user.claims.sub;
      const request = await storage.createServiceRequest(req.body, requestedById);
      res.json(request);
    } catch (error) {
      console.error("Error creating service request:", error);
      res.status(500).json({ message: "Failed to create service request" });
    }
  });

  app.patch('/api/service-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const request = await storage.updateServiceRequest(req.params.id, req.body);
      res.json(request);
    } catch (error) {
      console.error("Error updating service request:", error);
      res.status(500).json({ message: "Failed to update service request" });
    }
  });

  app.post('/api/service-requests/:id/approve', isAuthenticated, requirePermission('canApproveChanges'), async (req: any, res) => {
    try {
      const approvedById = req.user.claims.sub;
      const { notes } = req.body;
      const request = await storage.approveServiceRequest(req.params.id, approvedById, notes || '');
      res.json(request);
    } catch (error) {
      console.error("Error approving service request:", error);
      res.status(500).json({ message: "Failed to approve service request" });
    }
  });

  app.post('/api/service-requests/:id/reject', isAuthenticated, requirePermission('canApproveChanges'), async (req: any, res) => {
    try {
      const approvedById = req.user.claims.sub;
      const { notes } = req.body;
      const request = await storage.rejectServiceRequest(req.params.id, approvedById, notes || '');
      res.json(request);
    } catch (error) {
      console.error("Error rejecting service request:", error);
      res.status(500).json({ message: "Failed to reject service request" });
    }
  });

  app.post('/api/service-requests/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const { notes } = req.body;
      const request = await storage.completeServiceRequest(req.params.id, notes || '');
      res.json(request);
    } catch (error) {
      console.error("Error completing service request:", error);
      res.status(500).json({ message: "Failed to complete service request" });
    }
  });

  // Password change route
  // ISO 27001 Control A.5.17 - Authentication Information
  app.post('/api/auth/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      // Validate password policy
      const { validatePassword } = await import('./password-policy');
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        // Audit log - password change failed (policy violation)
        await createAuditLog({
          eventType: 'password_change',
          userId: userId,
          username: req.user.claims.email,
          success: false,
          reason: `Password policy violation: ${validation.errors.join(', ')}`,
          req,
        });
        return res.status(400).json({ message: validation.errors.join(', ') });
      }

      // Get user and verify current password if not using OIDC
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash new password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and clear mustChangePassword flag
      await storage.updateUser(userId, {
        passwordHash: hashedPassword,
        mustChangePassword: 'false',
      });

      // Audit log - password change successful
      await createAuditLog({
        eventType: 'password_change',
        userId: userId,
        username: user.email || req.user.claims.email,
        success: true,
        reason: 'User successfully changed password',
        req,
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error("Error changing password:", error);
      
      // Audit log - password change failed (system error)
      await createAuditLog({
        eventType: 'password_change',
        userId: req.user?.claims?.sub,
        username: req.user?.claims?.email || 'unknown',
        success: false,
        reason: `Password change failed: ${error}`,
        req,
      });
      
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Ticket routes
  app.get('/api/tickets', isAuthenticated, optionalPermissionContext(), async (req: any, res) => {
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

  app.post('/api/tickets', isAuthenticated, requirePermission('canCreateTickets'), async (req: any, res) => {
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

  app.patch('/api/tickets/:id/status', isAuthenticated, requirePermission('canUpdateOwnTickets', 'canUpdateAllTickets', 'canCloseTickets'), async (req, res) => {
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
  app.get('/api/configuration-items', isAuthenticated, requirePermission('canViewCMDB'), async (req, res) => {
    try {
      const cis = await storage.getAllConfigurationItems();
      res.json(cis);
    } catch (error) {
      console.error("Error fetching CIs:", error);
      res.status(500).json({ message: "Failed to fetch configuration items" });
    }
  });

  app.get('/api/configuration-items/:id', isAuthenticated, requirePermission('canViewCMDB'), async (req, res) => {
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

  app.get('/api/configuration-items/:id/tickets', isAuthenticated, requirePermission('canViewCMDB'), async (req, res) => {
    try {
      const tickets = await storage.getTicketsByCI(req.params.id);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching CI tickets:", error);
      res.status(500).json({ message: "Failed to fetch related tickets" });
    }
  });

  app.get('/api/configuration-items/:id/changes', isAuthenticated, requirePermission('canViewCMDB'), async (req, res) => {
    try {
      const changes = await storage.getChangeRequestsByCI(req.params.id);
      res.json(changes);
    } catch (error) {
      console.error("Error fetching CI changes:", error);
      res.status(500).json({ message: "Failed to fetch related changes" });
    }
  });

  app.get('/api/configuration-items/:id/problems', isAuthenticated, requirePermission('canViewCMDB'), async (req, res) => {
    try {
      const problems = await storage.getProblemsByCI(req.params.id);
      res.json(problems);
    } catch (error) {
      console.error("Error fetching CI problems:", error);
      res.status(500).json({ message: "Failed to fetch related problems" });
    }
  });

  app.post('/api/configuration-items', isAuthenticated, requirePermission('canManageCMDB'), async (req, res) => {
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
  app.get('/api/configuration-items/csv/template', isAuthenticated, requirePermission('canManageCMDB'), (req, res) => {
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

  app.post('/api/configuration-items/csv/import', isAuthenticated, requirePermission('canManageCMDB'), csvUpload.single('file'), async (req, res) => {
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

  app.post('/api/knowledge', isAuthenticated, requirePermission('canManageKnowledgebase'), async (req: any, res) => {
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

  // Branding logo upload
  app.post('/api/branding/logo', isAuthenticated, logoUpload.single('logo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the URL path for the logo
      const logoUrl = `/uploads/branding/${req.file.filename}`;

      // Update the logo_url setting
      await storage.upsertSetting({ key: 'logo_url', value: logoUrl });

      res.json({ logoUrl });
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      // Clean up file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ message: error.message || "Failed to upload logo" });
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
