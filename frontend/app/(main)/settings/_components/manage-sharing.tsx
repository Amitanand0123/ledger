'use client';

import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShareDashboardMutation, useGetMySharedUsersQuery, useRevokeShareAccessMutation, Share } from '@/lib/redux/slices/sharingApiSlice';
import { toast } from 'sonner';
import { Loader2, Share2, UserX } from 'lucide-react';

export function ManageSharing() {
    const { register, handleSubmit, reset } = useForm<{ email: string }>();
    const [shareDashboard, { isLoading: isSharing }] = useShareDashboardMutation();
    const { data: sharedUsers, isLoading: isLoadingUsers } = useGetMySharedUsersQuery();
    const [revokeAccess] = useRevokeShareAccessMutation();

    const onShare = (data: { email: string }) => {
        toast.promise(shareDashboard(data).unwrap(), {
            loading: `Sharing with ${data.email}...`,
            success: () => {
                reset();
                return 'Dashboard shared successfully!';
            },
            error: (err) => err.data?.message || 'Failed to share.',
        });
    };
    
    const onRevoke = (id: string, email: string) => {
        toast.promise(revokeAccess(id).unwrap(), {
            loading: `Revoking access for ${email}...`,
            success: 'Access revoked.',
            error: (err) => err.data?.message || 'Failed to revoke access.',
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Share Dashboard</CardTitle>
                <CardDescription>
                    Share a read-only view of your dashboard with others. They will need a Ledger account to view it.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onShare)} className="flex items-center gap-2">
                    <Input {...register('email')} type="email" placeholder="viewer@example.com" required />
                    <Button type="submit" disabled={isSharing}>
                        {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Share2 className="mr-2 h-4 w-4"/>} Share
                    </Button>
                </form>
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Currently Sharing With</h4>
                    {isLoadingUsers && <Loader2 className="animate-spin"/>}
                    {sharedUsers && sharedUsers.length > 0 ? (
                        sharedUsers.map((share: Share) => (
                            <div key={share.id} className="flex justify-between items-center p-2 border rounded-md">
                                <span>{share.inviteEmail}</span>
                                <Button variant="ghost" size="icon" onClick={() => onRevoke(share.id, share.inviteEmail)}>
                                    <UserX className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">You haven&apos;t shared your dashboard with anyone.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}