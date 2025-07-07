import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';
import { Package2 } from 'lucide-react';

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <Link href="/" className="inline-block mb-4">
                        <Package2 className="h-8 w-8 text-brand-primary" />
                    </Link>
                    <h1 className="text-3xl font-bold">Create an Account</h1>
                    <p className="text-muted-foreground">
                        Start tracking your job applications today.
                    </p>
                </div>

                <div className="bg-card p-6 sm:p-8 rounded-lg shadow-md">
                    <RegisterForm />
                </div>
                
                <p className="px-8 text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}