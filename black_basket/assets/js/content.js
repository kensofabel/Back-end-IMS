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
        document.getElementById('btn-save-permissions').style.display = "none";
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
        row.querySelector('.btn-save-role').style.display = "inline-block";
        row.querySelector('.btn-cancel-role').style.display = "inline-block";
        row.querySelector('.btn-delete-role').style.display = "inline-block"; // Show delete
        // Store original values for cancel
        // Store original values for cancel, including status
        const editableCells = Array.from(row.querySelectorAll('.editable-cell'));
        const statusBadge = row.querySelector('.status-badge-edit');
        const statusValue = statusBadge && statusBadge.innerHTML.includes('fa-check-circle') ? 'active' : 'inactive';
        row.dataset.original = JSON.stringify([
            editableCells[0].innerText, // name
            editableCells[1].innerText, // description
            statusValue // status
        ]);

        // Also re-enable Add Role, Select, and Set Permissions if deleted
        const deleteBtn = row.querySelector('.btn-delete-role');
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
                    row.querySelector('.btn-cancel-role').style.display = "none";
                    row.querySelector('.btn-edit-role').style.display = "inline-block";
                    row.querySelector('.btn-delete-role').style.display = "none";
                } else {
                    alert(data.message || 'Failed to update role.');
                }
            })
            .catch(() => alert('Failed to update role.'));
        }
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
            if (confirm('Are you sure you want to delete this role?')) {
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
                        alert(data.message || 'Failed to delete role.');
                    }
                })
                .catch(() => alert('Failed to delete role.'));
            }
        });
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
            row.querySelector('.btn-save-role').style.display = "none";
            row.querySelector('.btn-edit-role').style.display = "inline-block";
            row.querySelector('.btn-delete-role').style.display = "none"; // Hide delete
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
                if (tbody.querySelector('.new-role-row')) return;
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
                tbody.prepend(tr);
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
        editBtn.textContent = 'Cancel';
        editBtn.id = 'btn-cancel-permissions';
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
document.getElementById('content-manage-roles').style.display = 'none';
document.getElementById('content-set-permissions').style.display = 'none';

document.addEventListener('DOMContentLoaded', function() {
    const savedTab = localStorage.getItem('activeTab') || 'manage-roles';
    showTab(savedTab);
});
document.querySelectorAll('#content-set-permissions input[type="checkbox"]').forEach(cb => cb.disabled = true);

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
