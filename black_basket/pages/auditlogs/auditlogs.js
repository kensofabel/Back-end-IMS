// Realtime Audit Logs Fetcher with Filtering
function fetchAuditLogs() {
    const action = document.getElementById('audit-log-filter').value;
    const dateFrom = document.getElementById('audit-log-date-from').value;
    const dateTo = document.getElementById('audit-log-date-to').value;
    const search = document.getElementById('search-audit-logs').value;

    const params = new URLSearchParams({
        action,
        date_from: dateFrom,
        date_to: dateTo,
        search
    });

    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'fetch_auditlogs.php?' + params.toString(), true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            document.getElementById('audit-logs-table-body').innerHTML = xhr.responseText;
        }
    };
    xhr.send();
}

// Event listeners for filters and search box
['audit-log-filter', 'audit-log-date-from', 'audit-log-date-to'].forEach(id => {
    document.getElementById(id).addEventListener('input', fetchAuditLogs);
});
document.getElementById('search-audit-logs').addEventListener('input', function() {
    fetchAuditLogs();
});

// Filter button (for manual trigger)
window.filterAuditLogs = fetchAuditLogs;

// Fetch every 3 seconds
setInterval(fetchAuditLogs, 3000);
// Initial fetch
fetchAuditLogs();

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
