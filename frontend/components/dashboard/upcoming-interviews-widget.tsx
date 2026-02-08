'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Calendar, Clock, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

interface UpcomingInterview {
  id: string;
  type: string;
  scheduledAt: string;
  duration?: number | null;
  location?: string | null;
  completed: boolean;
  job: {
    id: string;
    company: string;
    position: string;
    status: string;
  };
}

const interviewTypeLabels: Record<string, string> = {
  PHONE_SCREEN: 'Phone Screen',
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  SYSTEM_DESIGN: 'System Design',
  CULTURAL_FIT: 'Cultural Fit',
  FINAL_ROUND: 'Final Round',
  OTHER: 'Other',
};

export function UpcomingInterviewsWidget() {
  const { data: session } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState<UpcomingInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUpcomingInterviews = async () => {
      if (!session?.accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/interviews/upcoming?limit=5`,
          {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
            },
            signal: controller.signal,
          },
        );

        if (response.ok) {
          const result = await response.json();
          setInterviews(result.data || []);
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to fetch upcoming interviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingInterviews();

    return () => {
      controller.abort();
    };
  }, [session]);

  if (!session) return null;

  return (
    <Card className="overflow-hidden border-l-4 border-l-blue-600 dark:border-l-blue-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <CardTitle>Upcoming Interviews</CardTitle>
            <CardDescription>Your scheduled interviews</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No upcoming interviews</p>
            <p className="text-xs mt-1">Schedule interviews from job details</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => {
              const interviewDate = new Date(interview.scheduledAt);
              const isUpcoming = isFuture(interviewDate);
              const timeUntil = formatDistanceToNow(interviewDate, { addSuffix: true });

              return (
                <div
                  key={interview.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/jobs/${interview.job.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {interviewTypeLabels[interview.type]}
                        </span>
                        {isUpcoming && (
                          <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {timeUntil}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {interview.job.company} - {interview.job.position}
                      </p>
                      <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(interviewDate, 'EEE, MMM d')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(interviewDate, 'h:mm a')}
                            {interview.duration && ` (${interview.duration} min)`}
                          </span>
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{interview.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
