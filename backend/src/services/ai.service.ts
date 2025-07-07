import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import { logger } from '../utils/logger';

if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
}
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const PROMPT_TEMPLATE = `
    You are an expert career coach providing analysis for a job application tracking tool.
    Analyze the following job description and provide a concise, well-formatted analysis in Markdown.

    The analysis must include:
    1.  **Top 5 Keywords:** A bulleted list of the most critical keywords and technologies mentioned.
    2.  **Skill Gap Analysis:** A brief, 1-2 sentence paragraph identifying potential skill gaps a typical applicant might have.
    3.  **Resume Tailoring Tips:** Two actionable bullet points on how to tailor a resume for this specific role.

    Keep the tone encouraging and professional. Do not include a title, start directly with the first heading.

    Job Description:
    ---
    {JOB_DESCRIPTION}
    ---
`;

export const analyzeJobDescription = async (
    jobDescription?: string | null
): Promise<string | null> => {
    if (!jobDescription || jobDescription.trim().length < 100) {
        return 'Analysis not available. The job description is too short or missing.';
    }

    const prompt = PROMPT_TEMPLATE.replace(
        '{JOB_DESCRIPTION}',
        jobDescription
    );

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        logger.error('Gemini API call failed:', error);
        throw new Error(
            'Could not generate AI analysis at this time. Please try again later.'
        );
    }
};