'use client';

import { DashboardPageContent } from '@/components/dashboard/dashboard-page-content';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { status } = useSession();
  
  if (status === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
      </div>
    );
  }

  return <DashboardPageContent />;
}