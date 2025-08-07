import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
});

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export const jobFormSchema = z.object({
  company: z.string().min(1, { message: 'Company name is required.' }),
  position: z.string().min(1, { message: 'Position is required.' }),
  location: z.string().min(1, { message: 'Location is required.' }),
  status: z.string().min(1, { message: 'Status is required.' }),
  
  // Optional fields
  salary: z.string().optional(),
  url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  description: z.string().optional(),
  // FIXED: Renamed to platformName to reflect new data structure
  platformName: z.string().optional().nullable(),
  
  // Updated document fields
  resumeId: z.string().optional().nullable(),
  coverLetterId: z.string().optional().nullable(),

}).catchall(z.any());


export const userProfileSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});

export const userPasswordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'Current password is required.' }),
    newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
}).refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password.',
    path: ['newPassword'],
});

export const customFieldSchema = z.object({
    name: z.string().min(2, { message: 'Field name is required.' }),
    type: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN']),
});