import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface RecurringPattern {
  patternType: string;
  patternKey: string;
  count: number;
  tickets: any[];
  suggestedTitle: string;
  suggestedDescription: string;
}

export function RecurringIncidentsDetector() {
  const { toast } = useToast();
  
  const { data: patterns, isLoading } = useQuery<RecurringPattern[]>({
    queryKey: ["/api/problems/detect-recurring"],
  });

  const createProblemMutation = useMutation({
    mutationFn: async (pattern: RecurringPattern) => {
      return await apiRequest("POST", "/api/problems", {
        title: pattern.suggestedTitle,
        description: pattern.suggestedDescription,
        priority: "high",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/problems/detect-recurring"] });
      toast({
        title: "Success",
        description: "Problem created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (!patterns || patterns.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-500/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Recurring Incidents Detected</CardTitle>
        </div>
        <CardDescription>
          We've identified patterns that may indicate underlying problems requiring investigation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {patterns.map((pattern, index) => (
          <div
            key={pattern.patternKey}
            className="p-4 border rounded-md hover-elevate"
            data-testid={`recurring-pattern-${index}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive" data-testid={`pattern-count-${index}`}>
                    {pattern.count} incidents
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {pattern.patternType}
                  </Badge>
                </div>
                <h4 className="font-medium mb-1" data-testid={`pattern-title-${index}`}>
                  {pattern.suggestedTitle}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {pattern.suggestedDescription}
                </p>
                <div className="flex flex-wrap gap-2">
                  {pattern.tickets.slice(0, 3).map((ticket) => (
                    <Badge
                      key={ticket.id}
                      variant="secondary"
                      className="text-xs"
                      data-testid={`ticket-badge-${ticket.ticketNumber}`}
                    >
                      {ticket.ticketNumber}: {ticket.title.substring(0, 30)}
                      {ticket.title.length > 30 ? "..." : ""}
                    </Badge>
                  ))}
                  {pattern.count > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{pattern.count - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => createProblemMutation.mutate(pattern)}
                disabled={createProblemMutation.isPending}
                data-testid={`button-create-problem-${index}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Problem
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
