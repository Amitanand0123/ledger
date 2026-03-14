'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import {
    Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip,
    XAxis, YAxis, LineChart, Line,
} from 'recharts';
import { Loader2, Activity, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { useGetOverviewStatsQuery } from '@/lib/redux/slices/statsApiSlice';

const RANGE_OPTIONS = [
    { label: '7d', value: 7 },
    { label: '14d', value: 14 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
];

const FUNNEL_COLORS: Record<string, string> = {
    APPLIED: '#3B82F6',
    INTERESTED: '#6366F1',
    PREPARING: '#8B5CF6',
    READY_TO_APPLY: '#A855F7',
    OA: '#F59E0B',
    INTERVIEW: '#F97316',
    OFFER: '#10B981',
    ACCEPTED: '#059669',
    REJECTED: '#EF4444',
    WITHDRAWN: '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
    APPLIED: 'Applied',
    INTERESTED: 'Interested',
    PREPARING: 'Preparing',
    READY_TO_APPLY: 'Ready to Apply',
    OA: 'Online Assessment',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-bold">{payload[0].value} applications</p>
        </div>
    );
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-bold">{payload[0].value}%</p>
        </div>
    );
};

export default function StatsPage() {
    const { data: session, status: authStatus } = useSession();
    const isGuest = authStatus === 'unauthenticated';
    const [days, setDays] = useState(30);

    const { data: stats, isLoading, error } = useGetOverviewStatsQuery(days, { skip: isGuest || authStatus === 'loading' });

    if (authStatus === 'loading' || isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-full gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
                <p className="text-muted-foreground">Loading analytics...</p>
            </div>
        );
    }

    if (isGuest) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center p-10 max-w-md">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Statistics</h2>
                    <p className="text-muted-foreground">Sign in to view your application analytics and insights.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center p-10 max-w-md">
                    <Activity className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Unable to Load Statistics</h2>
                    <p className="text-muted-foreground">Make sure the backend server is running and try again.</p>
                </div>
            </div>
        );
    }

    if (!stats || stats.totalCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center p-10 max-w-md">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">No Data Yet</h2>
                    <p className="text-muted-foreground">Start adding job applications to see your analytics!</p>
                </div>
            </div>
        );
    }

    const maxFunnelCount = Math.max(...(stats.funnelData || []).map((d: any) => d.count), 1);

    return (
        <div className="space-y-6 pb-8">
            {/* Header with Range Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Overview</h1>
                    <p className="text-sm text-muted-foreground">Analytics & Insights</p>
                </div>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    {RANGE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setDays(opt.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                days === opt.value
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 1: Applications Per Day */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-base font-semibold">Applications per day</h2>
                            <p className="text-sm text-muted-foreground">
                                Last {days} days &middot; {stats.totalInRange} total
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Avg / day</p>
                            <div className="flex items-center gap-1">
                                <span className="text-2xl font-bold">{stats.avgPerDay}</span>
                                {stats.avgPerDay > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats.applicationsPerDay} barCategoryGap="15%">
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border)"
                                opacity={0.3}
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                stroke="var(--muted-foreground)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={8}
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                }}
                                interval={days <= 14 ? 0 : days <= 30 ? 2 : 6}
                            />
                            <YAxis
                                stroke="var(--muted-foreground)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                width={24}
                            />
                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.15 }} />
                            <Bar
                                dataKey="count"
                                fill="#F97316"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Section 2: Application → Response Conversion + Funnel */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-base font-semibold">Application &rarr; Response Conversion</h2>
                            <p className="text-sm text-muted-foreground">
                                How many applications received a positive response
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Conversion Rate</p>
                            <div className="flex items-center gap-1">
                                <span className="text-2xl font-bold">{stats.conversionRate}%</span>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.respondedCount} of {stats.totalCount} applications
                            </p>
                        </div>
                    </div>

                    {/* Funnel Label */}
                    <p className="text-xs text-muted-foreground mb-4">
                        Funnel: {stats.funnelData?.map((d: any) => STATUS_LABELS[d.status] || d.status).join(' → ')}
                    </p>

                    {/* Horizontal Bar Funnel */}
                    <div className="space-y-3">
                        {stats.funnelData?.map((item: any) => {
                            const pct = (item.count / maxFunnelCount) * 100;
                            const color = FUNNEL_COLORS[item.status] || '#6B7280';
                            return (
                                <div key={item.status} className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-28 text-right shrink-0">
                                        {STATUS_LABELS[item.status] || item.status}
                                    </span>
                                    <div className="flex-1 h-8 bg-muted/30 rounded overflow-hidden relative">
                                        <div
                                            className="h-full rounded transition-all duration-500"
                                            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold w-8">{item.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Section 3: Conversion Rate Over Time */}
            {stats.conversionOverTime?.length > 1 && (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <h2 className="text-base font-semibold mb-1">Conversion rate over time</h2>
                        <p className="text-sm text-muted-foreground mb-6">Rolling 7-day average</p>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={stats.conversionOverTime}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                    opacity={0.3}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--muted-foreground)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={8}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                    }}
                                    interval={days <= 14 ? 1 : days <= 30 ? 4 : 10}
                                />
                                <YAxis
                                    stroke="var(--muted-foreground)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    width={36}
                                    tickFormatter={(val) => `${val}%`}
                                    domain={[0, 100]}
                                />
                                <Tooltip content={<CustomLineTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#F97316"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#F97316' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Section 4: Response Rate by Source */}
            {stats.responseBySource?.length > 0 && (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-base font-semibold">Response Rate by Source</h2>
                                <p className="text-sm text-muted-foreground">
                                    % of applications that got a response (not rejected or ghosted)
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Response Rate</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-2xl font-bold">{stats.conversionRate}%</span>
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.respondedCount} of {stats.totalCount} applications
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {stats.responseBySource.map((source: any, idx: number) => {
                                const colors = ['#3B82F6', '#A855F7', '#F59E0B', '#06B6D4', '#10B981', '#EF4444'];
                                const color = colors[idx % colors.length];
                                return (
                                    <div key={source.platform} className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-32 text-right shrink-0">
                                            {source.platform} ({source.total})
                                        </span>
                                        <div className="flex-1 h-7 bg-muted/30 rounded overflow-hidden">
                                            <div
                                                className="h-full rounded transition-all duration-500"
                                                style={{
                                                    width: `${Math.max(source.rate, 2)}%`,
                                                    backgroundColor: color,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold w-10">{source.rate}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
