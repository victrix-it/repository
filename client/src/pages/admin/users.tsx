import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  authProvider: string;
  profileImageUrl?: string;
}

export default function UsersPage() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'support':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getAuthProviderLabel = (provider: string) => {
    switch (provider) {
      case 'local':
        return 'Local';
      case 'ldap':
        return 'LDAP';
      case 'saml':
        return 'SAML';
      case 'oidc':
        return 'OIDC';
      default:
        return provider;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Link href="/admin/user-csv-import">
          <Button data-testid="button-create-user">
            <UserPlus className="h-4 w-4 mr-2" />
            Import Users
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {users?.map((user) => (
          <Card key={user.id} data-testid={`card-user-${user.id}`}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <CardDescription data-testid={`text-email-${user.id}`}>
                    {user.email}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getRoleBadgeVariant(user.role)} data-testid={`badge-role-${user.id}`}>
                    {user.role}
                  </Badge>
                  <Badge variant="outline" data-testid={`badge-auth-${user.id}`}>
                    {getAuthProviderLabel(user.authProvider)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {users && users.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
