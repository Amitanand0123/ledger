'use client';

import Link from 'next/link';
import { Menu, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { AppSidebar } from './sidebar';

/**
 * MobileHeader — visible only on small screens (md:hidden).
 * Shows a hamburger that opens the full sidebar in a Sheet.
 */
export function MobileHeader() {
    return (
        <header className="sticky top-0 z-50 flex h-12 items-center gap-3 border-b bg-background px-4 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 h-8 w-8">
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-60">
                    <VisuallyHidden.Root>
                        <SheetTitle>Navigation</SheetTitle>
                    </VisuallyHidden.Root>
                    <AppSidebar mobile />
                </SheetContent>
            </Sheet>

            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
                <Package2 className="h-5 w-5 text-brand-primary" />
                Ledger
            </Link>
        </header>
    );
}

// Keep Navbar export for backwards compat (layout will switch to MobileHeader)
export { MobileHeader as Navbar };
