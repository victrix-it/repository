import type { RequestHandler } from "express";
import { storage } from "./storage";
import type { Role } from "@shared/schema";

export interface UserWithRole {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  roleId: string | null;
  customerId: string | null;
  roleDetails?: Role;
}

export async function getUserWithRole(userId: string): Promise<UserWithRole | undefined> {
  const user = await storage.getUser(userId);
  if (!user) return undefined;

  let roleDetails: Role | undefined;
  if (user.roleId) {
    roleDetails = await storage.getRole(user.roleId);
  }

  return {
    ...user,
    roleDetails,
  };
}

function parseBoolean(value: string | null | undefined): boolean {
  return value === 'true';
}

export function hasPermission(user: UserWithRole, permission: keyof Role): boolean {
  // Legacy admin role always has all permissions
  if (user.role === 'admin') return true;
  
  // Check role-based permissions
  if (!user.roleDetails) return false;
  
  const value = user.roleDetails[permission];
  if (typeof value === 'string') {
    return parseBoolean(value);
  }
  return false;
}

export function requirePermission(...permissions: (keyof Role)[]): RequestHandler {
  return async (req, res, next) => {
    // Handle both Replit OIDC users and local/LDAP/SAML users
    const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await getUserWithRole(userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user has at least one of the required permissions
    const hasRequiredPermission = permissions.some(permission => 
      hasPermission(user, permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({ 
        message: "Forbidden: You don't have permission to perform this action" 
      });
    }

    // Attach user with role to request for later use
    (req as any).userWithRole = user;
    next();
  };
}

export function optionalPermissionContext(): RequestHandler {
  return async (req, res, next) => {
    // Handle both Replit OIDC users and local/LDAP/SAML users
    const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
    
    if (userId) {
      const user = await getUserWithRole(userId);
      if (user) {
        (req as any).userWithRole = user;
      }
    }
    
    next();
  };
}

export function isScopedToTenant(user: UserWithRole): boolean {
  if (!user.roleDetails) return false;
  return parseBoolean(user.roleDetails.isTenantScoped);
}

export function canAccessAllCustomers(user: UserWithRole): boolean {
  // Legacy admin can access all
  if (user.role === 'admin') return true;
  
  // If not tenant-scoped, can access all
  return !isScopedToTenant(user);
}

export function getTenantFilter(user: UserWithRole): string | null {
  if (canAccessAllCustomers(user)) {
    return null;
  }
  return user.customerId;
}
