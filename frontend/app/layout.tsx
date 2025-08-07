// frontend/app/layout.tsx
'use client'; 

import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReduxProvider from '@/lib/redux/provider';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/providers/AuthProvider'; // Your new provider
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Ledger</title>
        <meta name="description" content="The ultimate tool to manage and track your job applications with ease." />
        <link rel="icon" href="/job.jpg" />
      </head>
      <body className={inter.className}>
        {/*
          All providers are nested here, at the highest level.
          The `children` prop will be whatever page or nested layout
          Next.js is trying to render.
        */}
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ReduxProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster richColors position="top-right" />
              </ThemeProvider>
            </ReduxProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}