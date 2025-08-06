'use client';

import { DashboardPageContent } from '@/components/dashboard/dashboard-page-content';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
// The Navbar import is correctly removed from here.

export default function DashboardPage() {
  const { status } = useSession();

  // The MainLayout now handles the overall page structure,
  // so this component can focus solely on its content.
  // The 'main' element with flex properties is now in the layout.
  
  if (status === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
      </div>
    );
  }

  // The wrapping <main> tag can be removed if the parent layout provides it,
  // which your MainLayout does.
  return <DashboardPageContent />;
}