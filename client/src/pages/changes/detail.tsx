import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/file-upload";
import { AttachmentsList } from "@/components/attachments-list";
import { ArrowLeft, Server, Paperclip } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChangeRequest, User, ConfigurationItem } from "@shared/schema";

interface ChangeWithRelations extends ChangeRequest {
  requestedBy?: User;
  approvedBy?: User | null;
  linkedCI?: ConfigurationItem | null;
}

export default function ChangeDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data: change, isLoading } = useQuery<ChangeWithRelations>({
    queryKey: ["/api/changes", id],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/changes/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/changes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Change status updated" });
    },
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
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-muted-foreground mb-2" data-testid="change-number">
                    {change.changeNumber}
                  </p>
                  <CardTitle className="text-2xl mb-3" data-testid="change-title">{change.title}</CardTitle>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <StatusBadge status={change.status} type="change" />
                    <PriorityBadge priority={change.priority} />
                    <Badge variant="outline" className="capitalize">
                      {change.changeType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-foreground whitespace-pre-wrap" data-testid="change-description">
                  {change.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {change.reason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reason for Change</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{change.reason}</p>
              </CardContent>
            </Card>
          )}

          {change.impactAssessment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Impact Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{change.impactAssessment}</p>
              </CardContent>
            </Card>
          )}

          {change.prerequisites && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prerequisites</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{change.prerequisites}</p>
              </CardContent>
            </Card>
          )}

          {change.testPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{change.testPlan}</p>
              </CardContent>
            </Card>
          )}

          {change.implementorDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Implementor Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{change.implementorDetails}</p>
              </CardContent>
            </Card>
          )}

          {change.rollbackPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rollback Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{change.rollbackPlan}</p>
              </CardContent>
            </Card>
          )}

          {change.communicationPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communication Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{change.communicationPlan}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={selectedStatus || change.status}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  updateStatusMutation.mutate(value);
                }}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

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
