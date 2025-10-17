import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/file-upload";
import { AttachmentsList } from "@/components/attachments-list";
import { ArrowLeft, MessageSquare, Server, Paperclip, Tag } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Ticket, User, Comment, ConfigurationItem } from "@shared/schema";

interface TicketWithRelations extends Ticket {
  createdBy?: User;
  assignedTo?: User | null;
  linkedCI?: ConfigurationItem | null;
  comments?: Array<Comment & { createdBy: User }>;
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data: ticket, isLoading } = useQuery<TicketWithRelations>({
    queryKey: ["/api/tickets", id],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/tickets/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Ticket status updated" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/tickets/${id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      setComment("");
      toast({ title: "Success", description: "Comment added" });
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

  if (!ticket) {
    return (
      <div className="p-8">
        <p>Ticket not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link href="/tickets">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-muted-foreground mb-2" data-testid="ticket-number">
                    {ticket.ticketNumber}
                  </p>
                  <CardTitle className="text-2xl mb-3" data-testid="ticket-title">{ticket.title}</CardTitle>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <StatusBadge status={ticket.status} type="ticket" />
                    <PriorityBadge priority={ticket.priority} />
                    {ticket.category && (
                      <Badge variant="outline" data-testid="ticket-category">
                        {ticket.category}
                      </Badge>
                    )}
                  </div>
                  {ticket.tags && ticket.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {ticket.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs" data-testid={`ticket-tag-${tag}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap" data-testid="ticket-description">
                  {ticket.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Activity & Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((c) => (
                  <div key={c.id} className="flex gap-3" data-testid={`comment-${c.id}`}>
                    <UserAvatar user={c.createdBy} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {c.createdBy.firstName} {c.createdBy.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              )}

              <div className="pt-4 border-t">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-3"
                  data-testid="input-comment"
                />
                <Button
                  onClick={() => comment.trim() && addCommentMutation.mutate(comment)}
                  disabled={!comment.trim() || addCommentMutation.isPending}
                  data-testid="button-add-comment"
                >
                  Add Comment
                </Button>
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
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Select
                  value={selectedStatus || ticket.status}
                  onValueChange={(value) => {
                    setSelectedStatus(value);
                    updateStatusMutation.mutate(value);
                  }}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Created By</p>
                <div className="flex items-center gap-2">
                  <UserAvatar user={ticket.createdBy} size="sm" />
                  <span className="text-sm">
                    {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
                  </span>
                </div>
              </div>

              {ticket.assignedTo && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <UserAvatar user={ticket.assignedTo} size="sm" />
                    <span className="text-sm">
                      {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                    </span>
                  </div>
                </div>
              )}

              {ticket.linkedCI && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Linked CI</p>
                  <Link href={`/cmdb/${ticket.linkedCI.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded-md hover-elevate active-elevate-2 border">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ticket.linkedCI.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{ticket.linkedCI.type}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
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
                <FileUpload ticketId={id} />
              </div>
            </CardHeader>
            <CardContent>
              <AttachmentsList ticketId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
