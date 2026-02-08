'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, PieLabelRenderProps } from 'recharts';
import { Loader2, TrendingUp, CalendarDays, Percent, Clock, Briefcase, Target, Award, Activity } from 'lucide-react';
import { StatCard } from '@/components/stats/StatCard';
import { useGetStatsQuery } from '@/lib/redux/slices/statsApiSlice';
import { useGetAdvancedStatsQuery } from '@/lib/redux/slices/userApiSlice';

const COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#94A3B8', '#EF4444'];

const pieLabel = (props: PieLabelRenderProps) => {
    const { name, percent } = props;
    if (typeof percent !== 'number'){
        return '';
    }
    const percentage = (percent * 100).toFixed(0);
    return `${name}: ${percentage}%`;
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

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
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
                {/* Bar Chart - Applications Over Time */}
                <Card className="col-span-full lg:col-span-4 overflow-hidden border-0 shadow-lg pt-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -z-10" />
                    <CardHeader className="border-b bg-gradient-to-r from-brand-primary/5 to-transparent pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-brand-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Applications Over Time</CardTitle>
                                <CardDescription>Monthly application activity and trends</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={basicStats.timeSeriesData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9}/>
                                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    }}
                                    cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="url(#barGradient)"
                                    radius={[8, 8, 0, 0]}
                                    name="Applications"
                                    maxBarSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart - Application Funnel */}
                <Card className="col-span-full lg:col-span-3 overflow-hidden border-0 shadow-lg pt-0">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-3xl -z-10" />
                    <CardHeader className="border-b bg-gradient-to-r from-brand-secondary/5 to-transparent pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-brand-secondary/10 flex items-center justify-center">
                                <Award className="h-5 w-5 text-brand-secondary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Application Funnel</CardTitle>
                                <CardDescription>Status distribution breakdown</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <defs>
                                    {COLORS.map((color, index) => (
                                        <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={color} stopOpacity={1}/>
                                            <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
                                        </linearGradient>
                                    ))}
                                </defs>
                                <Pie
                                    data={basicStats.funnelData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={60}
                                    labelLine={false}
                                    label={pieLabel}
                                    paddingAngle={2}
                                >
                                    {basicStats.funnelData.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={`url(#pieGradient-${index % COLORS.length})`} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                />
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
                                <CardTitle className="text-lg">Top Application Sources</CardTitle>
                                <CardDescription>Your most frequently used platforms</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {advancedStats.topPlatforms.map((platform: any, index: number) => (
                                <div
                                    key={platform.name}
                                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/50 to-transparent hover:from-muted transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-sm">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-base">{platform.name}</p>
                                            <p className="text-xs text-muted-foreground">Application platform</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-brand-primary">{platform.count}</p>
                                        <p className="text-xs text-muted-foreground">applications</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}