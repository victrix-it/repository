import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { ConfigurationItem } from "@shared/schema";

const changeFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  changeType: z.enum(["normal", "emergency", "retrospective"]).default("normal"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  reason: z.string().optional(),
  prerequisites: z.string().optional(),
  communicationPlan: z.string().optional(),
  testPlan: z.string().optional(),
  implementorDetails: z.string().optional(),
  rollbackPlan: z.string().optional(),
  impactAssessment: z.string().optional(),
  linkedCiId: z.string().optional(),
  scheduledDate: z.string().optional(),
});

type ChangeFormData = z.infer<typeof changeFormSchema>;

export default function NewChangePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: cis } = useQuery<ConfigurationItem[]>({
    queryKey: ["/api/configuration-items"],
  });

  const form = useForm<ChangeFormData>({
    resolver: zodResolver(changeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      changeType: "normal",
      priority: "medium",
      reason: "",
      prerequisites: "",
      communicationPlan: "",
      testPlan: "",
      implementorDetails: "",
      rollbackPlan: "",
      impactAssessment: "",
      linkedCiId: "",
      scheduledDate: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChangeFormData) => {
      const payload = {
        ...data,
        reason: data.reason || null,
        prerequisites: data.prerequisites || null,
        communicationPlan: data.communicationPlan || null,
        testPlan: data.testPlan || null,
        implementorDetails: data.implementorDetails || null,
        rollbackPlan: data.rollbackPlan || null,
        impactAssessment: data.impactAssessment || null,
        linkedCiId: data.linkedCiId || null,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : null,
      };
      return await apiRequest("POST", "/api/changes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Change request created successfully",
      });
      setLocation("/changes");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8">
      <Link href="/changes">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Changes
        </Button>
      </Link>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">Create Change Request</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the change" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed information about the change"
                        className="min-h-32"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="changeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Change Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-change-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="retrospective">Retrospective</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Change</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Why is this change necessary?"
                        className="min-h-24"
                        {...field}
                        data-testid="input-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impactAssessment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impact Assessment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Service downtime, affected systems, user impact, etc."
                        className="min-h-24"
                        {...field}
                        data-testid="input-impact-assessment"
                      />
                    </FormControl>
                    <FormDescription>
                      Describe the impact on services, downtime, and affected systems
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prerequisites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prerequisites</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Steps or conditions required before implementing this change"
                        className="min-h-24"
                        {...field}
                        data-testid="input-prerequisites"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="testPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Plan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="How will this change be tested?"
                        className="min-h-24"
                        {...field}
                        data-testid="input-test-plan"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="implementorDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Implementor Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Person performing the change and contact information"
                        {...field}
                        data-testid="input-implementor-details"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rollbackPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rollback Plan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Steps to revert this change if something goes wrong"
                        className="min-h-24"
                        {...field}
                        data-testid="input-rollback-plan"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="communicationPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Plan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Who needs to be notified and when?"
                        className="min-h-24"
                        {...field}
                        data-testid="input-communication-plan"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="linkedCiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Linked Configuration Item</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-ci">
                            <SelectValue placeholder="No CI" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cis?.map((ci) => (
                            <SelectItem key={ci.id} value={ci.id}>
                              {ci.name} ({ci.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-scheduled-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                  {createMutation.isPending ? "Creating..." : "Create Change Request"}
                </Button>
                <Link href="/changes">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
