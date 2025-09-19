<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Access Rights</title>
    <link rel="stylesheet" href="../../assets/css/style.css" />
    <link rel="stylesheet" href="../../assets/css/content.css" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp" />
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>

    <div class="content-area access-content-area">
        <div class="section-header">
            <h2 class="access-header-title">
                Access Rights
                <span class="access-header-breadcrumb">
                    |
                    <i class="fas fa-users-cog"></i>
                    - Access Rights
                </span>
            </h2>
        </div>

        <div class="tabs">
            <div class="tab first-child active" id="tab-manage-roles" onclick="showTab('manage-roles')">Manage Roles</div>
            <div class="tab" id="tab-set-permissions" onclick="showTab('set-permissions')">Set Permissions</div>
        </div>

        <div class="tab-info-bar">
            <span class="tab-info-text" id="tab-info-text">
                Manage user roles. Add, edit, or remove roles as needed for your system.
            </span>
            <div id="tab-info-actions">
                <button class="btn-add-role" id="btn-add-role"><i class="fas fa-plus"></i> Add Role</button>
                <button class="btn-select-role" id="btn-select-role"><i class="fas fa-check-square"></i> Select</button>
            </div>
        </div>

        <!-- Manage Roles Tab -->
        <div class="tab-content" id="content-manage-roles">
            <table class="roles-table">
                <thead>
                    <tr>
                        <th>Role Name</th>
                        <th>Description</th>
                        <th>Action</th>
                        <th style="width:40px; text-align:center; display:none;" class="select-col">
                            <input type="checkbox" id="select-all-checkbox">
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="editable-cell">Admin</td>
                        <td class="editable-cell">Full access to all features</td>
                        <td>
                            <button class="btn-edit-role" title="Edit">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="btn-save-role" style="display:none;" title="Save">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-cancel-role" style="display:none;" title="Cancel">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="btn-delete-role" style="display:none; float:right;" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                        <td style="text-align:center; display:none;" class="select-col">
                            <input type="checkbox" class="row-select-checkbox">
                        </td>
                    </tr>
                    <!-- More rows as needed -->
                </tbody>
            </table>
        </div>

        <!-- Set Permissions Tab -->
        <div class="tab-content" id="content-set-permissions" style="display:none;">
            <div class="permissions-list">
                <!-- Example Role Permissions Block -->
                <div class="role-permissions">
                    <div class="role-permissions-header" onclick="togglePermissions(this)">
                        <span class="role-permissions-title">Admin</span>
                        <span class="role-permissions-separator">-</span>
                        <span class="role-permissions-desc">Full access to all features</span>
                    </div>
                    <div class="permissions-checkboxes">
                        <div class="permission-card">
                            <label>
                                <input type="checkbox" checked>
                                <span class="permission-texts">
                                    <span class="permission-title">Dashboard Access</span>
                                    <span class="permission-desc">Access to dashboard and statistics</span>
                                </span>
                            </label>
                        </div>
                        <div class="permission-card">
                            <label>
                                <input type="checkbox" checked>
                                <span class="permission-texts">
                                    <span class="permission-title">Inventory Management</span>
                                    <span class="permission-desc">View and manage inventory</span>
                                </span>
                            </label>
                        </div>
                        <div class="permission-card">
                            <label>
                                <input type="checkbox" checked>
                                <span class="permission-texts">
                                    <span class="permission-title">Add Products</span>
                                    <span class="permission-desc">Add new products to inventory</span>
                                </span>
                            </label>
                        </div>
                        <div class="permission-card">
                            <label>
                                <input type="checkbox" checked>
                                <span class="permission-texts">
                                    <span class="permission-title">Edit Products</span>
                                    <span class="permission-desc">Edit existing products</span>
                            </label>
                        </div>
                        <div class="permission-card">
                            <label>
                                <input type="checkbox">
                                <span class="permission-texts">
                                    <span class="permission-title">Dashboard Access</span>
                                    <span class="permission-desc">Access to dashboard and statistics</span>
                                </span>
                            </label>
                        </div>
                        <div class="permission-card">
                            <label>
                                <input type="checkbox">
                                <span class="permission-texts">
                                    <span class="permission-title">View Payment Reports</span>
                                    <span class="permission-desc">Access payment reports</span>
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
                <!-- Repeat .role-permissions for each role -->
            </div>
            <button class="btn-save-permissions" id="btn-save-permissions" style="display:none;">Save</button>
        </div>
    </div>

    <script>
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
                infoText.textContent = "Manage user roles. Add, edit, or remove roles as needed for your system.";
                infoActions.innerHTML = `
                    <button class="btn-add-role" id="btn-add-role"><i class="fas fa-plus"></i> Add Role</button>
                    <button class="btn-select-role" id="btn-select-role"><i class="fas fa-check-square"></i> Select</button>
                `;

                // Re-select and re-attach event listeners
                const addRoleBtn = document.getElementById('btn-add-role');
                const selectBtn = document.getElementById('btn-select-role');

                addRoleBtn.addEventListener('click', function() {
                    if (selectMode) {
                        setSelectMode(false);
                    } else {
                        alert('Add Role clicked!');
                    }
                });

                selectBtn.addEventListener('click', function() {
                    if (!selectMode) {
                        setSelectMode(true);
                    } else {
                        const checkedRows = Array.from(rowCheckboxes).filter(cb => cb.checked);
                        if (checkedRows.length === 0) return;
                        if (checkedRows.length === rowCheckboxes.length) {
                            if (!confirm('Are you sure you want to delete ALL selected roles?')) return;
                        } else {
                            if (!confirm('Are you sure you want to delete the selected roles?')) return;
                        }
                        checkedRows.forEach(cb => {
                            const row = cb.closest('tr');
                            row.parentNode.removeChild(row);
                        });
                        setSelectMode(false);
                    }
                });
            } else {
                infoText.textContent = "Use this section to define what each role can access and modify within the application.";
                infoActions.innerHTML = '';
                let editBtn = document.createElement('button');
                editBtn.className = 'btn-edit-permissions';
                editBtn.id = 'btn-edit-permissions';
                editBtn.innerHTML = '<i class="fas fa-pen"></i> Edit';
                editBtn.style.marginTop = '25px';
                infoBar.appendChild(editBtn);
                document.getElementById('btn-save-permissions').style.display = "none";
            }
            localStorage.setItem('activeTab', tab); // Save active tab
        }

        function togglePermissions(header) {
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
                row.dataset.original = JSON.stringify(Array.from(row.querySelectorAll('.editable-cell')).map(cell => cell.innerText));
            });
        });

        document.querySelectorAll('.btn-save-role').forEach(function(saveBtn) {
            saveBtn.addEventListener('click', function() {
                const row = this.closest('tr');
                const original = JSON.parse(row.dataset.original || "[]");
                const current = Array.from(row.querySelectorAll('.editable-cell')).map(cell => cell.innerText);
                const changed = original.some((val, idx) => val !== current[idx]);
                if (!changed || confirm("Are you sure you want to save changes?")) {
                    row.querySelectorAll('.editable-cell').forEach(cell => {
                        cell.contentEditable = "false";
                        cell.style.background = "";
                    });
                    this.style.display = "none";
                    row.querySelector('.btn-cancel-role').style.display = "none";
                    row.querySelector('.btn-edit-role').style.display = "inline-block";
                    row.querySelector('.btn-delete-role').style.display = "none"; // Hide delete
                }
            });
        });

        document.querySelectorAll('.btn-cancel-role').forEach(function(cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                const row = this.closest('tr');
                const original = JSON.parse(row.dataset.original || "[]");
                const current = Array.from(row.querySelectorAll('.editable-cell')).map(cell => cell.innerText);
                const changed = original.some((val, idx) => val !== current[idx]);
                if (!changed || confirm("Are you sure you want to cancel editing?")) {
                    // Restore original values if needed
                    if (changed) {
                        row.querySelectorAll('.editable-cell').forEach((cell, idx) => {
                            cell.innerText = original[idx] || cell.innerText;
                        });
                    }
                    row.querySelectorAll('.editable-cell').forEach(cell => {
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

        const addRoleBtn = document.getElementById('btn-add-role');
const selectBtn = document.getElementById('btn-select-role');
const selectCols = document.querySelectorAll('.select-col');
const selectAllCheckbox = document.getElementById('select-all-checkbox');
const rowCheckboxes = document.querySelectorAll('.row-select-checkbox');

let selectMode = false;

function setSelectMode(enabled) {
    selectMode = enabled;

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
        // Restore Add Role
        if (addRoleBtn) {
            addRoleBtn.innerHTML = '<i class="fas fa-plus"></i> Add Role';
            addRoleBtn.classList.remove('cancel');
        }
        // Restore Select
        if (selectBtn) {
            selectBtn.classList.remove('delete');
            selectBtn.innerHTML = '<i class="fas fa-check-square"></i> Select';
        }
        rowCheckboxes.forEach(cb => cb.checked = false);
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
    }
}

// Select button logic
selectBtn.addEventListener('click', function() {
    if (!selectMode) {
        setSelectMode(true);
    } else {
        // Delete selected
        const checkedRows = Array.from(rowCheckboxes).filter(cb => cb.checked);
        if (checkedRows.length === 0) return;
        if (checkedRows.length === rowCheckboxes.length) {
            if (!confirm('Are you sure you want to delete ALL selected roles?')) return;
        } else {
            if (!confirm('Are you sure you want to delete the selected roles?')) return;
        }
        checkedRows.forEach(cb => {
            const row = cb.closest('tr');
            row.parentNode.removeChild(row);
        });
        setSelectMode(false);
    }
});

// Add Role/Cancel button logic
addRoleBtn.addEventListener('click', function() {
    if (selectMode) {
        setSelectMode(false);
    } else {
        // Your add role logic here
        alert('Add Role clicked!');
    }
});

// Select all logic
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

// Edit/Save button logic for permissions
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'btn-edit-permissions') {
        // Enable all checkboxes
        document.querySelectorAll('#content-set-permissions input[type="checkbox"]').forEach(cb => cb.disabled = false);
        document.getElementById('btn-edit-permissions').textContent = "Save";
        document.getElementById('btn-save-permissions').style.display = "block";
        document.getElementById('btn-edit-permissions').id = "btn-save-permissions";
    } else if (e.target && e.target.id === 'btn-save-permissions') {
        // Save logic here (AJAX or local update)
        if (confirm("Are you sure you want to save permission changes?")) {
            document.querySelectorAll('#content-set-permissions input[type="checkbox"]').forEach(cb => cb.disabled = true);
            e.target.textContent = "Edit";
            e.target.id = "btn-edit-permissions";
            e.target.style.display = "block";
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const savedTab = localStorage.getItem('activeTab') || 'manage-roles';
    showTab(savedTab);
});
document.querySelectorAll('#content-set-permissions input[type="checkbox"]').forEach(cb => cb.disabled = true);
</script>
</body>
</html>