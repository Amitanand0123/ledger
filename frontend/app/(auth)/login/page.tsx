import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import { Package2 } from 'lucide-react';
import { Suspense } from 'react';

function LoginPageContent() {
    return <LoginForm />
}

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <Link href="/" className="inline-block mb-4">
                        <Package2 className="h-8 w-8 text-brand-primary" />
                    </Link>
                    <h1 className="text-3xl font-bold">Welcome Back</h1>
                    <p className="text-muted-foreground">Log in to access your job board.</p>
                </div>

                <div className="bg-card p-6 sm:p-8 rounded-lg shadow-md">
                   <Suspense fallback={<div>Loading...</div>}>
                        <LoginPageContent />
                   </Suspense>
                </div>
                
                <p className="px-8 text-center text-sm text-muted-foreground mt-6">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}