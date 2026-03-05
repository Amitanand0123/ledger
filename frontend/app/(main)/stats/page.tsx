'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip,
    XAxis, YAxis, PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import { Loader2, TrendingUp, CalendarDays, Percent, Clock, Briefcase, Target, Award, Activity } from 'lucide-react';
import { StatCard } from '@/components/stats/StatCard';
import { useGetStatsQuery } from '@/lib/redux/slices/statsApiSlice';
import { useGetAdvancedStatsQuery } from '@/lib/redux/slices/userApiSlice';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
        }}>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>
                {payload[0].value} applications
            </p>
        </div>
    );
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value, payload: data } = payload[0];
    return (
        <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        }}>
            <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: data?.fill || COLORS[0],
                flexShrink: 0,
            }} />
            <div>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>{name}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{value}</p>
            </div>
        </div>
    );
};

const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px', paddingTop: 12 }}>
            {payload?.map((entry: any, index: number) => (
                <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: entry.color,
                    }} />
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function StatsPage() {
    const { data: session } = useSession();

    const { data: basicStats, isLoading: isLoadingBasic, error: errorBasic } = useGetStatsQuery(undefined, { skip: !session });
    const { data: advancedStats, isLoading: isLoadingAdvanced, error: errorAdvanced } = useGetAdvancedStatsQuery(undefined, { skip: !session });

    const isLoading = isLoadingBasic || isLoadingAdvanced;
    const error = errorBasic || errorAdvanced;

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-full gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
                <p className="text-muted-foreground">Loading your statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center p-10 max-w-md">
                    <Activity className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Unable to Load Statistics</h2>
                    <p className="text-muted-foreground">We encountered an issue loading your data. Please try again later.</p>
                </div>
            </div>
        );
    }

    if (!basicStats || basicStats.totalApplications === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center p-10 max-w-md">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">No Data Yet</h2>
                    <p className="text-muted-foreground">Start adding job applications to see your statistics and track your progress!</p>
                </div>
            </div>
        );
    }

    const totalApplications = basicStats.funnelData?.reduce((sum: number, d: any) => sum + d.value, 0) || 0;

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Your Job Search Analytics
                </h1>
                <p className="text-sm text-muted-foreground">Track your application performance and insights at a glance</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Apps This Week"
                    value={advancedStats?.applicationsThisWeek ?? 0}
                    icon={<CalendarDays className="h-5 w-5 text-brand-primary"/>}
                    gradient="from-blue-500/20 to-cyan-500/20"
                    description="Last 7 days"
                />
                <StatCard
                    title="Interviews Scheduled"
                    value={advancedStats?.interviewsThisWeek ?? 0}
                    icon={<Briefcase className="h-5 w-5 text-emerald-600"/>}
                    gradient="from-emerald-500/20 to-green-500/20"
                    description="Last 7 days"
                />
                <StatCard
                    title="Interview Rate"
                    value={`${advancedStats?.applicationToInterviewRate ?? 0}%`}
                    description="Of all applications"
                    icon={<Percent className="h-5 w-5 text-purple-600"/>}
                    gradient="from-purple-500/20 to-pink-500/20"
                />
                <StatCard
                    title="Avg. Response Time"
                    value={advancedStats?.averageTimeToInterview ? `${advancedStats.averageTimeToInterview} days` : 'N/A'}
                    description="From application date"
                    icon={<Clock className="h-5 w-5 text-orange-600"/>}
                    gradient="from-orange-500/20 to-amber-500/20"
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Area/Bar Chart - Applications Over Time */}
                <Card className="col-span-full lg:col-span-4 overflow-hidden border-0 shadow-lg pt-0">
                    <CardHeader className="border-b bg-gradient-to-r from-brand-primary/5 to-transparent pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-brand-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Applications Over Time</CardTitle>
                                <CardDescription className="text-xs">Monthly application activity</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 pr-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={basicStats.timeSeriesData} barCategoryGap="20%">
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                    opacity={0.15}
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--muted-foreground)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={8}
                                />
                                <YAxis
                                    stroke="var(--muted-foreground)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    width={30}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.08, radius: 6 }} />
                                <Bar
                                    dataKey="count"
                                    fill="#3B82F6"
                                    radius={[6, 6, 0, 0]}
                                    name="Applications"
                                    maxBarSize={48}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart - Application Funnel */}
                <Card className="col-span-full lg:col-span-3 overflow-hidden border-0 shadow-lg pt-0">
                    <CardHeader className="border-b bg-gradient-to-r from-brand-secondary/5 to-transparent pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-brand-secondary/10 flex items-center justify-center">
                                <Award className="h-5 w-5 text-brand-secondary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Application Funnel</CardTitle>
                                <CardDescription className="text-xs">Status distribution breakdown</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={basicStats.funnelData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="45%"
                                    outerRadius={95}
                                    innerRadius={55}
                                    paddingAngle={3}
                                    stroke="var(--card)"
                                    strokeWidth={2}
                                    cornerRadius={4}
                                >
                                    {basicStats.funnelData.map((_entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                {/* Center label */}
                                <text x="50%" y="42%" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 24, fontWeight: 700, fill: 'var(--foreground)' }}>
                                    {totalApplications}
                                </text>
                                <text x="50%" y="52%" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fill: 'var(--muted-foreground)' }}>
                                    Total
                                </text>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend content={renderCustomLegend} verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top Platforms Section */}
            {advancedStats?.topPlatforms?.length > 0 && (
                <Card className="overflow-hidden border-0 shadow-lg pt-0">
                    <CardHeader className="border-b bg-gradient-to-r from-orange-500/5 to-transparent pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Top Application Sources</CardTitle>
                                <CardDescription className="text-xs">Your most frequently used platforms</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {advancedStats.topPlatforms.map((platform: any, index: number) => {
                                const maxCount = advancedStats.topPlatforms[0]?.count || 1;
                                const percentage = (platform.count / maxCount) * 100;
                                return (
                                    <div
                                        key={platform.name}
                                        className="relative flex items-center justify-between p-3 rounded-lg overflow-hidden hover:bg-muted/30 transition-all group"
                                    >
                                        {/* Progress bar background */}
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-lg opacity-10 group-hover:opacity-15 transition-opacity"
                                            style={{
                                                width: `${percentage}%`,
                                                background: COLORS[index % COLORS.length],
                                            }}
                                        />
                                        <div className="relative flex items-center gap-3">
                                            <div
                                                className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs text-white"
                                                style={{ background: COLORS[index % COLORS.length] }}
                                            >
                                                #{index + 1}
                                            </div>
                                            <p className="font-medium text-sm">{platform.name}</p>
                                        </div>
                                        <div className="relative">
                                            <p className="text-sm font-bold" style={{ color: COLORS[index % COLORS.length] }}>{platform.count}</p>
                                        </div>
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
