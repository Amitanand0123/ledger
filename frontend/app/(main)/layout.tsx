'use client';

import { AppSidebar } from '@/components/layout/sidebar';
import { MobileHeader } from '@/components/layout/navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar — sticky to viewport, part of flex flow */}
      <div className="hidden md:flex sticky top-0 h-screen shrink-0 z-40">
        <AppSidebar />
      </div>

      {/* Main content area — takes remaining width */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header — visible only on small screens */}
        <MobileHeader />

        <main className="flex flex-1 flex-col gap-4 p-4 md:px-8 md:py-6 lg:px-12 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
