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
    <link rel="stylesheet" href="../../assets/css/content.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
        <!-- Content Area -->
        <div class="content-area">
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
            <div class="access-header-spacer"></div>
            <div class="access-box-section">
                <div class="access-rights-actions">
                    <button class="btn btn-edit active" id="tab-manage-roles" onclick="showTab('roles')">
                        Manage Roles
                    </button>
                    <button class="btn btn-edit" id="tab-set-permissions" onclick="showTab('permissions')">
                        Set Permissions
                    </button>
                </div>
                <div id="tab-content-roles">
                    <p>Choose this option to manage user roles. You can add, edit, or remove roles for your system.</p>
                    <button class="btn btn-primary access-add-role"><i class="fas fa-plus"></i> Add New Role</button>
                    <table class="access-table">
                        <thead>
                            <tr>
                                <th>Role Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Admin</td>
                                <td>Full access to all features</td>
                                <td class="access-status"><i class="fas fa-check-circle"></i> Active</td>
                                <td><button class="btn btn-secondary access-action-btn">Manage</button></td>
                            </tr>
                            <!-- More rows as needed -->
                        </tbody>
                    </table>
                </div>
                <div id="tab-content-permissions" style="display:none;">
                    <p>Set permissions for each role. Assign or revoke access to specific features.</p>
                    <table class="access-table">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>Permission</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Admin</td>
                                <td>Manage Users</td>
                                <td class="access-status"><i class="fas fa-check-circle"></i> Enabled</td>
                                <td><button class="btn btn-secondary access-action-btn">Edit</button></td>
                            </tr>
                            <!-- More rows as needed -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <script>
            function showTab(tab) {
                document.getElementById('tab-content-roles').style.display = (tab === 'roles') ? '' : 'none';
                document.getElementById('tab-content-permissions').style.display = (tab === 'permissions') ? '' : 'none';
                document.getElementById('tab-manage-roles').classList.toggle('active', tab === 'roles');
                document.getElementById('tab-set-permissions').classList.toggle('active', tab === 'permissions');
            }
        </script>
</body>
</html>