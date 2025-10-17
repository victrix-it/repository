import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, FileText, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { KnowledgeBase, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface KBWithRelations extends KnowledgeBase {
  createdBy?: User;
}

export default function KnowledgePage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: articles, isLoading } = useQuery<KBWithRelations[]>({
    queryKey: ["/api/knowledge"],
  });

  const filteredArticles = articles?.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) ||
                         article.category.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || article.type === activeTab;
    return matchesSearch && matchesTab;
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-3xl font-semibold" data-testid="page-title">Knowledge Base</h1>
        <Link href="/knowledge/new">
          <Button data-testid="button-create-article">
            <Plus className="h-4 w-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-articles"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="sop" data-testid="tab-sop">SOPs</TabsTrigger>
          <TabsTrigger value="known_issue" data-testid="tab-known-issues">Known Issues</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles && filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <Link key={article.id} href={`/knowledge/${article.id}`}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid={`article-${article.id}`}>
                <CardHeader>
                  <div className="flex items-start gap-3 mb-2">
                    {article.type === 'sop' ? (
                      <FileText className="h-5 w-5 text-chart-1 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-chart-3 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-2 truncate" data-testid={`article-title-${article.id}`}>
                        {article.title}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {article.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {article.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.views} views</span>
                    </div>
                    <span>
                      {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-12 text-center col-span-full">
            <p className="text-muted-foreground">
              {search ? 'No articles match your search' : 'No articles yet. Create your first knowledge article!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
