'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    collapsed?: boolean;
    tooltip?: string;
}

export function NavLink({ href, children, collapsed, tooltip }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            title={collapsed ? tooltip : undefined}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 whitespace-nowrap text-content-secondary transition-all hover:text-primary-600 dark:hover:text-primary-500',
                isActive && 'text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-muted font-semibold',
                collapsed && 'justify-center px-0',
            )}
        >
            {children}
        </Link>
    );
}