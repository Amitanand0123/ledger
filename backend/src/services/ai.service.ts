import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
}
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const URL_FETCH_TIMEOUT_MS = 30_000;

const PROMPT_TEMPLATE = `
    You are an expert career coach providing analysis for a job application tracking tool.
    Analyze the following job description and provide a concise, well-formatted analysis in Markdown.

    The analysis must include:
    1.  **Top 5 Keywords:** A bulleted list of the most critical keywords and technologies mentioned.
    2.  **Skill Gap Analysis:** A brief, 1-2 sentence paragraph identifying potential skill gaps a typical applicant might have.
    3.  **Resume Tailoring Tips:** Two actionable bullet points on how to tailor a resume for this specific role.

    **NO-HALLUCINATION RULE:** Only extract keywords and technologies that are explicitly mentioned in the job description. Do not invent or assume requirements that are not stated. Base all analysis solely on the provided text.

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

const URL_EXTRACT_PROMPT = `
You are a job posting data extractor. Given the raw text content scraped from a job posting webpage, extract the following fields as a JSON object:

{
  "position": "The job title/position name",
  "company": "The company/organization name",
  "location": "The job location (city, state, remote, etc.)",
  "description": "The full job description including responsibilities, requirements, qualifications, etc."
}

Rules:
- Return ONLY valid JSON, no markdown, no code fences, no extra text.
- If a field cannot be determined, use an empty string "".
- For "description", include the complete job details — responsibilities, requirements, qualifications, benefits, etc.
- Do NOT invent or fabricate information. Only extract what is present in the text.

Raw page text:
---
{PAGE_TEXT}
---
`;

export const extractJobFromUrl = async (url: string): Promise<{
    position: string;
    company: string;
    location: string;
    description: string;
}> => {
    let pageText: string;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(URL_FETCH_TIMEOUT_MS),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
        }
        const html = await response.text();
        // Strip HTML tags and decode common entities
        pageText = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    } catch (error: any) {
        logger.error('Failed to fetch job URL:', error);
        throw new Error(
            error.name === 'TimeoutError'
                ? 'The URL took too long to respond. Please try pasting the job description manually.'
                : `Could not fetch the URL: ${error.message}`
        );
    }

    // Truncate to avoid exceeding token limits (first ~15000 chars should contain job details)
    const truncatedText = pageText.slice(0, 15000);

    const prompt = URL_EXTRACT_PROMPT.replace('{PAGE_TEXT}', truncatedText);

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Parse JSON from response (handle potential markdown fences)
        const jsonStr = text.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        const parsed = JSON.parse(jsonStr);

        return {
            position: parsed.position || '',
            company: parsed.company || '',
            location: parsed.location || '',
            description: parsed.description || '',
        };
    } catch (error) {
        logger.error('Failed to extract job data from URL:', error);
        throw new Error(
            'Could not extract job details from the URL. Please try pasting the job description manually.'
        );
    }
};