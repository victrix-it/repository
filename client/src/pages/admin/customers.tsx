import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type InsertCustomer, type Customer, type SlaTemplate } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function CustomersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: slaTemplates = [] } = useQuery<SlaTemplate[]>({
    queryKey: ['/api/sla-templates'],
  });

  const createForm = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      code: undefined,
      description: undefined,
      contactName: undefined,
      contactEmail: undefined,
      contactPhone: undefined,
      isActive: "true",
      slaTemplateId: undefined,
    },
  });

  const editForm = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      return await apiRequest('POST', '/api/customers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Customer created",
        description: "The customer has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCustomer> }) => {
      return await apiRequest('PATCH', `/api/customers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      toast({
        title: "Customer updated",
        description: "The customer has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setSelectedCustomer(null);
      toast({
        title: "Customer deleted",
        description: "The customer has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCustomer = (data: InsertCustomer) => {
    createMutation.mutate(data);
  };

  const handleEditCustomer = (data: InsertCustomer) => {
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data });
    }
  };

  const handleDeleteCustomer = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin')}
            className="mb-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Customers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customers for multi-customer support
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-customer">
              <Plus className="h-4 w-4 mr-2" />
              New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to the system
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateCustomer)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Acme Corporation" data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="ACME" data-testid="input-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Customer description" data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="John Doe" data-testid="input-contact-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="email" placeholder="john@acme.com" data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="+1 555-0100" data-testid="input-contact-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="slaTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SLA Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-sla-template">
                            <SelectValue placeholder="Select an SLA template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {slaTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                              {template.isDefault === 'true' && ' (Default)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending ? "Creating..." : "Create Customer"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p>Loading customers...</p>
        ) : customers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No customers yet. Create your first customer to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id} data-testid={`customer-card-${customer.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1">{customer.name}</CardTitle>
                    {customer.code && (
                      <Badge variant="secondary" className="text-xs">
                        {customer.code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isEditDialogOpen && selectedCustomer?.id === customer.id} onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (!open) setSelectedCustomer(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            editForm.reset({
                              name: customer.name,
                              code: customer.code || undefined,
                              description: customer.description || undefined,
                              contactName: customer.contactName || undefined,
                              contactEmail: customer.contactEmail || undefined,
                              contactPhone: customer.contactPhone || undefined,
                              isActive: customer.isActive,
                              slaTemplateId: customer.slaTemplateId || undefined,
                            });
                          }}
                          data-testid={`button-edit-${customer.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Customer</DialogTitle>
                          <DialogDescription>
                            Update customer information
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...editForm}>
                          <form onSubmit={editForm.handleSubmit(handleEditCustomer)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Customer Name *</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-edit-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name="code"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Code</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ""} data-testid="input-edit-code" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={editForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} value={field.value || ""} data-testid="input-edit-description" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                control={editForm.control}
                                name="contactName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ""} data-testid="input-edit-contact-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name="contactEmail"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Email</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ""} type="email" data-testid="input-edit-contact-email" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name="contactPhone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Phone</FormLabel>
                                    <FormControl>
                                      <Input {...field} value={field.value || ""} data-testid="input-edit-contact-phone" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={editForm.control}
                              name="slaTemplateId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>SLA Template</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-edit-sla-template">
                                        <SelectValue placeholder="Select an SLA template" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {slaTemplates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                          {template.name}
                                          {template.isDefault === 'true' && ' (Default)'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update">
                                {updateMutation.isPending ? "Updating..." : "Update Customer"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-delete-${customer.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{customer.name}"? This action cannot be undone.
                            Teams and CIs assigned to this customer will need to be reassigned.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-confirm-delete"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.description && (
                  <p className="text-sm text-muted-foreground">{customer.description}</p>
                )}
                {customer.slaTemplateId && (
                  <div className="text-sm">
                    <span className="font-medium">SLA: </span>
                    {slaTemplates.find(t => t.id === customer.slaTemplateId)?.name || 'Unknown'}
                  </div>
                )}
                {customer.contactName && (
                  <div className="text-sm">
                    <span className="font-medium">Contact: </span>
                    {customer.contactName}
                  </div>
                )}
                {customer.contactEmail && (
                  <div className="text-sm text-muted-foreground">
                    {customer.contactEmail}
                  </div>
                )}
                {customer.contactPhone && (
                  <div className="text-sm text-muted-foreground">
                    {customer.contactPhone}
                  </div>
                )}
                <Badge variant={customer.isActive === 'true' ? 'default' : 'secondary'}>
                  {customer.isActive === 'true' ? 'Active' : 'Inactive'}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
