import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, GitBranch, AlertCircle, TrendingUp, Plus } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  openTickets: number;
  inProgressTickets: number;
  criticalTickets: number;
  pendingChanges: number;
  totalCIs: number;
  kbArticles: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2" data-testid="page-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your helpdesk activity and current workload
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Incidents
            </CardTitle>
            <Ticket className="h-4 w-4 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="stat-open-tickets">
              {stats?.openTickets || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="stat-in-progress">
              {stats?.inProgressTickets || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Issues
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="stat-critical">
              {stats?.criticalTickets || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Changes
            </CardTitle>
            <GitBranch className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="stat-pending-changes">
              {stats?.pendingChanges || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/tickets/new">
              <Button className="w-full justify-start" variant="outline" data-testid="button-new-ticket">
                <Plus className="h-4 w-4 mr-2" />
                Create New Incident
              </Button>
            </Link>
            <Link href="/changes/new">
              <Button className="w-full justify-start" variant="outline" data-testid="button-new-change">
                <Plus className="h-4 w-4 mr-2" />
                Submit Change Request
              </Button>
            </Link>
            <Link href="/cmdb/new">
              <Button className="w-full justify-start" variant="outline" data-testid="button-new-ci">
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration Item
              </Button>
            </Link>
            <Link href="/knowledge/new">
              <Button className="w-full justify-start" variant="outline" data-testid="button-new-kb">
                <Plus className="h-4 w-4 mr-2" />
                Create Knowledge Article
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Configuration Items</span>
              <span className="text-lg font-semibold" data-testid="stat-total-cis">
                {stats?.totalCIs || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Knowledge Articles</span>
              <span className="text-lg font-semibold" data-testid="stat-kb-articles">
                {stats?.kbArticles || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
