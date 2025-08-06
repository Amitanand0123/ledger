'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetGoogleAuthUrlMutation } from "@/lib/redux/slices/userApiSlice";
import { toast } from "sonner";
import { Loader2, CalendarPlus } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ManageGcalSync() {
    const [getAuthUrl, { isLoading }] = useGetGoogleAuthUrlMutation();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check for the status in the URL query params after redirect from Google
        const status = searchParams?.get('gcal_status');
        if (status === 'success') {
            toast.success("Google Calendar connected successfully!");
        } else if (status === 'error') {
            toast.error("Failed to connect Google Calendar. Please try again.");
        }
    }, [searchParams]);

    const handleConnect = async () => {
        try {
            const { url } = await getAuthUrl().unwrap();
            // Redirect the user to the Google consent screen
            window.location.href = url;
        } catch (error) {
            toast.error("Could not get Google authentication URL. Please try again later.");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Google Calendar Sync</CardTitle>
                <CardDescription>
                    Connect your Google Calendar to automatically schedule interview events directly from the job details page.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleConnect} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CalendarPlus className="mr-2 h-4 w-4"/>}
                    Connect to Google Calendar
                </Button>
            </CardContent>
        </Card>
    );
}