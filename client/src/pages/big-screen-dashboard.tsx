import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, CheckCircle2, Calendar, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface DailyStats {
  callsLoggedToday: number;
  incidentsResolvedToday: number;
  changesScheduledToday: number;
  currentTime: string;
}

export default function BigScreenDashboard() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery<DailyStats>({
    queryKey: ['/api/dashboard/big-screen'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <p className="text-4xl text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background p-8 overflow-hidden">
      <div className="h-full flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-2">Victrix Servicedesk</h1>
          <p className="text-3xl text-muted-foreground">Daily Operations Dashboard</p>
        </div>

        {/* Main Stats Grid */}
        <div className="flex-1 grid grid-cols-3 gap-8">
          {/* Calls Logged Today */}
          <Card className="flex flex-col justify-center items-center p-12 hover-elevate" data-testid="card-calls-logged">
            <CardHeader className="text-center pb-6">
              <div className="mb-6 flex justify-center">
                <Phone className="h-24 w-24 text-primary" />
              </div>
              <CardTitle className="text-4xl font-medium">Calls Logged Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-9xl font-bold text-primary" data-testid="text-calls-logged">
                {stats?.callsLoggedToday || 0}
              </div>
            </CardContent>
          </Card>

          {/* Incidents Resolved Today */}
          <Card className="flex flex-col justify-center items-center p-12 hover-elevate" data-testid="card-incidents-resolved">
            <CardHeader className="text-center pb-6">
              <div className="mb-6 flex justify-center">
                <CheckCircle2 className="h-24 w-24 text-green-600" />
              </div>
              <CardTitle className="text-4xl font-medium">Incidents Resolved Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-9xl font-bold text-green-600" data-testid="text-incidents-resolved">
                {stats?.incidentsResolvedToday || 0}
              </div>
            </CardContent>
          </Card>

          {/* Changes Scheduled Today */}
          <Card className="flex flex-col justify-center items-center p-12 hover-elevate" data-testid="card-changes-scheduled">
            <CardHeader className="text-center pb-6">
              <div className="mb-6 flex justify-center">
                <Calendar className="h-24 w-24 text-blue-600" />
              </div>
              <CardTitle className="text-4xl font-medium">Changes Scheduled Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-9xl font-bold text-blue-600" data-testid="text-changes-scheduled">
                {stats?.changesScheduledToday || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer with Current Time */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-2xl text-muted-foreground">
            <Clock className="h-8 w-8" />
            <span data-testid="text-current-time">
              {stats?.currentTime || new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
