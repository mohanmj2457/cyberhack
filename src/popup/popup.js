// popup.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("SafeSearch AI: Popup initialized.");

    const sensitivitySelect = document.getElementById('sensitivity');
    const viewLogsBtn = document.getElementById('viewLogsBtn');

    // Load saved settings and stats
    chrome.storage.local.get(['sensitivity', 'alertCount', 'redactedCount'], (result) => {
        if (result.sensitivity) {
            sensitivitySelect.value = result.sensitivity;
        }
        
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 2) {
            statValues[0].textContent = result.alertCount || 0;
            statValues[1].textContent = result.redactedCount || 0;
        }
    });

    // Handle settings change
    sensitivitySelect.addEventListener('change', (e) => {
        const newValue = e.target.value;
        chrome.storage.local.set({ sensitivity: newValue }, () => {
            console.log(`Sensitivity saved as: ${newValue}`);
        });
    });

    // Phase 7: Log Viewer
    viewLogsBtn.addEventListener('click', () => {
        chrome.storage.local.get({ events: [] }, (data) => {
            const container = document.querySelector('.container');
            container.innerHTML = `
                <div class="header">
                    <div class="shield-icon" style="font-size: 16px;">📜</div>
                    <h1>Event Logs</h1>
                </div>
                <div id="logs-container" style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                    ${data.events.length === 0 ? '<p style="color: var(--text-muted); font-size: 12px;">No events recorded.</p>' : ''}
                    ${data.events.map(e => `
                        <div style="background: var(--card-bg); padding: 10px; border-radius: 6px; font-size: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <strong>${e.action_taken}</strong>
                                <span style="color: var(--text-muted);">${new Date(e.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div style="color: var(--danger);">${e.risk_category} (${e.severity})</div>
                        </div>
                    `).join('')}
                </div>
                <button id="backBtn" class="primary-btn" style="margin-top: 10px;">Back to Settings</button>
            `;
            
            document.getElementById('backBtn').addEventListener('click', () => {
                location.reload(); // Quick way to reset popup
            });
        });
    });
});
