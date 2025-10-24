import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Ticket, GitBranch, Server, BookOpen, Mail, BarChart3, AlertTriangle } from "lucide-react";

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
          
          {/* ISO 27001 Control A.5.16 - Authorization Warning Banner */}
          <Alert className="mb-6 text-left border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" data-testid="alert-authorization-warning">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-900 dark:text-yellow-200">
              <strong className="font-semibold">AUTHORIZED ACCESS ONLY</strong>
              <div className="mt-2 space-y-1">
                <p>• This system is for authorized users only</p>
                <p>• All activity is monitored and recorded</p>
                <p>• Unauthorized access attempts will be logged and may be prosecuted</p>
                <p>• By logging in, you acknowledge that you have read and understand this warning</p>
              </div>
            </AlertDescription>
          </Alert>
          
          <Button
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            I Acknowledge - Login to Continue
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
