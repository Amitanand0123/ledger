import { Navbar } from '@/components/layout/navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col gap-4 p-4 md:px-8 md:py-6 lg:px-12 lg:py-6">
        {children}
      </main>
    </div>
  );
}