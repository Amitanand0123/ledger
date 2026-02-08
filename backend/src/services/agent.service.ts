import { db } from '../db/client.js';
import { jobApplications, documents } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import config from '../config/index.js';
import { getFileBufferFromS3 } from './s3.service.js';
import { logger } from '../utils/logger.js';
import { createDocumentRecord } from './document.service.js';
import { getUploadPresignedUrl } from './s3.service.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import ApiError from '../utils/ApiError.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export const invokeAgent = async (userId: string, resumeId: string, jobId: string, userGoal: string) => {
    const [job] = await db
        .select({ description: jobApplications.description })
        .from(jobApplications)
        .where(and(eq(jobApplications.id, jobId), eq(jobApplications.userId, userId)))
        .limit(1);

    if (!job || !job.description) {
        throw new ApiError(404, 'Job not found or has no description.');
    }

    const [resumeDoc] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, resumeId), eq(documents.userId, userId)))
        .limit(1);

    if (!resumeDoc) {
        throw new ApiError(404, 'Resume not found.');
    }

    const resumeFileBuffer = await getFileBufferFromS3(resumeDoc.fileKey);
    if (!resumeFileBuffer) {
        throw new Error('Could not read resume file from storage.');
    }

    let resumeText = '';
    try {
        const uint8Array = new Uint8Array(resumeFileBuffer);

        const loadingTask = pdfjsLib.getDocument(uint8Array);
        const doc = await loadingTask.promise;

        const textItems = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ');
            textItems.push(pageText);
        }
        resumeText = textItems.join('\n\n');
    } catch (error) {
        logger.error('Failed to parse PDF buffer:', error);
        throw new Error('The resume file appears to be corrupted or is not a valid PDF.');
    }
    const agentRequest = {
        user_id: userId,
        resume_text: resumeText,
        job_description: job.description,
        user_goal: userGoal,
    };
    logger.info(`Invoking AI agent for user ${userId} and job ${jobId}`);
    const response = await fetch(`${config.aiServiceUrl}/agent/invoke`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.aiServiceApiKey}`,
        },
        body: JSON.stringify(agentRequest),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorDetail = errorText;
        try {
            const errorBody = JSON.parse(errorText);
            errorDetail = errorBody.detail || JSON.stringify(errorBody);
        } catch (e) {}
        logger.error('AI Agent Invocation Failed:', errorDetail);
        throw new ApiError(502, `The AI agent failed to generate advice: ${errorDetail}`);
    }

    return response.json();
};

export const rebuildResumeAndGeneratePdf = async (userId: string, resumeId: string, jobId: string) => {
    const [job] = await db
        .select()
        .from(jobApplications)
        .where(and(eq(jobApplications.id, jobId), eq(jobApplications.userId, userId)))
        .limit(1);

    const [resumeDoc] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, resumeId), eq(documents.userId, userId)))
        .limit(1);

    if (!job || !job.description) throw new Error('Job not found or has no description.');
    if (!resumeDoc || !resumeDoc.latexSource) throw new Error('Resume not found or has no LaTeX source code.');

    logger.info(`Requesting AI to rebuild resume ${resumeId} for job ${jobId}`);
    const aiResponse = await fetch(`${config.aiServiceUrl}/rebuild-resume-latex`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.aiServiceApiKey}` },
        body: JSON.stringify({
            latex_source: resumeDoc.latexSource,
            job_description: job.description,
        }),
    });
    if (!aiResponse.ok) throw new Error('AI service failed to rebuild the resume.');
    const { modified_latex } = await aiResponse.json();

    logger.info(`Requesting AI service to compile LaTeX to PDF`);
    const pdfResponse = await fetch(`${config.aiServiceUrl}/compile-latex-to-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.aiServiceApiKey}` },
        body: JSON.stringify({ latex_source: modified_latex }),
    });
    if (!pdfResponse.ok) throw new Error('AI service failed to compile the PDF.');
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    const newFilename = `Resume_for_${job.company.replace(/\s/g, '_')}.pdf`;
    const s3Client = new S3Client({ region: config.aws.region });
    const key = `uploads/${userId}/generated/${Date.now()}-${newFilename}`;

    const command = new PutObjectCommand({
        Bucket: config.aws.s3BucketName,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
    });
    await s3Client.send(command);
    logger.info(`Uploaded generated PDF to S3 with key: ${key}`);

    const newDoc = await createDocumentRecord(userId, newFilename, key, 'RESUME', modified_latex);

    return {
        message: 'Resume rebuilt successfully!',
        newDocument: newDoc,
    };
};
