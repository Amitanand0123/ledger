import { pgEnum } from 'drizzle-orm/pg-core';

// Document type enum
export const docTypeEnum = pgEnum('DocType', ['RESUME', 'COVER_LETTER']);

// Interview type enum
export const interviewTypeEnum = pgEnum('InterviewType', [
  'PHONE_SCREEN',
  'TECHNICAL',
  'BEHAVIORAL',
  'SYSTEM_DESIGN',
  'CULTURAL_FIT',
  'FINAL_ROUND',
  'OTHER',
]);

// Custom field type enum
export const fieldTypeEnum = pgEnum('FieldType', ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN']);

// Job application status enum
export const jobStatusEnum = pgEnum('JobStatus', [
  'INTERESTED',
  'PREPARING',
  'READY_TO_APPLY',
  'APPLIED',
  'OA',
  'INTERVIEW',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
]);
