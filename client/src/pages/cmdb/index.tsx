import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Server, Database, Network, HardDrive, Box } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { ConfigurationItem } from "@shared/schema";

const ciTypeIcons = {
  server: Server,
  application: Box,
  database: Database,
  network: Network,
  storage: HardDrive,
  other: Box,
};

export default function CMDBPage() {
  const [search, setSearch] = useState("");

  const { data: cis, isLoading } = useQuery<ConfigurationItem[]>({
    queryKey: ["/api/configuration-items"],
  });

  const filteredCIs = cis?.filter(ci =>
    ci.name.toLowerCase().includes(search.toLowerCase()) ||
    ci.type.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-3xl font-semibold" data-testid="page-title">Configuration Management Database</h1>
        <Link href="/cmdb/new">
          <Button data-testid="button-create-ci">
            <Plus className="h-4 w-4 mr-2" />
            New Configuration Item
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search configuration items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-cis"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCIs && filteredCIs.length > 0 ? (
          filteredCIs.map((ci) => {
            const Icon = ciTypeIcons[ci.type as keyof typeof ciTypeIcons] || Box;
            return (
              <Link key={ci.id} href={`/cmdb/${ci.id}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid={`ci-${ci.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base mb-2 truncate" data-testid={`ci-name-${ci.id}`}>
                          {ci.name}
                        </CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <StatusBadge status={ci.status} type="ci" />
                          <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded-md bg-muted">
                            {ci.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {ci.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ci.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })
        ) : (
          <Card className="p-12 text-center col-span-full">
            <p className="text-muted-foreground">
              {search ? 'No configuration items match your search' : 'No configuration items yet. Add your first CI!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
