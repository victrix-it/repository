import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Server, Database, Network, HardDrive, Box } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ConfigurationItem, User } from "@shared/schema";

const ciTypeIcons = {
  server: Server,
  application: Box,
  database: Database,
  network: Network,
  storage: HardDrive,
  other: Box,
};

interface CIWithRelations extends ConfigurationItem {
  owner?: User | null;
}

export default function CIDetailPage() {
  const { id } = useParams();

  const { data: ci, isLoading } = useQuery<CIWithRelations>({
    queryKey: ["/api/configuration-items", id],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!ci) {
    return (
      <div className="p-8">
        <p>Configuration item not found</p>
      </div>
    );
  }

  const Icon = ciTypeIcons[ci.type as keyof typeof ciTypeIcons] || Box;

  return (
    <div className="p-8">
      <Link href="/cmdb">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CMDB
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl mb-3" data-testid="ci-name">{ci.name}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <StatusBadge status={ci.status} type="ci" />
                    <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded-md bg-muted">
                      {ci.type}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            {ci.description && (
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap" data-testid="ci-description">
                  {ci.description}
                </p>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ci.owner && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Owner</p>
                  <div className="flex items-center gap-2">
                    <UserAvatar user={ci.owner} size="sm" />
                    <span className="text-sm">
                      {ci.owner.firstName} {ci.owner.lastName}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(ci.createdAt), { addSuffix: true })}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(ci.updatedAt), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
