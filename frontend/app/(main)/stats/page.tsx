'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, PieLabelRenderProps } from 'recharts';
import { Loader2, TrendingUp, CalendarDays, Percent, Clock } from 'lucide-react';
import { StatCard } from '@/components/stats/StatCard';
import { useGetStatsQuery } from '@/lib/redux/slices/statsApiSlice';
import { useGetAdvancedStatsQuery } from '@/lib/redux/slices/userApiSlice';

const COLORS = ['#8DBCC7', '#A4CCD9', '#EBFFD8', '#C4E1E6', '#a3a3a3', '#f87171'];

const pieLabel = (props: PieLabelRenderProps) => {
    const { name, percent } = props;
    if (percent === undefined) return '';
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
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-brand-primary" /></div>;
    }
    if (error) {
        return <div className="text-center p-10 text-destructive font-semibold">Failed to load statistics. Please try again later.</div>;
    }
    if (!basicStats || basicStats.totalApplications === 0) {
        return <div className="text-center p-10 text-muted-foreground">No application data available to generate stats yet.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold">
                My Statistics
            </h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Apps (Last 7 Days)" 
                    value={advancedStats?.applicationsThisWeek ?? 0}
                    icon={<CalendarDays className="h-4 w-4 text-muted-foreground"/>}
                />
                <StatCard 
                    title="Interviews (Last 7 Days)" 
                    value={advancedStats?.interviewsThisWeek ?? 0}
                    icon={<TrendingUp className="h-4 w-4 text-muted-foreground"/>}
                />
                <StatCard 
                    title="Interview Rate" 
                    value={`${advancedStats?.applicationToInterviewRate ?? 0}%`}
                    description="Of all applications"
                    icon={<Percent className="h-4 w-4 text-muted-foreground"/>}
                />
                <StatCard 
                    title="Avg. Time to Interview" 
                    value={advancedStats?.averageTimeToInterview ? `${advancedStats.averageTimeToInterview} days` : 'N/A'}
                    description="From application date"
                    icon={<Clock className="h-4 w-4 text-muted-foreground"/>}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-full lg:col-span-4 border-t-4 border-brand-secondary">
                    <CardHeader>
                        <CardTitle>Applications Over Time</CardTitle>
                        <CardDescription>Monthly application activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={basicStats.timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                <Bar dataKey="count" fill="#8DBCC7" radius={[4, 4, 0, 0]} name="Applications" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-full lg:col-span-3 border-t-4 border-brand-accent-light">
                     <CardHeader>
                        <CardTitle>Application Funnel</CardTitle>
                        <CardDescription>Distribution of your current statuses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie data={basicStats.funnelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={pieLabel}>
                                    {basicStats.funnelData.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            
            {advancedStats?.topPlatforms?.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Top Application Sources</CardTitle>
                        <CardDescription>Your most frequently used platforms.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {advancedStats.topPlatforms.map((platform: any) => (
                                <li key={platform.name} className="flex justify-between items-center text-sm">
                                    <span>{platform.name}</span>
                                    <span className="font-semibold">{platform.count} applications</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}