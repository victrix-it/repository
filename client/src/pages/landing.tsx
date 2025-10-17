import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, GitBranch, Server, BookOpen, Mail, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-semibold text-foreground mb-4">
            Enterprise Helpdesk Solution
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Comprehensive IT service management with ticket tracking, change management, CMDB, and knowledge base.
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            Login to Continue
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <Ticket className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Ticket Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track and resolve support tickets with priority levels, assignment, and status tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <GitBranch className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Change Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Submit and approve change requests with workflow tracking and approval processes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Server className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">CMDB</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track IT assets and configuration items with relationships to tickets and changes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Store and search SOPs and known issues with fixes for quick resolution.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Email Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create tickets directly from email messages with automatic parsing.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor ticket statistics, workload, and affected CIs in real-time.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
