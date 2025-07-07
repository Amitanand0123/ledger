'use client';

import { DashboardPageContent } from '@/components/dashboard/dashboard-page-content';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';

export default function DashboardPage() {
  const { status } = useSession();

  return (
    <div className="flex flex-col h-screen w-full bg-muted/40 dark:bg-background">
      <Navbar />
      
      <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:gap-6 lg:p-6 overflow-hidden">
        {status === "loading" ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
          </div>
        ) : (
          <DashboardPageContent />
        )}
      </main>
    </div>
  );
}