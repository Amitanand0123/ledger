'use client';

import { UpcomingInterviewsWidget } from '@/components/dashboard/upcoming-interviews-widget';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';

export default function UpcomingPage() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/dashboard');
  }

  return <UpcomingInterviewsWidget />;
}
