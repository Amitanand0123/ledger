import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  gradient?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatCard({ title, value, description, icon, gradient = 'from-blue-600/10 to-indigo-600/10', trend, trendValue }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border bg-card">
      {/* Gradient overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity', gradient)} />

      {/* Content */}
      <div className="relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-content-secondary">{title}</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {value}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {trend && trendValue && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                trend === 'up' && 'text-green-600 bg-green-50 dark:bg-green-950/30',
                trend === 'down' && 'text-red-600 bg-red-50 dark:bg-red-950/30',
                trend === 'neutral' && 'text-gray-600 bg-gray-50 dark:bg-gray-950/30',
              )}>
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
                {trend === 'neutral' && '→'}
                {trendValue}
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </Card>
  );
}
