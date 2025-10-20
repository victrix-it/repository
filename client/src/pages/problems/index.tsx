import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { RecurringIncidentsDetector } from "@/components/recurring-incidents-detector";
import { useState } from "react";
import type { Problem, User, Customer, Team, ConfigurationItem } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ProblemWithRelations extends Problem {
  createdBy?: User;
  assignedTo?: User | null;
  assignedToTeam?: Team | null;
  customer?: Customer | null;
  linkedCI?: ConfigurationItem | null;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  investigating: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  known_error: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function ProblemsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");

  const { data: problems, isLoading } = useQuery<ProblemWithRelations[]>({
    queryKey: ["/api/problems"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const filteredProblems = problems?.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase()) ||
      problem.problemNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || problem.status === statusFilter;
    const matchesCustomer = !customerFilter || problem.customerId === customerFilter;
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-3xl font-semibold" data-testid="page-title">Problem Management</h1>
        <Link href="/problems/new">
          <Button data-testid="button-create-problem">
            <Plus className="h-4 w-4 mr-2" />
            New Problem
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <RecurringIncidentsDetector />
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-problems"
          />
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="known_error">Known Error</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-48" data-testid="select-customer-filter">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Customers</SelectItem>
              {customers?.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(statusFilter || customerFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { 
                setStatusFilter(""); 
                setCustomerFilter("");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredProblems && filteredProblems.length > 0 ? (
          filteredProblems.map((problem) => (
            <Link key={problem.id} href={`/problems/${problem.id}`}>
              <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid={`problem-${problem.id}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground" data-testid={`problem-number-${problem.id}`}>
                        {problem.problemNumber}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${statusColors[problem.status]}`}
                        data-testid={`problem-status-${problem.id}`}
                      >
                        {problem.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${priorityColors[problem.priority]}`}
                        data-testid={`problem-priority-${problem.id}`}
                      >
                        {problem.priority.toUpperCase()}
                      </Badge>
                      {problem.customer && (
                        <Badge variant="secondary" className="text-xs" data-testid={`problem-customer-${problem.id}`}>
                          {problem.customer.name}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium mb-1 truncate" data-testid={`problem-title-${problem.id}`}>
                      {problem.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {problem.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {problem.assignedTo && (
                      <div className="flex items-center gap-2">
                        <UserAvatar user={problem.assignedTo} size="sm" />
                        <span className="hidden sm:inline">
                          {problem.assignedTo.firstName} {problem.assignedTo.lastName}
                        </span>
                      </div>
                    )}
                    <span className="text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(problem.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {search ? 'No problems match your search' : 'No problems yet. Create your first problem!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
