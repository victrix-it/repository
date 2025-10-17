import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/file-upload";
import { AttachmentsList } from "@/components/attachments-list";
import { ArrowLeft, Server, Paperclip } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ChangeRequest, User, ConfigurationItem } from "@shared/schema";

interface ChangeWithRelations extends ChangeRequest {
  requestedBy?: User;
  approvedBy?: User | null;
  linkedCI?: ConfigurationItem | null;
}

export default function ChangeDetailPage() {
  const { id } = useParams();

  const { data: change, isLoading } = useQuery<ChangeWithRelations>({
    queryKey: ["/api/changes", id],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!change) {
    return (
      <div className="p-8">
        <p>Change request not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link href="/changes">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Changes
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-muted-foreground mb-2" data-testid="change-number">
                    {change.changeNumber}
                  </p>
                  <CardTitle className="text-2xl mb-3" data-testid="change-title">{change.title}</CardTitle>
                  <StatusBadge status={change.status} type="change" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap" data-testid="change-description">
                  {change.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Requested By</p>
                <div className="flex items-center gap-2">
                  <UserAvatar user={change.requestedBy} size="sm" />
                  <span className="text-sm">
                    {change.requestedBy?.firstName} {change.requestedBy?.lastName}
                  </span>
                </div>
              </div>

              {change.approvedBy && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Approved By</p>
                  <div className="flex items-center gap-2">
                    <UserAvatar user={change.approvedBy} size="sm" />
                    <span className="text-sm">
                      {change.approvedBy.firstName} {change.approvedBy.lastName}
                    </span>
                  </div>
                </div>
              )}

              {change.linkedCI && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Linked CI</p>
                  <Link href={`/cmdb/${change.linkedCI.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded-md hover-elevate active-elevate-2 border">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{change.linkedCI.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{change.linkedCI.type}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {change.scheduledDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Scheduled Date</p>
                  <p className="text-sm">
                    {new Date(change.scheduledDate).toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <CardTitle className="text-lg">Attachments</CardTitle>
                </div>
                <FileUpload changeRequestId={id} />
              </div>
            </CardHeader>
            <CardContent>
              <AttachmentsList changeRequestId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
