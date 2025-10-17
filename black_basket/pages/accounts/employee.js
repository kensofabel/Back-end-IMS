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
    saveBtn.addEventListener('click', function() {
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
        if (!changed || confirm("Are you sure you want to save changes?")) {
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
                    alert(data.message || 'Failed to update role.');
                }
            })
            .catch(() => alert('Failed to update role.'));
        }
    });
});

// Attach delete logic for role delete buttons (after DOM is ready)
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.btn-delete-role').forEach(function(deleteBtn) {
        // Remove any previous click handlers to prevent stacking
        deleteBtn.replaceWith(deleteBtn.cloneNode(true));
    });
    document.querySelectorAll('.btn-delete-role').forEach(function(deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent bubbling and duplicate triggers
            const row = this.closest('tr');
            const roleId = row.dataset.roleId;
            // Only confirm here if not in select mode
            if (typeof selectMode !== 'undefined' && selectMode) {
                // In select mode, confirmation is already handled
                return;
            }
            // Proceed with delete request for roleId
            fetch('delete_role.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `role_id=${encodeURIComponent(roleId)}`
            })
            .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        row.parentNode.removeChild(row);
                    } else {
                        if (data.message && data.message.trim()) {
                            alert(data.message);
                        } else {
                            console.warn('Failed to delete role (no error message from server).');
                        }
                    }
                })
            .catch(() => { console.warn('Failed to delete role (network or server error).'); });
        });
    });
});

document.querySelectorAll('.btn-cancel-role').forEach(function(cancelBtn) {
    cancelBtn.addEventListener('click', function() {
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
        if (!changed || confirm("Are you sure you want to cancel editing?")) {
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
        selectBtn.addEventListener('click', function() {
            if (!selectMode) {
                setSelectMode(true);
            } else {
                // Delete selected
                const checkedRows = Array.from(document.querySelectorAll('.row-select-checkbox')).filter(cb => cb.checked);
                if (checkedRows.length === 0) return;
                if (checkedRows.length === document.querySelectorAll('.row-select-checkbox').length) {
                    if (!confirm('Are you sure you want to delete ALL selected roles?')) return;
                } else {
                    if (!confirm('Are you sure you want to delete the selected roles?')) return;
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
                        alert(data.message || 'Failed to delete roles.');
                    }
                })
                .catch(() => alert('Failed to delete roles.'));
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
                        alert('Role name is required.');
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
                                    alert('Role added but failed to assign permissions: ' + (permData.message || 'Unknown error'));
                                }
                            })
                            .catch(error => {
                                alert('Role added but failed to assign permissions: ' + error.message);
                            });
                        } else {
                            alert(data.message || 'Failed to add role.');
                        }
                    })
                    .catch(() => alert('Failed to add role.'));
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
document.addEventListener('click', function(e) {
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
                saveBtn.addEventListener('click', function(ev) {
                    ev.stopPropagation();
                    if (!confirm('Saving these changes will affect how users access your system. Are you sure you want to continue?')) return;
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
                            alert('Permissions updated successfully.');
                        } else {
                            alert(data.message || 'Failed to update permissions.');
                        }
                    })
                    .catch(() => alert('Failed to update permissions.'))
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
            if (!confirm(msg)) return;
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
            if (nameEl) nameEl.value = row.children[0].innerText;
            if (emailEl) emailEl.value = row.children[1].innerText;
            if (phoneEl) phoneEl.value = row.children[2].innerText;
            if (roleEl) roleEl.value = row.children[3].innerText;
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
        badge.onclick = function() {
            var icon = badge.querySelector('i');
            var text = badge.querySelector('.status-text');
            if (!icon || !text) return;
            if (icon.classList.contains('fa-check-circle')) {
                icon.classList.remove('fa-check-circle');
                icon.classList.add('fa-times-circle');
                badge.classList.remove('status-active');
                badge.classList.add('status-inactive');
                text.innerText = 'Inactive';
            } else {
                icon.classList.remove('fa-times-circle');
                icon.classList.add('fa-check-circle');
                badge.classList.remove('status-inactive');
                badge.classList.add('status-active');
                text.innerText = 'Active';
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
        btn.onclick = function() {
            if (!confirm('Are you sure you want to delete this employee?')) return;
            var row = btn.closest('tr');
            if (!row) return;
            var empId = row.dataset.employeeId || row.getAttribute('data-employee-id') || '';
            // If empId looks like a server id (numeric), try server delete; otherwise remove locally
            if (empId && /^\d+$/.test(empId)) {
                attemptDeleteEmployee(empId, row).then(data => {
                    if (data && data.success) {
                        if (row && row.parentNode) row.parentNode.removeChild(row);
                        alert('Employee deleted.');
                    } else {
                        alert(data.message || 'Failed to delete employee on server');
                    }
                }).catch(err => {
                    // If server refused or network failed, ask to remove locally
                    if (confirm('Server did not delete the account (or endpoint returned an error). Remove locally from the table instead?')) {
                        if (row && row.parentNode) row.parentNode.removeChild(row);
                    }
                });
            } else {
                // local-only row (no numeric id)
                if (row && row.parentNode) row.parentNode.removeChild(row);
            }
        };
    });

    // Delete Account button in Edit modal
    const deleteEmployeeBtn = document.getElementById('btn-delete-employee');
    if (deleteEmployeeBtn) {
        deleteEmployeeBtn.addEventListener('click', function() {
            const row = window.currentEditingEmployeeRow;
            if (!row) { alert('No employee selected.'); return; }
            if (!confirm('Are you sure you want to permanently delete this employee account? This action cannot be undone.')) return;
            const empId = row.dataset.employeeId;
            // Try server-side delete, otherwise fallback to client removal
            fetch('pages/accounts/delete_employee.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `employee_id=${encodeURIComponent(empId)}`
            }).then(resp => {
                if (!resp.ok) throw new Error('Network response not ok');
                return resp.json().catch(()=>({ success: false }));
            }).then(data => {
                if (data && data.success) {
                    if (row && row.parentNode) row.parentNode.removeChild(row);
                    closeEmployeeEditModal();
                    window.currentEditingEmployeeRow = null;
                    alert('Employee deleted.');
                } else {
                    if (confirm('Server did not delete the account (or endpoint missing). Remove locally from the table instead?')) {
                        if (row && row.parentNode) row.parentNode.removeChild(row);
                        closeEmployeeEditModal();
                        window.currentEditingEmployeeRow = null;
                    }
                }
            }).catch(err => {
                if (confirm('Could not contact server to delete account. Remove locally from the table instead?')) {
                    if (row && row.parentNode) row.parentNode.removeChild(row);
                    closeEmployeeEditModal();
                    window.currentEditingEmployeeRow = null;
                }
            });
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
                    alert('Please enter name and email before saving.');
                    return;
                }
                // Prevent double-submit
                if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.originalText = submitBtn.innerText; submitBtn.innerText = 'Saving...'; }
                const phone = (document.getElementById('employee-phone') || {}).value || '';
                const role = (document.getElementById('employee-role') || {}).value || '';
                const pos = (document.getElementById('employee-pos-pin') || {}).value || '';
                const tbody = document.querySelector('#employees-table tbody');
                if (!tbody) {
                    // Nothing to update; restore button and exit
                    return;
                }
                const newId = 'emp-' + Date.now();
                // If a row with same email exists, update it instead of appending duplicate
                const existing = Array.from(tbody.querySelectorAll('tr')).find(r => {
                    const emailCell = r.children[1];
                    return emailCell && emailCell.innerText.trim().toLowerCase() === email.trim().toLowerCase();
                });
                if (existing) {
                    existing.children[0].innerText = name;
                    existing.children[1].innerText = email;
                    existing.children[2].innerText = phone;
                    existing.children[3].innerText = role;
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
                tr.innerHTML = `
                    <td class="editable-cell">${escapeHtml(name)}</td>
                    <td class="editable-cell">${escapeHtml(email)}</td>
                    <td class="editable-cell">${escapeHtml(phone)}</td>
                    <td class="editable-cell">${escapeHtml(role)}</td>
                    <td class="status-col">
                        <span class="status-badge status-active status-badge-edit" style="cursor:pointer;" title="Toggle Status">
                            <i class="fas fa-check-circle"></i>
                            <span class="status-text">Active</span>
                        </span>
                    </td>
                    <td class="action-col">
                        <button class="btn-edit-role" title="Edit"><i class="fas fa-pen"></i> <span>Edit</span></button>
                        <button class="btn-delete-role" title="Delete"><i class="fas fa-trash"></i> <span>Delete</span></button>
                    </td>
                `;
                tbody.appendChild(tr);

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
                    delBtn.onclick = function() {
                        if (confirm('Are you sure you want to delete this employee?')) {
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
                        if (nameEl) nameEl.value = row.children[0].innerText;
                        if (emailEl) emailEl.value = row.children[1].innerText;
                        if (phoneEl) phoneEl.value = row.children[2].innerText;
                        if (roleEl) roleEl.value = row.children[3].innerText;
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
                alert('An error occurred while saving the employee. See console for details.');
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
            if (!id) { alert('No employee selected'); if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = submitBtn.dataset.originalText || 'Save Changes'; } return; }
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
                        row.children[0].innerText = name;
                        row.children[1].innerText = email;
                        row.children[2].innerText = phone;
                        row.children[3].innerText = role;
                        // If pos pin cell exists elsewhere, we currently don't have a column for it; consider adding
                    }
                    closeEmployeeEditModal();
                    try { window.location.reload(); } catch(e) {}
                } else {
                    alert((data && data.message) || 'Failed to update employee');
                }
            }).catch(err => { console.error('update_employee error', err); alert('Network error when updating employee'); })
            .finally(() => {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = submitBtn.dataset.originalText || 'Save Changes'; }
            });
        });
    }
});
