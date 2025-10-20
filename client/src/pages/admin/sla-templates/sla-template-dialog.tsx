import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SlaTemplate } from "@shared/schema";

const slaTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  
  // Incident SLAs
  incidentP1Response: z.number().min(1),
  incidentP1Resolution: z.number().min(1),
  incidentP2Response: z.number().min(1),
  incidentP2Resolution: z.number().min(1),
  incidentP3Response: z.number().min(1),
  incidentP3Resolution: z.number().min(1),
  incidentP4Response: z.number().min(1),
  incidentP4Resolution: z.number().min(1),
  incidentP5Response: z.number().min(1),
  incidentP5Resolution: z.number().min(1),
  
  // Change SLAs
  changeP1Approval: z.number().min(1),
  changeP1Implementation: z.number().min(1),
  changeP2Approval: z.number().min(1),
  changeP2Implementation: z.number().min(1),
  changeP3Approval: z.number().min(1),
  changeP3Implementation: z.number().min(1),
  changeP4Approval: z.number().min(1),
  changeP4Implementation: z.number().min(1),
  
  // Problem SLAs
  problemP1Response: z.number().min(1),
  problemP1RcaTarget: z.number().min(1),
  problemP1Resolution: z.number().min(1),
  problemP2Response: z.number().min(1),
  problemP2RcaTarget: z.number().min(1),
  problemP2Resolution: z.number().min(1),
  problemP3Response: z.number().min(1),
  problemP3RcaTarget: z.number().min(1),
  problemP3Resolution: z.number().min(1),
  problemP4Response: z.number().min(1),
  problemP4RcaTarget: z.number().min(1),
  problemP4Resolution: z.number().min(1),
});

type SlaTemplateFormData = z.infer<typeof slaTemplateSchema>;

interface SlaTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: SlaTemplate | null;
}

export function SlaTemplateDialog({ open, onOpenChange, template }: SlaTemplateDialogProps) {
  const { toast } = useToast();
  const isEditing = !!template;

  const form = useForm<SlaTemplateFormData>({
    resolver: zodResolver(slaTemplateSchema),
    defaultValues: template ? {
      name: template.name,
      description: template.description || "",
      incidentP1Response: template.incidentP1Response,
      incidentP1Resolution: template.incidentP1Resolution,
      incidentP2Response: template.incidentP2Response,
      incidentP2Resolution: template.incidentP2Resolution,
      incidentP3Response: template.incidentP3Response,
      incidentP3Resolution: template.incidentP3Resolution,
      incidentP4Response: template.incidentP4Response,
      incidentP4Resolution: template.incidentP4Resolution,
      incidentP5Response: template.incidentP5Response,
      incidentP5Resolution: template.incidentP5Resolution,
      changeP1Approval: template.changeP1Approval,
      changeP1Implementation: template.changeP1Implementation,
      changeP2Approval: template.changeP2Approval,
      changeP2Implementation: template.changeP2Implementation,
      changeP3Approval: template.changeP3Approval,
      changeP3Implementation: template.changeP3Implementation,
      changeP4Approval: template.changeP4Approval,
      changeP4Implementation: template.changeP4Implementation,
      problemP1Response: template.problemP1Response,
      problemP1RcaTarget: template.problemP1RcaTarget,
      problemP1Resolution: template.problemP1Resolution,
      problemP2Response: template.problemP2Response,
      problemP2RcaTarget: template.problemP2RcaTarget,
      problemP2Resolution: template.problemP2Resolution,
      problemP3Response: template.problemP3Response,
      problemP3RcaTarget: template.problemP3RcaTarget,
      problemP3Resolution: template.problemP3Resolution,
      problemP4Response: template.problemP4Response,
      problemP4RcaTarget: template.problemP4RcaTarget,
      problemP4Resolution: template.problemP4Resolution,
    } : {
      name: "",
      description: "",
      incidentP1Response: 15,
      incidentP1Resolution: 240,
      incidentP2Response: 30,
      incidentP2Resolution: 480,
      incidentP3Response: 60,
      incidentP3Resolution: 1440,
      incidentP4Response: 240,
      incidentP4Resolution: 4320,
      incidentP5Response: 1440,
      incidentP5Resolution: 99999,
      changeP1Approval: 30,
      changeP1Implementation: 60,
      changeP2Approval: 1440,
      changeP2Implementation: 2880,
      changeP3Approval: 2880,
      changeP3Implementation: 7200,
      changeP4Approval: 7200,
      changeP4Implementation: 99999,
      problemP1Response: 30,
      problemP1RcaTarget: 2880,
      problemP1Resolution: 7200,
      problemP2Response: 60,
      problemP2RcaTarget: 7200,
      problemP2Resolution: 14400,
      problemP3Response: 240,
      problemP3RcaTarget: 14400,
      problemP3Resolution: 28800,
      problemP4Response: 1440,
      problemP4RcaTarget: 28800,
      problemP4Resolution: 99999,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SlaTemplateFormData) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/sla-templates/${template.id}`, data);
      } else {
        return await apiRequest("POST", "/api/sla-templates", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sla-templates"] });
      toast({
        title: "Success",
        description: `SLA template ${isEditing ? 'updated' : 'created'} successfully`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SlaTemplateFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Create'} SLA Template</DialogTitle>
          <DialogDescription>
            Define service level targets for incidents, changes, and problems. Times are in minutes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Premium SLA" data-testid="input-template-name" />
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
                      <Textarea {...field} placeholder="Optional description" data-testid="input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Tabs defaultValue="incidents" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="incidents">Incidents</TabsTrigger>
                <TabsTrigger value="changes">Changes</TabsTrigger>
                <TabsTrigger value="problems">Problems</TabsTrigger>
              </TabsList>

              <TabsContent value="incidents" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Response / Resolution times in minutes</p>
                {['P1', 'P2', 'P3', 'P4', 'P5'].map((priority) => (
                  <div key={priority} className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`incident${priority}Response` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{priority} Response Time (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid={`input-incident-${priority.toLowerCase()}-response`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`incident${priority}Resolution` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{priority} Resolution Time (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid={`input-incident-${priority.toLowerCase()}-resolution`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="changes" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Approval / Implementation times in minutes</p>
                {['P1', 'P2', 'P3', 'P4'].map((priority) => (
                  <div key={priority} className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`change${priority}Approval` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{priority} Approval Time (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid={`input-change-${priority.toLowerCase()}-approval`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`change${priority}Implementation` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{priority} Implementation Time (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid={`input-change-${priority.toLowerCase()}-implementation`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="problems" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Response / RCA / Resolution times in minutes</p>
                {['P1', 'P2', 'P3', 'P4'].map((priority) => (
                  <div key={priority} className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`problem${priority}Response` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{priority} Response (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid={`input-problem-${priority.toLowerCase()}-response`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`problem${priority}RcaTarget` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{priority} RCA (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid={`input-problem-${priority.toLowerCase()}-rca`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`problem${priority}Resolution` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{priority} Resolution (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid={`input-problem-${priority.toLowerCase()}-resolution`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-template">
                {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
