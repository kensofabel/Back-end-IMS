// --- Button Actions ---
function showQuickSetup() {
    alert('Quick Setup coming soon!');
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        // Add reset logic here
        alert('Settings have been reset to default (demo).');
    }
}

// Change Password button
function handleChangePassword() {
    alert('Change Password dialog coming soon!');
}

// View Login History button
function handleViewLoginHistory() {
    alert('Login History feature coming soon!');
}

// Connect Integration buttons
function handleConnectIntegration(service) {
    alert('Connect to ' + service + ' coming soon!');
}

// Save Settings button
function handleSaveSettings() {
    // Collect data from the form
    const data = {
        businessName: document.getElementById('business-name')?.value || '',
        businessType: document.getElementById('business-type')?.value || '',
        businessAddress: document.getElementById('business-address')?.value || '',
        businessPhone: document.getElementById('business-phone')?.value || '',
        businessEmail: document.getElementById('business-email')?.value || '',
        currency: document.getElementById('currency')?.value || '',
        taxRate: document.getElementById('tax-rate')?.value || ''
        // Add more fields as needed
    };
    return fetch('save_settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            alert(res.message || 'Settings saved!');
            // Optionally update UI, e.g., last saved time
            const lastSaved = document.getElementById('last-saved-time');
            if (lastSaved) {
                lastSaved.textContent = 'Last saved: ' + new Date().toLocaleString();
            }
        } else {
            alert(res.message || 'Failed to save settings.');
        }
    })
    .catch(() => alert('Error saving settings.'));
}

// Tab switching logic
function showSettingsTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    const tab = document.getElementById(`${tabName}-tab`);
    const btn = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if (tab) tab.classList.add('active');
    if (btn) btn.classList.add('active');
}

// Card expand/collapse logic
function toggleCardExpansion(btn) {
    const card = btn.closest('.setting-card');
    if (!card) return;
    card.classList.toggle('expanded');
    const icon = btn.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
    }
}

// Expand/collapse all cards
function expandAllCards() {
    document.querySelectorAll('.setting-card').forEach(card => {
        card.classList.add('expanded');
        const icon = card.querySelector('.card-expand-btn i');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    });
}
function collapseAllCards() {
    document.querySelectorAll('.setting-card').forEach(card => {
        card.classList.remove('expanded');
        const icon = card.querySelector('.card-expand-btn i');
        if (icon) {
            icon.classList.add('fa-chevron-down');
            icon.classList.remove('fa-chevron-up');
        }
    });
}

// Settings search filter
function filterSettings(query) {
    query = query.toLowerCase();
    document.querySelectorAll('.setting-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
    });
}

// Show settings help (customize as needed)
function showSettingsHelp() {
    alert('Need help? Please refer to the documentation or contact support.');
}

// Auto-save toggle (optional, for UI feedback)
document.addEventListener('DOMContentLoaded', function() {
    // Prefill inputs from server settings, then compute stats
    fetch('get_settings.php', { credentials: 'same-origin', cache: 'no-store' })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(json => {
            if (!json || !json.success) return;
            const d = json.data || {};
            const map = [
                ['business-name', d.businessName],
                ['business-type', d.businessType],
                ['business-address', d.businessAddress],
                ['business-phone', d.businessPhone],
                ['business-email', d.businessEmail],
                ['currency', d.currency],
                ['tax-rate', d.taxRate]
            ];
            map.forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.value = (val ?? '').toString();
            });
            try { updateStatsFromInputs(); } catch (_) {}
        })
        .catch(() => {});
    // Load stats on page load (after possible prefill)
    fetchSettingsStats();
    // Tab switching
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabName + '-tab').classList.add('active');
        });
    });

    // Card expand/collapse (if any)
    document.querySelectorAll('.card-expand-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            toggleCardExpansion(this);
        });
    });

    // Search filter
    const searchInput = document.getElementById('settings-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterSettings(this.value);
        });
    }

    // Change Password button
    document.querySelectorAll('.modern-btn').forEach(btn => {
        if (btn.textContent.includes('Change')) {
            btn.addEventListener('click', handleChangePassword);
        }
        if (btn.textContent.includes('View')) {
            btn.addEventListener('click', handleViewLoginHistory);
        }
        if (btn.textContent.includes('Connect')) {
            btn.addEventListener('click', function() {
                const service = this.closest('.integration-item')?.querySelector('h4')?.textContent || 'Integration';
                handleConnectIntegration(service);
            });
        }
    });

    // Save Settings button
    const saveBtn = document.getElementById('save-settings-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            await handleSaveSettings();
            // Refresh stats after saving
            fetchSettingsStats();
        });
    }

    // Reset to Defaults button
    document.querySelectorAll('.modern-btn.secondary').forEach(btn => {
        if (btn.textContent.includes('Reset')) {
            btn.addEventListener('click', resetSettings);
        }
    });

    // Hero Quick Setup button
    document.querySelectorAll('.hero-btn').forEach(btn => {
        btn.addEventListener('click', showQuickSetup);
    });

    // Real-time stats: update tiles as fields change (without saving)
    const trackedIds = [
        'business-name',
        'business-type',
        'business-address',
        'business-phone',
        'business-email',
        'currency',
        'tax-rate'
    ];
    trackedIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', updateStatsFromInputs);
        el.addEventListener('change', updateStatsFromInputs);
    });
});

// Fetch and update settings stats
function fetchSettingsStats() {
    fetch('get_settings_stats.php', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (!data || !data.success) return;
            const completedEl = document.getElementById('completed-settings');
            const pendingEl = document.getElementById('pending-settings');
            const secureEl = document.getElementById('secure-percent');
            const secureLabel = document.getElementById('secure-label');
            if (completedEl) completedEl.textContent = data.completed;
            if (pendingEl) pendingEl.textContent = data.pending;
            if (secureEl) secureEl.textContent = `${data.securePercent}%`;
            if (secureLabel) secureLabel.textContent = data.securePercent >= 80 ? 'Secure' : 'Needs Attention';
        })
        .catch(() => {});
}

// Compute stats from current input values (instant feedback)
function updateStatsFromInputs() {
    const values = {
        business_name: (document.getElementById('business-name')?.value || '').trim(),
        business_type: (document.getElementById('business-type')?.value || '').trim(),
        business_address: (document.getElementById('business-address')?.value || '').trim(),
        business_phone: (document.getElementById('business-phone')?.value || '').trim(),
        business_email: (document.getElementById('business-email')?.value || '').trim(),
        currency: (document.getElementById('currency')?.value || '').trim(),
        tax_rate: (document.getElementById('tax-rate')?.value || '').trim(),
    };

    const requiredKeys = Object.keys(values);
    let completed = 0;
    requiredKeys.forEach(k => {
        if (values[k] !== '') completed++;
    });
    const total = requiredKeys.length;
    const pending = Math.max(0, total - completed);

    // Heuristic for secure percent (match backend approach)
    let securePercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (values.business_email && /.+@.+\..+/.test(values.business_email)) securePercent = Math.min(100, securePercent + 5);
    const tr = parseFloat(values.tax_rate);
    if (!isNaN(tr) && tr >= 0 && tr <= 100) securePercent = Math.min(100, securePercent + 5);

    const completedEl = document.getElementById('completed-settings');
    const pendingEl = document.getElementById('pending-settings');
    const secureEl = document.getElementById('secure-percent');
    const secureLabel = document.getElementById('secure-label');
    if (completedEl) completedEl.textContent = completed;
    if (pendingEl) pendingEl.textContent = pending;
    if (secureEl) secureEl.textContent = `${securePercent}%`;
    if (secureLabel) secureLabel.textContent = securePercent >= 80 ? 'Secure' : 'Needs Attention';
}