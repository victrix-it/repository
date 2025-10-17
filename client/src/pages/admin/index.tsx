import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, ListChecks, Settings } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2" data-testid="page-title">Administration</h1>
        <p className="text-muted-foreground">
          Manage teams, users, resolution categories, and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/teams">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-teams">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Teams</CardTitle>
                  <CardDescription>Manage support teams</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage teams, add team members, and assign tickets to teams
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-users">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>User management</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage user accounts, roles, and permissions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/resolution-categories">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-resolution-categories">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <ListChecks className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Resolution Categories</CardTitle>
                  <CardDescription>Ticket resolution tracking</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define categories for ticket resolution to track common solutions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/settings">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-settings">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Authentication & configuration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure LDAP integration, email settings, and system preferences
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
