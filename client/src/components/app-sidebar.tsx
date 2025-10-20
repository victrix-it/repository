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
} from "lucide-react";
import { Link, useLocation } from "wouter";
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: null as any,
  },
  {
    title: "Incidents",
    url: "/tickets",
    icon: Ticket,
    permission: null as any,
  },
  {
    title: "Problems",
    url: "/problems",
    icon: AlertCircle,
    permission: null as any,
  },
  {
    title: "Changes",
    url: "/changes",
    icon: GitBranch,
    permission: null as any,
  },
  {
    title: "CMDB",
    url: "/cmdb",
    icon: Server,
    permission: 'canViewCMDB' as const,
  },
  {
    title: "Knowledge Base",
    url: "/knowledge",
    icon: BookOpen,
    permission: null as any,
  },
  {
    title: "Email Inbox",
    url: "/emails",
    icon: Mail,
    permission: null as any,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const visibleItems = mainItems.filter(item => {
    if (item.permission === null) return true;
    return hasPermission(item.permission);
  });

  const showAdminSection = hasAnyPermission(
    'canManageUsers',
    'canManageRoles',
    'canRunReports'
  );

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wide px-2 mb-2">
            Helpdesk
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}>
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
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hasPermission('canRunReports') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === '/reports'} data-testid="nav-reports">
                      <Link href="/reports">
                        <BarChart3 className="h-4 w-4" />
                        <span>Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith('/admin')} data-testid="nav-admin">
                    <Link href="/admin">
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
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
              {user?.roleDetails?.name || 'User'}
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
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
