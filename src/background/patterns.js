// patterns.js
export const PATTERNS = [
    {
        id: "credit_card",
        category: "Financial",
        severity: "High",
        // Lookahead/lookbehind avoids \b failures on pure-digit strings
        // Matches Visa (16), MasterCard (16), Amex (15), Discover (16)
        regex: /(?<![0-9])(?:4[0-9]{15}|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})(?![0-9])/g,
        description: "Credit Card Number"
    },
    {
        id: "ssn",
        category: "PII",
        severity: "High",
        // US Social Security Number
        regex: /\b(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}\b/g,
        description: "Social Security Number"
    },
    {
        id: "aadhaar",
        category: "PII",
        severity: "High",
        // Indian Aadhaar Number
        regex: /\b[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}\b/g,
        description: "Aadhaar Number"
    },
    {
        id: "email",
        category: "Contact",
        severity: "Medium",
        // Basic Email
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
        description: "Email Address"
    },
    {
        id: "phone",
        category: "Contact",
        severity: "Low",
        // Generic Phone Number (US-centric, basic matching)
        regex: /\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g,
        description: "Phone Number"
    },
    {
        id: "api_key",
        category: "Credentials",
        severity: "High",
        // Heuristic for possible API keys / Auth tokens (long alphanumeric strings)
        regex: /\b[A-Za-z0-9_-]{32,}\b/g,
        description: "Possible API Key or Token"
    }
];

/**
 * Scans a query string for sensitive data patterns.
 * @param {string} query 
 * @returns {Object} Analysis result containing findings and max severity.
 */
export function analyzeQuery(query) {
    const findings = [];
    let maxSeverity = "None";

    for (const pattern of PATTERNS) {
        const matches = [...query.matchAll(pattern.regex)];
        if (matches.length > 0) {
            const matchedStrings = matches.map(m => m[0]);
            findings.push({
                type: pattern.id,
                category: pattern.category,
                severity: pattern.severity,
                description: pattern.description,
                matches: matchedStrings
            });
            
            // Update maxSeverity
            if (pattern.severity === "High") maxSeverity = "High";
            else if (pattern.severity === "Medium" && maxSeverity !== "High") maxSeverity = "Medium";
            else if (pattern.severity === "Low" && maxSeverity === "None") maxSeverity = "Low";
        }
    }

    return {
        isSensitive: findings.length > 0,
        findings: findings,
        maxSeverity: maxSeverity
    };
}
