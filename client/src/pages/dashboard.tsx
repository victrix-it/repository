import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, AlertTriangle, Clock, CheckCircle2, Activity } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface DashboardStats {
  stats: {
    openTickets: number;
    inProgressTickets: number;
    criticalTickets: number;
    pendingApprovals: number;
    slaBreached: number;
    totalCIs: number;
    kbArticles: number;
  };
  charts: {
    ticketsByStatus: Array<{ status: string; count: number }>;
    ticketsByPriority: Array<{ priority: string; count: number }>;
  };
  recentActivity: {
    tickets: Array<{
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
      priority: string;
      createdAt: Date;
    }>;
    changes: Array<{
      id: string;
      changeNumber: string;
      title: string;
      status: string;
      priority: string;
      createdAt: Date;
    }>;
    serviceRequests: Array<{
      id: string;
      requestNumber: string;
      status: string;
      priority: string;
      createdAt: Date;
      serviceCatalogItemId: string;
    }>;
  };
}

export default function Dashboard() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-10 w-40 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const charts = data?.charts;
  const activity = data?.recentActivity;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: t("common.open"),
      in_progress: t("common.in_progress"),
      resolved: t("common.resolved"),
      closed: t("common.closed"),
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    return priority.toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "p1":
        return "hsl(0 84% 60%)";
      case "p2":
        return "hsl(25 95% 53%)";
      case "p3":
        return "hsl(45 93% 47%)";
      case "p4":
        return "hsl(220 15% 55%)";
      case "p5":
        return "hsl(220 15% 65%)";
      default:
        return "hsl(220 15% 55%)";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "hsl(199 89% 48%)";
      case "in_progress":
        return "hsl(38 92% 50%)";
      case "resolved":
        return "hsl(142 76% 36%)";
      case "closed":
        return "hsl(220 15% 55%)";
      default:
        return "hsl(220 15% 55%)";
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-dashboard-title">
            {t("nav.dashboard")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your IT service management dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tickets/new">
            <Button data-testid="button-new-ticket">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </Link>
          <Link href="/service-catalog">
            <Button variant="secondary" data-testid="button-browse-catalog">
              Browse Catalog
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-stat-open-tickets" className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment or action
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-in-progress" className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgressTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-pending-approvals" className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingApprovals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Changes & requests awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-sla-breached" className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Breached</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.slaBreached || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-tickets-by-status">
          <CardHeader>
            <CardTitle>Tickets by Status</CardTitle>
            <CardDescription>Distribution of all tickets</CardDescription>
          </CardHeader>
          <CardContent>
            {charts?.ticketsByStatus && charts.ticketsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={charts.ticketsByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, count }) => `${getStatusLabel(status)}: ${count}`}
                  >
                    {charts.ticketsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No ticket data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-tickets-by-priority">
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
            <CardDescription>Priority distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {charts?.ticketsByPriority && charts.ticketsByPriority.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.ticketsByPriority}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="priority" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {charts.ticketsByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getPriorityColor(entry.priority)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No priority data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card data-testid="card-recent-tickets">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Tickets
            </CardTitle>
            <CardDescription>Latest 5 tickets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity?.tickets && activity.tickets.length > 0 ? (
              activity.tickets.map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                  <div className="flex items-start justify-between p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer" data-testid={`ticket-${ticket.ticketNumber}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {ticket.ticketNumber}
                        </span>
                        <Badge
                          variant="outline"
                          style={{ borderColor: getPriorityColor(ticket.priority) }}
                          className="text-xs"
                        >
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate mt-1">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(ticket.createdAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent tickets
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-recent-changes">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Changes
            </CardTitle>
            <CardDescription>Latest 5 change requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity?.changes && activity.changes.length > 0 ? (
              activity.changes.map((change) => (
                <Link key={change.id} href={`/changes/${change.id}`}>
                  <div className="flex items-start justify-between p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer" data-testid={`change-${change.changeNumber}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {change.changeNumber}
                        </span>
                        <Badge
                          variant="outline"
                          style={{ borderColor: getPriorityColor(change.priority) }}
                          className="text-xs"
                        >
                          {getPriorityLabel(change.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate mt-1">{change.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(change.createdAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {change.status}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent changes
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-recent-requests">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Requests
            </CardTitle>
            <CardDescription>Latest 5 service requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity?.serviceRequests && activity.serviceRequests.length > 0 ? (
              activity.serviceRequests.map((request) => (
                <Link key={request.id} href={`/service-catalog/requests/${request.id}`}>
                  <div className="flex items-start justify-between p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer" data-testid={`request-${request.requestNumber}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {request.requestNumber}
                        </span>
                        <Badge
                          variant="outline"
                          style={{ borderColor: getPriorityColor(request.priority) }}
                          className="text-xs"
                        >
                          {getPriorityLabel(request.priority)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(request.createdAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {request.status}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent requests
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/cmdb">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-quick-access-cmdb">
            <CardHeader>
              <CardTitle>Configuration Items</CardTitle>
              <CardDescription>Manage your CMDB</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalCIs || 0}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Total CIs in the database
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/knowledge-base">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-quick-access-kb">
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>Browse articles and SOPs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.kbArticles || 0}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Published articles
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
