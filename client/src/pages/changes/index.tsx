import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { ChangeRequest, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ChangeWithRelations extends ChangeRequest {
  requestedBy?: User;
  approvedBy?: User | null;
}

export default function ChangesPage() {
  const [search, setSearch] = useState("");

  const { data: changes, isLoading } = useQuery<ChangeWithRelations[]>({
    queryKey: ["/api/changes"],
  });

  const filteredChanges = changes?.filter(change =>
    change.title.toLowerCase().includes(search.toLowerCase()) ||
    change.changeNumber.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-3xl font-semibold" data-testid="page-title">Change Requests</h1>
        <Link href="/changes/new">
          <Button data-testid="button-create-change">
            <Plus className="h-4 w-4 mr-2" />
            New Change Request
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search changes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-changes"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredChanges && filteredChanges.length > 0 ? (
          filteredChanges.map((change) => (
            <Link key={change.id} href={`/changes/${change.id}`}>
              <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid={`change-${change.id}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground" data-testid={`change-number-${change.id}`}>
                        {change.changeNumber}
                      </span>
                      <StatusBadge status={change.status} type="change" />
                    </div>
                    <h3 className="font-medium mb-1 truncate" data-testid={`change-title-${change.id}`}>
                      {change.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {change.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {change.requestedBy && (
                      <div className="flex items-center gap-2">
                        <UserAvatar user={change.requestedBy} size="sm" />
                        <span className="hidden sm:inline">
                          {change.requestedBy.firstName} {change.requestedBy.lastName}
                        </span>
                      </div>
                    )}
                    <span className="text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {search ? 'No changes match your search' : 'No change requests yet. Submit your first change!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
