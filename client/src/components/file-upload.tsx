import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FileUploadProps {
  ticketId?: string;
  changeRequestId?: string;
  knowledgeBaseId?: string;
  onUploadComplete?: () => void;
}

export function FileUpload({ ticketId, changeRequestId, knowledgeBaseId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      if (ticketId) formData.append("ticketId", ticketId);
      if (changeRequestId) formData.append("changeRequestId", changeRequestId);
      if (knowledgeBaseId) formData.append("knowledgeBaseId", knowledgeBaseId);

      const response = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      // Invalidate attachments cache
      if (ticketId) queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "attachments"] });
      if (changeRequestId) queryClient.invalidateQueries({ queryKey: ["/api/changes", changeRequestId, "attachments"] });
      if (knowledgeBaseId) queryClient.invalidateQueries({ queryKey: ["/api/knowledge", knowledgeBaseId, "attachments"] });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        data-testid="input-file"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        data-testid="button-upload-file"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </>
        )}
      </Button>
    </div>
  );
}
