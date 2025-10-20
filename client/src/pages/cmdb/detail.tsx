import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Server, Database, Network, HardDrive, Box, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/usePermissions";
import type { ConfigurationItem, User, Customer, Team } from "@shared/schema";

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
  customer?: Customer | null;
  ownerTeam?: Team | null;
}

export default function CIDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    type: "",
    status: "",
    description: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    ipAddress: "",
    subnetMask: "",
    ownerId: "",
    customerId: "",
    ownerTeamId: "",
    supportDetails: "",
  });

  const { data: ci, isLoading } = useQuery<CIWithRelations>({
    queryKey: ["/api/configuration-items", id],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  const { data: relatedTickets } = useQuery<any[]>({
    queryKey: ["/api/configuration-items", id, "tickets"],
    enabled: !!id,
  });

  const { data: relatedChanges } = useQuery<any[]>({
    queryKey: ["/api/configuration-items", id, "changes"],
    enabled: !!id,
  });

  const { data: relatedProblems } = useQuery<any[]>({
    queryKey: ["/api/configuration-items", id, "problems"],
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PATCH', `/api/configuration-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuration-items", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/configuration-items"] });
      setEditOpen(false);
      toast({
        title: "Success",
        description: "Configuration item updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration item",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    if (!ci) return;
    setEditFormData({
      name: ci.name,
      type: ci.type,
      status: ci.status,
      description: ci.description || "",
      manufacturer: ci.manufacturer || "",
      model: ci.model || "",
      serialNumber: ci.serialNumber || "",
      ipAddress: ci.ipAddress || "",
      subnetMask: ci.subnetMask || "",
      ownerId: ci.ownerId || "",
      customerId: ci.customerId || "",
      ownerTeamId: ci.ownerTeamId || "",
      supportDetails: ci.supportDetails || "",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...editFormData,
      ownerId: editFormData.ownerId || undefined,
      customerId: editFormData.customerId || undefined,
      ownerTeamId: editFormData.ownerTeamId || undefined,
    };
    
    updateMutation.mutate(submitData);
  };

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
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/cmdb">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CMDB
          </Button>
        </Link>
        {hasPermission('canManageCMDB') && (
          <Button onClick={handleEditClick} data-testid="button-edit-ci">
            <Pencil className="h-4 w-4 mr-2" />
            Edit CI
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {ci.ciNumber && (
                <div className="mb-2">
                  <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded" data-testid="ci-number">
                    {ci.ciNumber}
                  </span>
                </div>
              )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Manufacturer</p>
              <p className="text-sm" data-testid="ci-manufacturer">{ci.manufacturer || "Not specified"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Model</p>
              <p className="text-sm" data-testid="ci-model">{ci.model || "Not specified"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Serial Number</p>
              <p className="text-sm font-mono" data-testid="ci-serial-number">{ci.serialNumber || "Not specified"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">IP Address</p>
              <p className="text-sm font-mono" data-testid="ci-ip-address">{ci.ipAddress || "Not specified"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Subnet Mask</p>
              <p className="text-sm font-mono" data-testid="ci-subnet-mask">{ci.subnetMask || "Not specified"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Discovery Method</p>
              <p className="text-sm capitalize" data-testid="ci-discovered-via">{ci.discoveredVia || "Manual"}</p>
            </div>

            {ci.lastDiscovered && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Discovered</p>
                <p className="text-sm" data-testid="ci-last-discovered">
                  {formatDistanceToNow(new Date(ci.lastDiscovered), { addSuffix: true })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ownership & Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Customer</p>
              {ci.customer ? (
                <>
                  <p className="text-sm font-medium" data-testid="ci-customer">{ci.customer.name}</p>
                  {ci.customer.code && (
                    <p className="text-xs text-muted-foreground">{ci.customer.code}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not assigned</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Owner</p>
              {ci.owner ? (
                <div className="flex items-center gap-2">
                  <UserAvatar user={ci.owner} size="sm" />
                  <span className="text-sm">
                    {ci.owner.firstName} {ci.owner.lastName}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not assigned</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Owner Team</p>
              <p className="text-sm" data-testid="ci-owner-team">
                {ci.ownerTeam?.name || "Not assigned"}
              </p>
            </div>

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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Support Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap" data-testid="ci-support-details">
              {ci.supportDetails || "No support details provided"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedTickets && relatedTickets.length > 0 ? (
              <div className="space-y-2">
                {relatedTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                    <div className="p-3 border rounded hover-elevate active-elevate-2 cursor-pointer" data-testid={`ticket-${ticket.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ticket.ticketNumber}</p>
                          <p className="text-sm text-muted-foreground truncate">{ticket.title}</p>
                        </div>
                        <StatusBadge status={ticket.status} type="ticket" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No related tickets</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Changes</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedChanges && relatedChanges.length > 0 ? (
              <div className="space-y-2">
                {relatedChanges.map((change) => (
                  <Link key={change.id} href={`/changes/${change.id}`}>
                    <div className="p-3 border rounded hover-elevate active-elevate-2 cursor-pointer" data-testid={`change-${change.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{change.changeNumber}</p>
                          <p className="text-sm text-muted-foreground truncate">{change.title}</p>
                        </div>
                        <StatusBadge status={change.status} type="change" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No related changes</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Problems</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedProblems && relatedProblems.length > 0 ? (
              <div className="space-y-2">
                {relatedProblems.map((problem) => (
                  <Link key={problem.id} href={`/problems/${problem.id}`}>
                    <div className="p-3 border rounded hover-elevate active-elevate-2 cursor-pointer" data-testid={`problem-${problem.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{problem.problemNumber}</p>
                          <p className="text-sm text-muted-foreground truncate">{problem.title}</p>
                        </div>
                        <StatusBadge status={problem.status} type="problem" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No related problems</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Configuration Item</DialogTitle>
              <DialogDescription>
                Update configuration item details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    data-testid="input-edit-name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Type *</Label>
                  <Select value={editFormData.type} onValueChange={(value) => setEditFormData({ ...editFormData, type: value })}>
                    <SelectTrigger data-testid="select-edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="application">Application</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  data-testid="input-edit-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                  <Input
                    id="edit-manufacturer"
                    value={editFormData.manufacturer}
                    onChange={(e) => setEditFormData({ ...editFormData, manufacturer: e.target.value })}
                    data-testid="input-edit-manufacturer"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-model">Model</Label>
                  <Input
                    id="edit-model"
                    value={editFormData.model}
                    onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                    data-testid="input-edit-model"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-serialNumber">Serial Number</Label>
                <Input
                  id="edit-serialNumber"
                  value={editFormData.serialNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, serialNumber: e.target.value })}
                  data-testid="input-edit-serial-number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-ipAddress">IP Address</Label>
                  <Input
                    id="edit-ipAddress"
                    value={editFormData.ipAddress}
                    onChange={(e) => setEditFormData({ ...editFormData, ipAddress: e.target.value })}
                    data-testid="input-edit-ip-address"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-subnetMask">Subnet Mask</Label>
                  <Input
                    id="edit-subnetMask"
                    value={editFormData.subnetMask}
                    onChange={(e) => setEditFormData({ ...editFormData, subnetMask: e.target.value })}
                    data-testid="input-edit-subnet-mask"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-customer">Customer</Label>
                <Select 
                  value={editFormData.customerId || "none"} 
                  onValueChange={(value) => setEditFormData({ 
                    ...editFormData, 
                    customerId: value === "none" ? "" : value,
                    ownerId: "" 
                  })}
                >
                  <SelectTrigger data-testid="select-edit-customer">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-owner">Owner</Label>
                <Select 
                  value={editFormData.ownerId || "none"} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, ownerId: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-edit-owner">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users
                      ?.filter(user => !editFormData.customerId || user.customerId === editFormData.customerId)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-ownerTeam">Owner Team</Label>
                <Select 
                  value={editFormData.ownerTeamId || "none"} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, ownerTeamId: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-edit-owner-team">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-supportDetails">Support Details</Label>
                <Textarea
                  id="edit-supportDetails"
                  value={editFormData.supportDetails}
                  onChange={(e) => setEditFormData({ ...editFormData, supportDetails: e.target.value })}
                  placeholder="Support contract details, vendor contacts, warranty information..."
                  data-testid="input-edit-support-details"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update-ci">
                {updateMutation.isPending ? "Updating..." : "Update CI"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
