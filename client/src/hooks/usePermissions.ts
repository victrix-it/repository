import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export interface UserPermissions {
  canCreateTickets: boolean;
  canUpdateOwnTickets: boolean;
  canUpdateAllTickets: boolean;
  canCloseTickets: boolean;
  canViewAllTickets: boolean;
  canApproveChanges: boolean;
  canManageKnowledgebase: boolean;
  canManageServiceCatalog: boolean;
  canRunReports: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageCMDB: boolean;
  canViewCMDB: boolean;
  isTenantScoped: boolean;
}

export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  roleId: string | null;
  customerId: string | null;
  roleDetails?: {
    id: string;
    name: string;
    description: string | null;
  };
  permissions: UserPermissions | null;
}

export function usePermissions() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<UserWithPermissions>({
    queryKey: ['/api/auth/user'],
  });

  const permissions = user?.permissions || null;

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!permissions) return false;
    return permissions[permission] === true;
  };

  const hasAnyPermission = (...permissionList: (keyof UserPermissions)[]): boolean => {
    if (!permissions) return false;
    return permissionList.some(permission => permissions[permission] === true);
  };

  const hasAllPermissions = (...permissionList: (keyof UserPermissions)[]): boolean => {
    if (!permissions) return false;
    return permissionList.every(permission => permissions[permission] === true);
  };

  const requirePermission = (permission: keyof UserPermissions, redirectTo: string = '/') => {
    if (!hasPermission(permission)) {
      setLocation(redirectTo);
      return false;
    }
    return true;
  };

  return {
    user,
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    requirePermission,
  };
}
