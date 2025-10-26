import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Shield, Plus, Edit, Trash2, Check, X } from "lucide-react";
import { insertRoleSchema, type Role } from "@shared/schema";
import { z } from "zod";

const formSchema = insertRoleSchema.extend({
  name: z.string().min(1, "Role name is required"),
});

type FormData = z.infer<typeof formSchema>;

const permissionLabels = {
  canCreateTickets: "Create Incidents",
  canUpdateOwnTickets: "Update Own Incidents",
  canUpdateAllTickets: "Update All Incidents",
  canCloseTickets: "Close Incidents",
  canViewAllTickets: "View All Incidents",
  canApproveChanges: "Approve Changes",
  canManageKnowledgebase: "Manage Knowledge Base",
  canManageServiceCatalog: "Manage Service Catalog",
  canRunReports: "Run Reports",
  canManageUsers: "Manage Users",
  canManageRoles: "Manage Roles",
  canManageCMDB: "Manage CMDB",
  canViewCMDB: "View CMDB",
  isTenantScoped: "Tenant Scoped (Multi-customer)",
};

export default function RolesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      canCreateTickets: "false",
      canUpdateOwnTickets: "false",
      canUpdateAllTickets: "false",
      canCloseTickets: "false",
      canViewAllTickets: "false",
      canApproveChanges: "false",
      canManageKnowledgebase: "false",
      canManageServiceCatalog: "false",
      canRunReports: "false",
      canManageUsers: "false",
      canManageRoles: "false",
      canManageCMDB: "false",
      canViewCMDB: "false",
      isTenantScoped: "false",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/roles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Role created successfully",
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      return await apiRequest("PATCH", `/api/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setEditingRole(null);
      form.reset();
      toast({
        title: "Success",
        description: "Role updated successfully",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
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

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.reset({
      name: role.name,
      description: role.description || "",
      canCreateTickets: role.canCreateTickets,
      canUpdateOwnTickets: role.canUpdateOwnTickets,
      canUpdateAllTickets: role.canUpdateAllTickets,
      canCloseTickets: role.canCloseTickets,
      canViewAllTickets: role.canViewAllTickets,
      canApproveChanges: role.canApproveChanges,
      canManageKnowledgebase: role.canManageKnowledgebase,
      canManageServiceCatalog: role.canManageServiceCatalog,
      canRunReports: role.canRunReports,
      canManageUsers: role.canManageUsers,
      canManageRoles: role.canManageRoles,
      canManageCMDB: role.canManageCMDB,
      canViewCMDB: role.canViewCMDB,
      isTenantScoped: role.isTenantScoped,
    });
  };

  const onSubmit = (data: FormData) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getPermissionCount = (role: Role) => {
    return Object.entries(role).filter(
      ([key, value]) => 
        key.startsWith('can') && 
        !key.includes('isTenant') && 
        value === 'true'
    ).length;
  };

  return (
    <div className="p-8">
      <Link href="/admin">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-semibold" data-testid="page-title">Roles & Permissions</h1>
          </div>
          <p className="text-muted-foreground">
            Manage user roles and their permissions. The legacy admin, support, and user roles are always available.
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingRole(null);
            form.reset();
            setIsCreateDialogOpen(true);
          }}
          data-testid="button-create-role"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Role
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading roles...</p>
          </CardContent>
        </Card>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No custom roles created yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-role">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Role
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Custom Roles</CardTitle>
            <CardDescription>
              Manage custom roles with specific permissions. Users with these roles will have access based on their assigned permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Tenant Scoped</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {role.description || "No description"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getPermissionCount(role)} permissions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.isTenantScoped === 'true' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                          data-testid={`button-edit-${role.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
                              deleteMutation.mutate(role.id);
                            }
                          }}
                          data-testid={`button-delete-${role.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Legacy Roles Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Default Legacy Roles</CardTitle>
          <CardDescription>
            These roles are built-in and cannot be modified. Users can be assigned these roles directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="default">Admin</Badge>
                <span className="font-semibold">System Administrator</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Full system access with all permissions enabled. Can manage all aspects of the system.
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border rounded-md p-4">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="default">Support</Badge>
                <span className="font-semibold">Support Agent</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Can manage incidents, changes, and CMDB. Typical role for IT support staff.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Create Incidents</Badge>
                <Badge variant="secondary" className="text-xs">Update All Incidents</Badge>
                <Badge variant="secondary" className="text-xs">Close Incidents</Badge>
                <Badge variant="secondary" className="text-xs">View All Incidents</Badge>
                <Badge variant="secondary" className="text-xs">Manage CMDB</Badge>
                <Badge variant="secondary" className="text-xs">View CMDB</Badge>
              </div>
            </div>

            <div className="border rounded-md p-4">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="default">User</Badge>
                <span className="font-semibold">End User</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Basic access for end users. Can create and update their own incidents.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Create Incidents</Badge>
                <Badge variant="secondary" className="text-xs">Update Own Incidents</Badge>
                <Badge variant="secondary" className="text-xs">View CMDB</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || editingRole !== null} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingRole(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-role-form">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Custom Role"}
            </DialogTitle>
            <DialogDescription>
              Define a custom role with specific permissions for your organization
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., IT Manager, Team Lead" {...field} data-testid="input-role-name" />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose of this role..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-role-description"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="font-semibold">Permissions</h3>
                <div className="space-y-3">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={key as any}
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between border rounded-md p-3">
                          <div className="flex-1">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {label}
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === 'true'}
                              onCheckedChange={(checked) => field.onChange(checked ? 'true' : 'false')}
                              data-testid={`switch-${key}`}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingRole(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingRole
                    ? "Update Role"
                    : "Create Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
