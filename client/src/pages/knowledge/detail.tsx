import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/file-upload";
import { AttachmentsList } from "@/components/attachments-list";
import { ArrowLeft, Eye, FileText, AlertCircle, Paperclip } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { KnowledgeBase, User } from "@shared/schema";

interface KBWithRelations extends KnowledgeBase {
  createdBy?: User;
}

export default function KBDetailPage() {
  const { id } = useParams();

  const { data: article, isLoading } = useQuery<KBWithRelations>({
    queryKey: ["/api/knowledge", id],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-8">
        <p>Article not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link href="/knowledge">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Base
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                {article.type === 'sop' ? (
                  <FileText className="h-6 w-6 text-chart-1 mt-1" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-chart-3 mt-1" />
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl mb-3" data-testid="article-title">{article.title}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{article.category}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {article.type.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{article.views} views</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap font-sans text-foreground bg-transparent" data-testid="article-content">
                  {article.content}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {article.createdBy && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Created By</p>
                  <div className="flex items-center gap-2">
                    <UserAvatar user={article.createdBy} size="sm" />
                    <span className="text-sm">
                      {article.createdBy.firstName} {article.createdBy.lastName}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <CardTitle className="text-lg">Attachments</CardTitle>
                </div>
                <FileUpload knowledgeBaseId={id} />
              </div>
            </CardHeader>
            <CardContent>
              <AttachmentsList knowledgeBaseId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
