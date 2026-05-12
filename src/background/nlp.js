// nlp.js
// A lightweight bag-of-words and n-gram model to detect sensitive intent
// without requiring heavy machine learning libraries.

const VOCABULARY = {
    medical: [
        { word: "symptoms", weight: 0.5 },
        { word: "diagnosis", weight: 0.6 },
        { word: "treatment", weight: 0.5 },
        { word: "cancer", weight: 0.8 },
        { word: "hiv", weight: 0.9 },
        { word: "depression", weight: 0.7 },
        { word: "pregnancy", weight: 0.6 },
        { word: "test results", weight: 0.8 },
        { word: "std", weight: 0.9 }
    ],
    financial: [
        { word: "bank account", weight: 0.8 },
        { word: "routing number", weight: 0.9 },
        { word: "password", weight: 0.9 },
        { word: "cvv", weight: 0.9 },
        { word: "pin number", weight: 0.9 },
        { word: "balance", weight: 0.4 },
        { word: "wire transfer", weight: 0.7 }
    ],
    personal: [
        { word: "passport", weight: 0.8 },
        { word: "driver license", weight: 0.8 },
        { word: "address", weight: 0.4 },
        { word: "date of birth", weight: 0.8 },
        { word: "dob", weight: 0.7 }
    ]
};

const THRESHOLD_HIGH = 1.5;
const THRESHOLD_MEDIUM = 0.8;

export function nlpClassify(query) {
    const lowerQuery = query.toLowerCase();
    
    let scores = {
        medical: 0,
        financial: 0,
        personal: 0
    };
    
    let findings = [];

    // Simple matching
    for (const [category, terms] of Object.entries(VOCABULARY)) {
        for (const term of terms) {
            if (lowerQuery.includes(term.word)) {
                scores[category] += term.weight;
                findings.push({
                    type: 'nlp_intent',
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    trigger: term.word
                });
            }
        }
    }

    // Determine max severity based on scores
    let maxScore = Math.max(scores.medical, scores.financial, scores.personal);
    let severity = "None";
    
    if (maxScore >= THRESHOLD_HIGH) {
        severity = "High";
    } else if (maxScore >= THRESHOLD_MEDIUM) {
        severity = "Medium";
    } else if (maxScore > 0) {
        severity = "Low";
    }

    return {
        isSensitive: severity !== "None",
        findings: findings,
        maxSeverity: severity,
        scores: scores
    };
}
