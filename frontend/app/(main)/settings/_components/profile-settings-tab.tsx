'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UpdateProfileForm } from './update-profile-form';
import { ChangePasswordForm } from './change-password-form';
import { User, Lock, Shield } from 'lucide-react';

interface ProfileSettingsTabProps {
  isPasswordAuth: boolean;
}

export function ProfileSettingsTab({ isPasswordAuth }: ProfileSettingsTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="overflow-hidden border-0 shadow-lg pt-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl -z-10" />
        <CardHeader className="border-b bg-gradient-to-r from-brand-primary/5 to-transparent pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-brand-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Profile Information</CardTitle>
              <CardDescription className="text-xs">Update your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <UpdateProfileForm />
        </CardContent>
      </Card>

      {isPasswordAuth && (
        <Card className="overflow-hidden border-0 shadow-lg pt-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -z-10" />
          <CardHeader className="border-b bg-gradient-to-r from-red-500/5 to-transparent pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Lock className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-sm">Security</CardTitle>
                <CardDescription className="text-xs">Change your password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium">Keep your account secure</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use a strong password with at least 8 characters
                  </p>
                </div>
              </div>
              <ChangePasswordForm />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}