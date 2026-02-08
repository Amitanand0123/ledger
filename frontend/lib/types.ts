import { DefaultSession } from 'next-auth';

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

export type InterviewType =
  | 'PHONE_SCREEN'
  | 'TECHNICAL'
  | 'BEHAVIORAL'
  | 'SYSTEM_DESIGN'
  | 'CULTURAL_FIT'
  | 'FINAL_ROUND'
  | 'OTHER';

export interface Interview {
  id: string;
  jobId: string;
  type: InterviewType;
  scheduledAt: string;
  duration?: number | null;
  location?: string | null;
  notes?: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  content: string;
  jobId: string;
  userId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
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
  applicationDate: string;
  deadline?: string | null;
  status: Status;
  order: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysisCount?: number;

  platformId?: string | null;
  platform?: JobPlatform | null;

  resumeId?: string | null;
  resume?: UserDocument | null;
  coverLetterId?: string | null;
  coverLetter?: UserDocument | null;

  interviewDate?: string | null;
  interviews?: Interview[];
  notes?: Note[];
  statusHistory?: any[];
  customFieldValues?: CustomFieldValue[];
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    user: {
      id?: string | null;
      onboardingCompleted?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    onboardingCompleted?: boolean;
    error?: string;
  }
}