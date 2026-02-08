'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="text-6xl">⚠️</div>
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="text-muted-foreground">
                    An unexpected error occurred. Please try again.
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="text-left text-sm bg-muted p-4 rounded-lg overflow-auto max-h-40">
                        {error.message}
                    </pre>
                )}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                    >
                        Go home
                    </button>
                </div>
            </div>
        </div>
    );
}
