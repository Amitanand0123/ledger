import { DefaultSession } from 'next-auth';

// Status is now a flexible string to allow for custom values.
export type Status = string;

export type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN';

export interface CustomField {
    id: string;
    name: string;
    type: FieldType;
}

export interface CustomFieldValue {
    id: string;
    value: string;
    customField: CustomField;
    customFieldId: string;
}

export interface JobPlatform {
    id:string;
    name: string;
}

export interface UserDocument {
    id: string;
    filename: string;
    fileKey: string;
    type: 'RESUME' | 'COVER_LETTER';
    createdAt: string;
    latexSource?: string | null;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  salary?: string | null;
  url?: string | null;
  description?: string | null;
  summary?: string | null;
  applicationDate: string; // ISO date string
  status: Status;
  order: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysisCount?: number;
  
  platformId?: string | null;
  platform?: JobPlatform | null;
  
  // Updated document fields
  resumeId?: string | null;
  resume?: UserDocument | null;
  coverLetterId?: string | null;
  coverLetter?: UserDocument | null;

  interviewDate?: string | null;
  statusHistory?: any[]; 
  customFieldValues?: CustomFieldValue[];
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accessToken?: string;
  }
}