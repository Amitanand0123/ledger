'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { userPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type PasswordFormValues = z.infer<typeof userPasswordSchema>;

export function ChangePasswordForm() {
    const { data: session } = useSession();

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordFormValues>({
        resolver: zodResolver(userPasswordSchema),
    });

    const onSubmit = async (data: PasswordFormValues) => {
        try {
            const response = await fetch('/api/v1/users/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to change password.");
            }

            toast.success("Password changed successfully!");
            reset();

        } catch (error: any) {
            toast.error(error.message);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" {...register('currentPassword')} />
                {errors.currentPassword && <p className="text-sm text-red-600 dark:text-red-500">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" {...register('newPassword')} />
                {errors.newPassword && <p className="text-sm text-red-600 dark:text-red-500">{errors.newPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-brand-secondary hover:bg-opacity-80 text-slate-800">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Change Password'}
            </Button>
        </form>
    );
}