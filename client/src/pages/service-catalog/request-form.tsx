import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceRequestSchema } from "@shared/schema";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Clock, DollarSign, AlertCircle } from "lucide-react";
import { Link } from "wouter";

const formSchema = insertServiceRequestSchema.extend({
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export default function ServiceRequestForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/service-catalog/request/:id");
  const catalogItemId = params?.id;

  const { data: catalogItem, isLoading } = useQuery({
    queryKey: ["/api/service-catalog", catalogItemId],
    enabled: !!catalogItemId,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceCatalogItemId: catalogItemId || "",
      priority: "medium" as const,
      formData: {},
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/service-requests", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: t("serviceCatalog.requestSubmitted", "Request Submitted"),
        description: t("serviceCatalog.requestSubmittedDesc", "Your service request has been submitted successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      navigate("/service-catalog/requests");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message || t("serviceCatalog.requestError", "Failed to submit request"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      serviceCatalogItemId: catalogItemId,
    });
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6 max-w-3xl">
          <Card>
            <CardHeader>
              <div className="h-8 bg-muted rounded animate-pulse w-1/2" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!catalogItem) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6 max-w-3xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-muted-foreground" data-testid="text-not-found">
                {t("serviceCatalog.itemNotFound", "Service not found")}
              </p>
              <Link href="/service-catalog">
                <Button variant="outline" className="mt-4" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("common.back", "Back to Catalog")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formFields = catalogItem.formFields ? (Array.isArray(catalogItem.formFields) ? catalogItem.formFields : []) : [];

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Link href="/service-catalog">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold" data-testid="text-page-title">
                {t("serviceCatalog.requestTitle", "Request Service")}
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-description">
                {catalogItem.name}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle data-testid="text-service-name">{catalogItem.name}</CardTitle>
              <CardDescription data-testid="text-service-desc">{catalogItem.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4 text-sm">
                {catalogItem.estimatedCompletionMinutes && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span data-testid="text-estimated-time">
                      {catalogItem.estimatedCompletionMinutes} {t("serviceCatalog.minutes", "minutes")}
                    </span>
                  </div>
                )}
                {catalogItem.cost && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span data-testid="text-cost">{catalogItem.cost}</span>
                  </div>
                )}
                {catalogItem.requiresApproval === 'true' && (
                  <Badge variant="outline" data-testid="badge-requires-approval">
                    {t("serviceCatalog.requiresApproval", "Requires Approval")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("serviceCatalog.requestDetails", "Request Details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.priority", "Priority")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">{t("priority.low", "Low")}</SelectItem>
                            <SelectItem value="medium">{t("priority.medium", "Medium")}</SelectItem>
                            <SelectItem value="high">{t("priority.high", "High")}</SelectItem>
                            <SelectItem value="urgent">{t("priority.urgent", "Urgent")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {formFields.map((field: any, index: number) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`formData.${field.name}`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </FormLabel>
                          <FormControl>
                            {field.type === "textarea" ? (
                              <Textarea
                                {...formField}
                                placeholder={field.placeholder || ""}
                                data-testid={`input-${field.name}`}
                              />
                            ) : field.type === "select" ? (
                              <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                <SelectTrigger data-testid={`select-${field.name}`}>
                                  <SelectValue placeholder={field.placeholder || ""} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option: string, i: number) => (
                                    <SelectItem key={i} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                {...formField}
                                type={field.type || "text"}
                                placeholder={field.placeholder || ""}
                                data-testid={`input-${field.name}`}
                              />
                            )}
                          </FormControl>
                          {field.description && (
                            <p className="text-sm text-muted-foreground">{field.description}</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  <div className="flex gap-3 justify-end">
                    <Link href="/service-catalog">
                      <Button type="button" variant="outline" data-testid="button-cancel">
                        {t("common.cancel", "Cancel")}
                      </Button>
                    </Link>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                      {createMutation.isPending
                        ? t("common.submitting", "Submitting...")
                        : t("serviceCatalog.submitRequest", "Submit Request")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
