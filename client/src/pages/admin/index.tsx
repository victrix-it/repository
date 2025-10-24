import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, ListChecks, Settings, Palette, Webhook, Network, FileSpreadsheet, UserPlus, Building2, Clock, Key, Box, ToggleLeft } from "lucide-react";

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
        <Link href="/admin/users">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-users">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage system users</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage all system users, roles, and authentication methods
              </p>
            </CardContent>
          </Card>
        </Link>

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

        <Link href="/admin/customers">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-customers">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>Multi-customer support</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage customers for MSP multi-tenancy and customer data isolation
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

        <Link href="/admin/sla-templates">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-sla-templates">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>SLA Templates</CardTitle>
                  <CardDescription>Service level agreements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define SLA templates with response and resolution time targets for different priorities
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/license">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-license">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Key className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>License Management</CardTitle>
                  <CardDescription>System licensing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage system license keys, expiration dates, and user limits
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/ci-types">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-ci-types">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Box className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>CI Types</CardTitle>
                  <CardDescription>Configuration item types</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define custom configuration item types for your organization
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/modules">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-modules">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <ToggleLeft className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Module Management</CardTitle>
                  <CardDescription>Enable/disable features</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Control which modules are available in your helpdesk system
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/branding">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-branding">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Customize appearance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure system name, logos, colors, and visual identity
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/auth-settings">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-auth-settings">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Authentication Settings</CardTitle>
                  <CardDescription>Configure login methods</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure local, LDAP, and SAML authentication methods
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/alert-integrations">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-alert-integrations">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Webhook className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Alert Integrations</CardTitle>
                  <CardDescription>Monitoring system webhooks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure webhooks for SolarWinds, Nagios, and other monitoring systems
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/network-discovery">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-network-discovery">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <Network className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Network Discovery</CardTitle>
                  <CardDescription>Automated CMDB population</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Scan networks to automatically discover and import devices into the CMDB
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/csv-import">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-csv-import">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>CSV Import</CardTitle>
                  <CardDescription>Bulk CMDB import</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Import configuration items in bulk from a CSV file
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/user-csv-import">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-user-csv-import">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-primary/10">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>User CSV Import</CardTitle>
                  <CardDescription>Bulk user import</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Import users in bulk from a CSV file with local authentication
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
