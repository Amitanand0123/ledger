import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Statistics — Ledger' };

export default function StatsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
