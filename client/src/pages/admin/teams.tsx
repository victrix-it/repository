import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamSchema, type InsertTeam } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Team = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TeamMember = {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  createdAt: Date;
};

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
};

export default function TeamsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/teams', selectedTeam?.id, 'members'],
    enabled: !!selectedTeam,
  });

  const createForm = useForm<InsertTeam>({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const editForm = useForm<InsertTeam>({
    resolver: zodResolver(insertTeamSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTeam) => {
      return await apiRequest('POST', '/api/teams', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Team created",
        description: "The team has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTeam> }) => {
      return await apiRequest('PATCH', `/api/teams/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
      toast({
        title: "Team updated",
        description: "The team has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setSelectedTeam(null);
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      return await apiRequest('POST', `/api/teams/${teamId}/members`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', selectedTeam?.id, 'members'] });
      setIsAddMemberDialogOpen(false);
      toast({
        title: "Member added",
        description: "The user has been added to the team",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      return await apiRequest('DELETE', `/api/teams/${teamId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', selectedTeam?.id, 'members'] });
      toast({
        title: "Member removed",
        description: "The user has been removed from the team",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = (data: InsertTeam) => {
    createMutation.mutate(data);
  };

  const handleEditTeam = (data: InsertTeam) => {
    if (selectedTeam) {
      updateMutation.mutate({ id: selectedTeam.id, data });
    }
  };

  const handleDeleteTeam = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleAddMember = (userId: string) => {
    if (selectedTeam) {
      addMemberMutation.mutate({ teamId: selectedTeam.id, userId });
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (selectedTeam) {
      removeMemberMutation.mutate({ teamId: selectedTeam.id, userId });
    }
  };

  const availableUsers = users.filter(
    user => !teamMembers.some(member => member.userId === user.id)
  );

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin')}
            className="mb-2"
            data-testid="button-back-to-admin"
          >
            ← Back to Admin
          </Button>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams and team members
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-team">
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-team">
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
              <DialogDescription>
                Add a new team to organize your support staff
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateTeam)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Infrastructure Team" {...field} data-testid="input-team-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Responsible for server and network infrastructure"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-team-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create-team">
                    {createMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading teams...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold">All Teams ({teams.length})</h2>
            {teams.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No teams yet. Create your first team to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <Card
                    key={team.id}
                    className={`cursor-pointer hover-elevate active-elevate-2 ${
                      selectedTeam?.id === team.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedTeam(team)}
                    data-testid={`card-team-${team.id}`}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{team.name}</CardTitle>
                            {team.description && (
                              <CardDescription className="text-xs line-clamp-1">
                                {team.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Team Details */}
          <div className="lg:col-span-2">
            {selectedTeam ? (
              <Card data-testid="card-team-details">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedTeam.name}</CardTitle>
                      <CardDescription>{selectedTeam.description || "No description"}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              editForm.reset({
                                name: selectedTeam.name,
                                description: selectedTeam.description || "",
                              });
                            }}
                            data-testid="button-edit-team"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-edit-team">
                          <DialogHeader>
                            <DialogTitle>Edit Team</DialogTitle>
                            <DialogDescription>
                              Update team information
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(handleEditTeam)} className="space-y-4">
                              <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-edit-team-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={editForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        {...field}
                                        value={field.value || ""}
                                        data-testid="input-edit-team-description"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <DialogFooter>
                                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-team">
                                  {updateMutation.isPending ? "Updating..." : "Update Team"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" data-testid="button-delete-team">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-testid="dialog-delete-team">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Team</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this team? This action cannot be undone.
                              All team members will be removed from the team.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTeam(selectedTeam.id)}
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
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Team Members ({teamMembers.length})</h3>
                    <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" data-testid="button-add-member">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-testid="dialog-add-member">
                        <DialogHeader>
                          <DialogTitle>Add Team Member</DialogTitle>
                          <DialogDescription>
                            Select a user to add to {selectedTeam.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {availableUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              All users are already members of this team
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {availableUsers.map((user) => (
                                <div
                                  key={user.id}
                                  className="flex items-center justify-between p-3 rounded-md border hover-elevate active-elevate-2"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarImage src={user.profileImageUrl || undefined} />
                                      <AvatarFallback>
                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {user.firstName} {user.lastName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddMember(user.id)}
                                    disabled={addMemberMutation.isPending}
                                    data-testid={`button-add-user-${user.id}`}
                                  >
                                    Add
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No members yet. Add users to this team.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-md border"
                          data-testid={`member-row-${member.userId}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {member.firstName?.[0]}{member.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{member.role}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={removeMemberMutation.isPending}
                              data-testid={`button-remove-member-${member.userId}`}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a team to view details and manage members</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
