import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import TicketsPage from "@/pages/tickets/index";
import NewTicketPage from "@/pages/tickets/new";
import TicketDetailPage from "@/pages/tickets/detail";
import ChangesPage from "@/pages/changes/index";
import NewChangePage from "@/pages/changes/new";
import ChangeDetailPage from "@/pages/changes/detail";
import CMDBPage from "@/pages/cmdb/index";
import NewCIPage from "@/pages/cmdb/new";
import CIDetailPage from "@/pages/cmdb/detail";
import KnowledgePage from "@/pages/knowledge/index";
import NewKBPage from "@/pages/knowledge/new";
import KBDetailPage from "@/pages/knowledge/detail";
import ProblemsPage from "@/pages/problems/index";
import NewProblemPage from "@/pages/problems/new";
import EmailsPage from "@/pages/emails/index";
import AdminPage from "@/pages/admin/index";
import BrandingPage from "@/pages/admin/branding";
import AuthSettingsPage from "@/pages/admin/auth-settings";
import AlertIntegrationsPage from "@/pages/admin/alert-integrations";
import NetworkDiscoveryPage from "@/pages/admin/network-discovery";
import DiscoveryResultsPage from "@/pages/admin/discovery-results";
import CsvImportPage from "@/pages/admin/csv-import";
import TeamsPage from "@/pages/admin/teams";
import CustomersPage from "@/pages/admin/customers";
import UserCsvImportPage from "@/pages/admin/user-csv-import";
import UsersPage from "@/pages/admin/users";
import ResolutionCategoriesPage from "@/pages/admin/resolution-categories";
import SlaTemplatesPage from "@/pages/admin/sla-templates/index";
import ReportsPage from "@/pages/reports";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/tickets" component={TicketsPage} />
          <Route path="/tickets/new" component={NewTicketPage} />
          <Route path="/tickets/:id" component={TicketDetailPage} />
          <Route path="/changes" component={ChangesPage} />
          <Route path="/changes/new" component={NewChangePage} />
          <Route path="/changes/:id" component={ChangeDetailPage} />
          <Route path="/cmdb" component={CMDBPage} />
          <Route path="/cmdb/new" component={NewCIPage} />
          <Route path="/cmdb/:id" component={CIDetailPage} />
          <Route path="/knowledge" component={KnowledgePage} />
          <Route path="/knowledge/new" component={NewKBPage} />
          <Route path="/knowledge/:id" component={KBDetailPage} />
          <Route path="/problems" component={ProblemsPage} />
          <Route path="/problems/new" component={NewProblemPage} />
          <Route path="/emails" component={EmailsPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/branding" component={BrandingPage} />
          <Route path="/admin/auth-settings" component={AuthSettingsPage} />
          <Route path="/admin/alert-integrations" component={AlertIntegrationsPage} />
          <Route path="/admin/network-discovery" component={NetworkDiscoveryPage} />
          <Route path="/admin/discovery/:jobId" component={DiscoveryResultsPage} />
          <Route path="/admin/csv-import" component={CsvImportPage} />
          <Route path="/admin/teams" component={TeamsPage} />
          <Route path="/admin/customers" component={CustomersPage} />
          <Route path="/admin/user-csv-import" component={UserCsvImportPage} />
          <Route path="/admin/users" component={UsersPage} />
          <Route path="/admin/resolution-categories" component={ResolutionCategoriesPage} />
          <Route path="/admin/sla-templates" component={SlaTemplatesPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!isLoading && isAuthenticated) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between p-2 border-b sticky top-0 z-50 bg-background">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return <Router />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
