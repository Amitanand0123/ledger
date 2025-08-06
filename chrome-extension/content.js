/**
 * A helper function to safely query the DOM and return the text content.
 * @param {string} selector - The CSS selector to find the element.
 * @returns {string|null} The trimmed text content of the element or null if not found.
 */
const getText = (selector) => {
    const element = document.querySelector(selector);
    return element ? element.innerText.trim() : null;
};

// --- Scraper for LinkedIn ---
const scrapeLinkedIn = () => {
    console.log("Ledger: Running LinkedIn scraper...");
    const position = getText('.job-details-jobs-unified-top-card__job-title, .top-card-layout__title');
    // The company name is often a link within a specific container
    const company = getText('.job-details-jobs-unified-top-card__company-name a, .topcard__org-name-link');
    const location = getText('.job-details-jobs-unified-top-card__primary-description-container > div > span:last-child, .topcard__flavor--bullet');
    const descriptionElement = document.querySelector('#job-details, .description__text');
    
    if (!position || !company) {
        console.warn("Ledger: Could not find essential fields (position/company) on LinkedIn page.");
        return null; // Essential fields are missing
    }

    return {
        position,
        company,
        location,
        description: descriptionElement ? descriptionElement.innerText : '',
    };
};

// --- Scraper for Indeed ---
const scrapeIndeed = () => {
    console.log("Ledger: Running Indeed scraper...");
    const position = getText('[data-testid="JobInfoHeader-title"]');
    // Indeed often puts the company name in a data attribute
    const companyElement = document.querySelector('[data-testid="JobInfoHeader-companyName"]');
    const company = companyElement ? companyElement.innerText.trim() : null;
    const location = getText('[data-testid="JobInfoHeader-companyLocation"]');
    const descriptionElement = document.querySelector('#jobDescriptionText');
    
    if (!position || !company) {
        console.warn("Ledger: Could not find essential fields (position/company) on Indeed page.");
        return null;
    }

    return {
        position,
        company,
        location,
        description: descriptionElement ? descriptionElement.innerText : '',
    };
};

// --- Scraper for Glassdoor ---
const scrapeGlassdoor = () => {
    console.log("Ledger: Running Glassdoor scraper...");
    // Glassdoor often uses data-test attributes which are more stable
    const position = getText('[data-test="job-title"]');
    const company = getText('[data-test="employer-name"]');
    const location = getText('[data-test="location"]');
    const descriptionElement = document.querySelector('.jobDescriptionContent');

    if (!position || !company) {
        console.warn("Ledger: Could not find essential fields (position/company) on Glassdoor page.");
        return null;
    }

    return {
        position,
        company,
        location,
        description: descriptionElement ? descriptionElement.innerText : '',
    };
};


// --- The Scraper Router ---
// This object maps hostnames to the correct scraper function.
const scraperRouter = {
    'www.linkedin.com': scrapeLinkedIn,
    'linkedin.com': scrapeLinkedIn,
    'www.indeed.com': scrapeIndeed,
    'indeed.com': scrapeIndeed,
    'www.glassdoor.com': scrapeGlassdoor,
    'glassdoor.com': scrapeGlassdoor,
};

// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'scrape') {
        const hostname = window.location.hostname;
        const scraper = scraperRouter[hostname];

        if (scraper) {
            try {
                const jobData = scraper();
                if (jobData) {
                    sendResponse({ success: true, data: jobData });
                } else {
                    // Scraper ran but failed to find key elements
                    sendResponse({ success: false, error: "Could not find job details on this page." });
                }
            } catch (error) {
                console.error("Ledger: Error during scraping:", error);
                sendResponse({ success: false, error: "An unexpected error occurred while scraping." });
            }
        } else {
            // No scraper found for this website
            console.log(`Ledger: No scraper available for ${hostname}`);
            sendResponse({ success: false, error: `This website (${hostname}) is not supported yet.` });
        }
    }
    return true; // Indicates an asynchronous response
});