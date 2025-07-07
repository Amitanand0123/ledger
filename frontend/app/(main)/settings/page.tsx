'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UpdateProfileForm } from "./_components/update-profile-form"
import { ChangePasswordForm } from "./_components/change-password-form"
import { ManageCustomFields } from "./_components/manage-custom-fields"
import { useSession } from "next-auth/react"
import { ManageDocuments } from "@/components/settings/manage-documents" // Updated path

export default function SettingsPage() {
    const { data: session } = useSession();
    const isPasswordAuth = session?.user?.email;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">
                Account Settings
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card className="border-t-4 border-brand-primary">
                        <CardHeader><CardTitle>Profile</CardTitle><CardDescription>Update your personal information.</CardDescription></CardHeader>
                        <CardContent><UpdateProfileForm /></CardContent>
                    </Card>

                    {isPasswordAuth && (
                        <Card className="border-t-4 border-brand-secondary">
                            <CardHeader><CardTitle>Password</CardTitle><CardDescription>Change your password.</CardDescription></CardHeader>
                            <CardContent><ChangePasswordForm /></CardContent>
                        </Card>
                    )}
                </div>
                <div className="space-y-6">
                    <ManageDocuments />
                    <ManageCustomFields />
                </div>
            </div>
        </div>
    )
}