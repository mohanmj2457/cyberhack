import { analyzeQuery } from './patterns.js';
import { nlpClassify } from './nlp.js';

// background.js - Service Worker
console.log("SafeSearch AI: Background service worker initialized.");

// Listener for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'QUERY_INTERCEPTED') {
        const query = request.payload;
        
        // Phase 7: Dynamic Configuration - respect sensitivity levels
        chrome.storage.local.get({ sensitivity: 'medium' }, (settings) => {
            const patternResult = analyzeQuery(query);
            const nlpResult = nlpClassify(query);
            
            const combinedFindings = [...patternResult.findings, ...nlpResult.findings];
            
            let finalSeverity = "None";
            const severities = [patternResult.maxSeverity, nlpResult.maxSeverity];
            if (severities.includes("High")) finalSeverity = "High";
            else if (severities.includes("Medium")) finalSeverity = "Medium";
            else if (severities.includes("Low")) finalSeverity = "Low";

            // Filter out events based on sensitivity settings
            let shouldAlert = false;
            if (settings.sensitivity === 'high' && finalSeverity !== "None") shouldAlert = true;
            if (settings.sensitivity === 'medium' && (finalSeverity === "High" || finalSeverity === "Medium")) shouldAlert = true;
            if (settings.sensitivity === 'low' && finalSeverity === "High") shouldAlert = true;

            const analysisResult = {
                isSensitive: shouldAlert,
                findings: combinedFindings,
                maxSeverity: finalSeverity
            };
            
            sendResponse({ 
                status: "analyzed", 
                risk: shouldAlert ? analysisResult.maxSeverity : "None",
                analysis: analysisResult
            });
        });
        return true; // Keep the message channel open for async responses
    } 
    else if (request.type === 'LOG_EVENT') {
        // Phase 7: Event Logging
        const event = request.payload;
        event.event_id = 'evt_' + Math.random().toString(36).substr(2, 9);
        
        chrome.storage.local.get({ events: [], redactedCount: 0, alertCount: 0 }, (data) => {
            const events = data.events;
            events.unshift(event);
            if (events.length > 50) events.pop();
            
            let newRedactedCount = data.redactedCount;
            let newAlertCount = data.alertCount + 1; // Any log event means an alert was shown
            
            if (event.action_taken === "Redacted") {
                newRedactedCount++;
            }
            
            chrome.storage.local.set({ 
                events: events,
                redactedCount: newRedactedCount,
                alertCount: newAlertCount
            });
        });
        sendResponse({ status: 'logged' });
    }
    return true; 
});
