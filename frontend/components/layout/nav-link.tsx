'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-content-secondary transition-all hover:text-primary-600 dark:hover:text-primary-500',
                isActive && 'text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-muted font-semibold',
            )}
        >
            {children}
        </Link>
    );
}