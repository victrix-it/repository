import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { SlaTemplate } from "@shared/schema";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SlaTemplateDialog } from "./sla-template-dialog.tsx";

export default function SlaTemplatesPage() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState<SlaTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: templates, isLoading } = useQuery<SlaTemplate[]>({
    queryKey: ["/api/sla-templates"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sla-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sla-templates"] });
      toast({
        title: "Success",
        description: "SLA template deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/sla-templates/${id}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sla-templates"] });
      toast({
        title: "Success",
        description: "Default SLA template updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return "As agreed";
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
    }
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link href="/admin">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-to-admin">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </Link>
      
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="page-title">
            SLA Templates
          </h1>
          <p className="text-muted-foreground">
            Manage service level agreement templates for customers
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-sla">
          <Plus className="h-4 w-4 mr-2" />
          New SLA Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id} data-testid={`sla-template-${template.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle>{template.name}</CardTitle>
                    {template.isDefault === 'true' && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </div>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  {template.isDefault !== 'true' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefaultMutation.mutate(template.id)}
                      disabled={setDefaultMutation.isPending}
                      data-testid={`button-set-default-${template.id}`}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditTemplate(template)}
                    data-testid={`button-edit-${template.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteId(template.id)}
                    disabled={template.isDefault === 'true'}
                    data-testid={`button-delete-${template.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Incident SLAs */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Incident SLAs</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P1 Critical:</span>
                      <span className="font-medium">{formatMinutes(template.incidentP1Response)} / {formatMinutes(template.incidentP1Resolution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P2 High:</span>
                      <span className="font-medium">{formatMinutes(template.incidentP2Response)} / {formatMinutes(template.incidentP2Resolution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P3 Medium:</span>
                      <span className="font-medium">{formatMinutes(template.incidentP3Response)} / {formatMinutes(template.incidentP3Resolution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P4 Low:</span>
                      <span className="font-medium">{formatMinutes(template.incidentP4Response)} / {formatMinutes(template.incidentP4Resolution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P5 Info:</span>
                      <span className="font-medium">{formatMinutes(template.incidentP5Response)} / {formatMinutes(template.incidentP5Resolution)}</span>
                    </div>
                  </div>
                </div>

                {/* Change SLAs */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Change SLAs</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P1 Critical:</span>
                      <span className="font-medium">{formatMinutes(template.changeP1Approval)} / {formatMinutes(template.changeP1Implementation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P2 High:</span>
                      <span className="font-medium">{formatMinutes(template.changeP2Approval)} / {formatMinutes(template.changeP2Implementation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P3 Medium:</span>
                      <span className="font-medium">{formatMinutes(template.changeP3Approval)} / {formatMinutes(template.changeP3Implementation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P4 Low:</span>
                      <span className="font-medium">{formatMinutes(template.changeP4Approval)} / {formatMinutes(template.changeP4Implementation)}</span>
                    </div>
                  </div>
                </div>

                {/* Problem SLAs */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Problem SLAs</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P1 Critical:</span>
                      <span className="font-medium text-xs">{formatMinutes(template.problemP1Response)} / {formatMinutes(template.problemP1RcaTarget)} / {formatMinutes(template.problemP1Resolution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P2 High:</span>
                      <span className="font-medium text-xs">{formatMinutes(template.problemP2Response)} / {formatMinutes(template.problemP2RcaTarget)} / {formatMinutes(template.problemP2Resolution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P3 Medium:</span>
                      <span className="font-medium text-xs">{formatMinutes(template.problemP3Response)} / {formatMinutes(template.problemP3RcaTarget)} / {formatMinutes(template.problemP3Resolution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P4 Low:</span>
                      <span className="font-medium text-xs">{formatMinutes(template.problemP4Response)} / {formatMinutes(template.problemP4RcaTarget)} / {formatMinutes(template.problemP4Resolution)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SLA Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this SLA template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <SlaTemplateDialog
        open={showCreateDialog || !!editTemplate}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditTemplate(null);
          }
        }}
        template={editTemplate}
      />
    </div>
  );
}
