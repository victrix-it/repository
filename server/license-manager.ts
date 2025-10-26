import { db } from "./db";
import { licenses, users, roles } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface LicenseStatus {
  isValid: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  maxUsers: number | null;
  currentUsers: number;
  features: any;
  message: string;
}

/**
 * Check if system license is valid
 */
export async function checkLicense(): Promise<LicenseStatus> {
  const [activeLicense] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.isActive, 'true'))
    .orderBy(desc(licenses.createdAt))
    .limit(1);

  if (!activeLicense) {
    return {
      isValid: false,
      isExpired: false,
      daysRemaining: null,
      maxUsers: null,
      currentUsers: 0,
      features: {},
      message: 'No active license found. Please enter a valid license key.',
    };
  }

  const now = new Date();
  const expirationDate = activeLicense.expirationDate;

  // Check if expired
  if (expirationDate && expirationDate < now) {
    return {
      isValid: false,
      isExpired: true,
      daysRemaining: 0,
      maxUsers: activeLicense.maxUsers,
      currentUsers: await getUserCount(),
      features: activeLicense.features || {},
      message: `License expired on ${expirationDate.toLocaleDateString()}`,
    };
  }

  // Calculate days remaining
  let daysRemaining = null;
  if (expirationDate) {
    const timeDiff = expirationDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Check user limit
  const currentUsers = await getUserCount();
  if (activeLicense.maxUsers && currentUsers > activeLicense.maxUsers) {
    return {
      isValid: false,
      isExpired: false,
      daysRemaining,
      maxUsers: activeLicense.maxUsers,
      currentUsers,
      features: activeLicense.features || {},
      message: `User limit exceeded. License allows ${activeLicense.maxUsers} users, but ${currentUsers} users exist.`,
    };
  }

  return {
    isValid: true,
    isExpired: false,
    daysRemaining,
    maxUsers: activeLicense.maxUsers,
    currentUsers,
    features: activeLicense.features || {},
    message: 'License is valid',
  };
}

/**
 * Get count of active users
 */
async function getUserCount(): Promise<number> {
  const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
  return allUsers.length;
}

/**
 * Ensure default roles exist in the system
 */
export async function ensureDefaultRolesExist(): Promise<void> {
  const defaultRoles = [
    {
      name: 'System Administrator',
      description: 'Full system access with all permissions',
      canCreateTickets: 'true',
      canUpdateOwnTickets: 'true',
      canUpdateAllTickets: 'true',
      canCloseTickets: 'true',
      canViewAllTickets: 'true',
      canApproveChanges: 'true',
      canManageKnowledgebase: 'true',
      canManageServiceCatalog: 'true',
      canRunReports: 'true',
      canManageUsers: 'true',
      canManageRoles: 'true',
      canManageCMDB: 'true',
      canViewCMDB: 'true',
      isTenantScoped: 'false',
    },
    {
      name: 'Support Agent',
      description: 'Support team member with access to manage tickets and changes',
      canCreateTickets: 'true',
      canUpdateOwnTickets: 'true',
      canUpdateAllTickets: 'true',
      canCloseTickets: 'true',
      canViewAllTickets: 'true',
      canApproveChanges: 'false',
      canManageKnowledgebase: 'true',
      canManageServiceCatalog: 'false',
      canRunReports: 'true',
      canManageUsers: 'false',
      canManageRoles: 'false',
      canManageCMDB: 'true',
      canViewCMDB: 'true',
      isTenantScoped: 'false',
    },
    {
      name: 'Change Manager',
      description: 'Change management specialist with approval authority',
      canCreateTickets: 'true',
      canUpdateOwnTickets: 'true',
      canUpdateAllTickets: 'true',
      canCloseTickets: 'false',
      canViewAllTickets: 'true',
      canApproveChanges: 'true',
      canManageKnowledgebase: 'true',
      canManageServiceCatalog: 'false',
      canRunReports: 'true',
      canManageUsers: 'false',
      canManageRoles: 'false',
      canManageCMDB: 'false',
      canViewCMDB: 'true',
      isTenantScoped: 'false',
    },
    {
      name: 'Change Approver',
      description: 'Customer role with authority to approve changes for their company',
      canCreateTickets: 'true',
      canUpdateOwnTickets: 'true',
      canUpdateAllTickets: 'false',
      canCloseTickets: 'false',
      canViewAllTickets: 'false',
      canApproveChanges: 'true',
      canManageKnowledgebase: 'false',
      canManageServiceCatalog: 'false',
      canRunReports: 'false',
      canManageUsers: 'false',
      canManageRoles: 'false',
      canManageCMDB: 'false',
      canViewCMDB: 'true',
      isTenantScoped: 'true',
    },
    {
      name: 'End User',
      description: 'Standard user with basic ticket creation rights',
      canCreateTickets: 'true',
      canUpdateOwnTickets: 'true',
      canUpdateAllTickets: 'false',
      canCloseTickets: 'false',
      canViewAllTickets: 'false',
      canApproveChanges: 'false',
      canManageKnowledgebase: 'false',
      canManageServiceCatalog: 'false',
      canRunReports: 'false',
      canManageUsers: 'false',
      canManageRoles: 'false',
      canManageCMDB: 'false',
      canViewCMDB: 'false',
      isTenantScoped: 'true',
    },
  ];

  for (const roleData of defaultRoles) {
    const [existingRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleData.name))
      .limit(1);

    if (!existingRole) {
      await db.insert(roles).values(roleData);
      console.log(`Created default role: ${roleData.name}`);
    }
  }
}

/**
 * Ensure default admin account exists
 * Username: admin@helpdesk.local
 * Password: admin
 * Must change password on first login
 */
export async function ensureDefaultAdminExists(): Promise<void> {
  const defaultAdminEmail = 'admin@helpdesk.local';

  // Ensure roles exist first
  await ensureDefaultRolesExist();

  // Check if admin user already exists
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, defaultAdminEmail))
    .limit(1);

  if (existingAdmin) {
    // Admin already exists, skip creation
    return;
  }

  // Find System Administrator role
  const [adminRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, 'System Administrator'))
    .limit(1);

  if (!adminRole) {
    throw new Error('System Administrator role not found. Database initialization failed.');
  }

  // Hash default password
  const passwordHash = await bcrypt.hash('admin', 10);

  // Create default admin user
  await db.insert(users).values({
    id: 'default-admin-user',
    email: defaultAdminEmail,
    firstName: 'System',
    lastName: 'Administrator',
    authProvider: 'local',
    passwordHash,
    roleId: adminRole.id,
    status: 'active',
    mustChangePassword: 'true', // Force password change on first login
  });

  console.log('Default admin user created: admin@helpdesk.local / admin (must change password on first login)');
}
