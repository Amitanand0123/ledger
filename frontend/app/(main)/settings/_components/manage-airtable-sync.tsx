'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateAirtableSettingsMutation, useSyncToAirtableMutation } from '@/lib/redux/slices/userApiSlice'; // We will add these
import { toast } from 'sonner';
import { Loader2, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';

const airtableSettingsSchema = z.object({
    apiKey: z.string().startsWith('pat', 'Must be a Personal Access Token starting with \'pat\''),
    baseId: z.string().startsWith('app', 'Must be a Base ID starting with \'app\''),
    tableName: z.string().min(1, 'Table name is required.'),
});

type AirtableSettingsValues = z.infer<typeof airtableSettingsSchema>;

export function ManageAirtableSync() {
    // In a real app, you would fetch and pre-fill these values from the user's profile
    const { register, handleSubmit, formState: { errors } } = useForm<AirtableSettingsValues>({
        resolver: zodResolver(airtableSettingsSchema),
    });

    const [updateSettings, { isLoading: isUpdating }] = useUpdateAirtableSettingsMutation();
    const [syncNow, { isLoading: isSyncing }] = useSyncToAirtableMutation();

    const onSave = (data: AirtableSettingsValues) => {
        toast.promise(updateSettings(data).unwrap(), {
            loading: 'Saving settings...',
            success: 'Airtable settings saved!',
            error: (err) => err.data?.message || 'Failed to save settings.',
        });
    };

    const onSync = () => {
        toast.promise(syncNow().unwrap(), {
            loading: 'Syncing jobs to Airtable...',
            success: (res) => res.message,
            error: (err) => err.data?.message || 'Sync failed. Check your settings and table columns.',
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Airtable Sync</CardTitle>
                <CardDescription>
                    Connect your Airtable account to sync your job board. Ensure your Airtable table has columns like: 
                    &apos;Company&apos;, &apos;Position&apos;, &apos;Status&apos;, etc.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <div>
                        <Label htmlFor="apiKey">Airtable API Key</Label>
                        <Input id="apiKey" type="password" {...register('apiKey')} placeholder="pat..."/>
                        {errors.apiKey && <p className="text-sm text-destructive">{errors.apiKey.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="baseId">Base ID</Label>
                        <Input id="baseId" {...register('baseId')} placeholder="app..."/>
                        {errors.baseId && <p className="text-sm text-destructive">{errors.baseId.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="tableName">Table Name</Label>
                        <Input id="tableName" {...register('tableName')} defaultValue="Job Applications"/>
                        {errors.tableName && <p className="text-sm text-destructive">{errors.tableName.message}</p>}
                    </div>
                    <Button type="submit" disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Settings
                    </Button>
                </form>
                <div className="border-t pt-4">
                    <Button onClick={onSync} disabled={isSyncing} variant="outline">
                         {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                         <Zap className="mr-2 h-4 w-4 text-yellow-500"/>
                         Sync to Airtable Now
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}