import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceCatalogItemSchema } from "@shared/schema";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { useState } from "react";

const formSchema = insertServiceCatalogItemSchema.extend({
  category: z.enum(["access", "software", "hardware", "other"]),
});

export default function ServiceCatalogAdmin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const canManage = hasPermission('canManageServiceCatalog');

  const { data: catalogItems = [], isLoading } = useQuery({
    queryKey: ["/api/service-catalog/all"],
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "other" as const,
      icon: "",
      estimatedCompletionMinutes: 0,
      requiresApproval: "false",
      isActive: "true",
      cost: "",
      formFields: [] as any[],
      assignedToTeamId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/service-catalog", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: t("common.success", "Success"),
        description: t("serviceCatalog.itemCreated", "Service catalog item created successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/service-catalog/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: t("common.success", "Success"),
        description: t("serviceCatalog.itemUpdated", "Service catalog item updated successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setDialogOpen(false);
      setEditItem(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/service-catalog/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: t("common.success", "Success"),
        description: t("serviceCatalog.itemDeleted", "Service catalog item deleted successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setDeleteItem(null);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    form.reset({
      name: item.name,
      description: item.description || "",
      category: item.category,
      icon: item.icon || "",
      estimatedCompletionMinutes: item.estimatedCompletionMinutes || 0,
      requiresApproval: item.requiresApproval,
      isActive: item.isActive,
      cost: item.cost || "",
      formFields: item.formFields || [],
      assignedToTeamId: item.assignedToTeamId || undefined,
    });
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditItem(null);
    form.reset();
    setDialogOpen(true);
  };

  if (!canManage) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <ShieldAlert className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2" data-testid="text-permission-denied">
                  {t("common.permissionDenied", "Permission Denied")}
                </h2>
                <p className="text-muted-foreground" data-testid="text-permission-message">
                  {t("serviceCatalog.requiresPermission", "You need the Service Catalog Admin role to manage catalog items.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold" data-testid="text-page-title">
                {t("serviceCatalog.adminTitle", "Service Catalog Management")}
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-description">
                {t("serviceCatalog.adminDescription", "Manage service catalog items and offerings")}
              </p>
            </div>
            <Button onClick={handleNew} data-testid="button-new-item">
              <Plus className="w-4 h-4 mr-2" />
              {t("serviceCatalog.newItem", "New Item")}
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : catalogItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4" data-testid="text-no-items">
                  {t("serviceCatalog.noItems", "No service catalog items yet")}
                </p>
                <Button onClick={handleNew} data-testid="button-new-item-empty">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("serviceCatalog.createFirst", "Create First Item")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogItems.map((item: any) => (
                <Card key={item.id} data-testid={`card-item-${item.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg" data-testid={`text-item-name-${item.id}`}>
                        {item.name}
                      </CardTitle>
                      <div className="flex gap-1">
                        {item.isActive === 'true' ? (
                          <Badge variant="default" data-testid={`badge-active-${item.id}`}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t("common.active", "Active")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" data-testid={`badge-inactive-${item.id}`}>
                            <XCircle className="w-3 h-3 mr-1" />
                            {t("common.inactive", "Inactive")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2" data-testid={`text-item-desc-${item.id}`}>
                      {item.description || t("common.noDescription", "No description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline" data-testid={`badge-category-${item.id}`}>
                        {t(`serviceCatalog.category${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`, item.category)}
                      </Badge>
                      {item.requiresApproval === 'true' && (
                        <Badge variant="outline" data-testid={`badge-approval-${item.id}`}>
                          {t("serviceCatalog.requiresApproval", "Approval")}
                        </Badge>
                      )}
                    </div>
                    {item.assignedToTeam && (
                      <p className="text-sm text-muted-foreground" data-testid={`text-team-${item.id}`}>
                        {t("common.team", "Team")}: {item.assignedToTeam.name}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(item)}
                        data-testid={`button-edit-${item.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        {t("common.edit", "Edit")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteItem(item)}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-form">
          <DialogHeader>
            <DialogTitle>
              {editItem
                ? t("serviceCatalog.editItem", "Edit Service Catalog Item")
                : t("serviceCatalog.newItem", "New Service Catalog Item")}
            </DialogTitle>
            <DialogDescription>
              {t("serviceCatalog.formDescription", "Configure the service catalog item details")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.name", "Name")} *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.description", "Description")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.category", "Category")} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="access">{t("serviceCatalog.categoryAccess", "Access Requests")}</SelectItem>
                          <SelectItem value="software">{t("serviceCatalog.categorySoftware", "Software")}</SelectItem>
                          <SelectItem value="hardware">{t("serviceCatalog.categoryHardware", "Hardware")}</SelectItem>
                          <SelectItem value="other">{t("serviceCatalog.categoryOther", "Other")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedCompletionMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("serviceCatalog.estimatedTime", "Est. Time (minutes)")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.cost", "Cost")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="$0.00" data-testid="input-cost" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedToTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.team", "Team")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-team">
                            <SelectValue placeholder={t("common.selectTeam", "Select team")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams.map((team: any) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requiresApproval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t("serviceCatalog.requiresApproval", "Requires Approval")}
                      </FormLabel>
                      <FormDescription>
                        {t("serviceCatalog.requiresApprovalDesc", "Requests must be approved before processing")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'true'}
                        onCheckedChange={(checked) => field.onChange(checked ? 'true' : 'false')}
                        data-testid="switch-requires-approval"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t("common.active", "Active")}
                      </FormLabel>
                      <FormDescription>
                        {t("serviceCatalog.isActiveDesc", "Make this item available in the service catalog")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'true'}
                        onCheckedChange={(checked) => field.onChange(checked ? 'true' : 'false')}
                        data-testid="switch-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditItem(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? t("common.saving", "Saving...")
                    : t("common.save", "Save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent data-testid="dialog-delete">
          <DialogHeader>
            <DialogTitle>{t("serviceCatalog.deleteItem", "Delete Service Catalog Item")}</DialogTitle>
            <DialogDescription>
              {t("serviceCatalog.deleteConfirm", "Are you sure you want to delete")} "{deleteItem?.name}"?
              {t("serviceCatalog.deleteWarning", " This action cannot be undone.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteItem(null)}
              data-testid="button-cancel-delete"
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteItem.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("common.deleting", "Deleting...") : t("common.delete", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
