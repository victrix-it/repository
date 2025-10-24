import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, DollarSign, ShoppingCart, Laptop, Key, HardDrive, HelpCircle, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const categoryIcons = {
  access: Key,
  software: Laptop,
  hardware: HardDrive,
  other: HelpCircle,
};

export default function ServiceCatalog() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: catalogItems = [], isLoading } = useQuery({
    queryKey: ["/api/service-catalog"],
  });

  const filteredItems = catalogItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold" data-testid="text-page-title">
              {t("serviceCatalog.title", "Service Catalog")}
            </h1>
            <p className="text-muted-foreground" data-testid="text-page-description">
              {t("serviceCatalog.description", "Browse and request IT services from the catalog")}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("serviceCatalog.searchPlaceholder", "Search services...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("serviceCatalog.allCategories", "All Categories")}</SelectItem>
                <SelectItem value="access">{t("serviceCatalog.categoryAccess", "Access Requests")}</SelectItem>
                <SelectItem value="software">{t("serviceCatalog.categorySoftware", "Software")}</SelectItem>
                <SelectItem value="hardware">{t("serviceCatalog.categoryHardware", "Hardware")}</SelectItem>
                <SelectItem value="other">{t("serviceCatalog.categoryOther", "Other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="hover-elevate">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : Object.keys(groupedItems).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-results">
                  {t("serviceCatalog.noResults", "No services found matching your criteria")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(groupedItems).map(([category, items]: [string, any]) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons] || HelpCircle;
                return (
                  <div key={category} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">
                        {t(`serviceCatalog.category${category.charAt(0).toUpperCase() + category.slice(1)}`, category)}
                      </h2>
                      <Badge variant="secondary" className="ml-2" data-testid={`badge-count-${category}`}>
                        {items.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item: any) => (
                        <Card key={item.id} className="hover-elevate active-elevate-2" data-testid={`card-service-${item.id}`}>
                          <CardHeader className="space-y-0 pb-3">
                            <CardTitle className="text-lg flex items-start justify-between gap-2">
                              <span data-testid={`text-service-name-${item.id}`}>{item.name}</span>
                              {item.requiresApproval === 'true' && (
                                <Badge variant="outline" className="text-xs" data-testid={`badge-approval-${item.id}`}>
                                  {t("serviceCatalog.requiresApproval", "Approval")}
                                </Badge>
                              )}
                            </CardTitle>
                            {item.description && (
                              <CardDescription className="line-clamp-2" data-testid={`text-service-desc-${item.id}`}>
                                {item.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span data-testid={`text-time-${item.id}`}>
                                  {item.estimatedCompletionMinutes 
                                    ? `${item.estimatedCompletionMinutes} ${t("serviceCatalog.minutes", "min")}`
                                    : t("serviceCatalog.timeVaries", "Varies")}
                                </span>
                              </div>
                              {item.cost && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <DollarSign className="w-4 h-4" />
                                  <span data-testid={`text-cost-${item.id}`}>{item.cost}</span>
                                </div>
                              )}
                            </div>
                            <Link href={`/service-catalog/request/${item.id}`}>
                              <Button className="w-full" data-testid={`button-request-${item.id}`}>
                                {t("serviceCatalog.requestService", "Request Service")}
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
