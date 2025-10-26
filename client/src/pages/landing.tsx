import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, GitBranch, Server, BookOpen, Mail, BarChart3, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch settings for customizable content
  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ["/api/settings"],
  });

  const settingsMap = (settings || []).reduce((acc: any, setting: any) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/local/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Invalid email or password");
      }

      const data = await response.json();
      
      if (data.user) {
        // Force page reload to ensure authentication state is updated
        // Small delay to ensure cookie is set before reload
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get customizable content or use defaults
  const pageTitle = settingsMap['landing_title'] || 'Victrix Servicedesk Solution';
  const pageSubtitle = settingsMap['landing_subtitle'] || 'Comprehensive IT service management with incident tracking, change management, CMDB, and knowledge base.';
  const warningTitle = settingsMap['landing_warning_title'] || 'AUTHORIZED ACCESS ONLY';
  const logoUrl = settingsMap['logo_url'];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto mb-8 md:mb-16">
          <div className="text-center mb-6 md:mb-8">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-12 md:h-16 mx-auto mb-3 md:mb-4"
                data-testid="img-logo"
              />
            )}
            <h1 className="text-2xl md:text-4xl font-semibold text-foreground mb-3 md:mb-4 px-2" data-testid="text-page-title">
              {pageTitle}
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 px-2" data-testid="text-page-subtitle">
              {pageSubtitle}
            </p>
          </div>
          
          {/* ISO 27001 Control A.5.16 - Authorization Warning Banner */}
          <Alert className="mb-4 md:mb-6 text-left border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" data-testid="alert-authorization-warning">
            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
            <AlertDescription className="text-xs md:text-sm text-yellow-900 dark:text-yellow-200">
              <strong className="font-semibold">{warningTitle}</strong>
              <div className="mt-2 space-y-1">
                <p>• This system is for authorized users only</p>
                <p>• All activity is monitored and recorded</p>
                <p>• Unauthorized access attempts will be logged and may be prosecuted</p>
                <p>• By logging in, you acknowledge that you have read and understand this warning</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Login Form */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle data-testid="text-login-title">Login</CardTitle>
              <CardDescription data-testid="text-login-description">
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Username or Email</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? "Logging in..." : "I Acknowledge - Login to Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
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
