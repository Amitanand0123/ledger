'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { userProfileSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type ProfileFormValues = z.infer<typeof userProfileSchema>;

export function UpdateProfileForm() {
    const { data: session, update } = useSession();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
        resolver: zodResolver(userProfileSchema),
        defaultValues: {
            name: session?.user?.name ?? '',
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            const response = await fetch('/api/v1/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile.');
            }

            // This updates the session on the client-side
            await update({ name: data.name });
            toast.success('Profile updated successfully!');

        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600 dark:text-red-500">{errors.name.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-brand-primary hover:bg-opacity-80 text-white">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
        </form>
    );
}