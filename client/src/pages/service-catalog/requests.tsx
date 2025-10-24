import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, ShoppingCart, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";

const statusColors: Record<string, any> = {
  submitted: { variant: "secondary", icon: Clock },
  pending_approval: { variant: "default", icon: Clock },
  approved: { variant: "default", icon: CheckCircle },
  rejected: { variant: "destructive", icon: XCircle },
  in_progress: { variant: "default", icon: Clock },
  completed: { variant: "default", icon: CheckCircle },
  cancelled: { variant: "secondary", icon: XCircle },
};

const priorityColors: Record<string, string> = {
  low: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
  medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900",
  high: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900",
  urgent: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
};

export default function ServiceRequests() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; open: boolean }>({ type: "", open: false });
  const [actionNotes, setActionNotes] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/service-requests"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest(`/api/service-requests/${id}/approve`, "POST", { notes });
    },
    onSuccess: () => {
      toast({
        title: t("serviceCatalog.requestApproved", "Request Approved"),
        description: t("serviceCatalog.requestApprovedDesc", "The service request has been approved"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setActionDialog({ type: "", open: false });
      setActionNotes("");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest(`/api/service-requests/${id}/reject`, "POST", { notes });
    },
    onSuccess: () => {
      toast({
        title: t("serviceCatalog.requestRejected", "Request Rejected"),
        description: t("serviceCatalog.requestRejectedDesc", "The service request has been rejected"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setActionDialog({ type: "", open: false });
      setActionNotes("");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest(`/api/service-requests/${id}/complete`, "POST", { notes });
    },
    onSuccess: () => {
      toast({
        title: t("serviceCatalog.requestCompleted", "Request Completed"),
        description: t("serviceCatalog.requestCompletedDesc", "The service request has been marked as completed"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setActionDialog({ type: "", open: false });
      setActionNotes("");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAction = () => {
    if (!selectedRequest) return;

    switch (actionDialog.type) {
      case "approve":
        approveMutation.mutate({ id: selectedRequest.id, notes: actionNotes });
        break;
      case "reject":
        rejectMutation.mutate({ id: selectedRequest.id, notes: actionNotes });
        break;
      case "complete":
        completeMutation.mutate({ id: selectedRequest.id, notes: actionNotes });
        break;
    }
  };

  const filteredRequests = requests.filter((request: any) => {
    const matchesSearch =
      request.requestNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.serviceCatalogItem?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold" data-testid="text-page-title">
                {t("serviceCatalog.myRequests", "My Service Requests")}
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-description">
                {t("serviceCatalog.requestsDescription", "View and manage your service requests")}
              </p>
            </div>
            <Link href="/service-catalog">
              <Button data-testid="button-browse-catalog">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t("serviceCatalog.browseCatalog", "Browse Catalog")}
              </Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("serviceCatalog.searchRequests", "Search requests...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses", "All Statuses")}</SelectItem>
                <SelectItem value="submitted">{t("status.submitted", "Submitted")}</SelectItem>
                <SelectItem value="pending_approval">{t("status.pending_approval", "Pending Approval")}</SelectItem>
                <SelectItem value="approved">{t("status.approved", "Approved")}</SelectItem>
                <SelectItem value="rejected">{t("status.rejected", "Rejected")}</SelectItem>
                <SelectItem value="in_progress">{t("status.in_progress", "In Progress")}</SelectItem>
                <SelectItem value="completed">{t("status.completed", "Completed")}</SelectItem>
                <SelectItem value="cancelled">{t("status.cancelled", "Cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
                      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                      <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4" data-testid="text-no-requests">
                  {t("serviceCatalog.noRequests", "No service requests found")}
                </p>
                <Link href="/service-catalog">
                  <Button data-testid="button-browse-catalog-empty">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t("serviceCatalog.browseCatalog", "Browse Catalog")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request: any) => {
                const statusConfig = statusColors[request.status] || statusColors.submitted;
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-semibold" data-testid={`text-request-number-${request.id}`}>
                                {request.requestNumber}
                              </h3>
                              <Badge variant={statusConfig.variant} data-testid={`badge-status-${request.id}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {t(`status.${request.status}`, request.status)}
                              </Badge>
                              <Badge
                                className={priorityColors[request.priority]}
                                data-testid={`badge-priority-${request.id}`}
                              >
                                {t(`priority.${request.priority}`, request.priority)}
                              </Badge>
                            </div>
                            <p className="text-base font-medium" data-testid={`text-service-${request.id}`}>
                              {request.serviceCatalogItem?.name}
                            </p>
                            {request.serviceCatalogItem?.description && (
                              <p className="text-sm text-muted-foreground" data-testid={`text-desc-${request.id}`}>
                                {request.serviceCatalogItem.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 md:items-end">
                            <span className="text-sm text-muted-foreground" data-testid={`text-date-${request.id}`}>
                              {format(new Date(request.createdAt), "PPp")}
                            </span>
                            {request.status === "pending_approval" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setActionDialog({ type: "approve", open: true });
                                  }}
                                  data-testid={`button-approve-${request.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  {t("common.approve", "Approve")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setActionDialog({ type: "reject", open: true });
                                  }}
                                  data-testid={`button-reject-${request.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  {t("common.reject", "Reject")}
                                </Button>
                              </div>
                            )}
                            {request.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionDialog({ type: "complete", open: true });
                                }}
                                data-testid={`button-complete-${request.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {t("common.complete", "Complete")}
                              </Button>
                            )}
                          </div>
                        </div>
                        {(request.approvalNotes || request.completionNotes) && (
                          <div className="pt-4 border-t space-y-2">
                            {request.approvalNotes && (
                              <div>
                                <span className="text-sm font-medium">{t("serviceCatalog.approvalNotes", "Approval Notes")}: </span>
                                <span className="text-sm text-muted-foreground">{request.approvalNotes}</span>
                              </div>
                            )}
                            {request.completionNotes && (
                              <div>
                                <span className="text-sm font-medium">{t("serviceCatalog.completionNotes", "Completion Notes")}: </span>
                                <span className="text-sm text-muted-foreground">{request.completionNotes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent data-testid="dialog-action">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" && t("serviceCatalog.approveRequest", "Approve Request")}
              {actionDialog.type === "reject" && t("serviceCatalog.rejectRequest", "Reject Request")}
              {actionDialog.type === "complete" && t("serviceCatalog.completeRequest", "Complete Request")}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.requestNumber} - {selectedRequest?.serviceCatalogItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("serviceCatalog.notes", "Notes")}
                {actionDialog.type === "reject" && <span className="text-destructive ml-1">*</span>}
              </label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionDialog.type === "reject"
                    ? t("serviceCatalog.rejectNotesPlaceholder", "Provide a reason for rejection")
                    : t("serviceCatalog.notesPlaceholder", "Add notes (optional)")
                }
                rows={4}
                data-testid="textarea-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ type: "", open: false });
                setActionNotes("");
              }}
              data-testid="button-cancel-action"
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                (actionDialog.type === "reject" && !actionNotes.trim()) ||
                approveMutation.isPending ||
                rejectMutation.isPending ||
                completeMutation.isPending
              }
              data-testid="button-confirm-action"
            >
              {(approveMutation.isPending || rejectMutation.isPending || completeMutation.isPending)
                ? t("common.processing", "Processing...")
                : t("common.confirm", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
