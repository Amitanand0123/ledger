'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UpdateProfileForm } from "./_components/update-profile-form"
import { ChangePasswordForm } from "./_components/change-password-form"
import { ManageCustomFields } from "./_components/manage-custom-fields"
import { useSession } from "next-auth/react"
import { ManageDocuments } from "@/components/settings/manage-documents" 
import { ManageAirtableSync } from "./_components/manage-airtable-sync"
import { ManageAutomations } from "./_components/manage-automation"
import { ManageGcalSync } from "./_components/manage-gcal-sync"
import { ConnectExtension } from "./_components/connect-extension";

export default function SettingsPage() {
    const { data: session } = useSession();

    // Logic Explanation:
    // We check for `session.user.email` as a proxy for password-based authentication.
    // While a Google user also has an email, the backend distinguishes them. 
    // Allowing an OAuth user to set/change a password here would require a dedicated, secure
    // backend endpoint and flow (e.g., "Set Password" with email confirmation).
    // The current logic correctly and safely shows the password change form only to users
    // who originally signed up with an email and password.
    const isPasswordAuth = session?.user?.email;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold">
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
                    <ConnectExtension />
                    <ManageDocuments />
                    <ManageCustomFields />
                    <ManageGcalSync />
                    <ManageAirtableSync />
                    <ManageAutomations />
                </div>
            </div>
        </div>
    )
}