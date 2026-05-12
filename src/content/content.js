// content.js - Injected into search engine pages
console.log("SafeSearch AI: Content script loaded.");

let debounceTimer;
let currentBanner = null;
let activeTarget = null;
const attachedInputs = new WeakSet();

// --- Phase 7: Event Logging ---
function logEvent(action, analysisResult) {
    chrome.runtime.sendMessage({
        type: 'LOG_EVENT',
        payload: {
            timestamp: new Date().toISOString(),
            risk_category: [...new Set(analysisResult.findings.map(f => f.category))].join(', '),
            severity: analysisResult.maxSeverity,
            action_taken: action
        }
    });
}

// --- Phase 5: UI ---
function removeBanner() {
    if (currentBanner) { currentBanner.remove(); currentBanner = null; }
}

// Phase 6: Redaction
function generateRedactedQuery(originalQuery, findings) {
    let redacted = originalQuery;
    findings.forEach(finding => {
        if (finding.matches) {
            finding.matches.forEach(match => {
                redacted = redacted.replace(match, `[REDACTED_${finding.type.toUpperCase()}]`);
            });
        }
        if (finding.type === 'nlp_intent' && finding.trigger) {
            redacted = redacted.replace(new RegExp(finding.trigger, 'gi'), '[SENSITIVE_TERM]');
        }
    });
    return redacted;
}

function showWarningBanner(inputElement, analysisResult, originalQuery) {
    removeBanner();
    const rect = inputElement.getBoundingClientRect();
    const banner = document.createElement('div');
    banner.id = 'safesearch-banner';
    banner.style.top = `${rect.bottom + window.scrollY + 4}px`;
    banner.style.left = `${rect.left + window.scrollX}px`;

    const redactedQuery = generateRedactedQuery(originalQuery, analysisResult.findings);
    const hasRedactions = redactedQuery !== originalQuery;
    const categories = [...new Set(analysisResult.findings.map(f => f.category))].join(', ');

    banner.innerHTML = `
        <div id="safesearch-banner-header">
            <span>🛡️</span> Risk Detected: ${analysisResult.maxSeverity}
        </div>
        <div id="safesearch-banner-text">
            Sensitive data found (${categories}). Submitting may expose your private data.
        </div>
        ${hasRedactions ? `<div id="safesearch-suggestion"><strong>Safe version:</strong><br/>${redactedQuery}</div>` : ''}
        <div class="safesearch-btn-group">
            ${hasRedactions ? `<button class="safesearch-btn safesearch-btn-primary" id="ss-btn-accept">Use Redacted</button>` : ''}
            <button class="safesearch-btn safesearch-btn-danger" id="ss-btn-proceed">Proceed Anyway</button>
            <button class="safesearch-btn safesearch-btn-danger" id="ss-btn-dismiss">Dismiss</button>
        </div>
    `;

    document.body.appendChild(banner);
    currentBanner = banner;

    if (hasRedactions) {
        document.getElementById('ss-btn-accept').addEventListener('click', (e) => {
            e.preventDefault();
            inputElement.value = redactedQuery;
            inputElement.dataset.safesearchApproved = "true";
            logEvent("Redacted", analysisResult);
            removeBanner();
        });
    }
    document.getElementById('ss-btn-proceed').addEventListener('click', (e) => {
        e.preventDefault();
        inputElement.dataset.safesearchApproved = "true";
        logEvent("Proceeded", analysisResult);
        removeBanner();
    });
    document.getElementById('ss-btn-dismiss').addEventListener('click', (e) => {
        e.preventDefault();
        inputElement.value = '';
        logEvent("Dismissed", analysisResult);
        removeBanner();
    });
}

// --- Core handler attached directly to each discovered input ---
function handleInput(event) {
    const target = event.target;
    activeTarget = target;
    const query = target.value;
    target.dataset.safesearchApproved = "false";
    removeBanner();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (query.trim().length < 4) return;
        chrome.runtime.sendMessage({ type: 'QUERY_INTERCEPTED', payload: query }, (response) => {
            if (chrome.runtime.lastError) return;
            if (response && response.risk !== 'None') {
                showWarningBanner(target, response.analysis, query);
            }
        });
    }, 300);
}

// Intercept Enter key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && currentBanner && activeTarget && activeTarget.dataset.safesearchApproved !== "true") {
        if (document.activeElement === activeTarget || activeTarget.contains(document.activeElement)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
}, true);

document.addEventListener('click', (e) => {
    if (currentBanner && !currentBanner.contains(e.target)) removeBanner();
});

// --- Phase 2: Smart input discovery ---
// Selectors that cover Google's new textarea AND old input, Bing, DuckDuckGo
const SELECTORS = [
    'textarea[name="q"]',
    'input[name="q"]',
    'input[name="p"]',
    'input[type="search"]',
    'input[name="search_query"]'
];

function attachToInput(el) {
    if (attachedInputs.has(el)) return;
    attachedInputs.add(el);
    el.addEventListener('input', handleInput);
    console.log("SafeSearch AI: Attached to", el.tagName, el.name || el.type);
}

function scanAndAttach(root) {
    SELECTORS.forEach(sel => {
        root.querySelectorAll(sel).forEach(attachToInput);
    });

    // Also walk open shadow roots (Google uses shadow DOM)
    root.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) scanAndAttach(el.shadowRoot);
    });
}

// Initial scan
scanAndAttach(document);

// MutationObserver to catch dynamically added inputs (Google SPA navigation)
const observer = new MutationObserver(() => scanAndAttach(document));
observer.observe(document.body, { childList: true, subtree: true });
