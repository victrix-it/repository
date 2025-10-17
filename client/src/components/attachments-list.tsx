import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2, File, FileText, Image, FileArchive, FileVideo, FileAudio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Attachment } from "@shared/schema";

interface AttachmentsListProps {
  ticketId?: string;
  changeRequestId?: string;
  knowledgeBaseId?: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return FileArchive;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export function AttachmentsList({ ticketId, changeRequestId, knowledgeBaseId }: AttachmentsListProps) {
  const { toast } = useToast();

  // Determine the query key based on which ID is provided
  const queryKey = ticketId 
    ? ["/api/tickets", ticketId, "attachments"]
    : changeRequestId
    ? ["/api/changes", changeRequestId, "attachments"]
    : ["/api/knowledge", knowledgeBaseId, "attachments"];

  const endpoint = ticketId
    ? `/api/tickets/${ticketId}/attachments`
    : changeRequestId
    ? `/api/changes/${changeRequestId}/attachments`
    : `/api/knowledge/${knowledgeBaseId}/attachments`;

  const { data: attachments, isLoading } = useQuery<Attachment[]>({
    queryKey,
    queryFn: () => fetch(endpoint).then(res => res.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      return apiRequest("DELETE", `/api/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete attachment",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (attachmentId: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/attachments/${attachmentId}/download`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading attachments...</div>;
  }

  if (!attachments || attachments.length === 0) {
    return <div className="text-sm text-muted-foreground">No attachments</div>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const Icon = getFileIcon(attachment.mimeType);
        return (
          <Card key={attachment.id} data-testid={`attachment-${attachment.id}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid="attachment-filename">
                    {attachment.originalFilename}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(attachment.id, attachment.originalFilename)}
                    data-testid={`button-download-${attachment.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(attachment.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${attachment.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
