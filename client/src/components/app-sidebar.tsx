import {
  LayoutDashboard,
  Ticket,
  GitBranch,
  Server,
  BookOpen,
  Mail,
  Settings,
  LogOut,
  AlertCircle,
  BarChart3,
  ShoppingCart,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useModules } from "@/hooks/useModules";
import { useTranslation } from 'react-i18next';
import type { SystemSetting } from "@shared/schema";
import type { ModuleKey } from "@shared/modules";

const getMainItems = (t: any) => [
  {
    title: t('nav.dashboard'),
    titleKey: "dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: null as any,
    module: null as ModuleKey | null,
  },
  {
    title: t('nav.incidents'),
    titleKey: "incidents",
    url: "/tickets",
    icon: Ticket,
    permission: null as any,
    module: 'incidents' as ModuleKey,
  },
  {
    title: t('nav.problems'),
    titleKey: "problems",
    url: "/problems",
    icon: AlertCircle,
    permission: null as any,
    module: 'problems' as ModuleKey,
  },
  {
    title: t('nav.changes'),
    titleKey: "changes",
    url: "/changes",
    icon: GitBranch,
    permission: null as any,
    module: 'changes' as ModuleKey,
  },
  {
    title: t('nav.cmdb'),
    titleKey: "cmdb",
    url: "/cmdb",
    icon: Server,
    permission: 'canViewCMDB' as const,
    module: 'cmdb' as ModuleKey,
  },
  {
    title: t('nav.knowledge'),
    titleKey: "knowledge-base",
    url: "/knowledge",
    icon: BookOpen,
    permission: null as any,
    module: 'knowledge' as ModuleKey,
  },
  {
    title: t('nav.serviceCatalog'),
    titleKey: "service-catalog",
    url: "/service-catalog",
    icon: ShoppingCart,
    permission: null as any,
    module: 'service_catalog' as ModuleKey,
  },
  {
    title: t('nav.emailInbox'),
    titleKey: "email-inbox",
    url: "/emails",
    icon: Mail,
    permission: null as any,
    module: 'email_inbox' as ModuleKey,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { isModuleEnabled } = useModules();
  const { t } = useTranslation();

  const { data: settings } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings"],
  });

  const settingsMap = settings?.reduce((acc, s) => {
    acc[s.key] = s.value || '';
    return acc;
  }, {} as Record<string, string>) || {};

  const logoUrl = settingsMap['logo_url'];
  const systemName = settingsMap['system_name'] || 'Servicedesk & CMDB';
  const companyName = settingsMap['company_name'] || 'Your Company';

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const mainItems = getMainItems(t);
  const visibleItems = mainItems.filter(item => {
    // Check permission
    if (item.permission !== null && !hasPermission(item.permission)) {
      return false;
    }
    
    // Check if module is enabled (null means always show, like dashboard)
    if (item.module !== null && !isModuleEnabled(item.module)) {
      return false;
    }
    
    return true;
  });

  const showAdminSection = hasAnyPermission(
    'canManageUsers',
    'canManageRoles',
    'canRunReports',
    'canManageServiceCatalog'
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={systemName} 
              className="h-8 w-auto"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              data-testid="sidebar-logo"
            />
          ) : (
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {companyName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{systemName}</p>
            <p className="text-xs text-muted-foreground truncate">{companyName}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wide px-2 mb-2">
            {systemName}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.titleKey}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showAdminSection && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wide px-2 mb-2">
              {t('nav.admin')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hasPermission('canRunReports') && isModuleEnabled('reports') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === '/reports'} data-testid="nav-reports">
                      <Link href="/reports">
                        <BarChart3 className="h-4 w-4" />
                        <span>{t('nav.reports')}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith('/admin')} data-testid="nav-admin">
                    <Link href="/admin">
                      <Settings className="h-4 w-4" />
                      <span>{t('nav.settings')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
            <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="user-name">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize" data-testid="user-role">
              {user?.role || 'User'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.location.href = '/api/logout'}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('nav.logout')}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
