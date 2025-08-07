// frontend/app/(main)/layout.tsx

import { Navbar } from '@/components/layout/navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We no longer need the two-column grid layout or the Sidebar component here.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}