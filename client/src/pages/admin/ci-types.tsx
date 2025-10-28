import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Link } from 'wouter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Pencil, Trash2, Box, ArrowLeft } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { CiType } from '@shared/schema';

const AVAILABLE_ICONS = [
  'Server', 'AppWindow', 'Database', 'Network', 'HardDrive', 'Box',
  'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Printer', 'Router',
  'Wifi', 'Cloud', 'Globe', 'Lock', 'Shield', 'Settings'
];

export default function CiTypesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CiType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Box',
    isActive: 'true',
  });

  const { data: ciTypes, isLoading } = useQuery<CiType[]>({
    queryKey: ['/api/ci-types'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('POST', '/api/ci-types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ci-types'] });
      toast({ title: 'CI Type created', description: 'The CI type has been created successfully' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create CI type',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest('PATCH', `/api/ci-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ci-types'] });
      toast({ title: 'CI Type updated', description: 'The CI type has been updated successfully' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update CI type',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/ci-types/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ci-types'] });
      toast({ title: 'CI Type deleted', description: 'The CI type has been deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete CI type',
        variant: 'destructive',
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormData({ name: '', description: '', icon: 'Box', isActive: 'true' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (ciType: CiType) => {
    setEditingType(ciType);
    setFormData({
      name: ciType.name,
      description: ciType.description || '',
      icon: ciType.icon || 'Box',
      isActive: ciType.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingType(null);
    setFormData({ name: '', description: '', icon: 'Box', isActive: 'true' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this CI type?')) {
      deleteMutation.mutate(id);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Box;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      <Link href="/admin">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-to-admin">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </Link>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-ci-types">CI Types Management</h1>
          <p className="text-muted-foreground">
            Manage configuration item types for your organization
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-create-ci-type">
          <Plus className="w-4 h-4 mr-2" />
          New CI Type
        </Button>
      </div>

      <Card data-testid="card-ci-types">
        <CardHeader>
          <CardTitle>CI Types</CardTitle>
          <CardDescription>
            Define the types of configuration items your organization tracks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading CI types...</div>
          ) : !ciTypes || ciTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No CI types found. Create your first CI type to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ciTypes.map((ciType) => (
                  <TableRow key={ciType.id} data-testid={`row-ci-type-${ciType.id}`}>
                    <TableCell>{getIconComponent(ciType.icon || 'Box')}</TableCell>
                    <TableCell className="font-medium" data-testid={`text-name-${ciType.id}`}>
                      {ciType.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ciType.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ciType.isActive === 'true' ? 'default' : 'secondary'}
                        data-testid={`badge-status-${ciType.id}`}
                      >
                        {ciType.isActive === 'true' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ciType.isDefault === 'true' && (
                        <Badge variant="outline" data-testid={`badge-default-${ciType.id}`}>
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(ciType)}
                          data-testid={`button-edit-${ciType.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {ciType.isDefault !== 'true' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(ciType.id)}
                            data-testid={`button-delete-${ciType.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-ci-type-form">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Edit CI Type' : 'Create CI Type'}
              </DialogTitle>
              <DialogDescription>
                {editingType
                  ? 'Update the configuration item type details'
                  : 'Add a new configuration item type to your system'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Vehicle, Equipment, Facility"
                  required
                  data-testid="input-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this CI type"
                  rows={3}
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger data-testid="select-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((iconName) => (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          {getIconComponent(iconName)}
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingType
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
