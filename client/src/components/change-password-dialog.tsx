import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle } from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forcedChange?: boolean;
}

export function ChangePasswordDialog({ open, onOpenChange, forcedChange = false }: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword?: string; newPassword: string }) => {
      return apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
      
      if (forcedChange) {
        window.location.reload();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Password change failed',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are the same',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: currentPassword || undefined,
      newPassword,
    });
  };

  return (
    <Dialog open={open} onOpenChange={forcedChange ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-change-password">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              {forcedChange ? (
                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <AlertCircle className="w-4 h-4" />
                  You must change your password before continuing
                </span>
              ) : (
                'Update your account password'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!forcedChange && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  data-testid="input-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                data-testid="input-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                data-testid="input-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            {!forcedChange && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              data-testid="button-submit"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
