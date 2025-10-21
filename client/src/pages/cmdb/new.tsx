import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { User, Customer, CiType } from "@shared/schema";

type Team = {
  id: string;
  name: string;
  description: string | null;
};

const ciFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  typeId: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "maintenance", "decommissioned"]),
  ipAddress: z.string().optional(),
  subnetMask: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  supportDetails: z.string().optional(),
  ownerId: z.string().optional(),
  ownerTeamId: z.string().optional(),
  customerId: z.string().optional(),
});

type CIFormData = z.infer<typeof ciFormSchema>;

export default function NewCIPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: ciTypes } = useQuery<CiType[]>({
    queryKey: ["/api/ci-types/active"],
  });

  const form = useForm<CIFormData>({
    resolver: zodResolver(ciFormSchema),
    defaultValues: {
      name: "",
      typeId: "",
      description: "",
      status: "active",
      ipAddress: "",
      subnetMask: "",
      serialNumber: "",
      manufacturer: "",
      model: "",
      supportDetails: "",
      ownerId: "",
      ownerTeamId: "",
      customerId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CIFormData) => {
      const payload = {
        ...data,
        ipAddress: data.ipAddress || null,
        subnetMask: data.subnetMask || null,
        serialNumber: data.serialNumber || null,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        supportDetails: data.supportDetails || null,
        ownerId: data.ownerId || null,
        ownerTeamId: data.ownerTeamId || null,
        customerId: data.customerId || null,
      };
      return await apiRequest("POST", "/api/configuration-items", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuration-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Configuration item created successfully",
      });
      setLocation("/cmdb");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8">
      <Link href="/cmdb">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CMDB
        </Button>
      </Link>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Add Configuration Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Production Web Server 1" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="typeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ciTypes?.map((ciType) => (
                            <SelectItem key={ciType.id} value={ciType.id}>
                              {ciType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="decommissioned">Decommissioned</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this configuration item"
                        className="min-h-24"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dell, HP, Cisco" {...field} data-testid="input-manufacturer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., PowerEdge R740" {...field} data-testid="input-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SN123456789" {...field} data-testid="input-serial-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 192.168.1.100" {...field} data-testid="input-ip-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="subnetMask"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subnet Mask (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 255.255.255.0 or /24" {...field} data-testid="input-subnet-mask" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("ownerId", "");
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-customer">
                          <SelectValue placeholder="No customer assigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Details (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="3rd party support contracts, vendor contact details"
                        className="min-h-24"
                        {...field}
                        data-testid="input-support-details"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ownerId"
                  render={({ field }) => {
                    const selectedCustomerId = form.watch("customerId");
                    const filteredUsers = users?.filter(user => 
                      !selectedCustomerId || user.customerId === selectedCustomerId
                    ) || [];
                    
                    return (
                      <FormItem>
                        <FormLabel>Owner User (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-owner">
                              <SelectValue placeholder="No user owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                {selectedCustomerId ? "No users for this customer" : "Select a customer first"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="ownerTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Team (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-owner-team">
                            <SelectValue placeholder="No team owner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams?.map((team) => (
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

              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                  {createMutation.isPending ? "Creating..." : "Create Configuration Item"}
                </Button>
                <Link href="/cmdb">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
