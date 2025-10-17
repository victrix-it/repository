import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { EmailMessage } from "@shared/schema";

export default function EmailsPage() {
  const { toast } = useToast();

  const { data: emails, isLoading } = useQuery<EmailMessage[]>({
    queryKey: ["/api/emails"],
  });

  const convertToTicketMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return await apiRequest("POST", `/api/emails/${emailId}/convert`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Email converted to ticket successfully",
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
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const unconvertedEmails = emails?.filter(email => !email.ticketId);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2" data-testid="page-title">Email Inbox</h1>
        <p className="text-muted-foreground">
          Convert incoming emails to support tickets
        </p>
      </div>

      <div className="space-y-3">
        {unconvertedEmails && unconvertedEmails.length > 0 ? (
          unconvertedEmails.map((email) => (
            <Card key={email.id} className="p-4" data-testid={`email-${email.id}`}>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-md bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" data-testid={`email-from-${email.id}`}>
                      {email.fromAddress}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="font-medium mb-2 truncate" data-testid={`email-subject-${email.id}`}>
                    {email.subject}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {email.body}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => convertToTicketMutation.mutate(email.id)}
                  disabled={convertToTicketMutation.isPending}
                  data-testid={`button-convert-${email.id}`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Convert to Ticket
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No unconverted emails in your inbox
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
