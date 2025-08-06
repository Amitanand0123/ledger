'use client'

import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateWebhookSettingsMutation } from "@/lib/redux/slices/userApiSlice"; // We will add this
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ManageAutomations() {
    const { register, handleSubmit } = useForm<{ zapierUrl: string }>();
    const [updateWebhook, { isLoading }] = useUpdateWebhookSettingsMutation();
    
    const onSave = (data: { zapierUrl: string }) => {
        toast.promise(updateWebhook({
            eventType: "job.status.changed",
            targetUrl: data.zapierUrl,
        }).unwrap(), {
            loading: 'Saving Zapier URL...',
            success: 'Webhook URL saved!',
            error: (err) => err.data?.message || 'Failed to save.'
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Automations (Zapier)</CardTitle>
                <CardDescription>
                   Connect to Zapier to automate tasks. Create a new "Catch Hook" Zap and paste the URL below.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                     <div>
                        <Label htmlFor="zapierUrl">"Job Status Changed" Webhook URL</Label>
                        <Input id="zapierUrl" type="url" {...register('zapierUrl')} placeholder="https://hooks.zapier.com/..."/>
                    </div>
                    <Button type="submit" disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Webhook
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}