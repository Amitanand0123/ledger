'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BarChart3, Calendar, FileSearch, Home, Settings,
    ChevronLeft, ChevronRight, CircleUser,
    LogIn, LogOut, Moon, Sun, Package2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { NavLink } from './nav-link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/upcoming', icon: Calendar, label: 'Upcoming' },
    { href: '/resume-tools', icon: FileSearch, label: 'Resume Tools' },
    { href: '/stats', icon: BarChart3, label: 'Statistics' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

interface AppSidebarProps {
    /** When true, render expanded without collapse toggle (for mobile Sheet) */
    mobile?: boolean;
}

export function AppSidebar({ mobile }: AppSidebarProps) {
    const [collapsed, setCollapsed] = useState(true);
    const [mounted, setMounted] = useState(false);
    const { data: session, status } = useSession();
    const isGuest = status === 'unauthenticated';
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) setCollapsed(saved === 'true');
        setMounted(true);
    }, []);

    const toggleCollapsed = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebar-collapsed', String(next));
    };

    const handleLogout = () => {
        toast('Are you sure you want to log out?', {
            action: {
                label: 'Logout',
                onClick: () => signOut({ callbackUrl: '/' }),
            },
            cancel: {
                label: 'Cancel',
                onClick: () => toast.dismiss(),
            },
        });
    };

    const handleToggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // For mobile Sheet: always expanded, no collapse toggle
    const isCollapsed = mobile ? false : collapsed;

    return (
        <aside
            className={cn(
                'flex flex-col h-full border-r bg-background transition-all duration-300',
                mobile ? 'w-full' : (isCollapsed ? 'w-16' : 'w-60'),
            )}
        >
            {/* Logo + collapse toggle */}
            <div className={cn('flex flex-col gap-2 p-3', isCollapsed && 'items-center')}>
                <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'justify-between')}>
                    <Link
                        href="/dashboard"
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-2 py-1.5 text-lg font-semibold',
                            isCollapsed && 'justify-center px-0',
                        )}
                        title={isCollapsed ? 'Ledger' : undefined}
                    >
                        <Package2 className="h-6 w-6 text-brand-primary shrink-0" />
                        {!isCollapsed && <span className="text-sm font-bold">Ledger</span>}
                    </Link>
                    {!mobile && mounted && (
                        <button
                            onClick={toggleCollapsed}
                            className={cn(
                                'flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-all hover:text-foreground hover:bg-muted',
                                isCollapsed && 'mt-1',
                            )}
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed
                                ? <ChevronRight className="h-4 w-4" />
                                : <ChevronLeft className="h-4 w-4" />
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Separator */}
            <div className="mx-3 border-t" />

            {/* Nav Links */}
            <nav className={cn('flex flex-col gap-1 p-3', isCollapsed && 'items-center')}>
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.href}
                        href={item.href}
                        collapsed={isCollapsed}
                        tooltip={item.label}
                    >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom section */}
            <div className={cn('flex flex-col gap-1 p-3 border-t', isCollapsed && 'items-center')}>
                {/* Theme toggle */}
                <button
                    onClick={handleToggleTheme}
                    title={isCollapsed ? 'Toggle theme' : undefined}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-content-secondary transition-all hover:text-primary-600 dark:hover:text-primary-500',
                        isCollapsed && 'justify-center px-0',
                    )}
                >
                    <Sun className="h-5 w-5 shrink-0 dark:hidden" />
                    <Moon className="h-5 w-5 shrink-0 hidden dark:block" />
                    {!isCollapsed && 'Theme'}
                </button>

                {/* User section */}
                {isGuest ? (
                    <Link
                        href="/login"
                        title={isCollapsed ? 'Login' : undefined}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-content-secondary transition-all hover:text-primary-600 dark:hover:text-primary-500',
                            isCollapsed && 'justify-center px-0',
                        )}
                    >
                        <LogIn className="h-5 w-5 shrink-0" />
                        {!isCollapsed && 'Login'}
                    </Link>
                ) : (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                title={isCollapsed ? (session?.user?.name || 'Account') : undefined}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted',
                                    isCollapsed && 'justify-center px-0',
                                )}
                            >
                                <CircleUser className="h-5 w-5 shrink-0" />
                                {!isCollapsed && (
                                    <span className="text-sm truncate">
                                        {session?.user?.name || 'Account'}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" align="end" className="w-48 p-2">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </PopoverContent>
                    </Popover>
                )}

            </div>
        </aside>
    );
}

// Re-export old name for any remaining imports
export { AppSidebar as Sidebar };
