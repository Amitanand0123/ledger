'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useGetMySharedUsersQuery,
  useRevokeShareAccessMutation,
} from '@/lib/redux/slices/sharingApiSlice';
import { Users, Trash2, UserCheck, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function DashboardSharingTab() {
  const { data: sharedUsers, isLoading } = useGetMySharedUsersQuery();
  const [revokeAccess] = useRevokeShareAccessMutation();

  const handleRevokeAccess = async (shareId: string, email: string) => {
    try {
      await revokeAccess(shareId).unwrap();
      toast.success(`Access revoked for ${email}`);
    } catch (error: any) {
      toast.error(error.data?.message || 'Failed to revoke access');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-brand-accent-light/20 border border-brand-accent-light rounded-lg">
        <Info className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium mb-1">About Dashboard Sharing</p>
          <p className="text-muted-foreground">
            You can share your dashboard with others to give them read-only access to view your job applications.
            Shared users can see all your job details, status updates, and statistics, but cannot make any changes.
          </p>
        </div>
      </div>

      {/* Shared With Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            People with Access
          </CardTitle>
          <CardDescription>
            Manage who can view your job application dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sharedUsers || sharedUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm">
                You haven&apos;t shared your dashboard with anyone yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the &quot;Manage Sharing&quot; tab to invite people
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedUsers.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary/10">
                      <UserCheck className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{share.inviteEmail}</p>
                      {share.viewer ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {share.viewer.name || share.viewer.email}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs mt-1">
                          Pending Invitation
                        </Badge>
                      )}
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Access</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to revoke access for <strong>{share.inviteEmail}</strong>?
                          They will no longer be able to view your dashboard.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRevokeAccess(share.id, share.inviteEmail)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Revoke Access
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {sharedUsers && sharedUsers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{sharedUsers.length}</div>
              <p className="text-xs text-muted-foreground">
                Total Shared With
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {sharedUsers.filter(s => s.viewer).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Active Users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {sharedUsers.filter(s => !s.viewer).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending Invitations
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}