// Global variables for real-time functionality and pagination
let lastLogCount = 0;
let isConnected = false;
let fetchInterval = null;
let previousLogs = '';

// Pagination state
let currentPage = 1;
let perPage = 10;
let totalPages = 1;

// Realtime Audit Logs Fetcher with Filtering and Visual Indicators
function fetchAuditLogs(showNewIndicator = false) {
    const action = document.getElementById('audit-log-filter').value;
    const dateFrom = document.getElementById('audit-log-date-from').value;
    const dateTo = document.getElementById('audit-log-date-to').value;
    const search = document.getElementById('search-audit-logs').value;

    const params = new URLSearchParams({
        action,
        date_from: dateFrom,
        date_to: dateTo,
        search,
        page: currentPage,
        per_page: perPage
    });

    updateConnectionStatus('connecting');

    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'fetch_auditlogs.php?' + params.toString(), true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const rawResponse = xhr.responseText;
            const tbody = document.getElementById('audit-logs-table-body');

            // Extract pagination metadata comment if present: <!-- PAGINATION: {...} -->
            let paginationMeta = null;
            const paginationMatch = rawResponse.match(/<!--\s*PAGINATION:\s*(\{[\s\S]*?\})\s*-->/);
            if (paginationMatch && paginationMatch[1]) {
                try {
                    paginationMeta = JSON.parse(paginationMatch[1]);
                } catch (e) {
                    paginationMeta = null;
                }
            }

            // Remove HTML comments (including the pagination meta and Last Updated comments)
            const rowsHtml = rawResponse.replace(/<!--([\s\S]*?)-->/g, '').trim();

            // Check if content has changed (compare only the rows HTML to avoid meta noise)
            if (rowsHtml !== previousLogs) {
                // Flash new content indicator if this isn't the initial load
                if (previousLogs !== '' && showNewIndicator) {
                    flashNewLogsIndicator();
                }

                tbody.innerHTML = rowsHtml;
                previousLogs = rowsHtml;

                // Update timestamps immediately after loading content
                updateTimestamps();

                // Count current logs
                const logRows = tbody.querySelectorAll('tr');
                const currentLogCount = logRows.length;

                // Highlight new logs if count increased
                if (currentLogCount > lastLogCount && lastLogCount > 0) {
                    highlightNewLogs(currentLogCount - lastLogCount);
                }

                lastLogCount = currentLogCount;
            }

            // If pagination meta provided, update UI state
            if (paginationMeta) {
                currentPage = parseInt(paginationMeta.page || currentPage, 10);
                perPage = parseInt(paginationMeta.per_page || perPage, 10);
                totalPages = parseInt(paginationMeta.pages || totalPages, 10);
                updatePaginationUI();
            }
            
            updateConnectionStatus('connected');
            isConnected = true;
        } else {
            updateConnectionStatus('error');
            isConnected = false;
        }
    };
    
    xhr.onerror = function() {
        updateConnectionStatus('error');
        isConnected = false;
    };
    
    xhr.ontimeout = function() {
        updateConnectionStatus('timeout');
        isConnected = false;
    };
    
    xhr.timeout = 5000; // 5 second timeout
    xhr.send();
}

// Update connection status indicator
function updateConnectionStatus(status) {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (!indicator || !statusText) return;
    
    switch(status) {
        case 'connected':
            indicator.className = 'fas fa-circle status-connected';
            statusText.textContent = 'Live';
            break;
        case 'connecting':
            indicator.className = 'fas fa-circle status-connecting';
            statusText.textContent = 'Updating...';
            break;
        case 'error':
            indicator.className = 'fas fa-circle status-error';
            statusText.textContent = 'Connection Error';
            break;
        case 'timeout':
            indicator.className = 'fas fa-circle status-timeout';
            statusText.textContent = 'Timeout';
            break;
    }
}

// Update pagination controls UI (supports both id/class based elements)
function updatePaginationUI() {
    // page display text (legacy) and page input/total elements (employee-style)
    const pageDisplay = document.getElementById('page-display');
    const pageInput = document.getElementById('pagination-page-input') || document.querySelector('.pagination-page-input');
    const totalPagesEl = document.getElementById('pagination-total-pages') || document.querySelector('.pagination-total-pages');
    const prevBtn = document.getElementById('prev-page') || document.querySelector('.pagination-prev');
    const nextBtn = document.getElementById('next-page') || document.querySelector('.pagination-next');
    const rowsSelect = document.getElementById('rows-per-page') || document.querySelector('.pagination-rows-select');

    if (pageDisplay) pageDisplay.textContent = `Page ${currentPage} of ${totalPages}`;
    if (pageInput) pageInput.value = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (rowsSelect) rowsSelect.value = String(perPage);
}

// Flash indicator when new logs arrive
function flashNewLogsIndicator() {
    const statusText = document.getElementById('status-text');
    if (statusText) {
        const originalText = statusText.textContent;
        statusText.textContent = 'New Logs!';
        statusText.style.color = '#4CAF50';
        statusText.style.fontWeight = 'bold';
        
        setTimeout(() => {
            statusText.textContent = originalText;
            statusText.style.color = '';
            statusText.style.fontWeight = '';
        }, 2000);
    }
}

// Highlight new log entries
function highlightNewLogs(newCount) {
    const tbody = document.getElementById('audit-logs-table-body');
    const rows = tbody.querySelectorAll('tr');
    
    for (let i = 0; i < Math.min(newCount, rows.length); i++) {
        const row = rows[i];
        row.classList.add('new-log-entry');
        
        // Remove highlight after 5 seconds
        setTimeout(() => {
            row.classList.remove('new-log-entry');
        }, 5000);
    }
}

// Real-time timestamp update function
function updateTimestamps() {
    const rows = document.querySelectorAll('[data-timestamp]');
    const now = new Date();
    
    rows.forEach(row => {
        const timestamp = row.getAttribute('data-timestamp');
        if (timestamp) {
            const logTime = new Date(timestamp);
            const diffMs = now - logTime;
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            let timeDisplay;
            let exactTime = logTime.toLocaleString();
            
            if (diffDays > 0) {
                timeDisplay = logTime.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            } else if (diffHours > 0) {
                timeDisplay = diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
            } else if (diffMinutes > 0) {
                timeDisplay = diffMinutes + ' minute' + (diffMinutes > 1 ? 's' : '') + ' ago';
            } else if (diffSeconds > 10) {
                timeDisplay = diffSeconds + ' second' + (diffSeconds > 1 ? 's' : '') + ' ago';
            } else {
                timeDisplay = 'Just now';
            }
            
            const timestampCell = row.querySelector('td:first-child');
            if (timestampCell) {
                timestampCell.textContent = timeDisplay;
                timestampCell.title = exactTime;
            }
        }
    });
}

// Enhanced timestamp formatting for newly fetched data
function formatTimestamp(timestamp) {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now - logTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
        return logTime.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } else if (diffHours > 0) {
        return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
    } else if (diffMinutes > 0) {
        return diffMinutes + ' minute' + (diffMinutes > 1 ? 's' : '') + ' ago';
    } else if (diffSeconds > 10) {
        return diffSeconds + ' second' + (diffSeconds > 1 ? 's' : '') + ' ago';
    } else {
        return 'Just now';
    }
}

// Event listeners for filters and search box
['audit-log-filter', 'audit-log-date-from', 'audit-log-date-to'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('input', () => { currentPage = 1; fetchAuditLogs(false); });
    }
});

// Search input with debounce to avoid too many requests
let searchTimeout;
const searchInput = document.getElementById('search-audit-logs');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1; fetchAuditLogs(false);
        }, 300); // 300ms debounce
    });
}

// Filter button (for manual trigger)
window.filterAuditLogs = () => fetchAuditLogs(false);

// Start real-time updates with 1-second interval for more responsive updates
function startRealTimeUpdates() {
    // Clear any existing interval
    if (fetchInterval) {
        clearInterval(fetchInterval);
    }
    
    // Fetch every 1 second for real-time feel
    fetchInterval = setInterval(() => fetchAuditLogs(true), 1000);
    
    // Update timestamps every 10 seconds for real-time relative time
    setInterval(updateTimestamps, 10000);
}

// Stop real-time updates
function stopRealTimeUpdates() {
    if (fetchInterval) {
        clearInterval(fetchInterval);
        fetchInterval = null;
    }
}

// Page visibility API to pause updates when tab is not active
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopRealTimeUpdates();
        updateConnectionStatus('paused');
    } else {
        startRealTimeUpdates();
        fetchAuditLogs(false); // Immediate fetch when returning to tab
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initial fetch
    fetchAuditLogs(false);
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Initial timestamp update
    setTimeout(updateTimestamps, 100);
    
    // Hook pagination controls (support both ids and employee classes)
    const prevBtn = document.getElementById('prev-page') || document.querySelector('.pagination-prev');
    const nextBtn = document.getElementById('next-page') || document.querySelector('.pagination-next');
    const rowsSelect = document.getElementById('rows-per-page') || document.querySelector('.pagination-rows-select');
    const pageInput = document.getElementById('pagination-page-input') || document.querySelector('.pagination-page-input');

    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = Math.max(1, currentPage - 1);
            fetchAuditLogs(false);
        }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage = Math.min(totalPages, currentPage + 1);
            fetchAuditLogs(false);
        }
    });
    if (rowsSelect) rowsSelect.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10) || 10;
        perPage = val;
        currentPage = 1;
        fetchAuditLogs(false);
    });
    if (pageInput) {
        pageInput.addEventListener('change', (e) => {
            let v = parseInt(e.target.value, 10) || 1;
            v = Math.max(1, Math.min(v, totalPages || 1));
            currentPage = v;
            fetchAuditLogs(false);
        });
        pageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                pageInput.dispatchEvent(new Event('change'));
            }
        });
    }
});

// Manual refresh function
window.manualRefresh = function() {
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
        refreshIcon.classList.add('fa-spin');
        setTimeout(() => refreshIcon.classList.remove('fa-spin'), 1000);
    }
    
    // Force immediate fetch
    fetchAuditLogs(true);
    
    // Reset the interval for real-time updates
    if (fetchInterval) {
        clearInterval(fetchInterval);
    }
    startRealTimeUpdates();
};

// Add notification permission request for desktop notifications (optional enhancement)
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Show desktop notification for critical actions (optional)
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '../../assets/images/icon.webp',
            tag: 'audit-log'
        });
    }
}

// Also start immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading
} else {
    // DOM is already loaded
    fetchAuditLogs(false);
    startRealTimeUpdates();
    // Initial timestamp update
    setTimeout(updateTimestamps, 100);
}

// Request notification permission on load
requestNotificationPermission();

// Reset audit log filters function (moved from HTML)
window.resetAuditLogFilters = function() {
    document.getElementById('audit-log-filter').value = 'all';
    document.getElementById('audit-log-date-from').value = '';
    document.getElementById('audit-log-date-to').value = '';
    const searchInput = document.getElementById('search-audit-logs');
    if (searchInput) searchInput.value = '';
    if (typeof filterAuditLogs === 'function') filterAuditLogs();
};

window.exportAuditLogs = function exportAuditLogs() {
    const action = document.getElementById('audit-log-filter').value;
    const dateFrom = document.getElementById('audit-log-date-from').value;
    const dateTo = document.getElementById('audit-log-date-to').value;
    const search = document.getElementById('search-audit-logs').value;

    const params = new URLSearchParams({
        action,
        date_from: dateFrom,
        date_to: dateTo,
        search,
        export: 'csv'
    });

    window.open('fetch_auditlogs.php?' + params.toString(), '_blank');
};
