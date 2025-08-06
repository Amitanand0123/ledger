// Views
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');
const loadingView = document.getElementById('loading-view');
const successView = document.getElementById('success-view');

// Form elements
const jobForm = document.getElementById('job-form');
const positionInput = document.getElementById('position');
const companyInput = document.getElementById('company');
const locationInput = document.getElementById('location');
const salaryInput = document.getElementById('salary');
const descriptionInput = document.getElementById('description');
const addJobBtn = document.getElementById('add-job-btn');

const API_URL = 'https://ledger-backend-2hto.onrender.com/api/v1';
let jobUrl = '';

// Check for auth token and scrape page on popup open
document.addEventListener('DOMContentLoaded', async () => {
    const token = await getToken();
    if (!token) {
        showView('auth');
        return;
    }

    showView('loading');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    jobUrl = tab.url;

    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        // Send a message to the content script to start scraping
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'scrape' });
        
        if (response && response.success) {
            populateForm(response.data);
            showView('main');
        } else {
            // Handle scraping failure
            errorMessage.textContent = response.error || "Could not automatically parse the details from this page.";
            showView('error');
        }

    } catch (error) {
        console.error("Scraping error:", error.message);
        errorMessage.textContent = "This page cannot be scraped. Please check browser permissions.";
        showView('error');
    }
});

// Event listener for the "Fill Manually" button
manualEntryBtn.addEventListener('click', () => {
    populateForm({}); // Clear form fields
    showView('main');
});


// Handle form submission
jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addJobBtn.disabled = true;
    addJobBtn.textContent = 'Adding...';

    const token = await getToken();
    if (!token) {
        alert('Authentication error. Please re-connect the extension from Ledger settings.');
        return;
    }

    const jobData = {
        position: positionInput.value,
        company: companyInput.value,
        location: locationInput.value,
        salary: salaryInput.value,
        description: descriptionInput.value,
        url: jobUrl,
        status: 'PENDING', // Default status
        applicationDate: new Date().toISOString(),
    };

    try {
        const response = await fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(jobData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add job.');
        }

        showView('success');
        setTimeout(() => window.close(), 2000); // Close popup after 2 seconds

    } catch (error) {
        alert(`Error: ${error.message}`);
        addJobBtn.disabled = false;
        addJobBtn.textContent = 'Add Job to Ledger';
    }
});

function populateForm(data) {
    positionInput.value = data.position || '';
    companyInput.value = data.company || '';
    locationInput.value = data.location || '';
    salaryInput.value = data.salary || '';
    descriptionInput.value = data.description || '';
}

function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`${viewName}-view`).classList.remove('hidden');
}

// --- Auth Token Management ---
// Listen for token sent from the web app
chrome.runtime.onMessageExternal.addListener(
    (request, sender, sendResponse) => {
      if (request.type === 'SET_LEDGER_TOKEN') {
        chrome.storage.sync.set({ ledger_jwt: request.token }, () => {
          console.log('Ledger token saved successfully.');
          sendResponse({ success: true });
          // Switch to main view immediately after token is set
          showView('main'); 
          window.location.reload(); // Reload popup to trigger scraping
        });
        return true; // Indicates you will send a response asynchronously
      }
    }
);

async function getToken() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('ledger_jwt', (result) => {
            resolve(result.ledger_jwt);
        });
    });
}