<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Management System</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
        <!-- Content Area -->
        <div class="content-area">
                <!-- Access Rights Section -->
            <section id="access-rights-section" class="section active">
                <div class="section-header">
                    <h2>Access Rights Management</h2>
                </div>
                <div class="access-rights-content">
                    <p>Access rights management content will be displayed here.</p>
                    <!-- Add access rights management specific content -->
                    <div class="access-rights-actions">
                        <button class="btn btn-edit" onclick="manageRoles()">
                            <i class="fas fa-user-shield"></i> Manage Roles
                        </button>
                        <button class="btn btn-edit" onclick="setPermissions()">
                            <i class="fas fa-key"></i> Set Permissions
                        </button>
                    </div>
                </div>
            </section>
        </div>
            <!-- Roles Management Modal -->
    <div id="roles-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Manage Roles</h2>
                <span class="close" onclick="closeRolesModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="roles-actions">
                    <button class="btn btn-primary" onclick="showAddRoleForm()">
                        <i class="fas fa-plus"></i> Add New Role
                    </button>
                </div>
                <div id="roles-list" class="roles-list">
                    <!-- Roles will be populated by JavaScript -->
                </div>
            </div>
        </div>
    </div>

    <!-- Add/Edit Role Form Modal -->
    <div id="role-form-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="role-form-title">Add Role</h2>
                <span class="close" onclick="closeRoleFormModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="role-form">
                    <div class="form-group">
                        <label for="role-name">Role Name</label>
                        <input type="text" id="role-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="role-description">Description</label>
                        <textarea id="role-description" name="description" rows="3" required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Role</button>
                        <button type="button" class="btn btn-secondary" onclick="closeRoleFormModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Permissions Management Modal -->
    <div id="permissions-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Set Permissions</h2>
                <span class="close" onclick="closePermissionsModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="permissions-content">
                    <div class="permissions-section">
                        <h3>Role-Based Permissions</h3>
                        <div id="permissions-list" class="permissions-list">
                            <!-- Permissions will be populated by JavaScript -->
                        </div>
                    </div>
                    <div class="permissions-actions">
                        <button class="btn btn-primary" onclick="savePermissions()">
                            <i class="fas fa-save"></i> Save Permissions
                        </button>
                        <button class="btn btn-secondary" onclick="closePermissionsModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>