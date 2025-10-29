import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Tag } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Ticket, User, Customer, Team } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface TicketWithRelations extends Ticket {
  createdBy?: User;
  assignedTo?: User | null;
  customer?: Customer | null;
  assignedToTeam?: Team | null;
}

export default function TicketsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [slaFilter, setSlaFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");

  const { data: ticketsResponse, isLoading } = useQuery<{ tickets: TicketWithRelations[]; total: number }>({
    queryKey: ["/api/tickets"],
  });

  const tickets = ticketsResponse?.tickets || [];

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Get unique categories and tags for filtering
  const categories = Array.from(new Set(tickets.map(t => t.category).filter(Boolean)));
  const allTags = Array.from(new Set(tickets.flatMap(t => t.tags || [])));

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || ticket.category === categoryFilter;
    const matchesTag = !tagFilter || (ticket.tags && ticket.tags.includes(tagFilter));
    const matchesCustomer = !customerFilter || ticket.customerId === customerFilter;
    const matchesSla = !slaFilter || ticket.slaStatus === slaFilter;
    const matchesTeam = !teamFilter || ticket.assignedToTeamId === teamFilter;
    return matchesSearch && matchesCategory && matchesTag && matchesCustomer && matchesSla && matchesTeam;
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-4 md:mb-6" />
        <div className="space-y-3 md:space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-semibold" data-testid="page-title">Incidents</h1>
        <Link href="/incidents/new">
          <Button data-testid="button-create-ticket" size="sm" className="md:h-9">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Incident</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-tickets"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-tag-filter">
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-customer-filter">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Customers</SelectItem>
              {customers?.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={slaFilter} onValueChange={setSlaFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-sla-filter">
              <SelectValue placeholder="All SLA Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All SLA Status</SelectItem>
              <SelectItem value="within_sla">Within SLA</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
              <SelectItem value="breached">Breached</SelectItem>
            </SelectContent>
          </Select>

          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-team-filter">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Teams</SelectItem>
              {teams?.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(categoryFilter || tagFilter || customerFilter || slaFilter || teamFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { 
                setCategoryFilter(""); 
                setTagFilter(""); 
                setCustomerFilter("");
                setSlaFilter("");
                setTeamFilter("");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        {filteredTickets && filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <Link key={ticket.id} href={`/incidents/${ticket.id}`}>
              <Card className="p-3 md:p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid={`ticket-${ticket.id}`}>
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground" data-testid={`ticket-number-${ticket.id}`}>
                        {ticket.ticketNumber}
                      </span>
                      <StatusBadge status={ticket.status} type="ticket" />
                      <PriorityBadge priority={ticket.priority} />
                      {ticket.category && (
                        <Badge variant="outline" className="text-xs" data-testid={`ticket-category-${ticket.id}`}>
                          {ticket.category}
                        </Badge>
                      )}
                      {ticket.customer && (
                        <Badge variant="secondary" className="text-xs" data-testid={`ticket-customer-${ticket.id}`}>
                          {ticket.customer.name}
                        </Badge>
                      )}
                      {ticket.slaStatus && ticket.slaStatus !== 'within_sla' && (
                        <Badge 
                          variant={ticket.slaStatus === 'breached' ? 'destructive' : 'default'}
                          className="text-xs" 
                          data-testid={`ticket-sla-${ticket.id}`}
                        >
                          {ticket.slaStatus === 'at_risk' ? 'SLA At Risk' : 'SLA Breached'}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium mb-1 truncate" data-testid={`ticket-title-${ticket.id}`}>
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    {ticket.tags && ticket.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {ticket.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs" data-testid={`ticket-tag-${ticket.id}-${tag}`}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {ticket.assignedTo && (
                      <div className="flex items-center gap-2">
                        <UserAvatar user={ticket.assignedTo} size="sm" />
                        <span className="hidden sm:inline">
                          {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                        </span>
                      </div>
                    )}
                    <span className="text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {search ? 'No incidents match your search' : 'No incidents yet. Create your first incident!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
