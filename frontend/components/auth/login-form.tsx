'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema } from '@/lib/validations';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl: searchParams?.get('from') || '/',
      });

      if (result?.error) {
        toast.error('Invalid email or password. Please try again.');
      } else if (result?.ok) {
        toast.success('Login successful! Redirecting...');
        router.push(result.url || '/');
        router.refresh();
      }
    } catch (_err) {
      toast.error('An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
      setIsGoogleLoading(true);
      await signIn('google', { callbackUrl: searchParams?.get('from') || '/' });
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
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
          <Input id="email" type="email" {...register('email')} placeholder="name@example.com" className="focus-visible:ring-brand-primary" />
          {errors.email && <p className="text-sm text-red-500 dark:text-red-400">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
          <Input id="password" type="password" {...register('password')} placeholder="••••••••" className="focus-visible:ring-brand-primary" />
          {errors.password && <p className="text-sm text-red-500 dark:text-red-400">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login with Email'}
        </Button>
      </form>
    </div>
  );
}