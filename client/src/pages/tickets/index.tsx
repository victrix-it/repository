import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Ticket, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface TicketWithRelations extends Ticket {
  createdBy?: User;
  assignedTo?: User | null;
}

export default function TicketsPage() {
  const [search, setSearch] = useState("");

  const { data: tickets, isLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets"],
  });

  const filteredTickets = tickets?.filter(ticket =>
    ticket.title.toLowerCase().includes(search.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-3xl font-semibold" data-testid="page-title">Tickets</h1>
        <Link href="/tickets/new">
          <Button data-testid="button-create-ticket">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-tickets"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredTickets && filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid={`ticket-${ticket.id}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground" data-testid={`ticket-number-${ticket.id}`}>
                        {ticket.ticketNumber}
                      </span>
                      <StatusBadge status={ticket.status} type="ticket" />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <h3 className="font-medium mb-1 truncate" data-testid={`ticket-title-${ticket.id}`}>
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
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
              {search ? 'No tickets match your search' : 'No tickets yet. Create your first ticket!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
