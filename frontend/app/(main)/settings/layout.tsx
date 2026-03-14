import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings — Ledger' };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
