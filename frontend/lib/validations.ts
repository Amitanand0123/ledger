import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
});

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Password must contain at least one special character.' }),
});

export const jobFormSchema = z.object({
  company: z.string()
    .min(1, { message: 'Company name is required.' })
    .max(100, { message: 'Company name must be less than 100 characters.' }),
  position: z.string()
    .min(1, { message: 'Position is required.' })
    .max(100, { message: 'Position must be less than 100 characters.' }),
  location: z.string()
    .min(1, { message: 'Location is required.' })
    .max(100, { message: 'Location must be less than 100 characters.' }),
  status: z.string().min(1, { message: 'Status is required.' }),
  salary: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      // Allow formats like: $120,000, $120k, $120K, 120000, $120,000/year, etc.
      return /^(\$)?[\d,]+[kK]?(\/year|\/yr|\/hour|\/hr)?$/.test(val.trim());
    }, { message: 'Please use a valid salary format (e.g., $120,000 or $120k)' }),
  url: z.string()
    .url({ message: 'Please enter a valid URL.' })
    .optional()
    .or(z.literal('')),
  description: z.string()
    .max(10000, { message: 'Description must be less than 10,000 characters.' })
    .optional(),
  deadline: z.string().optional().nullable(),
  platformName: z.string().optional().nullable(),
  resumeId: z.string().optional().nullable(),
  coverLetterId: z.string().optional().nullable(),
}).passthrough();


export const userProfileSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});

export const userPasswordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'Current password is required.' }),
    newPassword: z.string()
        .min(8, { message: 'New password must be at least 8 characters.' })
        .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter.' })
        .regex(/[a-z]/, { message: 'Must contain at least one lowercase letter.' })
        .regex(/[0-9]/, { message: 'Must contain at least one number.' })
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Must contain at least one special character.' }),
}).refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password.',
    path: ['newPassword'],
});

export const customFieldSchema = z.object({
    name: z.string().min(2, { message: 'Field name is required.' }),
    type: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN']),
});