import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Download, CheckCircle2, XCircle, AlertCircle, Users, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UserCsvImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/users/csv/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setImportResult(data);
      if (data.success > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${data.success} user${data.success > 1 ? 's' : ''}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/users/csv/template', '_blank');
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/admin')}
          className="mb-2"
          size="sm"
          data-testid="button-back-to-admin"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">User CSV Import</h1>
        <p className="text-muted-foreground">
          Bulk import users from a CSV file
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Download Template Card */}
        <Card data-testid="card-download-template">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Step 1: Download Template
            </CardTitle>
            <CardDescription>
              Download the CSV template to see the required format and example data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              data-testid="button-download-template"
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </CardContent>
        </Card>

        {/* Upload CSV Card */}
        <Card data-testid="card-upload-csv">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Step 2: Upload CSV File
            </CardTitle>
            <CardDescription>
              Select your CSV file and click import to add users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                data-testid="input-csv-file"
              />
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              data-testid="button-import-csv"
            >
              {importMutation.isPending ? "Importing..." : "Import Users"}
            </Button>
          </CardContent>
        </Card>

        {/* Import Results Card */}
        {importResult && (
          <Card data-testid="card-import-results">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">
                    {importResult.success} Successful
                  </Badge>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {importResult.errors.length} Failed
                    </Badge>
                  </div>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some rows could not be imported. See details below.
                  </AlertDescription>
                </Alert>
              )}

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Errors:</h3>
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-2">
                      {importResult.errors.map((error: any, index: number) => (
                        <div
                          key={index}
                          className="p-2 bg-destructive/10 rounded border-l-2 border-destructive"
                          data-testid={`error-row-${error.row}`}
                        >
                          <div className="text-sm font-medium">Row {error.row}</div>
                          <div className="text-xs text-muted-foreground">{error.error}</div>
                          {error.data && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Data: {JSON.stringify(error.data).slice(0, 100)}...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {importResult.success > 0 && (
                <Button
                  onClick={() => setLocation('/admin/users')}
                  data-testid="button-view-users"
                >
                  <Users className="mr-2 h-4 w-4" />
                  View Users
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* CSV Format Information */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Required Columns:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Email</strong> - User email address (must be unique)</li>
                <li><strong>Password</strong> - User password (minimum 8 characters)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Optional Columns:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>First Name</li>
                <li>Last Name</li>
                <li>Role (user, support, or admin - defaults to user)</li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Imported users will use local authentication. Column names are case-insensitive and flexible (e.g., "Email", "email", "email_address" all work).
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Note:</strong> Passwords will be securely hashed before storage. Make sure to use strong passwords in your CSV file.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
