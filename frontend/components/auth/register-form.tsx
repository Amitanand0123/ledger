'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerSchema } from '@/lib/validations';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    const registrationPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(async (response) => {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to register');
        }
        return response.json();
    });

    toast.promise(registrationPromise, {
        loading: 'Creating your account...',
        success: async () => {
            await signIn('credentials', { redirect: false, email: data.email, password: data.password });
            router.push('/');
            router.refresh();
            return 'Account created! Logging you in...';
        },
        error: (err) => {
            setIsLoading(false);
            return err.message || 'An unexpected error occurred.';
        },
    });
  };
  
  const handleGoogleSignIn = async () => {
      setIsGoogleLoading(true);
      await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
          {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
             <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-67.4 64.8C295.5 99.5 272.8 88 248 88c-73.2 0-133.1 59.9-133.1 133.1s59.9 133.1 133.1 133.1c76.9 0 115.1-53.2 120.3-79.6H248V261.8h239.2z"></path></svg>
          )}
          Continue with Google
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or create an account with email</span></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" {...register('name')} placeholder="John Doe" className="focus-visible:ring-brand-primary" />
          {errors.name && <p className="text-sm text-red-500 dark:text-red-400">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} placeholder="name@example.com" className="focus-visible:ring-brand-primary" />
          {errors.email && <p className="text-sm text-red-500 dark:text-red-400">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} placeholder="At least 6 characters" className="focus-visible:ring-brand-primary" />
          {errors.password && <p className="text-sm text-red-500 dark:text-red-400">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
        </Button>
      </form>
    </div>
  );
}