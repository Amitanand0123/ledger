'use client';

import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageDocuments } from '@/components/settings/manage-documents';
import { ManageCustomFields } from './_components/manage-custom-fields';
import { ProfileSettingsTab } from './_components/profile-settings-tab';
import { IntegrationsSettingsTab } from './_components/integrations-settings-tab';

export default function SettingsPage() {
    const { data: session } = useSession();

    // We still need to determine if the user has a password to show the change password form.
    const isPasswordAuth = !!session?.user?.email;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold">
                Account Settings
            </h1>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="customization">Customization</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileSettingsTab isPasswordAuth={isPasswordAuth} />
                </TabsContent>

                <TabsContent value="documents">
                    <ManageDocuments />
                </TabsContent>

                <TabsContent value="integrations">
                    <IntegrationsSettingsTab />
                </TabsContent>

                <TabsContent value="customization">
                    <ManageCustomFields />
                </TabsContent>
            </Tabs>
        </div>
    );
}