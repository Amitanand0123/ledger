// backend/src/services/agent.service.ts
import { prisma } from '../config/db.js';
import config from '../config/index.js';
import { getFileBufferFromS3 } from './s3.service.js';
import { logger } from '../utils/logger.js';
import { createDocumentRecord } from './document.service.js';
import { getUploadPresignedUrl } from './s3.service.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import ApiError from '../utils/ApiError.js';

// Import the legacy build for Node.js environments
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export const invokeAgent = async (userId: string, resumeId: string, jobId: string, userGoal:string) => {
    // 1. Get Job Description
    const job = await prisma.jobApplication.findFirst({
        where: { id: jobId, userId },
        select: { description: true }
    });
    if (!job || !job.description) {
        throw new ApiError(404,"Job not found or has no description.");
    }
    
    // 2. Get Resume Document from DB
    const resumeDoc = await prisma.document.findFirst({
        where: { id: resumeId, userId }
    });
    if (!resumeDoc) {
        throw new ApiError(404,"Resume not found.");
    }
    
    // 3. Get the raw PDF file BUFFER from S3
    const resumeFileBuffer = await getFileBufferFromS3(resumeDoc.fileKey);
    if (!resumeFileBuffer) {
        throw new Error("Could not read resume file from storage.");
    }

    // --- PDF Parsing Logic ---
    let resumeText = '';
    try {
        // *** FIX: Convert the Node.js Buffer to a Uint8Array ***
        const uint8Array = new Uint8Array(resumeFileBuffer);

        // Load the PDF document from the converted array.
        const loadingTask = pdfjsLib.getDocument(uint8Array);
        const doc = await loadingTask.promise;
        
        const textItems = [];
        // Iterate through each page of the PDF
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            // Extract the string content from each text item on the page
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            textItems.push(pageText);
        }
        // Join the text from all pages
        resumeText = textItems.join('\n\n');

    } catch (error) {
        logger.error('Failed to parse PDF buffer:', error);
        throw new Error('The resume file appears to be corrupted or is not a valid PDF.');
    }

    // 5. Prepare the request for the AI service
    const agentRequest = {
        user_id: userId,
        resume_text: resumeText,
        job_description: job.description,
        user_goal: userGoal,
    };

    // 6. Call the FastAPI AI Agent
    logger.info(`Invoking AI agent for user ${userId} and job ${jobId}`);
    const response = await fetch(`${config.aiServiceUrl}/agent/invoke`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.aiServiceApiKey}`
        },
        body: JSON.stringify(agentRequest)
    });

    if (!response.ok) {
        let errorDetail = 'An unknown error occurred in the AI service.';
        try {
            const errorBody = await response.json();
            errorDetail = errorBody.detail || JSON.stringify(errorBody);
        } catch (e) {
            errorDetail = await response.text();
        }
        logger.error("AI Agent Invocation Failed:", errorDetail);
        throw new ApiError(502, `The AI agent failed to generate advice: ${errorDetail}`);
    }

    return response.json();
};

export const rebuildResumeAndGeneratePdf = async (userId: string, resumeId: string, jobId: string) => {
    // 1. Get Job and Resume LaTeX Source
    const job = await prisma.jobApplication.findFirst({ where: { id: jobId, userId } });
    const resumeDoc = await prisma.document.findFirst({ where: { id: resumeId, userId } });

    if (!job || !job.description) throw new Error("Job not found or has no description.");
    if (!resumeDoc || !resumeDoc.latexSource) throw new Error("Resume not found or has no LaTeX source code.");

    // 2. Call AI service to get modified LaTeX
    logger.info(`Requesting AI to rebuild resume ${resumeId} for job ${jobId}`);
    const aiResponse = await fetch(`${config.aiServiceUrl}/rebuild-resume-latex`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.aiServiceApiKey}`},
        body: JSON.stringify({
            latex_source: resumeDoc.latexSource,
            job_description: job.description,
        })
    });
    if (!aiResponse.ok) throw new Error("AI service failed to rebuild the resume.");
    const { modified_latex } = await aiResponse.json();

    // 3. Call AI service again to compile LaTeX to PDF
    logger.info(`Requesting AI service to compile LaTeX to PDF`);
    const pdfResponse = await fetch(`${config.aiServiceUrl}/compile-latex-to-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.aiServiceApiKey}`},
        body: JSON.stringify({ latex_source: modified_latex })
    });
    if (!pdfResponse.ok) throw new Error("AI service failed to compile the PDF.");
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);


    // 4. Upload the newly generated PDF to S3
    const newFilename = `Resume_for_${job.company.replace(/\s/g, '_')}.pdf`;
    const s3Client = new S3Client({ region: config.aws.region });
    const key = `uploads/${userId}/generated/${Date.now()}-${newFilename}`;
    
    const command = new PutObjectCommand({
        Bucket: config.aws.s3BucketName,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
    });
    await s3Client.send(command);
    logger.info(`Uploaded generated PDF to S3 with key: ${key}`);

    // 5. Create a new document record for the generated resume
    const newDoc = await createDocumentRecord(userId, newFilename, key, 'RESUME', modified_latex);

    // 6. Return the new document so the frontend can use it
    return {
        message: "Resume rebuilt successfully!",
        newDocument: newDoc,
    };
};