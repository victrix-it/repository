import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp, Users, Server, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const statusColors: Record<string, string> = {
  'open': '#3b82f6',
  'in_progress': '#f59e0b',
  'closed': '#10b981',
  'on_hold': '#6b7280',
  'pending_approval': '#f59e0b',
  'approved': '#10b981',
  'rejected': '#ef4444',
  'in_review': '#8b5cf6',
  'scheduled': '#06b6d4',
  'implementing': '#f59e0b',
  'completed': '#10b981',
  'cancelled': '#6b7280',
  'p1': '#ef4444',
  'p2': '#f59e0b',
  'p3': '#3b82f6',
  'p4': '#10b981',
};

function ReportCard({ title, description, children, icon: Icon }: any) {
  return (
    <Card data-testid={`card-report-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}

export default function Reports() {
  const { data: ticketsPerCI, isLoading: loadingTicketsPerCI } = useQuery({
    queryKey: ['/api/reports/tickets-per-ci'],
  });

  const { data: changesPerCI, isLoading: loadingChangesPerCI } = useQuery({
    queryKey: ['/api/reports/changes-per-ci'],
  });

  const { data: problemsPerCI, isLoading: loadingProblemsPerCI } = useQuery({
    queryKey: ['/api/reports/problems-per-ci'],
  });

  const { data: ticketsPerCustomer, isLoading: loadingTicketsPerCustomer } = useQuery({
    queryKey: ['/api/reports/tickets-per-customer'],
  });

  const { data: changesPerCustomer, isLoading: loadingChangesPerCustomer } = useQuery({
    queryKey: ['/api/reports/changes-per-customer'],
  });

  const { data: problemsPerCustomer, isLoading: loadingProblemsPerCustomer } = useQuery({
    queryKey: ['/api/reports/problems-per-customer'],
  });

  const { data: topResolvers, isLoading: loadingTopResolvers } = useQuery({
    queryKey: ['/api/reports/top-resolvers'],
  });

  const { data: topChangeImplementors, isLoading: loadingTopImplementors } = useQuery({
    queryKey: ['/api/reports/top-change-implementors'],
  });

  const { data: ticketStatusDist, isLoading: loadingTicketStatus } = useQuery({
    queryKey: ['/api/reports/ticket-status-distribution'],
  });

  const { data: changeStatusDist, isLoading: loadingChangeStatus } = useQuery({
    queryKey: ['/api/reports/change-status-distribution'],
  });

  const { data: problemStatusDist, isLoading: loadingProblemStatus } = useQuery({
    queryKey: ['/api/reports/problem-status-distribution'],
  });

  const { data: ticketsByPriority, isLoading: loadingTicketsPriority } = useQuery({
    queryKey: ['/api/reports/tickets-by-priority'],
  });

  const { data: mostProblematicCIs, isLoading: loadingProblematicCIs } = useQuery({
    queryKey: ['/api/reports/most-problematic-cis'],
  });

  const formatTicketsPerCI = Array.isArray(ticketsPerCI) ? ticketsPerCI.map((item: any) => ({
    name: item.ciNumber || item.ciName || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatChangesPerCI = Array.isArray(changesPerCI) ? changesPerCI.map((item: any) => ({
    name: item.ciNumber || item.ciName || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatProblemsPerCI = Array.isArray(problemsPerCI) ? problemsPerCI.map((item: any) => ({
    name: item.ciNumber || item.ciName || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatTicketsPerCustomer = Array.isArray(ticketsPerCustomer) ? ticketsPerCustomer.map((item: any) => ({
    name: item.customerName || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatChangesPerCustomer = Array.isArray(changesPerCustomer) ? changesPerCustomer.map((item: any) => ({
    name: item.customerName || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatProblemsPerCustomer = Array.isArray(problemsPerCustomer) ? problemsPerCustomer.map((item: any) => ({
    name: item.customerName || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatTopResolvers = Array.isArray(topResolvers) ? topResolvers.map((item: any) => ({
    name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatTopImplementors = Array.isArray(topChangeImplementors) ? topChangeImplementors.map((item: any) => ({
    name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatTicketStatus = Array.isArray(ticketStatusDist) ? ticketStatusDist.map((item: any) => ({
    name: item.status?.replace(/_/g, ' ') || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatChangeStatus = Array.isArray(changeStatusDist) ? changeStatusDist.map((item: any) => ({
    name: item.status?.replace(/_/g, ' ') || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatProblemStatus = Array.isArray(problemStatusDist) ? problemStatusDist.map((item: any) => ({
    name: item.status?.replace(/_/g, ' ') || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatTicketsPriority = Array.isArray(ticketsByPriority) ? ticketsByPriority.map((item: any) => ({
    name: item.priority?.toUpperCase() || 'Unknown',
    value: Number(item.count),
  })) : [];

  const formatProblematicCIs = Array.isArray(mostProblematicCIs) ? mostProblematicCIs.map((item: any) => ({
    name: item.ciNumber || item.ciName || 'Unknown',
    tickets: Number(item.ticketCount),
    problems: Number(item.problemCount),
  })) : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-reports">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Comprehensive insights into your IT service management operations</p>
      </div>

      {/* Status Distribution Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Status Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportCard title="Ticket Status" description="Distribution of tickets by status" icon={BarChart3}>
            {loadingTicketStatus ? (
              <LoadingSkeleton />
            ) : formatTicketStatus && formatTicketStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={formatTicketStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatTicketStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name.replace(/\s+/g, '_')] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>

          <ReportCard title="Change Status" description="Distribution of change requests by status" icon={BarChart3}>
            {loadingChangeStatus ? (
              <LoadingSkeleton />
            ) : formatChangeStatus && formatChangeStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={formatChangeStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatChangeStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name.replace(/\s+/g, '_')] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>

          <ReportCard title="Problem Status" description="Distribution of problems by status" icon={BarChart3}>
            {loadingProblemStatus ? (
              <LoadingSkeleton />
            ) : formatProblemStatus && formatProblemStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={formatProblemStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatProblemStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name.replace(/\s+/g, '_')] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>
        </div>
      </div>

      {/* Priority Distribution */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Priority Analysis</h2>
        <div className="grid grid-cols-1 gap-6">
          <ReportCard title="Tickets by Priority" description="Distribution of tickets across priority levels" icon={AlertCircle}>
            {loadingTicketsPriority ? (
              <LoadingSkeleton />
            ) : formatTicketsPriority && formatTicketsPriority.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={formatTicketsPriority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Tickets">
                    {formatTicketsPriority.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name.toLowerCase()] || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>
        </div>
      </div>

      {/* Per CI Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Configuration Item Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportCard title="Tickets per CI" description="Top 20 CIs by ticket volume" icon={Server}>
            {loadingTicketsPerCI ? (
              <LoadingSkeleton />
            ) : formatTicketsPerCI && formatTicketsPerCI.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatTicketsPerCI} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[0]} name="Tickets" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>

          <ReportCard title="Changes per CI" description="Top 20 CIs by change volume" icon={Server}>
            {loadingChangesPerCI ? (
              <LoadingSkeleton />
            ) : formatChangesPerCI && formatChangesPerCI.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatChangesPerCI} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[1]} name="Changes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>

          <ReportCard title="Problems per CI" description="Top 20 CIs by problem volume" icon={Server}>
            {loadingProblemsPerCI ? (
              <LoadingSkeleton />
            ) : formatProblemsPerCI && formatProblemsPerCI.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatProblemsPerCI} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[2]} name="Problems" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>
        </div>
      </div>

      {/* Per Customer Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Customer Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportCard title="Tickets per Customer" description="Ticket volume by customer" icon={TrendingUp}>
            {loadingTicketsPerCustomer ? (
              <LoadingSkeleton />
            ) : formatTicketsPerCustomer && formatTicketsPerCustomer.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatTicketsPerCustomer}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[0]} name="Tickets" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>

          <ReportCard title="Changes per Customer" description="Change request volume by customer" icon={TrendingUp}>
            {loadingChangesPerCustomer ? (
              <LoadingSkeleton />
            ) : formatChangesPerCustomer && formatChangesPerCustomer.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatChangesPerCustomer}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[1]} name="Changes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>

          <ReportCard title="Problems per Customer" description="Problem volume by customer" icon={TrendingUp}>
            {loadingProblemsPerCustomer ? (
              <LoadingSkeleton />
            ) : formatProblemsPerCustomer && formatProblemsPerCustomer.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatProblemsPerCustomer}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[2]} name="Problems" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>
        </div>
      </div>

      {/* Performance Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Team Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportCard title="Top Resolvers" description="Top 10 team members by resolved tickets" icon={Users}>
            {loadingTopResolvers ? (
              <LoadingSkeleton />
            ) : formatTopResolvers && formatTopResolvers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatTopResolvers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[4]} name="Resolved Tickets" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>

          <ReportCard title="Top Change Implementors" description="Top 10 team members by completed changes" icon={Users}>
            {loadingTopImplementors ? (
              <LoadingSkeleton />
            ) : formatTopImplementors && formatTopImplementors.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatTopImplementors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[5]} name="Completed Changes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>
        </div>
      </div>

      {/* Most Problematic CIs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Problem Areas</h2>
        <div className="grid grid-cols-1 gap-6">
          <ReportCard title="Most Problematic CIs" description="Top 10 CIs with highest incident and problem counts" icon={AlertCircle}>
            {loadingProblematicCIs ? (
              <LoadingSkeleton />
            ) : formatProblematicCIs && formatProblematicCIs.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={formatProblematicCIs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tickets" fill={COLORS[0]} name="Tickets" />
                  <Bar dataKey="problems" fill={COLORS[3]} name="Problems" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </ReportCard>
        </div>
      </div>
    </div>
  );
}
