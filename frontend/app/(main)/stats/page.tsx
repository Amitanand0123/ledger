// frontend/app/(main)/stats/page.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, PieLabelRenderProps } from 'recharts';
import { Loader2 } from "lucide-react";

// Using your brand colors for the charts
const COLORS = ['#8DBCC7', '#A4CCD9', '#EBFFD8', '#C4E1E6', '#a3a3a3', '#f87171'];

export default function StatsPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!session?.accessToken) return;
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/stats`, {
                    headers: { 'Authorization': `Bearer ${session.accessToken}` }
                });
                if (!res.ok) throw new Error("Failed to fetch application statistics.");
                const data = await res.json();
                setStats(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchStats();
        } else if (session === null) {
            // Handle guest user state
            setError("Statistics are only available for logged-in users.");
            setLoading(false);
        }

    }, [session]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-brand-primary" /></div>;
    }
    if (error) {
        return <div className="text-center p-10 text-slate-500 dark:text-slate-400">{error}</div>;
    }
    if (!stats || stats.totalApplications === 0) {
        return <div className="text-center p-10 text-slate-500 dark:text-slate-400">No application data available to generate stats yet.</div>;
    }

    const pieLabel = (props: PieLabelRenderProps) => {
        const { name, percent } = props;
        if (percent === undefined) return '';
        const percentage = (percent * 100).toFixed(0);
        return `${name}: ${percentage}%`;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">
                My Statistics
            </h1>
            <Card className="bg-brand-primary text-white">
                <CardHeader>
                    <CardTitle>Total Applications</CardTitle>
                    <CardDescription className="text-slate-100">Your job search at a glance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-5xl font-bold">{stats.totalApplications}</p>
                </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-full lg:col-span-4 border-t-4 border-brand-secondary">
                    <CardHeader>
                        <CardTitle>Applications Over Time</CardTitle>
                        <CardDescription>Monthly application activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={stats.timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                    }}
                                />
                                <Bar dataKey="count" fill="#8DBCC7" radius={[4, 4, 0, 0]} name="Applications" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-full lg:col-span-3 border-t-4 border-brand-accent-light">
                     <CardHeader>
                        <CardTitle>Application Funnel</CardTitle>
                        <CardDescription>Distribution of your current application statuses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie data={stats.funnelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={pieLabel}>
                                    {stats.funnelData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                     contentStyle={{
                                        background: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}