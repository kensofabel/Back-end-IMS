// Tab switching logic
function showSettingsTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const tab = document.getElementById(`${tabName}-tab`);
    const btn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    if (tab) tab.classList.add('active');
    if (btn) btn.classList.add('active');
}

// Card expand/collapse logic
function toggleCardExpansion(btn) {
    const card = btn.closest('.settings-card');
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
    document.querySelectorAll('.settings-card').forEach(card => {
        card.classList.add('expanded');
        const icon = card.querySelector('.card-expand-btn i');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    });
}
function collapseAllCards() {
    document.querySelectorAll('.settings-card').forEach(card => {
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
    document.querySelectorAll('.settings-card').forEach(card => {
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
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSettingsTab(tabName);
        });
    });

    // Card expand/collapse
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
});