import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { logger } from './logger.js';

/**
 * Text cleaning chain inspired by HireMaze AI's Chain of Responsibility pattern.
 * Fixes common PDF extraction artifacts: encoding issues, CID codes, orphan brackets, whitespace.
 */
function cleanExtractedText(text: string): string {
    let cleaned = text;

    // 1. Fix mojibake / encoding artifacts (common UTF-8 → Latin-1 misreads)
    const mojibakeMap: Record<string, string> = {
        'â€™': '\'', 'â€œ': '"', 'â€\u009d': '"', 'â€"': '—',
        'â€¦': '…', 'Â ': ' ', 'Ã©': 'é', 'Ã¨': 'è', 'Ã±': 'ñ',
        'Ã¼': 'ü', 'Ã¶': 'ö', 'Ã¤': 'ä', 'ï¬': 'fi', 'ï¬‚': 'fl',
    };
    for (const [bad, good] of Object.entries(mojibakeMap)) {
        cleaned = cleaned.replaceAll(bad, good);
    }

    // 2. Remove PDF CID codes (e.g., "(cid:12)" artifacts from bad font encoding)
    cleaned = cleaned.replace(/\(cid:\d+\)/gi, '');

    // 3. Remove orphan brackets / empty parentheses
    cleaned = cleaned.replace(/\(\s*\)/g, '');
    cleaned = cleaned.replace(/\[\s*\]/g, '');

    // 4. Normalize whitespace
    cleaned = cleaned.replace(/[ \t]+/g, ' ');           // Collapse horizontal whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');         // Max 2 consecutive newlines
    cleaned = cleaned.replace(/^\s+$/gm, '');             // Remove whitespace-only lines

    // 5. Fix broken words (hyphens at line breaks)
    cleaned = cleaned.replace(/(\w)-\n(\w)/g, '$1$2');

    // 6. Remove null bytes and control characters (except newline/tab)
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    return cleaned.trim();
}

/**
 * Extract text from a PDF buffer using pdfjs-dist.
 * Returns cleaned, structured text with page separators.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument(uint8Array);
    const doc = await loadingTask.promise;

    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();

        // Group text items by vertical position (Y coordinate) to reconstruct lines
        const lineMap = new Map<number, { x: number; str: string }[]>();
        for (const item of textContent.items) {
            if (!('str' in item) || !item.str.trim()) continue;
            // Round Y to nearest integer to group items on the same line
            const y = Math.round(item.transform[5]);
            if (!lineMap.has(y)) lineMap.set(y, []);
            lineMap.get(y)!.push({ x: item.transform[4], str: item.str });
        }

        // Sort lines top-to-bottom (higher Y = higher on page in PDF coords)
        const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
        const lineTexts: string[] = [];
        for (const y of sortedYs) {
            // Sort items left-to-right within each line
            const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
            lineTexts.push(items.map((item) => item.str).join(' '));
        }

        pages.push(lineTexts.join('\n'));
    }

    const rawText = pages.join('\n\n');
    return cleanExtractedText(rawText);
}

/**
 * Extract hyperlinks from a PDF buffer.
 * Returns an array of { url, anchorText } objects.
 */
export async function extractHyperlinksFromPdf(buffer: Buffer): Promise<{ url: string; anchorText: string }[]> {
    const links: { url: string; anchorText: string }[] = [];
    const seenUrls = new Set<string>();

    try {
        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument(uint8Array);
        const doc = await loadingTask.promise;

        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const annotations = await page.getAnnotations();
            const textContent = await page.getTextContent();

            for (const annotation of annotations) {
                if (annotation.subtype !== 'Link' || !annotation.url) continue;
                const url = annotation.url;
                if (seenUrls.has(url)) continue;
                seenUrls.add(url);

                // Try to find anchor text near the link's bounding box
                let anchorText = '';
                if (annotation.rect) {
                    const [x1, y1, x2, y2] = annotation.rect;
                    const nearbyItems = textContent.items.filter((item) => {
                        if (!('str' in item) || !item.str.trim()) return false;
                        const ix = item.transform[4];
                        const iy = item.transform[5];
                        return ix >= x1 - 5 && ix <= x2 + 5 && iy >= y1 - 5 && iy <= y2 + 5;
                    });
                    anchorText = nearbyItems.map((item) => ('str' in item ? item.str : '')).join(' ').trim();
                }

                links.push({ url, anchorText: anchorText || url });
            }
        }
    } catch (error: unknown) {
        logger.warn('Failed to extract hyperlinks from PDF (non-fatal):', error instanceof Error ? { message: error.message } : undefined);
    }

    return links;
}

/**
 * Categorize extracted hyperlinks into known types.
 */
export function categorizeLinks(links: { url: string; anchorText: string }[]): {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    other: { url: string; anchorText: string }[];
} {
    let linkedin: string | undefined;
    let github: string | undefined;
    let portfolio: string | undefined;
    const other: { url: string; anchorText: string }[] = [];

    for (const link of links) {
        const url = link.url.toLowerCase();
        if (url.includes('linkedin.com')) {
            linkedin = link.url;
        } else if (url.includes('github.com')) {
            github = link.url;
        } else if (
            url.includes('portfolio') ||
            url.includes('personal') ||
            link.anchorText.toLowerCase().includes('portfolio')
        ) {
            portfolio = link.url;
        } else if (!url.includes('mailto:') && !url.includes('tel:')) {
            other.push(link);
        }
    }

    return { linkedin, github, portfolio, other };
}

/**
 * Full extraction: text + hyperlinks + categorized links.
 * Use this as the single entry point for resume PDF processing.
 */
export async function extractFullResumeData(buffer: Buffer): Promise<{
    text: string;
    hyperlinks: { url: string; anchorText: string }[];
    categorizedLinks: ReturnType<typeof categorizeLinks>;
}> {
    const [text, hyperlinks] = await Promise.all([
        extractTextFromPdf(buffer),
        extractHyperlinksFromPdf(buffer),
    ]);

    return {
        text,
        hyperlinks,
        categorizedLinks: categorizeLinks(hyperlinks),
    };
}
