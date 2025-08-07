'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UpdateProfileForm } from './update-profile-form';
import { ChangePasswordForm } from './change-password-form';

interface ProfileSettingsTabProps {
  isPasswordAuth: boolean;
}

export function ProfileSettingsTab({ isPasswordAuth }: ProfileSettingsTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateProfileForm />
        </CardContent>
      </Card>
      
      {isPasswordAuth && (
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}