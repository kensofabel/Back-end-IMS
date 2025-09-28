<?php
session_start();
require_once '../../config/db.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}

// Fetch roles
$roles = [];
$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
if ($user_id !== null) {
    $result = $conn->query("SELECT owner_id FROM users WHERE id = $user_id");
    if ($result && $row = $result->fetch_assoc()) {
        $owner_id = is_null($row['owner_id']) ? $user_id : intval($row['owner_id']);
        $sql_roles = "SELECT * FROM roles WHERE owner_id = $owner_id ORDER BY id ASC";
    } else {
        // fallback: show all roles if user not found
        $sql_roles = "SELECT * FROM roles ORDER BY id ASC";
    }
} else {
    // fallback: show all roles if not logged in
    $sql_roles = "SELECT * FROM roles ORDER BY id ASC";
}
$result_roles = $conn->query($sql_roles);
if ($result_roles && $result_roles->num_rows > 0) {
    while ($row = $result_roles->fetch_assoc()) {
        $roles[] = $row;
    }
}

// Fetch permissions
$permissions = [];
$sql_permissions = "SELECT * FROM permissions ORDER BY id ASC";
$result_permissions = $conn->query($sql_permissions);
if ($result_permissions && $result_permissions->num_rows > 0) {
    while ($row = $result_permissions->fetch_assoc()) {
        $permissions[] = $row;
    }
}

// Fetch role-permissions mapping
$role_permissions = [];
$sql_role_permissions = "SELECT * FROM role_permissions";
$result_role_permissions = $conn->query($sql_role_permissions);
if ($result_role_permissions && $result_role_permissions->num_rows > 0) {
    while ($row = $result_role_permissions->fetch_assoc()) {
        $role_permissions[$row['role_id']][] = $row['permission_id'];
    }
}

// Determine which tab should be active based on cookie
$active_tab = 'manage-roles';
if (isset($_COOKIE['access_tab']) && in_array($_COOKIE['access_tab'], ['manage-roles', 'set-permissions'])) {
    $active_tab = $_COOKIE['access_tab'];
}
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

    <div class="content-area accounts-content-area">
        <div class="section-header">
            <h2 class="accounts-header-title">
                Access Rights
                <span class="accounts-header-breadcrumb">
                    |
                    <i class="fas fa-users-cog"></i>
                    - Access Rights
                </span>
            </h2>
        </div>

        <div class="tabs">
            <div class="tab first-child<?php if ($active_tab === 'manage-roles') echo ' active'; ?>" id="tab-manage-roles" onclick="showTab('manage-roles')">Manage Roles</div>
            <div class="tab<?php if ($active_tab === 'set-permissions') echo ' active'; ?>" id="tab-set-permissions" onclick="showTab('set-permissions')">Set Permissions</div>
        </div>

        <div class="tab-info-bar">
            <span class="tab-info-text" id="tab-info-text">
                <?php if ($active_tab === 'set-permissions'): ?>
                    Use this section to define what each role can access and modify within the application.
                <?php else: ?>
                    Manage user roles. Add, edit, or remove roles as needed for your system. Note: Adding a new role will automatically assign all permissions to it.
                <?php endif; ?>
            </span>
            <div id="tab-info-actions">
                <?php if ($active_tab === 'set-permissions'): ?>
                    <button class="btn-edit-permissions" id="btn-edit-permissions"><i class="fas fa-pen-to-square"></i>Edit</button>
                <?php else: ?>
                    <button class="btn-add-role" id="btn-add-role"><i class="fas fa-plus"></i> Add Role</button>
                    <button class="btn-select-role" id="btn-select-role"><i class="fas fa-check-square"></i></button>
                <?php endif; ?>
            </div>
        </div>

        <!-- Manage Roles Tab -->
        <div class="tab-content" id="content-manage-roles" style="<?php if ($active_tab !== 'manage-roles') echo 'display:none;'; ?>">
            <table class="roles-table">
                <thead>
                    <tr>
                        <th>Role Name</th>
                        <th>Description</th>
                        <th class="status-col">Status</th>
                        <th class="action-col">Action</th>
                        <th style="width:40px; text-align:center; display:none;" class="select-col">
                            <input type="checkbox" id="select-all-checkbox">
                        </th>
                    </tr>
                </thead>
                <tbody>
                <?php if (count($roles) > 0): ?>
                    <?php foreach ($roles as $role): ?>
                    <tr data-role-id="<?php echo (int)$role['id']; ?>">
                        <td class="editable-cell"><?php echo htmlspecialchars($role['name']); ?></td>
                        <td class="editable-cell"><?php echo htmlspecialchars($role['description']); ?></td>
                        <td class="status-col">
                            <span class="status-badge status-badge-view editable-cell" data-role-id="<?php echo (int)$role['id']; ?>">
                                <?php if ($role['status'] === 'active'): ?>
                                    <i class="fas fa-check-circle" style="color:#4caf50; margin-left: -10px;"></i><span class="status-text" style="text-transform:capitalize; font-weight:400; font-size:1rem; margin-left:4px;">active</span>
                                <?php else: ?>
                                    <i class="fas fa-times-circle" style="color:#e53e3e; margin-left: -10px;"></i><span class="status-text" style="text-transform:capitalize; font-weight:400; font-size:1rem; margin-left:4px;">inactive</span>
                                <?php endif; ?>
                            </span>
                            <span class="status-badge status-badge-edit" data-role-id="<?php echo (int)$role['id']; ?>" style="display:none; cursor:pointer; user-select:none; outline:none; border:none;">
                                <?php if ($role['status'] === 'active'): ?>
                                    <i class="fas fa-check-circle" style="color:#4caf50; margin-left: -10px;"></i><span class="status-text" style="text-transform:capitalize; font-weight:400; font-size:1rem; margin-left:4px;">active</span>
                                <?php else: ?>
                                    <i class="fas fa-times-circle" style="color:#e53e3e; margin-left: -10px;"></i><span class="status-text" style="text-transform:capitalize; font-weight:400; font-size:1rem; margin-left:4px;">inactive</span>
                                <?php endif; ?>
                            </span>
                        </td>
                        <td class="action-col">
                            <button class="btn-edit-role" title="Edit">
                                <i class="fas fa-pen-to-square"></i><span></span>
                            </button>
                            <button class="btn-save-role" style="display:none;" title="Save">
                                <i class="fas fa-check"></i><span></span>
                            </button>
                            <button class="btn-cancel-role" style="display:none;" title="Cancel">
                                <i class="fas fa-times"></i><span></span>
                            </button>
                            <button class="btn-delete-role" style="display:none;" title="Delete">
                                <i class="fas fa-trash"></i><span></span>
                            </button>
                        </td>
                        <td style="text-align:center; display:none; user-select:none;" class="select-col">
                            <input type="checkbox" class="row-select-checkbox" tabindex="-1" style="user-select:none;">
                        </td>
                    </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr><td colspan="4">No roles found.</td></tr>
                <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Set Permissions Tab -->
        <div class="tab-content" id="content-set-permissions" style="<?php if ($active_tab !== 'set-permissions') echo 'display:none;'; ?>">
            <div class="permissions-list">
                <?php if (count($roles) > 0): ?>
                    <?php foreach ($roles as $role): ?>
                    <div class="role-permissions" data-role-id="<?php echo (int)$role['id']; ?>">
                        <div class="role-permissions-header" onclick="togglePermissions(this)">
                            <span class="role-permissions-title"><?php echo htmlspecialchars($role['name']); ?></span>
                            <span class="role-permissions-separator">-</span>
                            <span class="role-permissions-desc"><?php echo htmlspecialchars($role['description']); ?></span>
                        </div>
                        <div class="permissions-checkboxes">
                            <?php foreach ($permissions as $perm): ?>
                                <?php $checked = (isset($role_permissions[$role['id']]) && in_array($perm['id'], $role_permissions[$role['id']])); ?>
                                <div class="permission-card" data-permission-id="<?php echo (int)$perm['id']; ?>" style="display:<?php echo $checked ? 'block' : 'none'; ?>;">
                                    <span class="permission-texts">
                                        <span class="permission-title"><?php echo htmlspecialchars($perm['name']); ?></span>
                                        <span class="permission-desc"><?php echo htmlspecialchars($perm['description']); ?></span>
                                    </span>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div>No roles found.</div>
                <?php endif; ?>
            </div>
            <button class="btn-save-permissions" id="btn-save-permissions" style="display:none;">Save</button>
        </div>
    </div>

    <script src="../../assets/js/content.js"></script>
    <script>
    // Show/hide status badge toggle in edit mode
    document.querySelectorAll('.btn-edit-role').forEach(function(editBtn) {
        editBtn.addEventListener('click', function() {
            var row = this.closest('tr');
            var statusBadgeView = row.querySelector('.status-badge-view');
            var statusBadgeEdit = row.querySelector('.status-badge-edit');
            if (statusBadgeView && statusBadgeEdit) {
                statusBadgeView.style.display = 'none';
                statusBadgeEdit.style.display = 'inline-block';
            }
        });
    });
    document.querySelectorAll('.btn-cancel-role, .btn-save-role').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var row = this.closest('tr');
            var statusBadgeView = row.querySelector('.status-badge-view');
            var statusBadgeEdit = row.querySelector('.status-badge-edit');
            if (statusBadgeView && statusBadgeEdit) {
                // Update badge icon/text based on toggle
                statusBadgeView.innerHTML = statusBadgeEdit.innerHTML;
                statusBadgeView.style.display = '';
                statusBadgeEdit.style.display = 'none';
            }
        });
    });
    // Toggle logic for badge in edit mode
    document.querySelectorAll('.status-badge-edit').forEach(function(badge) {
        badge.addEventListener('click', function() {
            var isActive = this.innerHTML.includes('fa-check-circle');
            if (isActive) {
                this.innerHTML = '<i class="fas fa-times-circle" style="color:#e53e3e; margin-left: -10px;"></i><span style="text-transform:capitalize; font-weight:400; font-size:1rem; margin-left:4px;">inactive</span>';
            } else {
                this.innerHTML = '<i class="fas fa-check-circle" style="color:#4caf50; margin-left: -10px;"></i><span style="text-transform:capitalize; font-weight:400; font-size:1rem; margin-left:4px;">active</span>';
            }
        });
    });
    </script>
</body>
</html>