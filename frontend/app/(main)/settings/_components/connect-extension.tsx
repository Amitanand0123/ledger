'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Link2 } from 'lucide-react';

// This ID MUST match the ID of your extension after you load it in Chrome
const EXTENSION_ID = 'YOUR_CHROME_EXTENSION_ID_HERE';

export function ConnectExtension() {
    const { data: session } = useSession();

    const handleConnect = () => {
        if (!session?.accessToken) {
            toast.error('You must be logged in to connect the extension.');
            return;
        }

        if (window.chrome && window.chrome.runtime) {
            chrome.runtime.sendMessage(EXTENSION_ID, {
                type: 'SET_LEDGER_TOKEN',
                token: session.accessToken,
            }, (response: { success: boolean } | undefined) => {
                if (chrome.runtime.lastError) {
                    toast.error('Could not connect. Is the Ledger extension installed and enabled?');
                    console.error(chrome.runtime.lastError);
                } else if (response && response.success) {
                    toast.success('Extension connected successfully!');
                } else {
                    toast.warning('Connection sent, but no confirmation received from the extension.');
                }
            });
        } else {
            toast.error('This feature is only available in a Chrome browser with the extension installed.');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chrome Extension</CardTitle>
                <CardDescription>
                    Connect the Ledger Job Clipper to save jobs directly from your browser in one click.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleConnect}>
                    <Link2 className="mr-2 h-4 w-4"/>
                    Connect Extension
                </Button>
            </CardContent>
        </Card>
    );
}