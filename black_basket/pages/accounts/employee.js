// --- Status toggle for employees ---
console.log('employee.js loaded (v2)');
// Show the missing-actual-state toast only once per page load
window._bb_actualStateMissingNotified = window._bb_actualStateMissingNotified || false;
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.status-badge-edit').forEach(function(badge) {
            badge.addEventListener('click', async function(e) {
            const empId = this.getAttribute('data-employee-id');
            if (!empId) return;
            const badgeEl = this;
            // Ensure actual state is set before toggling lock/unlock. Prompt user if missing.
            let actualState = (badgeEl.getAttribute('data-actual-state') || '').toString().trim().toLowerCase();
            if (!actualState || actualState === 'offline' || actualState === 'unknown') {
                const chosen = await showActualStatePicker('Actual state is not set for this employee. Choose actual state before toggling.', 'Set actual state');
                if (!chosen) {
                    try { showToast('info', 'Toggling cancelled; actual state not set.'); } catch (e) {}
                    return;
                }
                actualState = chosen;
                badgeEl.setAttribute('data-actual-state', actualState);
            }
            fetch('toggle_employee_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'id=' + encodeURIComponent(empId) + '&actual_state=' + encodeURIComponent(actualState)
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    const newStatus = data.new_status;
                    badgeEl.setAttribute('data-status', newStatus);
                    const icon = badgeEl.querySelector('i');
                    const text = badgeEl.querySelector('.status-text');
                    // Map server 'active'/'inactive' to Unlocked/Locked UI labels
                    if (newStatus === 'active') {
                        badgeEl.classList.add('status-active');
                        badgeEl.classList.remove('status-inactive');
                        if (icon) { icon.classList.add('fa-check-circle'); icon.classList.remove('fa-times-circle'); }
                        if (text) text.textContent = 'Unlocked';
                    } else {
                        badgeEl.classList.remove('status-active');
                        badgeEl.classList.add('status-inactive');
                        if (icon) { icon.classList.remove('fa-check-circle'); icon.classList.add('fa-times-circle'); }
                        if (text) text.textContent = 'Locked';
                    }
                } else {
                    showToast('error', data.message || 'Failed to toggle lock');
                }
            })
            .catch(() => showToast('error', 'Failed to toggle lock'));
        });
    });
});
// Helper for employee row cells — use .editable-cell to avoid relying on child index (checkbox column may be present)
function getEditableCellText(row, idx) {
    if (!row) return '';
    const cells = row.querySelectorAll('.editable-cell');
    return (cells && cells[idx] && cells[idx].innerText) ? cells[idx].innerText : '';
}
function setEditableCellText(row, idx, text) {
    if (!row) return;
    const cells = row.querySelectorAll('.editable-cell');
    if (cells && cells[idx]) cells[idx].innerText = text;
}
// ---------- In-page toast & confirm helpers ----------
// showToast(type, message, timeoutMs)
function showToast(type, message, timeout) {
    timeout = typeof timeout === 'number' ? timeout : 4000;
    const container = document.getElementById('toast-container');
    if (!container) {
        // fallback to alert if toast container missing
        alert(message);
        return;
    }
    const toast = document.createElement('div');
    toast.className = 'bb-toast bb-toast-' + (type || 'info');
    toast.style.background = type === 'error' ? '#d9534f' : (type === 'success' ? '#4caf50' : (type === 'warning' ? '#f0ad4e' : '#333'));
    toast.style.color = '#fff';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    toast.style.maxWidth = '320px';
    toast.style.wordBreak = 'break-word';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(6px)'; }, timeout - 300);
    setTimeout(() => { try { toast.remove(); } catch (e) {} }, timeout);
}

// showConfirm(message, title) -> Promise<boolean>
function showConfirm(message, title) {
    return new Promise(resolve => {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
            // fallback
            resolve(window.confirm(message));
            return;
        }
        const body = document.getElementById('confirm-modal-body');
        const ok = document.getElementById('confirm-modal-ok');
        const cancel = document.getElementById('confirm-modal-cancel');
        const close = document.getElementById('confirm-modal-close');
        const titleEl = document.getElementById('confirm-modal-title');
        if (titleEl) titleEl.innerText = title || 'Confirm';
        if (body) body.innerText = message || '';
        modal.style.display = 'flex';
        modal.classList.add('show');
        // ensure buttons exist
        function cleanup(result) {
            try { modal.style.display = 'none'; modal.classList.remove('show'); } catch (e) {}
            ok.removeEventListener('click', onOk);
            cancel.removeEventListener('click', onCancel);
            close.removeEventListener('click', onCancel);
            resolve(result);
        }
        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        ok.addEventListener('click', onOk);
        cancel.addEventListener('click', onCancel);
        close.addEventListener('click', onCancel);
    });
}
// showActualStatePicker(message, title) -> Promise<string|null>
function showActualStatePicker(message, title) {
    return new Promise(resolve => {
        const modal = document.getElementById('confirm-modal');
        // Fallback to prompt if modal not present
        if (!modal) {
            const ans = window.prompt((message || 'Set actual state (online/offline):') + '\nEnter online or offline', 'offline');
            if (!ans) return resolve(null);
            const val = (ans || '').trim().toLowerCase();
            if (val !== 'online' && val !== 'offline') return resolve(null);
            return resolve(val);
        }
        const body = document.getElementById('confirm-modal-body');
        const ok = document.getElementById('confirm-modal-ok');
        const cancel = document.getElementById('confirm-modal-cancel');
        const close = document.getElementById('confirm-modal-close');
        const titleEl = document.getElementById('confirm-modal-title');
        if (titleEl) titleEl.innerText = title || 'Set actual state';
        if (body) body.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="font-size:0.95rem;">${(message||'Choose actual state')}</div>
                <label style="display:flex;align-items:center;gap:8px;"><input type="radio" name="bb_actual_state" value="online"> <span>Online</span></label>
                <label style="display:flex;align-items:center;gap:8px;"><input type="radio" name="bb_actual_state" value="offline" checked> <span>Offline</span></label>
            </div>`;
        modal.style.display = 'flex';
        modal.classList.add('show');
        function cleanup() {
            try { modal.style.display = 'none'; modal.classList.remove('show'); } catch (e) {}
            ok.removeEventListener('click', onOk);
            cancel.removeEventListener('click', onCancel);
            close.removeEventListener('click', onCancel);
        }
        function onOk() {
            const sel = modal.querySelector('input[name="bb_actual_state"]:checked');
            const v = sel ? sel.value : null;
            cleanup();
            resolve(v);
        }
        function onCancel() {
            cleanup();
            resolve(null);
        }
        ok.addEventListener('click', onOk);
        cancel.addEventListener('click', onCancel);
        close.addEventListener('click', onCancel);
    });
}
// Return array of selected employee IDs (strings)
function getSelectedEmployeeIds() {
    return Array.from(document.querySelectorAll('.employee-select:checked')).map(cb => cb.value);
}

// Attach change handlers to employee-select checkboxes and keep select-all in sync
function attachEmployeeSelectHandlers() {
    const selectAll = document.getElementById('select-all-employees');
    // header checkbox handler (only attach once)
    if (selectAll && !selectAll._hasSelectionHandler) {
        selectAll._hasSelectionHandler = true;
        selectAll.addEventListener('change', function() {
            document.querySelectorAll('.employee-select').forEach(cb => cb.checked = selectAll.checked);
            // Ensure toolbar updates when select-all toggled
            updateBulkToolbarState();
        });
    }
    // per-row checkboxes
    document.querySelectorAll('.employee-select').forEach(cb => {
        if (cb._hasSelectionHandler) return; cb._hasSelectionHandler = true;
        cb.addEventListener('change', function() {
            const all = Array.from(document.querySelectorAll('.employee-select'));
            if (selectAll) selectAll.checked = all.length > 0 && all.every(c => c.checked);
            // Update bulk toolbar visibility
            updateBulkToolbarState();
        });
    });
    // Ensure toolbar state is correct after handlers attached
    updateBulkToolbarState();
}

function updateBulkToolbarState() {
    const btn = document.getElementById('btn-bulk-delete');
    if (!btn) return;
    const selected = getSelectedEmployeeIds();
    const has = selected && selected.length > 0;
    // Show/hide the bulk-delete button depending on selection
    btn.style.display = has ? '' : 'none';
}

// Bulk delete handler
document.addEventListener('DOMContentLoaded', function() {
    const bulkBtn = document.getElementById('btn-bulk-delete');
    if (!bulkBtn) return;
    bulkBtn.addEventListener('click', async function() {
        const ids = getSelectedEmployeeIds();
        if (!ids || ids.length === 0) return;
        const ok = await showConfirm('Are you sure you want to permanently delete the selected employees? This cannot be undone.', 'Delete employees');
        if (!ok) return;
        try {
            const resp = await fetch('employees_bulk.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_ids: ids })
            });
            const data = await resp.json().catch(() => ({}));
            if (data && data.success) {
                (data.deleted || []).forEach(id => {
                    const row = document.querySelector('#employees-table tbody tr[data-employee-id="' + id + '"]');
                    if (row && row.parentNode) row.parentNode.removeChild(row);
                });
                updateBulkToolbarState();
                if ((data.failed || []).length > 0) {
                    showToast('warning', 'Some items could not be deleted. See console for details.');
                    console.warn('Failed deletions', data.failed);
                } else {
                    showToast('success', 'Selected employees deleted.');
                }
            } else {
                showToast('error', data && data.message ? data.message : 'Failed to delete selected employees');
            }
        } catch (err) {
            console.error(err);
            showToast('error', 'Network or server error while deleting');
        }
    });
});
// --- Employee Table Pagination Logic ---
document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('employees-table');
    const paginationBar = document.querySelector('.employee-pagination-bar');
    if (!table || !paginationBar) return;
    let rowsPerPage = 10;
    let currentPage = 1;
    // Helper: get all rows and manage filtered state via class 'filtered-out'
    function getAllRows() {
        return Array.from(table.querySelectorAll('tbody tr'));
    }
    function getVisibleRows() {
        return getAllRows().filter(r => !r.classList.contains('filtered-out'));
    }
    function getTotalPages() {
        return Math.max(1, Math.ceil(getVisibleRows().length / rowsPerPage));
    }
    function updatePagination() {
        const totalPages = getTotalPages();
        // Update input and total
        const pageInput = paginationBar.querySelector('.pagination-page-input');
        const totalSpan = paginationBar.querySelector('.pagination-total-pages');
        pageInput.value = currentPage;
        totalSpan.textContent = totalPages;
        // Enable/disable buttons
        const prevBtn = paginationBar.querySelector('.pagination-prev');
        const nextBtn = paginationBar.querySelector('.pagination-next');
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
        prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
        nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
    }
    function showPage(page) {
        const all = getAllRows();
        const visible = getVisibleRows();
        const totalPages = getTotalPages();
        currentPage = Math.max(1, Math.min(page, totalPages));
        // For each row, if it's filtered-out keep hidden. Otherwise determine its index in visible set.
        all.forEach(row => {
            if (row.classList.contains('filtered-out')) {
                row.style.display = 'none';
                return;
            }
            const visIndex = visible.indexOf(row);
            if (visIndex === -1) {
                row.style.display = 'none';
            } else {
                row.style.display = (visIndex >= (currentPage-1)*rowsPerPage && visIndex < currentPage*rowsPerPage) ? '' : 'none';
            }
        });
        updatePagination();
    }
    // Initial display
    showPage(1);
    // Button handlers
    const prevBtn = paginationBar.querySelector('.pagination-prev');
    const nextBtn = paginationBar.querySelector('.pagination-next');
    prevBtn.addEventListener('click', function() {
        if (typeof serverMode !== 'undefined' && serverMode) {
            // server-driven pagination: ask server for previous page
            const pageInputEl = paginationBar.querySelector('.pagination-page-input');
            let page = parseInt((pageInputEl && pageInputEl.value) || '1', 10) || 1;
            if (page > 1) loadEmployeesServer(page - 1);
        } else {
            if (currentPage > 1) showPage(currentPage - 1);
        }
    });
    nextBtn.addEventListener('click', function() {
        if (typeof serverMode !== 'undefined' && serverMode) {
            // server-driven pagination: ask server for next page
            const pageInputEl = paginationBar.querySelector('.pagination-page-input');
            const totalSpan = paginationBar.querySelector('.pagination-total-pages');
            let page = parseInt((pageInputEl && pageInputEl.value) || '1', 10) || 1;
            const total = parseInt((totalSpan && totalSpan.textContent) || '1', 10) || 1;
            if (page < total) loadEmployeesServer(page + 1);
        } else {
            if (currentPage < getTotalPages()) showPage(currentPage + 1);
        }
    });
    // Page input handler
    const pageInput = paginationBar.querySelector('.pagination-page-input');
    pageInput.addEventListener('change', function() {
        let val = parseInt(pageInput.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (typeof serverMode !== 'undefined' && serverMode) {
            // When server-mode, ask the server for the requested page
            loadEmployeesServer(val);
            return;
        }
        if (val > getTotalPages()) val = getTotalPages();
        showPage(val);
    });
    // Rows per page handler
    const rowsSelect = paginationBar.querySelector('.pagination-rows-select');
    rowsSelect.addEventListener('change', function() {
        rowsPerPage = parseInt(rowsSelect.value, 10) || 10;
        if (typeof serverMode !== 'undefined' && serverMode) {
            loadEmployeesServer(1);
        } else {
            showPage(1);
        }
    });
    // --- Filtering logic (server-backed with client-side fallback) ---
    function debounce(fn, wait) {
        let t;
        return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
    }

    // client-side apply (fallback)
    function applyFilters() {
        const q = (document.getElementById('employee-search') || {}).value || '';
        const role = (document.getElementById('employee-role-filter') || {}).value || '';
        const status = (document.getElementById('employee-status-filter') || {}).value || '';
        const lq = q.trim().toLowerCase();
        getAllRows().forEach(row => {
            const name = (getEditableCellText(row, 0) || '').toLowerCase();
            const email = (getEditableCellText(row, 1) || '').toLowerCase();
            const phone = (getEditableCellText(row, 2) || '').toLowerCase();
            const roleCell = (getEditableCellText(row, 3) || '').toLowerCase();
            const badge = row.querySelector('.status-badge') || row.querySelector('.status-badge-edit');
            let rowStatus = '';
            if (badge) {
                const ds = badge.getAttribute('data-status');
                if (ds) rowStatus = ds.toLowerCase();
                else rowStatus = badge.classList.contains('status-active') ? 'active' : (badge.classList.contains('status-inactive') ? 'inactive' : 'active');
            }
            let matches = true;
            if (lq) {
                matches = name.indexOf(lq) !== -1 || email.indexOf(lq) !== -1 || phone.indexOf(lq) !== -1 || roleCell.indexOf(lq) !== -1;
            }
            if (matches && role) matches = roleCell === role.toLowerCase();
            if (matches && status) matches = rowStatus === status.toLowerCase();
            if (!matches) row.classList.add('filtered-out'); else row.classList.remove('filtered-out');
        });
        const tableEl = document.getElementById('employees-table');
        if (tableEl) {
            const visibleCount = getVisibleRows().length;
            let noMsg = document.getElementById('no-employees-filter-message');
            if (!noMsg) {
                noMsg = document.createElement('div');
                noMsg.id = 'no-employees-filter-message';
                noMsg.style.textAlign = 'center';
                noMsg.style.color = '#aaa';
                noMsg.style.padding = '20px 0';
                noMsg.innerText = 'No matching employees found.';
                tableEl.parentNode.insertBefore(noMsg, tableEl.nextSibling);
            }
            noMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        }
        showPage(1);
    }

    // server-mode: load rows via API and render
    let serverMode = false;
    function renderRowsFromServer(rows) {
        let table = document.getElementById('employees-table');
        let tbody;
        if (!table) {
            table = document.createElement('table');
            table.className = 'roles-table';
            table.id = 'employees-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th class="select-col" style="width:40px;text-align:center;"><input id="select-all-employees" type="checkbox" aria-label="Select all employees" /></th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th class="status-col">Status</th>
                        <th class="action-col">Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>`;
            const tabContent = document.getElementById('content-manage-employees');
            if (tabContent) tabContent.insertBefore(table, tabContent.querySelector('.employee-pagination-bar'));
        }
        tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        rows.forEach(r => {
            const id = r.id;
            const name = (r.full_name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const email = (r.email || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const phone = (r.phone || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const role = (r.role_name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const status = (r.status || 'active');
            const isActive = status === 'active';
            const badgeClass = isActive ? 'status-active' : 'status-inactive';
            const iconClass = isActive ? 'fa-check-circle' : 'fa-times-circle';
            const statusText = isActive ? 'Active' : 'Inactive';
            const tr = document.createElement('tr');
            tr.setAttribute('data-employee-id', id);
            tr.className = 'employee-row';
            tr.innerHTML = `
                <td class="select-col" style="text-align:center;"><input type="checkbox" class="employee-select" name="selected_employees[]" value="${id}" aria-label="Select ${name}" /></td>
                <td class="editable-cell employee-name-cell">${name}</td>
                <td class="editable-cell employee-email-cell">${email}</td>
                <td class="editable-cell employee-phone-cell">${phone}</td>
                <td class="editable-cell employee-role-cell">${role}</td>
                <td class="status-col">
                    <span class="status-badge ${badgeClass} status-badge-edit" style="cursor:pointer;" title="Toggle Status" data-employee-id="${id}" data-status="${status}">
                        <i class="fas ${iconClass}"></i>
                        <span class="status-text">${statusText}</span>
                    </span>
                </td>
                <td class="action-col">
                    <button class="btn-edit-role" title="Edit"><i class="fas fa-pen"></i> <span>Edit</span></button>
                    <button class="btn-delete-role" title="Delete"><i class="fas fa-trash"></i> <span>Delete</span></button>
                </td>`;
            tbody.appendChild(tr);
        });
    attachDynamicRowHandlers();
    // Attach employee-select handlers for newly rendered rows
    attachEmployeeSelectHandlers();
    // set tooltips for truncated content
    setCellTooltips();
    }

    function attachDynamicRowHandlers() {
        document.querySelectorAll('.status-badge-edit').forEach(function(badge) {
            if (badge._hasHandler) return; badge._hasHandler = true;
            badge.addEventListener('click', async function(e) {
                const empId = this.getAttribute('data-employee-id');
                if (!empId) return;
                    const badgeEl = this;
                    // Ensure actual_state exists on dynamically attached badges as well
                    let actualState = (badgeEl.getAttribute('data-actual-state') || '').toString().trim().toLowerCase();
                    if (!actualState || actualState === 'offline' || actualState === 'unknown') {
                        const chosen = await showActualStatePicker('Actual state is not set for this employee. Choose actual state before toggling.', 'Set actual state');
                        if (!chosen) { try { showToast('info', 'Toggling cancelled; actual state not set.'); } catch (e) {} ; return; }
                        actualState = chosen;
                        badgeEl.setAttribute('data-actual-state', actualState);
                    }
                    fetch('toggle_employee_status.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'id=' + encodeURIComponent(empId) + '&actual_state=' + encodeURIComponent(actualState)
                    })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        const newStatus = data.new_status;
                        badgeEl.setAttribute('data-status', newStatus);
                        const icon = badgeEl.querySelector('i');
                        const text = badgeEl.querySelector('.status-text');
                        if (newStatus === 'active') {
                            badgeEl.classList.add('status-active');
                            badgeEl.classList.remove('status-inactive');
                            if (icon) { icon.classList.add('fa-check-circle'); icon.classList.remove('fa-times-circle'); }
                            if (text) text.textContent = 'Unlocked';
                        } else {
                            badgeEl.classList.remove('status-active');
                            badgeEl.classList.add('status-inactive');
                            if (icon) { icon.classList.remove('fa-check-circle'); icon.classList.add('fa-times-circle'); }
                            if (text) text.textContent = 'Locked';
                        }
                        } else {
                            showToast('error', data.message || 'Failed to toggle lock');
                        }
                    })
                    .catch(() => showToast('error', 'Failed to toggle lock'));
            });
        });

        document.querySelectorAll('.btn-delete-role').forEach(function(btn) {
            if (btn._hasHandler) return; btn._hasHandler = true;
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const ok = await showConfirm('Are you sure you want to delete this employee?', 'Delete employee');
                if (!ok) return;
                const row = this.closest('tr');
                const empId = row && (row.getAttribute('data-employee-id') || '');
                if (empId && /^\d+$/.test(empId)) {
                    try {
                        const resp = await fetch('delete_employee.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: `employee_id=${encodeURIComponent(empId)}`
                        });
                        const data = await resp.json().catch(() => ({}));
                        if (data && data.success) {
                            if (row && row.parentNode) row.parentNode.removeChild(row);
                            showToast('success', 'Employee deleted.');
                        } else {
                            showToast('error', data.message || 'Failed to delete employee');
                        }
                    } catch (err) {
                        console.error(err);
                        const removeLocal = await showConfirm('Could not contact server to delete account. Remove locally from the table instead?', 'Remove locally?');
                        if (removeLocal) {
                            if (row && row.parentNode) row.parentNode.removeChild(row);
                        }
                    }
                } else {
                    if (row && row.parentNode) row.parentNode.removeChild(row);
                }
            });
        });

        document.querySelectorAll('.btn-edit-role').forEach(function(btn) {
            if (btn._hasHandler) return; btn._hasHandler = true;
            btn.addEventListener('click', function() {
                openEmployeeEditModal();
                var row = this.closest('tr');
                window.currentEditingEmployeeRow = row;
                if (!row) return;
                var nameEl = document.getElementById('edit-employee-name');
                var emailEl = document.getElementById('edit-employee-email');
                var phoneEl = document.getElementById('edit-employee-phone');
                var roleEl = document.getElementById('edit-employee-role');
                if (nameEl) nameEl.value = getEditableCellText(row, 0);
                if (emailEl) emailEl.value = getEditableCellText(row, 1);
                if (phoneEl) phoneEl.value = getEditableCellText(row, 2);
                if (roleEl) roleEl.value = getEditableCellText(row, 3);
                try { if (typeof updateFormGroupState === 'function') { if (nameEl) updateFormGroupState(nameEl); if (emailEl) updateFormGroupState(emailEl); if (phoneEl) updateFormGroupState(phoneEl); if (roleEl) updateFormGroupState(roleEl); } } catch (err) {}
            });
        });
    }

    // Add tooltips for truncated table cells (only if text is overflowing)
    function setCellTooltips() {
        const selector = '#employees-table tbody tr td.employee-name-cell, #employees-table tbody tr td.employee-email-cell, #employees-table tbody tr td.employee-phone-cell, #employees-table tbody tr td.employee-role-cell';
            document.querySelectorAll(selector).forEach(td => {
            // clear previous title
            td.removeAttribute('title');
            // use timeout to ensure rendered widths are calculated after DOM changes
            try {
                if (td.scrollWidth > td.clientWidth + 1) {
                    td.setAttribute('title', td.innerText.trim());
                }
            } catch (e) {
                // ignore
            }
        });
    }
    // update tooltips on window resize and after dynamic row changes
    window.addEventListener('resize', function() { setTimeout(setCellTooltips, 120); });

    function loadEmployeesServer(pageNum) {
        pageNum = pageNum || 1;
        const q = (document.getElementById('employee-search') || {}).value || '';
        const role = (document.getElementById('employee-role-filter') || {}).value || '';
        const status = (document.getElementById('employee-status-filter') || {}).value || '';
        const perPage = parseInt((document.querySelector('.pagination-rows-select') || {}).value || 10, 10);
        const params = new URLSearchParams({ q: q, role: role, status: status, page: pageNum, per_page: perPage });
        fetch('employees_api.php?' + params.toString(), { credentials: 'same-origin' })
            .then(r => r.json())
            .then(data => {
                if (data && data.success) {
                    serverMode = true;
                    // keep client-side currentPage in sync so other UI code reads the right value
                    try { currentPage = parseInt(data.page || pageNum, 10) || 1; } catch (e) { currentPage = pageNum; }
                    renderRowsFromServer(data.rows || []);
                    const totalPages = data.total_pages || 1;
                    const pageInput = paginationBar.querySelector('.pagination-page-input');
                    const totalSpan = paginationBar.querySelector('.pagination-total-pages');
                    const prevBtn = paginationBar.querySelector('.pagination-prev');
                    const nextBtn = paginationBar.querySelector('.pagination-next');
                    pageInput.value = data.page || 1;
                    totalSpan.textContent = totalPages;
                    prevBtn.disabled = (data.page || 1) <= 1;
                    nextBtn.disabled = (data.page || 1) >= totalPages;
                    prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
                    nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
                } else {
                    serverMode = false;
                    applyFilters();
                }
            })
            .catch(() => { serverMode = false; applyFilters(); });
    }

    const debouncedApply = debounce(applyFilters, 250);
    const searchEl = document.getElementById('employee-search');
    if (searchEl) searchEl.addEventListener('input', function() { if (serverMode) { debouncedApply(); loadEmployeesServer(1); } else debouncedApply(); });
    const roleFilter = document.getElementById('employee-role-filter');
    if (roleFilter) roleFilter.addEventListener('change', function() { 
        if (serverMode) loadEmployeesServer(1); else applyFilters(); 
        // Reset header select-all checkbox when role filter changes to avoid stale selection state
        try {
            const sa = document.getElementById('select-all-employees');
            if (sa && sa.checked) { sa.checked = false; updateBulkToolbarState(); }
        } catch (e) {}
    });
    const statusFilter = document.getElementById('employee-status-filter');
    if (statusFilter) statusFilter.addEventListener('change', function() {
        if (serverMode) loadEmployeesServer(1); else applyFilters();
        // Reset header select-all checkbox when status filter changes to avoid stale selection state
        try {
            const sa = document.getElementById('select-all-employees');
            if (sa && sa.checked) { sa.checked = false; updateBulkToolbarState(); }
        } catch (e) {}
    });
    const clearBtn = document.getElementById('employee-clear-filters');
    if (clearBtn) clearBtn.addEventListener('click', function() {
        if (searchEl) searchEl.value = '';
        if (roleFilter) roleFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        // Reset header select-all checkbox when clearing filters to avoid stale selection state
        try {
            const sa = document.getElementById('select-all-employees');
            if (sa && sa.checked) { sa.checked = false; updateBulkToolbarState(); }
        } catch (e) {}
        if (serverMode) loadEmployeesServer(1); else {
            getAllRows().forEach(r => r.classList.remove('filtered-out'));
            const noMsg = document.getElementById('no-employees-filter-message'); if (noMsg) noMsg.style.display = 'none';
            showPage(1);
        }
    });

    // Try server on initial load; if it fails, fallback to client-side
    try { loadEmployeesServer(1); } catch (err) { /* ignore */ }

    // Ensure tooltips are set for the initial client-side table too
    setTimeout(setCellTooltips, 200);
    // Ensure employee checkbox handlers are attached (handles existing rows)
    attachEmployeeSelectHandlers();
});
// Consolidated accounts JS (moved from assets/js/content.js + page inline handlers)
// This file is loaded by pages in pages/accounts/*.php

function showTab(tab) {
    document.getElementById('content-manage-roles').style.display = (tab === 'manage-roles') ? '' : 'none';
    document.getElementById('content-set-permissions').style.display = (tab === 'set-permissions') ? '' : 'none';
    document.getElementById('tab-manage-roles').classList.toggle('active', tab === 'manage-roles');
    document.getElementById('tab-set-permissions').classList.toggle('active', tab === 'set-permissions');

    const infoText = document.getElementById('tab-info-text');
    const infoActions = document.getElementById('tab-info-actions');
    const infoBar = document.querySelector('.tab-info-bar');
    // Remove any previously injected edit button
    let oldEditBtn = document.getElementById('btn-edit-permissions');
    if (oldEditBtn) oldEditBtn.remove();

    if (tab === 'manage-roles') {
        infoText.textContent = "Add, edit, or remove roles as needed for your system. Note: Adding a new role will automatically assign all permissions to it.";
        infoActions.innerHTML = `
            <button class="btn-add-role" id="btn-add-role"><i class="fas fa-plus"></i> Add Role</button>
            <button class="btn-select-role" id="btn-select-role"><i class="fas fa-check-square"></i></button>
        `;
        attachRoleTabHandlers();
    } else {
        infoText.textContent = "Use this section to define what each role can access and modify within the application.";
        infoActions.innerHTML = '';
        let editBtn = document.createElement('button');
        editBtn.className = 'btn-edit-permissions';
        editBtn.id = 'btn-edit-permissions';
        editBtn.innerHTML = '<i class="fas fa-pen-to-square"></i> Edit';
        editBtn.style.marginTop = '25px';
        infoBar.appendChild(editBtn);
        const saveBtnEl = document.getElementById('btn-save-permissions');
        if (saveBtnEl) saveBtnEl.style.display = "none";
    }
    localStorage.setItem('activeTab', tab); // Save active tab
    // Also set a cookie for PHP to read
    document.cookie = 'access_tab=' + encodeURIComponent(tab) + '; path=/';
}

function togglePermissions(header) {
    // Close all other role-permissions
    document.querySelectorAll('.role-permissions.open').forEach(openBlock => {
        if (openBlock !== header.closest('.role-permissions')) {
            openBlock.classList.remove('open');
        }
    });
    // Toggle the selected one
    const container = header.closest('.role-permissions');
    container.classList.toggle('open');
}

// Add this script to handle ellipsis menu toggle
document.querySelectorAll('.ellipsis-icon').forEach(icon => {
    icon.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.ellipsis-menu').forEach(menu => menu.classList.remove('open'));
        this.parentElement.classList.toggle('open');
    });
});
document.addEventListener('click', () => {
    document.querySelectorAll('.ellipsis-menu').forEach(menu => menu.classList.remove('open'));
});

document.querySelectorAll('.btn-edit-role').forEach(function(editBtn) {
    editBtn.addEventListener('click', function() {
        const row = this.closest('tr');
        // Only apply inline role-edit behavior to rows that represent roles.
        // Employee rows use data-employee-id and open a modal instead, so skip them here.
        if (!row || !row.dataset.roleId) return;
        // Disable Add Role and Select buttons
        const addRoleBtn = document.getElementById('btn-add-role');
        const selectBtn = document.getElementById('btn-select-role');
        const setPermTab = document.getElementById('tab-set-permissions');
        if (addRoleBtn) {
            addRoleBtn.disabled = true;
            addRoleBtn.style.pointerEvents = 'none';
            addRoleBtn.style.opacity = 0.5;
        }
        if (selectBtn) {
            selectBtn.disabled = true;
            selectBtn.style.pointerEvents = 'none';
            selectBtn.style.opacity = 0.5;
        }
        if (setPermTab) {
            setPermTab.disabled = true;
            setPermTab.style.pointerEvents = 'none';
            setPermTab.style.opacity = 0.5;
        }
        row.querySelectorAll('.editable-cell').forEach(cell => {
            cell.contentEditable = "true";
            cell.style.background = "#232323";
            cell.focus();
        });
        this.style.display = "none";
        const saveBtn = row.querySelector('.btn-save-role');
        if (saveBtn) saveBtn.style.display = "inline-block";
        const cancelBtn = row.querySelector('.btn-cancel-role');
        if (cancelBtn) cancelBtn.style.display = "inline-block";
        const deleteBtn = row.querySelector('.btn-delete-role');
        if (deleteBtn) deleteBtn.style.display = "inline-block"; // Show delete
        // Store original values for cancel
        const editableCells = Array.from(row.querySelectorAll('.editable-cell'));
        const statusBadge = row.querySelector('.status-badge-edit');
        const statusValue = statusBadge && statusBadge.innerHTML.includes('fa-check-circle') ? 'active' : 'inactive';
        row.dataset.original = JSON.stringify([
            editableCells[0].innerText, // name
            editableCells[1].innerText, // description
            statusValue // status
        ]);

        // Also re-enable Add Role, Select, and Set Permissions if deleted
        if (deleteBtn) {
            // Remove any previous handler to avoid stacking
            deleteBtn.onclick = null;
            deleteBtn.addEventListener('click', function handler(e) {
                setTimeout(() => {
                    if (addRoleBtn) {
                        addRoleBtn.disabled = false;
                        addRoleBtn.style.pointerEvents = '';
                        addRoleBtn.style.opacity = '';
                    }
                    if (selectBtn) {
                        selectBtn.disabled = false;
                        selectBtn.style.pointerEvents = '';
                        selectBtn.style.opacity = '';
                    }
                    if (setPermTab) {
                        setPermTab.disabled = false;
                        setPermTab.style.pointerEvents = '';
                        setPermTab.style.opacity = '';
                    }
                }, 100);
            }, { once: true });
        }
    });
});

document.querySelectorAll('.btn-save-role').forEach(function(saveBtn) {
    saveBtn.addEventListener('click', async function() {
        // Re-enable Add Role and Select buttons after save
        const addRoleBtn = document.getElementById('btn-add-role');
        const selectBtn = document.getElementById('btn-select-role');
        const setPermTab = document.getElementById('tab-set-permissions');
        if (addRoleBtn) {
            addRoleBtn.disabled = false;
            addRoleBtn.style.pointerEvents = '';
            addRoleBtn.style.opacity = '';
        }
        if (selectBtn) {
            selectBtn.disabled = false;
            selectBtn.style.pointerEvents = '';
            selectBtn.style.opacity = '';
        }
        if (setPermTab) {
            setPermTab.disabled = false;
            setPermTab.style.pointerEvents = '';
            setPermTab.style.opacity = '';
        }
        const row = this.closest('tr');
        const original = JSON.parse(row.dataset.original || "[]");
        const editableCells = Array.from(row.querySelectorAll('.editable-cell'));
        const statusBadge = row.querySelector('.status-badge-edit');
        const statusValue = statusBadge && statusBadge.innerHTML.includes('fa-check-circle') ? 'active' : 'inactive';
        const current = [
            editableCells[0].innerText, // name
            editableCells[1].innerText, // description
            statusValue // status
        ];
        const changed = original.some((val, idx) => val !== current[idx]);
    if (!changed || await showConfirm("Are you sure you want to save changes?", 'Save changes')) {
            // AJAX to update_role.php
            const roleId = row.dataset.roleId;
            const name = current[0].trim();
            const desc = current[1].trim();
            fetch('update_role.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `role_id=${encodeURIComponent(roleId)}&name=${encodeURIComponent(name)}&description=${encodeURIComponent(desc)}&status=${encodeURIComponent(statusValue)}`
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    row.querySelectorAll('.editable-cell').forEach(cell => {
                        cell.contentEditable = "false";
                        cell.style.background = "";
                    });
                    saveBtn.style.display = "none";
                    const cancelBtn = row.querySelector('.btn-cancel-role');
                    if (cancelBtn) cancelBtn.style.display = "none";
                    const editBtn = row.querySelector('.btn-edit-role');
                    if (editBtn) editBtn.style.display = "inline-block";
                    const deleteBtn = row.querySelector('.btn-delete-role');
                    if (deleteBtn) deleteBtn.style.display = "none";
                } else {
                    showToast('error', data.message || 'Failed to update role.');
                }
            })
            .catch(() => showToast('error', 'Failed to update role.'));
        }
    });
});

// Attach delete logic for role delete buttons (after DOM is ready)
document.addEventListener('DOMContentLoaded', function() {
    // Replace role delete handlers to use in-page confirm/toast when not in select mode
    document.querySelectorAll('.btn-delete-role').forEach(function(deleteBtn) {
        // Remove any previous click handlers to prevent stacking
        const newBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);
    });
    document.querySelectorAll('.btn-delete-role').forEach(function(deleteBtn) {
        deleteBtn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const row = this.closest('tr');
            const roleId = row && row.dataset.roleId;
            if (typeof selectMode !== 'undefined' && selectMode) return;
            const ok = await showConfirm('Are you sure you want to delete this role?', 'Delete role');
            if (!ok) return;
            try {
                const res = await fetch('delete_role.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `role_id=${encodeURIComponent(roleId)}`
                });
                const data = await res.json().catch(() => ({}));
                if (data.success) {
                    if (row && row.parentNode) row.parentNode.removeChild(row);
                    showToast('success', 'Role deleted.');
                } else {
                    if (data.message && data.message.trim()) {
                        showToast('error', data.message);
                    } else {
                        console.warn('Failed to delete role (no error message from server).');
                        showToast('error', 'Failed to delete role.');
                    }
                }
            } catch (err) {
                console.warn('Failed to delete role (network or server error).', err);
                showToast('error', 'Network or server error while deleting role.');
            }
        });
    });
});

document.querySelectorAll('.btn-cancel-role').forEach(function(cancelBtn) {
    cancelBtn.addEventListener('click', async function() {
        // Re-enable Add Role and Select buttons after cancel
        const addRoleBtn = document.getElementById('btn-add-role');
        const selectBtn = document.getElementById('btn-select-role');
        const setPermTab = document.getElementById('tab-set-permissions');
        if (addRoleBtn) {
            addRoleBtn.disabled = false;
            addRoleBtn.style.pointerEvents = '';
            addRoleBtn.style.opacity = '';
        }
        if (selectBtn) {
            selectBtn.disabled = false;
            selectBtn.style.pointerEvents = '';
            selectBtn.style.opacity = '';
        }
        if (setPermTab) {
            setPermTab.disabled = false;
            setPermTab.style.pointerEvents = '';
            setPermTab.style.opacity = '';
        }
        const row = this.closest('tr');
        const original = JSON.parse(row.dataset.original || "[]");
        const editableCells = Array.from(row.querySelectorAll('.editable-cell'));
        const statusBadge = row.querySelector('.status-badge-edit');
        const statusValue = statusBadge && statusBadge.innerHTML.includes('fa-check-circle') ? 'active' : 'inactive';
        const current = [
            editableCells[0].innerText, // name
            editableCells[1].innerText, // description
            statusValue // status
        ];
        const changed = original.some((val, idx) => val !== current[idx]);
    if (!changed || await showConfirm("Are you sure you want to cancel editing?", 'Cancel editing')) {
            // Restore original values if needed
            if (changed) {
                editableCells[0].innerText = original[0] || editableCells[0].innerText;
                editableCells[1].innerText = original[1] || editableCells[1].innerText;
                if (statusBadge) {
                    if (original[2] === 'active') {
                        statusBadge.innerHTML = '<i class="fas fa-check-circle" style="color:#4caf50;"></i> <span style="text-transform:capitalize; font-weight:400; font-size:1rem;">active</span>';
                    } else {
                        statusBadge.innerHTML = '<i class="fas fa-times-circle" style="color:#e53e3e;"></i> <span style="text-transform:capitalize; font-weight:400; font-size:1rem;">inactive</span>';
                    }
                }
            }
            editableCells.forEach(cell => {
                cell.contentEditable = "false";
                cell.style.background = "";
            });
            this.style.display = "none";
            const saveBtn = row.querySelector('.btn-save-role');
            if (saveBtn) saveBtn.style.display = "none";
            const editBtn = row.querySelector('.btn-edit-role');
            if (editBtn) editBtn.style.display = "inline-block";
            const deleteBtn = row.querySelector('.btn-delete-role');
            if (deleteBtn) deleteBtn.style.display = "none"; // Hide delete
        }
    });
});


let selectMode = false;

function attachRoleTabHandlers() {
    const addRoleBtn = document.getElementById('btn-add-role');
    const selectBtn = document.getElementById('btn-select-role');
    const selectCols = document.querySelectorAll('.select-col');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const rowCheckboxes = document.querySelectorAll('.row-select-checkbox');

    function setSelectMode(enabled) {
        selectMode = enabled;
        // When entering select mode, disable all Edit buttons and Set Permissions tab
        document.querySelectorAll('.btn-edit-role').forEach(btn => {
            btn.disabled = enabled;
            btn.style.pointerEvents = enabled ? 'none' : '';
            btn.style.opacity = enabled ? 0.5 : '';
        });
        const setPermTab = document.getElementById('tab-set-permissions');
        if (setPermTab) {
            setPermTab.disabled = enabled;
            setPermTab.style.pointerEvents = enabled ? 'none' : '';
            setPermTab.style.opacity = enabled ? 0.5 : '';
        }
        // Always re-select the current buttons
        const addRoleBtn = document.getElementById('btn-add-role');
        const selectBtn = document.getElementById('btn-select-role');
        const selectCols = document.querySelectorAll('.select-col');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const rowCheckboxes = document.querySelectorAll('.row-select-checkbox');
        // Show/hide the select column (header and cells)
        selectCols.forEach(col => col.style.display = enabled ? 'table-cell' : 'none');
        // Show/hide the checkboxes
        rowCheckboxes.forEach(cb => cb.style.display = enabled ? 'inline-block' : 'none');
        if (selectAllCheckbox) selectAllCheckbox.style.display = enabled ? 'inline-block' : 'none';
    if (enabled) {
            // Change Add Role to Cancel
            if (addRoleBtn) {
                addRoleBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
                addRoleBtn.classList.add('cancel');
            }
            // Change Select to Delete
            if (selectBtn) {
                selectBtn.classList.add('delete');
                selectBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
            }
        } else {
            // When leaving select mode, re-enable all Edit buttons
            document.querySelectorAll('.btn-edit-role').forEach(btn => {
                btn.disabled = false;
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
            });
            // Restore Add Role
            if (addRoleBtn) {
                addRoleBtn.innerHTML = '<i class="fas fa-plus"></i> Add Role';
                addRoleBtn.classList.remove('cancel');
            }
            // Restore Select
            if (selectBtn) {
                selectBtn.classList.remove('delete');
                selectBtn.innerHTML = '<i class="fas fa-check-square"></i>';
            }
            rowCheckboxes.forEach(cb => cb.checked = false);
            if (selectAllCheckbox) selectAllCheckbox.checked = false;
        }
    }

    // Select button logic
    if (selectBtn) {
        selectBtn.addEventListener('click', async function() {
            if (!selectMode) {
                setSelectMode(true);
            } else {
                // Delete selected
                const checkedRows = Array.from(document.querySelectorAll('.row-select-checkbox')).filter(cb => cb.checked);
                if (checkedRows.length === 0) return;
                if (checkedRows.length === document.querySelectorAll('.row-select-checkbox').length) {
                    if (!await showConfirm('Are you sure you want to delete ALL selected roles?', 'Delete roles')) return;
                } else {
                    if (!await showConfirm('Are you sure you want to delete the selected roles?', 'Delete roles')) return;
                }
                // Collect role IDs from data-role-id
                const roleIds = checkedRows.map(cb => cb.closest('tr').dataset.roleId).filter(Boolean);
                if (roleIds.length === 0) {
                    // fallback: remove from UI only
                    checkedRows.forEach(cb => {
                        const row = cb.closest('tr');
                        row.parentNode.removeChild(row);
                    });
                    setSelectMode(false);
                    return;
                }
                fetch('delete_roles.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role_ids: roleIds })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        checkedRows.forEach(cb => {
                            const row = cb.closest('tr');
                            row.parentNode.removeChild(row);
                        });
                        setSelectMode(false);
                    } else {
                        showToast('error', data.message || 'Failed to delete roles.');
                    }
                })
                .catch(() => showToast('error', 'Failed to delete roles.'));
            }
        });
    }

    // Add Role/Cancel button logic
    if (addRoleBtn) {
    addRoleBtn.addEventListener('click', function() {
            const setPermTab = document.getElementById('tab-set-permissions');
            if (selectMode) {
                setSelectMode(false);
            } else {
                // Insert a new editable row at the top of the roles table
                const tbody = document.querySelector('.roles-table tbody');
                // Prevent multiple new rows
                if (tbody && tbody.querySelector('.new-role-row')) return;
                const tr = document.createElement('tr');
                tr.className = 'new-role-row';
                tr.innerHTML = `
                    <td class="editable-cell" contenteditable="true" style="background:#232323;"></td>
                    <td class="editable-cell" contenteditable="true" style="background:#232323;"></td>
                    <td>
                        <button class="btn-save-role" title="Save"><i class="fas fa-check"></i></button>
                        <button class="btn-cancel-role" title="Cancel"><i class="fas fa-times"></i></button>
                    </td>
                    <td style="text-align:center; display:none;" class="select-col">
                        <input type="checkbox" class="row-select-checkbox" style="display:none;">
                    </td>
                `;
                if (tbody) tbody.prepend(tr);
                // Focus the role name cell
                const nameCell = tr.querySelectorAll('.editable-cell')[0];
                if (nameCell) {
                    nameCell.focus();
                    // Move cursor to start (for most browsers)
                    if (window.getSelection && document.createRange) {
                        const range = document.createRange();
                        range.selectNodeContents(nameCell);
                        range.collapse(true);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
                // Disable Edit and Select buttons while adding
                document.querySelectorAll('.btn-edit-role').forEach(btn => {
                    btn.disabled = true;
                    btn.style.pointerEvents = 'none';
                    btn.style.opacity = 0.5;
                });
                const selectBtn = document.getElementById('btn-select-role');
                if (selectBtn) {
                    selectBtn.disabled = true;
                    selectBtn.style.pointerEvents = 'none';
                    selectBtn.style.opacity = 0.5;
                }
                if (setPermTab) {
                    setPermTab.disabled = true;
                    setPermTab.style.pointerEvents = 'none';
                    setPermTab.style.opacity = 0.5;
                }
                // Save button logic
                tr.querySelector('.btn-save-role').addEventListener('click', function() {
                    const cells = tr.querySelectorAll('.editable-cell');
                    const name = cells[0].innerText.trim();
                    const desc = cells[1].innerText.trim();
                    if (!name) {
                        showToast('error', 'Role name is required.');
                        return;
                    }
                    // AJAX to add_role.php
                    fetch('add_role.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `name=${encodeURIComponent(name)}&description=${encodeURIComponent(desc)}`
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.role_id) {
                            // Get all permission IDs from the current page
                            const allPermissionIds = [];
                            document.querySelectorAll('input[type="checkbox"][name="permissions[]"]').forEach(checkbox => {
                                allPermissionIds.push(parseInt(checkbox.value));
                            });
                            
                            // Immediately assign all permissions to this new role in the DB
                            fetch('update_role_permissions.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ role_id: parseInt(data.role_id), permission_ids: allPermissionIds })
                            })
                            .then(res => res.json())
                            .then(permData => {
                                if (permData.success) {
                                    // Reload the page after successful add and permission assignment
                                    window.location.reload();
                                } else {
                                    showToast('error', 'Role added but failed to assign permissions: ' + (permData.message || 'Unknown error'));
                                }
                            })
                            .catch(error => {
                                showToast('error', 'Role added but failed to assign permissions: ' + error.message);
                            });
                        } else {
                            showToast('error', data.message || 'Failed to add role.');
                        }
                    })
                    .catch(() => showToast('error', 'Failed to add role.'));
                });
                // Cancel button logic
                tr.querySelector('.btn-cancel-role').addEventListener('click', function() {
                    tr.remove();
                    // Re-enable Edit and Select buttons after cancel
                    document.querySelectorAll('.btn-edit-role').forEach(btn => {
                        btn.disabled = false;
                        btn.style.pointerEvents = '';
                        btn.style.opacity = '';
                    });
                    const selectBtn = document.getElementById('btn-select-role');
                    if (selectBtn) {
                        selectBtn.disabled = false;
                        selectBtn.style.pointerEvents = '';
                        selectBtn.style.opacity = '';
                    }
                    if (setPermTab) {
                        setPermTab.disabled = false;
                        setPermTab.style.pointerEvents = '';
                        setPermTab.style.opacity = '';
                    }
                });
            }
        });
    }

    // Select all logic
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            document.querySelectorAll('.row-select-checkbox').forEach(cb => cb.checked = selectAllCheckbox.checked);
        });
    }
    document.querySelectorAll('.row-select-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = Array.from(document.querySelectorAll('.row-select-checkbox')).every(cb => cb.checked);
            }
        });
    });
}

// Attach handlers on initial load
attachRoleTabHandlers();

// Select all logic for roles table only (not global)
document.addEventListener('DOMContentLoaded', function() {
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const rowCheckboxes = document.querySelectorAll('.row-select-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            rowCheckboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
        });
    }
    rowCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = Array.from(rowCheckboxes).every(cb => cb.checked);
            }
        });
    });
});

// Edit/Save button logic for permissions
document.addEventListener('click', async function(e) {
    if (e.target && e.target.id === 'btn-edit-permissions') {
        // Add edit mode class for permission hover
        document.body.classList.add('edit-permissions-mode');
        // Disable Manage Roles tab while editing permissions
        const manageRolesTab = document.getElementById('tab-manage-roles');
        if (manageRolesTab) {
            manageRolesTab.disabled = true;
            manageRolesTab.style.pointerEvents = 'none';
            manageRolesTab.style.opacity = 0.5;
        }
        // Enter edit mode: show all permission cards and checkboxes, change Edit to Cancel
        document.querySelectorAll('.role-permissions').forEach(roleBlock => {
            // Get last saved state (original) or current checked state if not present
            let origArr = [];
            if (roleBlock.dataset.original) {
                origArr = JSON.parse(roleBlock.dataset.original);
            } else {
                origArr = Array.from(roleBlock.querySelectorAll('.permission-card')).map(card => {
                    let cb = card.querySelector('input[type="checkbox"]');
                    return cb ? cb.checked : (card.style.display !== 'none');
                });
            }
            roleBlock.querySelectorAll('.permission-card').forEach((card, idx) => {
                // Always show all permission cards in edit mode
                card.style.display = 'block';
                let cb = card.querySelector('input[type="checkbox"]');
                let texts = card.querySelector('span.permission-texts');
                // If not already wrapped, create a flex row container
                let flexRow = card.querySelector('.permission-flex-row');
                if (!flexRow) {
                    flexRow = document.createElement('div');
                    flexRow.className = 'permission-flex-row';
                    flexRow.style.display = 'flex';
                    flexRow.style.alignItems = 'center';
                    // Move texts into flexRow
                    card.appendChild(flexRow);
                    if (texts) flexRow.appendChild(texts);
                }
                if (!cb) {
                    // Add checkbox if not present
                    const permId = card.dataset.permissionId;
                    // Determine checked state from original display
                    const wasVisible = origArr[idx];
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = wasVisible;
                    // Place checkbox as first child in flexRow
                    flexRow.insertBefore(input, flexRow.firstChild);
                } else {
                    cb.style.display = '';
                    cb.disabled = false;
                    cb.checked = origArr[idx];
                }
            });
            // Add Save button to the role-permissions-header if not present
            let header = roleBlock.querySelector('.role-permissions-header');
            let saveBtn = header.querySelector('.btn-save-permissions-role');
            if (!saveBtn) {
                saveBtn = document.createElement('button');
                saveBtn.className = 'btn-save-permissions btn-save-permissions-role';
                saveBtn.textContent = 'Save';
                saveBtn.style.display = 'none';
                saveBtn.style.marginLeft = 'auto';
                saveBtn.addEventListener('click', async function(ev) {
                    ev.stopPropagation();
                    if (!await showConfirm('Saving these changes will affect how users access your system. Are you sure you want to continue?', 'Save permissions')) return;
                    // Gather checked permissions for this role
                    const roleId = roleBlock.dataset.roleId;
                    const checkedPerms = Array.from(roleBlock.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.closest('.permission-card').dataset.permissionId));
                    saveBtn.disabled = true;
                    fetch('update_role_permissions.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role_id: parseInt(roleId), permission_ids: checkedPerms })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            // Reset unsaved state, hide Save button, update original state
                            roleBlock.dataset.original = JSON.stringify(Array.from(roleBlock.querySelectorAll('.permission-card')).map(card => {
                                let cb = card.querySelector('input[type="checkbox"]');
                                return cb ? cb.checked : (card.style.display !== 'none');
                            }));
                            roleBlock.dataset.unsaved = 'false';
                            saveBtn.style.display = 'none';
                            showToast('success', 'Permissions updated successfully.');
                        } else {
                            showToast('error', data.message || 'Failed to update permissions.');
                        }
                    })
                    .catch(() => showToast('error', 'Failed to update permissions.'))
                    .finally(() => { saveBtn.disabled = false; });
                });
                header.appendChild(saveBtn);
            }
            // Store original state for cancel
            const orig = Array.from(roleBlock.querySelectorAll('.permission-card')).map(card => {
                let cb = card.querySelector('input[type="checkbox"]');
                return cb ? cb.checked : (card.style.display !== 'none');
            });
            roleBlock.dataset.original = JSON.stringify(orig);
            roleBlock.dataset.unsaved = 'false';

            // Add change event to checkboxes for unsaved detection and Save button
            roleBlock.querySelectorAll('input[type="checkbox"]').forEach((cb, idx) => {
                cb.addEventListener('change', function() {
                    const origArr = JSON.parse(roleBlock.dataset.original || '[]');
                    const currArr = Array.from(roleBlock.querySelectorAll('.permission-card')).map(card => {
                        let c = card.querySelector('input[type="checkbox"]');
                        return c ? c.checked : (card.style.display !== 'none');
                    });
                    const changed = origArr.some((val, i) => val !== currArr[i]);
                    roleBlock.dataset.unsaved = changed ? 'true' : 'false';
                    // Show/hide Save button for this role
                    let header = roleBlock.querySelector('.role-permissions-header');
                    let saveBtn = header.querySelector('.btn-save-permissions-role');
                    if (saveBtn) saveBtn.style.display = changed ? '' : 'none';
                });
            });
        });
        // Change Edit to Cancel
        const editBtn = document.getElementById('btn-edit-permissions');
        if (editBtn) {
            editBtn.textContent = 'Cancel';
            editBtn.id = 'btn-cancel-permissions';
        }
    } else if (e.target && e.target.id === 'btn-cancel-permissions') {
        // Remove edit mode class for permission hover
        document.body.classList.remove('edit-permissions-mode');
        // Re-enable Manage Roles tab when exiting edit mode
        const manageRolesTab = document.getElementById('tab-manage-roles');
        if (manageRolesTab) {
            manageRolesTab.disabled = false;
            manageRolesTab.style.pointerEvents = '';
            manageRolesTab.style.opacity = '';
        }
        // Cancel edit mode: check for unsaved changes per role
        const unsavedRoles = [];
        document.querySelectorAll('.role-permissions').forEach(roleBlock => {
            const header = roleBlock.querySelector('.role-permissions-header');
            const saveBtn = header && header.querySelector('.btn-save-permissions-role');
            if (saveBtn && saveBtn.style.display !== 'none') {
                // Try to get the role name as shown in the header (first child element with text, not a button)
                let roleName = '';
                // Prefer .role-name if present
                const nameElem = header.querySelector('.role-name');
                if (nameElem && nameElem.textContent.trim()) {
                    roleName = nameElem.textContent.trim();
                } else {
                    // Try to get the first child element with text (not a button)
                    let found = false;
                    header.childNodes.forEach(node => {
                        if (!found && node.nodeType === Node.ELEMENT_NODE && node.textContent.trim() && node.tagName !== 'BUTTON') {
                            roleName = node.textContent.trim();
                            found = true;
                        }
                    });
                    // Fallback: try data-role-name
                    if (!roleName && roleBlock.dataset.roleName && roleBlock.dataset.roleName.trim()) {
                        roleName = roleBlock.dataset.roleName.trim();
                    }
                    // Fallback: try first non-empty text node
                    if (!roleName) {
                        header.childNodes.forEach(node => {
                            if (!found && node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                                roleName = node.textContent.trim();
                                found = true;
                            }
                        });
                    }
                    if (!roleName) roleName = 'Role';
                }
                unsavedRoles.push(roleName);
            }
        });
        if (unsavedRoles.length > 0) {
            const msg = 'The following roles have unsaved changes:\n' + unsavedRoles.join('\n') + '\nAre you sure you want to cancel editing?';
            if (!await showConfirm(msg, 'Unsaved changes')) return;
        }
        // Exit edit mode: restore view mode (only show checked permissions, hide checkboxes)
        document.querySelectorAll('.role-permissions').forEach(roleBlock => {
            // Restore checkboxes to last saved state (original)
            let origArr = [];
            if (roleBlock.dataset.original) {
                origArr = JSON.parse(roleBlock.dataset.original);
            } else {
                origArr = Array.from(roleBlock.querySelectorAll('.permission-card')).map(card => {
                    let cb = card.querySelector('input[type="checkbox"]');
                    return cb ? cb.checked : (card.style.display !== 'none');
                });
            }
            roleBlock.querySelectorAll('.permission-card').forEach((card, idx) => {
                let cb = card.querySelector('input[type="checkbox"]');
                if (cb) {
                    cb.checked = origArr[idx];
                }
                // Hide unchecked permission cards, remove checkboxes
                if (cb) {
                    if (origArr[idx]) {
                        cb.style.display = 'none';
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
            // Hide Save button
            const header = roleBlock.querySelector('.role-permissions-header');
            const saveBtn = header && header.querySelector('.btn-save-permissions-role');
            if (saveBtn) saveBtn.style.display = 'none';
            roleBlock.dataset.unsaved = 'false';
        });
        // Change Cancel back to Edit with icon
        const cancelBtn = document.getElementById('btn-cancel-permissions');
        if (cancelBtn) {
            cancelBtn.innerHTML = '<i class="fas fa-pen-to-square"></i> Edit';
            cancelBtn.id = 'btn-edit-permissions';
        }
        // Disable all checkboxes in view mode
        document.querySelectorAll('#content-set-permissions input[type="checkbox"]').forEach(cb => cb.disabled = true);
    }
});

// Hide both tab contents initially to prevent flicker
if (document.getElementById('content-manage-roles')) document.getElementById('content-manage-roles').style.display = 'none';
if (document.getElementById('content-set-permissions')) document.getElementById('content-set-permissions').style.display = 'none';

document.addEventListener('DOMContentLoaded', function() {
    const savedTab = localStorage.getItem('activeTab') || 'manage-roles';
    if (typeof showTab === 'function') showTab(savedTab);
});
document.querySelectorAll && document.querySelectorAll('#content-set-permissions input[type="checkbox"]').forEach(cb => cb.disabled = true);

// Make permission card clickable to toggle checkbox (except direct checkbox click)
document.querySelectorAll('.permissions-checkboxes .permission-card').forEach(card => {
    card.onclick = function(e) {
        const cb = card.querySelector('input[type="checkbox"]');
        if (!cb) return;
        if (e.target === cb) return; // let default checkbox click happen
        if (!cb.disabled) {
            cb.checked = !cb.checked;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };
});

// --- Page-local modal handlers and basic employee page logic moved from employee.php
function openEmployeeFormModal() {
    const el = document.getElementById('employee-form-modal');
    if (el) {
        el.classList.add('show');
        try { el.style.display = 'flex'; } catch(e) {}
        // Ensure submit button is enabled when opening
        const submitBtn = el.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Save Employee'; // Ensure button text is reset
        }
    }
}
function closeEmployeeFormModal() {
    const el = document.getElementById('employee-form-modal');
        if (el) { 
            el.classList.remove('show'); 
            try { el.style.display = 'none'; } catch(e) {} 
        }
}
function openEmployeeEditModal() {
    const el = document.getElementById('employee-edit-modal');
        if (el) { 
            el.classList.add('show'); 
            try { el.style.display = 'flex'; } catch(e) {} 
            const submitBtn = el.querySelector('button[type="submit"]'); 
            if (submitBtn) { 
                submitBtn.disabled = false; 
                submitBtn.innerText = 'Update Employee'; // Ensure button text is set for editing
            }
        }
}
function closeEmployeeEditModal() {
    const el = document.getElementById('employee-edit-modal');
    if (el) {
        el.classList.remove('show');
        try { el.style.display = 'none'; } catch(e) {}
    }
}

// Add Employee button handler
document.addEventListener('DOMContentLoaded', function() {
    // If the page was loaded with query parameters (from accidental GET form submit),
    // remove them from the URL so client-side code doesn't reprocess them and to avoid duplicates.
    if (window.history && window.location.search) {
        try { window.history.replaceState({}, document.title, window.location.pathname + window.location.hash); } catch(e) {}
    }
    const addBtn = document.getElementById('btn-add-employee');
    if (addBtn) addBtn.onclick = openEmployeeFormModal;

    // Edit button handler (delegated if possible)
    document.querySelectorAll('.btn-edit-role').forEach(function(btn) {
        btn.onclick = function() {
            openEmployeeEditModal();
            // Populate modal fields with selected employee data
            var row = btn.closest('tr');
            // track the currently edited row for delete/save
            window.currentEditingEmployeeRow = row;
            if (!row) return;
            var nameEl = document.getElementById('edit-employee-name');
            var emailEl = document.getElementById('edit-employee-email');
            var phoneEl = document.getElementById('edit-employee-phone');
            var roleEl = document.getElementById('edit-employee-role');
            if (nameEl) nameEl.value = getEditableCellText(row, 0);
            if (emailEl) emailEl.value = getEditableCellText(row, 1);
            if (phoneEl) phoneEl.value = getEditableCellText(row, 2);
            if (roleEl) roleEl.value = getEditableCellText(row, 3);
            // For demo, pos pin and hire date left blank
            // Ensure labels hide/show correctly for populated fields
            try {
                if (typeof updateFormGroupState === 'function') {
                    if (nameEl) updateFormGroupState(nameEl);
                    if (emailEl) updateFormGroupState(emailEl);
                    if (phoneEl) updateFormGroupState(phoneEl);
                    if (roleEl) updateFormGroupState(roleEl);
                }
            } catch (err) {
                // ignore; not critical
            }
        };
    });

    // Status badge toggle handler
    document.querySelectorAll('.status-badge-edit').forEach(function(badge) {
        badge.onclick = async function() {
            var icon = badge.querySelector('i');
            var text = badge.querySelector('.status-text');
            if (!icon || !text) return;
            // Local toggle fallback: ensure actual_state exists and prompt user if missing
            var actualState = (badge.getAttribute('data-actual-state') || '').toString().trim().toLowerCase();
            if (!actualState || actualState === 'offline' || actualState === 'unknown') {
                const chosen = await showActualStatePicker('Actual state is not set for this employee. Choose actual state before toggling.', 'Set actual state');
                if (!chosen) { try { showToast('info', 'Toggling cancelled; actual state not set.'); } catch (e) {} ; return; }
                badge.setAttribute('data-actual-state', chosen);
            }
            if (icon.classList.contains('fa-check-circle')) {
                icon.classList.remove('fa-check-circle');
                icon.classList.add('fa-times-circle');
                badge.classList.remove('status-active');
                badge.classList.add('status-inactive');
                text.innerText = 'Locked';
            } else {
                icon.classList.remove('fa-times-circle');
                icon.classList.add('fa-check-circle');
                badge.classList.remove('status-inactive');
                badge.classList.add('status-active');
                text.innerText = 'Unlocked';
            }
        };
    });

    // Delete button handler: attempt server-side delete, fallback to client removal if server unavailable
    function attemptDeleteEmployee(empId, row) {
                return fetch('delete_employee.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `employee_id=${encodeURIComponent(empId)}`
        }).then(resp => {
            if (!resp.ok) {
                // server returned error (403 or other), bubble up
                return resp.json().then(j => Promise.reject(j)).catch(() => Promise.reject({ success: false }));
            }
            return resp.json().catch(() => ({ success: false }));
        });
    }

    document.querySelectorAll('.btn-delete-role').forEach(function(btn) {
        btn.onclick = async function() {
            const ok = await showConfirm('Are you sure you want to delete this employee?', 'Delete employee');
            if (!ok) return;
            var row = btn.closest('tr');
            if (!row) return;
            var empId = row.dataset.employeeId || row.getAttribute('data-employee-id') || '';
            // If empId looks like a server id (numeric), try server delete; otherwise remove locally
            if (empId && /^\d+$/.test(empId)) {
                try {
                    const data = await attemptDeleteEmployee(empId, row);
                    if (data && data.success) {
                        if (row && row.parentNode) row.parentNode.removeChild(row);
                        showToast('success', 'Employee deleted.');
                    } else {
                        showToast('error', data.message || 'Failed to delete employee on server');
                    }
                } catch (err) {
                    const removeLocal = await showConfirm('Server did not delete the account (or endpoint returned an error). Remove locally from the table instead?', 'Remove locally?');
                    if (removeLocal) {
                        if (row && row.parentNode) row.parentNode.removeChild(row);
                    }
                }
            } else {
                // local-only row (no numeric id)
                if (row && row.parentNode) row.parentNode.removeChild(row);
            }
        };
    });

    // Delete Account button in Edit modal
    const deleteEmployeeBtn = document.getElementById('btn-delete-employee');
    if (deleteEmployeeBtn) {
        deleteEmployeeBtn.addEventListener('click', async function() {
            const row = window.currentEditingEmployeeRow;
            if (!row) { showToast('error', 'No employee selected.'); return; }
            const ok = await showConfirm('Are you sure you want to permanently delete this employee account? This action cannot be undone.', 'Delete employee');
            if (!ok) return;
            const empId = row.dataset.employeeId;
            try {
                const resp = await fetch('pages/accounts/delete_employee.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `employee_id=${encodeURIComponent(empId)}`
                });
                if (!resp.ok) throw new Error('Network response not ok');
                const data = await resp.json().catch(()=>({ success: false }));
                if (data && data.success) {
                    if (row && row.parentNode) row.parentNode.removeChild(row);
                    closeEmployeeEditModal();
                    window.currentEditingEmployeeRow = null;
                    showToast('success', 'Employee deleted.');
                } else {
                    const removeLocal = await showConfirm('Server did not delete the account (or endpoint missing). Remove locally from the table instead?', 'Remove locally?');
                    if (removeLocal) {
                        if (row && row.parentNode) row.parentNode.removeChild(row);
                        closeEmployeeEditModal();
                        window.currentEditingEmployeeRow = null;
                    }
                }
            } catch (err) {
                const removeLocal = await showConfirm('Could not contact server to delete account. Remove locally from the table instead?', 'Remove locally?');
                if (removeLocal) {
                    if (row && row.parentNode) row.parentNode.removeChild(row);
                    closeEmployeeEditModal();
                    window.currentEditingEmployeeRow = null;
                }
            }
        });
    }

    // Auto-hide labels: add listeners to inputs and selects inside .form-group
    // Small helper to escape HTML when injecting values into innerHTML
    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function(s) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s];
        });
    }

    function updateFormGroupState(el) {
        const fg = el.closest('.form-group');
        if (!fg) return;
        const val = (el.value || '').toString().trim();
        if (val.length > 0) fg.classList.add('has-value'); else fg.classList.remove('has-value');
    }

    // --- Add Employee client-side submit handler (quick UX fix)
    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) {
        employeeForm.addEventListener('submit', function(ev) {
            ev.preventDefault();
            const submitBtn = employeeForm.querySelector('button[type="submit"]');
            const restoreSubmit = function() {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = submitBtn.dataset.originalText || 'Save Employee';
                }
            };
            try {
                const name = (document.getElementById('employee-name') || {}).value || '';
                const email = (document.getElementById('employee-email') || {}).value || '';
                // Basic validation: require name and email
                if (!name.trim() || !email.trim()) {
                    showToast('error', 'Please enter name and email before saving.');
                    return;
                }
                // Prevent double-submit
                if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.originalText = submitBtn.innerText; submitBtn.innerText = 'Saving...'; }
                const phone = (document.getElementById('employee-phone') || {}).value || '';
                const role = (document.getElementById('employee-role') || {}).value || '';
                const pos = (document.getElementById('employee-pos-pin') || {}).value || '';

                // If table doesn't exist, create it (first employee case)
                let tbody = document.querySelector('#employees-table tbody');
                if (!tbody) {
                    // Remove no-employees message if present
                    const noMsg = document.getElementById('no-employees-message');
                    if (noMsg) noMsg.remove();
                    // Create table structure
                    const table = document.createElement('table');
                    table.className = 'roles-table';
                    table.id = 'employees-table';
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th class="select-col" style="width:40px;text-align:center;"><input id="select-all-employees" type="checkbox" aria-label="Select all employees" /></th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th class="status-col">Status</th>
                                <th class="action-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;
                    // Insert table into the tab-content div
                    const tabContent = document.getElementById('content-manage-employees');
                    if (tabContent) tabContent.appendChild(table);
                    tbody = table.querySelector('tbody');
                }
                if (!tbody) {
                    // Nothing to update; restore button and exit
                    restoreSubmit();
                    return;
                }
                const newId = 'emp-' + Date.now();
                // If a row with same email exists, update it instead of appending duplicate
                const existing = Array.from(tbody.querySelectorAll('tr')).find(r => {
                    const emailCellText = getEditableCellText(r, 1) || '';
                    return emailCellText.trim().toLowerCase() === email.trim().toLowerCase();
                });
                if (existing) {
                    setEditableCellText(existing, 0, name);
                    setEditableCellText(existing, 1, email);
                    setEditableCellText(existing, 2, phone);
                    setEditableCellText(existing, 3, role);
                    // ensure delete/edit buttons shown
                    const delBtn = existing.querySelector('.btn-delete-role'); if (delBtn) delBtn.style.display = '';
                    const editBtn = existing.querySelector('.btn-edit-role'); if (editBtn) editBtn.style.display = '';
                    // close modal and reset
                    employeeForm.reset();
                    closeEmployeeFormModal();
                    return;
                }

                const tr = document.createElement('tr');
                tr.setAttribute('data-employee-id', newId);
                tr.className = 'employee-row';
                tr.innerHTML = `
                    <td class="select-col" style="text-align:center;"><input type="checkbox" class="employee-select" name="selected_employees[]" value="${newId}" aria-label="Select ${escapeHtml(name)}" /></td>
                    <td class="editable-cell employee-name-cell">${escapeHtml(name)}</td>
                    <td class="editable-cell employee-email-cell">${escapeHtml(email)}</td>
                    <td class="editable-cell employee-phone-cell">${escapeHtml(phone)}</td>
                    <td class="editable-cell employee-role-cell">${escapeHtml(role)}</td>
                    <td class="status-col">
                        <span class="status-badge status-active status-badge-edit" style="cursor:pointer;" title="Toggle Lock" data-actual-state="offline">
                            <i class="fas fa-check-circle"></i>
                            <span class="status-text">Unlocked</span>
                        </span>
                    </td>
                    <td class="action-col">
                        <button class="btn-edit-role" title="Edit"><i class="fas fa-pen"></i> <span>Edit</span></button>
                        <button class="btn-delete-role" title="Delete"><i class="fas fa-trash"></i> <span>Delete</span></button>
                    </td>
                `;
                tbody.appendChild(tr);
                // Ensure selection handlers are wired for this dynamically added row
                attachEmployeeSelectHandlers();

                // wire handlers for new row
                const statusBadge = tr.querySelector('.status-badge-edit');
                if (statusBadge) {
                    statusBadge.onclick = function() {
                        const icon = this.querySelector('i');
                        const text = this.querySelector('.status-text');
                        if (!icon || !text) return;
                        if (icon.classList.contains('fa-check-circle')) {
                            icon.classList.remove('fa-check-circle');
                            icon.classList.add('fa-times-circle');
                            this.classList.remove('status-active');
                            this.classList.add('status-inactive');
                            text.innerText = 'Inactive';
                        } else {
                            icon.classList.remove('fa-times-circle');
                            icon.classList.add('fa-check-circle');
                            this.classList.remove('status-inactive');
                            this.classList.add('status-active');
                            text.innerText = 'Active';
                        }
                    };
                }
                const delBtn = tr.querySelector('.btn-delete-role');
                if (delBtn) {
                    delBtn.onclick = async function() {
                        const ok = await showConfirm('Are you sure you want to delete this employee?', 'Delete employee');
                        if (ok) {
                            const r = this.closest('tr');
                            if (r) r.remove();
                        }
                    };
                }
                const editBtn = tr.querySelector('.btn-edit-role');
                if (editBtn) {
                    editBtn.onclick = function() {
                        openEmployeeEditModal();
                        const row = this.closest('tr');
                        window.currentEditingEmployeeRow = row;
                        const nameEl = document.getElementById('edit-employee-name');
                        const emailEl = document.getElementById('edit-employee-email');
                        const phoneEl = document.getElementById('edit-employee-phone');
                        const roleEl = document.getElementById('edit-employee-role');
                        if (nameEl) nameEl.value = getEditableCellText(row, 0);
                        if (emailEl) emailEl.value = getEditableCellText(row, 1);
                        if (phoneEl) phoneEl.value = getEditableCellText(row, 2);
                        if (roleEl) roleEl.value = getEditableCellText(row, 3);
                        try {
                            if (typeof updateFormGroupState === 'function') {
                                if (nameEl) updateFormGroupState(nameEl);
                                if (emailEl) updateFormGroupState(emailEl);
                                if (phoneEl) updateFormGroupState(phoneEl);
                                if (roleEl) updateFormGroupState(roleEl);
                            }
                        } catch (err) {}
                    };
                }

                // Attempt server-side create (persist). If server responds success, use returned id.
                try {
                    fetch('create_employee.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent((document.getElementById('employee-password')||{}).value||'')}&role=${encodeURIComponent(role)}&phone=${encodeURIComponent((document.getElementById('employee-phone')||{}).value||'')}&pos_pin=${encodeURIComponent((document.getElementById('employee-pos-pin')||{}).value||'')}`
                    }).then(r => r.json()).then(data => {
                        console.debug('create_employee response', data);
                        if (data && data.success) {
                            // update tr data-employee-id with server id
                            if (data.user && data.user.id) tr.setAttribute('data-employee-id', data.user.id);
                            // reload so server-side rendering will show the persisted row
                            try { window.location.reload(); } catch(e) { /* ignore */ }
                        } else {
                            console.warn('create_employee failed', data);
                        }
                    }).catch(err => console.warn('create_employee network error', err));
                } catch (e) { console.warn('create_employee call failed', e); }

                // reset and close
                employeeForm.reset();
                closeEmployeeFormModal();
            } catch (err) {
                console.error('Error in employee add handler', err);
                showToast('error', 'An error occurred while saving the employee. See console for details.');
            } finally {
                // Always restore the submit button state
                restoreSubmit();
            }
        });
    }

    // Initialize current state on page load for both forms
    document.querySelectorAll('#employee-form .form-group input, #employee-form .form-group select, #employee-edit-form .form-group input, #employee-edit-form .form-group select').forEach(function(input) {
        updateFormGroupState(input);
        // Avoid stacking listeners if this script runs multiple times
        input.removeEventListener('input', input._hasValueHandler);
        input._hasValueHandler = function() { updateFormGroupState(input); };
        input.addEventListener('input', input._hasValueHandler);
        // Also listen to change for select/date fields
        input.removeEventListener('change', input._hasValueChangeHandler);
        input._hasValueChangeHandler = function() { updateFormGroupState(input); };
        input.addEventListener('change', input._hasValueChangeHandler);
    });

    // Password toggle handlers
    document.querySelectorAll('.password-toggle').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('slashed');
                this.title = 'Hide password';
            } else {
                input.type = 'password';
                this.classList.add('slashed');
                this.title = 'Show password';
            }
        });
    });

    // Edit form submit -> update server and DOM
    const editForm = document.getElementById('employee-edit-form');
    if (editForm) {
        editForm.addEventListener('submit', function(ev) {
            ev.preventDefault();
            const submitBtn = editForm.querySelector('button[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.originalText = submitBtn.innerText; submitBtn.innerText = 'Saving...'; }
            const id = (window.currentEditingEmployeeRow && window.currentEditingEmployeeRow.dataset.employeeId) || '';
            const name = (document.getElementById('edit-employee-name') || {}).value || '';
            const email = (document.getElementById('edit-employee-email') || {}).value || '';
            const password = (document.getElementById('edit-employee-password') || {}).value || '';
            const role = (document.getElementById('edit-employee-role') || {}).value || '';
            const phone = (document.getElementById('edit-employee-phone') || {}).value || '';
            const posPin = (document.getElementById('edit-employee-pos-pin') || {}).value || '';
            if (!id) { showToast('error', 'No employee selected'); if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = submitBtn.dataset.originalText || 'Save Changes'; } return; }
            fetch('update_employee.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&role=${encodeURIComponent(role)}&phone=${encodeURIComponent(phone)}&pos_pin=${encodeURIComponent(posPin)}`
            }).then(r => r.json()).then(data => {
                console.debug('update_employee response', data);
                if (data && data.success) {
                    // update DOM
                    const row = window.currentEditingEmployeeRow;
                    if (row) {
                        setEditableCellText(row, 0, name);
                        setEditableCellText(row, 1, email);
                        setEditableCellText(row, 2, phone);
                        setEditableCellText(row, 3, role);
                        // If pos pin cell exists elsewhere, we currently don't have a column for it; consider adding
                    }
                    closeEmployeeEditModal();
                    try { window.location.reload(); } catch(e) {}
                } else {
                    showToast('error', (data && data.message) || 'Failed to update employee');
                }
            }).catch(err => { console.error('update_employee error', err); showToast('error', 'Network error when updating employee'); })
            .finally(() => {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = submitBtn.dataset.originalText || 'Save Changes'; }
            });
        });
    }
});
