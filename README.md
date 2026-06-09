# 🛡️ SafeSearch AI — Browser Extension

**Real-time Search Query Protection for Chrome**

A lightweight Manifest V3 Chrome extension that intercepts search queries on major engines and alerts users before sensitive data — PII, financial details, credentials, or medical info — is accidentally submitted to search servers.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Detection Engine](#detection-engine)
- [Architecture](#architecture)
- [Supported Search Engines](#supported-search-engines)
- [Privacy Guarantee](#privacy-guarantee)
- [Project Structure](#project-structure)
- [Development](#development)
- [Example](#example)
- [License](#license)

---

## Overview

SafeSearch AI's Browser Extension silently monitors what you type into search boxes. The moment it detects potentially sensitive content — like a credit card number, Aadhaar number, password, or medical term — it surfaces a non-intrusive warning banner and offers a **safe redacted version** of your query before you hit Enter.

No data ever leaves your browser. Everything runs locally.

---

## Features

| Feature | Description |
|---|---|
| 🔍 **Shadow DOM Traversal** | Recursively hooks into modern SPA search inputs, including deeply nested Shadow DOM trees used by Google and other SPAs |
| 🤖 **Hybrid Detection Engine** | Combines Regex pattern matching with lightweight NLP heuristics for high accuracy with minimal false positives |
| 🚨 **Risk Banner UI** | Injects a clean, non-intrusive warning banner with risk level (Low / Medium / High) and detected categories |
| ✏️ **Safe Version Suggestion** | Automatically generates a redacted version of the query with sensitive tokens replaced (e.g., `[REDACTED_CREDIT_CARD]`) |
| 🔒 **100% Client-Side** | Zero data egress. No API calls. No telemetry. All processing is sandboxed in your browser tab |
| ⚡ **Zero Latency** | Detection runs synchronously on `input` events — warning appears before the query is submitted |

---

## How It Works

```
User types in search box
        │
        ▼
Content Script intercepts input event
        │
        ▼
Shadow DOM traversal locates active input
        │
        ▼
Hybrid Regex + NLP engine scans query text
        │
   ┌────┴────┐
   │         │
Clean     Sensitive data detected
   │         │
   ▼         ▼
No action  Risk banner injected into DOM
           Safe redacted version displayed
                    │
            User chooses to:
            ├── Edit query
            ├── Use safe version
            └── Dismiss & proceed
```

---

## Installation

> **Prerequisite:** Google Chrome (or any Chromium-based browser with extension support)

1. **Download or clone** this repository to your local machine:
   ```bash
   git clone https://github.com/your-org/safesearch-ai.git
   cd safesearch-ai
   ```

2. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

3. Enable **Developer Mode** using the toggle in the top-right corner.

4. Click **Load Unpacked** and select the **root directory** of this project (the folder containing `manifest.json`).

5. The SafeSearch AI shield icon will appear in your Chrome toolbar. You're protected.

---

## Detection Engine

The extension uses a two-layer detection approach:

### Layer 1 — Regex Patterns

Fast, pattern-based detection for structured sensitive data:

| Category | Examples Detected |
|---|---|
| 💳 Financial | Credit/debit card numbers, UPI IDs, IFSC codes, bank account numbers, CVVs |
| 🪪 Identity (PII) | Aadhaar numbers, SSNs, passport numbers, driver's license numbers, dates of birth |
| 🔑 Credentials | Passwords, API keys (AWS, OpenAI, GitHub), JWT tokens, OTPs |
| 📬 Contact | Email addresses, phone numbers (Indian & US formats) |
| 🏥 Medical | Diagnosis keywords, medication names, test result phrases |
| 🗄️ Database | Connection strings, `username=`, `password=` patterns in query text |

### Layer 2 — NLP Heuristics

Contextual analysis that catches sensitive data which doesn't match rigid patterns:

- Detects intent phrases like *"my password is"*, *"card number:"*, *"OTP is"*
- Identifies credential-sharing language even with minor typos or spacing variations
- Flags prompt injection attempts (e.g., *"ignore previous instructions"*, *"reveal system prompt"*)

### Risk Scoring

Detections are assigned a risk level based on category severity and count:

| Risk Level | Trigger |
|---|---|
| 🟡 Low | Single contact-type item (email, phone) |
| 🟠 Medium | PII or financial data present |
| 🔴 High | Credentials, medical data, multiple sensitive categories, or prompt injection detected |

---

## Architecture

```
/ (Extension Root)
├── manifest.json          # Manifest V3 config — permissions, content scripts
├── content.js             # Injected into every tab; handles DOM interception & UI
├── detector.js            # Core detection engine (Regex + NLP)
├── ui.js                  # Risk banner & safe-version UI components
├── styles.css             # Scoped styles for injected UI elements
├── background.js          # Service worker — handles extension lifecycle events
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Key Technical Decisions

**Manifest V3** — Uses the latest Chrome extension standard for better security, performance, and future compatibility with Chrome's extension platform roadmap.

**Shadow DOM Traversal** — Modern search engines (Google, Bing) render their search inputs inside Shadow DOM trees that are invisible to standard `document.querySelector`. The extension uses recursive `shadowRoot` traversal to reliably hook into these inputs.

**CSS Injection via Shadow DOM** — The warning banner is injected using an isolated Shadow DOM to prevent the host page's CSS from interfering with the UI or vice versa.

---

## Supported Search Engines

| Engine | Status |
|---|---|
| Google Search | ✅ Supported |
| Bing | ✅ Supported |
| DuckDuckGo | ✅ Supported |
| Yahoo Search | ✅ Supported |
| Brave Search | ✅ Supported |
| Other sites | ⚙️ Generic `<input type="search">` fallback |

---

## Privacy Guarantee

- **No network requests** — The extension never sends any data anywhere. It has no `host_permissions` for external servers.
- **No storage of query content** — Detected sensitive tokens are never written to `chrome.storage` or `localStorage`. Only a session-level scan count badge is maintained in memory.
- **No background analytics** — The service worker contains no telemetry, no crash reporting, and no usage tracking.
- **Isolated UI** — The injected warning banner runs in a scoped Shadow DOM and cannot read or modify page content beyond the search input it monitors.

You can verify all of this by inspecting the source — the extension is fully open source.

---

## Development

### Prerequisites

- Google Chrome 109+
- A text editor or IDE

### Editing & Reloading

1. Make changes to any `.js` or `.css` file.
2. Go to `chrome://extensions/`.
3. Click the **refresh icon** on the SafeSearch AI card.
4. Reload the target tab.

### Adding New Detection Patterns

Open `detector.js` and add your pattern to the relevant category array:

```javascript
// Example: adding a new Indian government ID pattern
const patterns = {
  identity: [
    /\b[0-9]{12}\b/,           // Aadhaar
    /\b[A-Z]{5}[0-9]{4}[A-Z]\b/, // PAN Card
    /YOUR_NEW_PATTERN_HERE/,
  ],
  // ...
};
```

### Running Tests

```bash
# Open the test runner in Chrome DevTools console (no build step required)
# Load the extension, then open chrome://extensions/ > Inspect views: background page
# Tests are defined in detector.test.js
```

---

## Example

The screenshot below shows the extension in action on a Google search page. The user typed a query containing a credit card number, UPI ID, bank credentials, and Aadhaar number. The extension detected **High Risk** across 5 categories and surfaced a fully redacted safe version before the query was submitted.

> *See `/screenshots/demo-high-risk.png` for a full walkthrough example.*

**Input query (what the user typed):**
```
Buy something using credit card 4111222233334444 UPI: rahul@oksbi IFSC: HDFC0001234
Net Banking Login: Username: rahul_admin Password: BankingPass@2026 OTP: 482991
My Aadhaar number is: 4821 9932 1842
```

**Safe version (generated by extension):**
```
Buy something using credit card [REDACTED_CREDIT_CARD] UPI: [REDACTED_UPI]
IFSC: [REDACTED_IFSC] Net Banking Login: Username: [SENSITIVE_TERM]
Password: [SENSITIVE_TERM] OTP: [SENSITIVE_TERM]
My Aadhaar number is: [REDACTED_AADHAAR]
```

---

## Related Module

This extension is one half of the **SafeSearch AI Ecosystem**. For scanning documents, emails, and shared content *before* you send them, see the companion Web Application:

👉 [`/webapp` — Enterprise Pre-Share Content Scanner](./webapp/README.md)

---

## License

MIT License — Developed for Advanced Agentic Coding.

See [LICENSE](./LICENSE) for full terms.
