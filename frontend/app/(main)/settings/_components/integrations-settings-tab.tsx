'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ConnectExtension } from './connect-extension';
import { ManageGcalSync } from './manage-gcal-sync';
import { ManageAirtableSync } from './manage-airtable-sync';
import { ManageAutomations } from './manage-automation';

function GcalSyncLoading() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-4/5 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-48" />
            </CardContent>
        </Card>
    );
}

export function IntegrationsSettingsTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ConnectExtension />
      <Suspense fallback={<GcalSyncLoading />}>
        <ManageGcalSync />
      </Suspense>
      <ManageAirtableSync />
      <ManageAutomations />
    </div>
  );
}