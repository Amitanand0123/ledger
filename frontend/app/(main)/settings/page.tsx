'use client';

import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageDocuments } from '@/components/settings/manage-documents';
import { ManageCustomFields } from './_components/manage-custom-fields';
import { ProfileSettingsTab } from './_components/profile-settings-tab';
import { DashboardSharingTab } from './_components/dashboard-sharing-tab';
import { ManageSharing } from './_components/manage-sharing';
import { User, FileText, Share2, Sliders } from 'lucide-react';

export default function SettingsPage() {
    const { data: session } = useSession();
    const isPasswordAuth = !!session?.user?.email;

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Account Settings
                </h1>
                <p className="text-sm text-muted-foreground">Manage your profile, documents, and preferences</p>
            </div>

            {/* Tabs with Modern Styling */}
            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 h-auto p-1 bg-muted/50 backdrop-blur">
                    <TabsTrigger
                        value="profile"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
                    >
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="documents"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
                    >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Documents</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="sharing"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
                    >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Sharing</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="customization"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
                    >
                        <Sliders className="h-4 w-4" />
                        <span className="hidden sm:inline">Custom Fields</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <ProfileSettingsTab isPasswordAuth={isPasswordAuth} />
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                    <ManageDocuments />
                </TabsContent>

                <TabsContent value="sharing" className="mt-6 space-y-6">
                    <DashboardSharingTab />
                    <ManageSharing />
                </TabsContent>

                <TabsContent value="customization" className="mt-6">
                    <ManageCustomFields />
                </TabsContent>
            </Tabs>
        </div>
    );
}