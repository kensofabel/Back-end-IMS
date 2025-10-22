
<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}
require_once __DIR__ . '/../../partials/check_permission.php';
require_permission(11);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Management</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="../../assets/css/content.css">
    <link rel="stylesheet" href="../../assets/css/employee.css">
    <link rel="stylesheet" href="employee.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>  
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>

    <div class="content-area accounts-content-area">
            <div class="section-header">
                <h2 class="accounts-header-title">
                    Accounts
                    <span class="accounts-header-breadcrumb">
                        |
                        <i class="fas fa-users-cog"></i>
                        - Employees
                    </span>
                </h2>
            </div>
            <div class="tabs">
                <div class="tab active" id="tab-manage-employees">Manage Employees</div>
            </div>
            <div class="tab-info-bar">
                <div class="tab-info-text" id="tab-info-text">Add, edit, or remove employees as needed for your system. Click status to toggle Active/Inactive.</div>
                <div class="tab-info-actions" id="tab-info-actions" style="display:flex;align-items:center;gap:12px;">
                    <button class="btn-add-role" id="btn-add-employee"><i class="fas fa-user-plus"></i> Add Employee</button>
                    <input type="text" id="employee-search" placeholder="Search employees..." style="padding:7px 14px;border-radius:6px;border:1px solid #333;width:220px;font-size:1rem;background:#232323;color:#fff;">
                    <i class="fas fa-search" style="color:#ff9800;"></i>
                </div>
            </div>
            <div class="tab-content" id="content-manage-employees">
<?php
require_once '../../config/db.php';
$currentUser = intval($_SESSION['user_id']);
$owner_for_query = $currentUser;
$oStmt = $conn->prepare('SELECT owner_id FROM users WHERE id = ? LIMIT 1');
$oStmt->bind_param('i', $currentUser);
$oStmt->execute();
$oStmt->bind_result($owner_id_val);
$oStmt->fetch();
$oStmt->close();
if ($owner_id_val !== null) $owner_for_query = intval($owner_id_val);

$stmt = $conn->prepare(
    'SELECT u.id, u.full_name, u.email, u.phone, u.pos_pin, u.status, (SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = u.id LIMIT 1) as role_name FROM users u WHERE u.owner_id = ? AND u.id <> ? ORDER BY u.full_name ASC'
);
$stmt->bind_param('ii', $owner_for_query, $currentUser);
$employees = [];
if ($stmt->execute()) {
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $employees[] = $row;
    }
    $res->free();
}
$stmt->close();
if (count($employees) > 0) {
    echo '<table class="roles-table" id="employees-table">';
    echo '<thead><tr>';
    echo '<th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th class="status-col">Status</th><th class="action-col">Actions</th>';
    echo '</tr></thead><tbody>';
    // Determine if current user can delete employees (owner or has Employee Management permission id=11)
    $can_delete = false;
    $actingUser = $currentUser;
    if ($actingUser > 0) {
        // owner check
        $ownerCheck = $conn->prepare('SELECT owner_id FROM users WHERE id = ? LIMIT 1');
        if ($ownerCheck) {
            $ownerCheck->bind_param('i', $actingUser);
            $ownerCheck->execute();
            $ownerCheck->bind_result($owner_val_check);
            $ownerCheck->fetch();
            $ownerCheck->close();
            if ($owner_val_check === null) {
                $can_delete = true;
            }
        }
        // permission check if not owner
        if (!$can_delete) {
            $permStmt = $conn->prepare('SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id WHERE ur.user_id = ? AND rp.permission_id = 11 LIMIT 1');
            if ($permStmt) {
                $permStmt->bind_param('i', $actingUser);
                $permStmt->execute();
                $permStmt->store_result();
                if ($permStmt->num_rows > 0) $can_delete = true;
                $permStmt->close();
            }
        }
    }
    foreach ($employees as $row) {
        $rid = (int)$row['id'];
        $rname = htmlspecialchars($row['full_name'] ?? '');
        $remail = htmlspecialchars($row['email'] ?? '');
        $rphone = htmlspecialchars($row['phone'] ?? '');
        $rpos = htmlspecialchars($row['pos_pin'] ?? '');
        $rrole = htmlspecialchars($row['role_name'] ?? '');
        echo "<tr data-employee-id=\"{$rid}\">\n";
        echo "    <td class=\"editable-cell\">{$rname}</td>\n";
        echo "    <td class=\"editable-cell\">{$remail}</td>\n";
        echo "    <td class=\"editable-cell\">{$rphone}</td>\n";
        echo "    <td class=\"editable-cell\">{$rrole}</td>\n";
    $status = isset($row['status']) ? $row['status'] : 'active';
    $isActive = ($status === 'active');
    $badgeClass = $isActive ? 'status-active' : 'status-inactive';
    $iconClass = $isActive ? 'fa-check-circle' : 'fa-times-circle';
    $statusText = $isActive ? 'Active' : 'Inactive';
    echo "    <td class=\"status-col\">\n";
    echo "        <span class=\"status-badge {$badgeClass} status-badge-edit\" style=\"cursor:pointer;\" title=\"Toggle Status\" data-employee-id=\"{$rid}\" data-status=\"{$status}\">\n";
    echo "            <i class=\"fas {$iconClass}\"></i>\n";
    echo "            <span class=\"status-text\">{$statusText}</span>\n";
    echo "        </span>\n";
    echo "    </td>\n";
        echo "    <td class=\"action-col\">\n";
        echo "        <button class=\"btn-edit-role\" title=\"Edit\"><i class=\"fas fa-pen\"></i> <span>Edit</span></button>\n";
        if ($can_delete) {
            echo "        <button class=\"btn-delete-role\" title=\"Delete\"><i class=\"fas fa-trash\"></i> <span>Delete</span></button>\n";
        } else {
            echo "        <button class=\"btn-delete-role\" title=\"Delete\" style=\"display:none;\"><i class=\"fas fa-trash\"></i> <span>Delete</span></button>\n";
        }
        echo "    </td>\n";
        echo "</tr>\n";
    }
    echo '</tbody></table>';
    // Pagination bar (HTML only, JS logic to be added)
    echo '<div class="employee-pagination-bar dark-theme-pagination">';
    echo '  <button class="pagination-btn pagination-prev" disabled title="Previous page">&#60;</button>';
    echo '  <button class="pagination-btn pagination-next" disabled title="Next page">&#62;</button>';
    echo '  <span style="color:#fff;font-size:1.04rem;margin-left:12px;">Page</span>';
    echo '  <input type="number" class="pagination-page-input" min="1" value="1" style="width:44px;text-align:center;padding:4px 0;border:1px solid #222;border-radius:4px;font-size:1.04rem;margin:0 6px;background:#232323;color:#fff;" />';
    echo '  <span style="color:#fff;font-size:1.04rem;">of</span>';
    echo '  <span class="pagination-total-pages" style="color:#fff;font-size:1.04rem;margin:0 6px;">1</span>';
    echo '  <span style="color:#fff;font-size:1.04rem;margin-left:18px;">Rows per page:</span>';
    echo '  <select class="pagination-rows-select" style="padding:4px 8px;border-radius:4px;border:1px solid #444;font-size:1.04rem;margin-left:6px;background:#232323;color:#fff;">';
    echo '    <option value="10" selected>10</option>';
    echo '    <option value="25">25</option>';
    echo '    <option value="50">50</option>';
    echo '    <option value="100">100</option>';
    echo '  </select>';
    echo '</div>';
} else {
    echo '<div id="no-employees-message" style="text-align:center; color:#aaa; padding:40px 0;">No employees found. Add an employee to get started.</div>';
}
?>
            </div>
        </div>
    </div>

    <!-- Add Employee Modal -->
    <div id="employee-form-modal" class="modal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="employee-form-title">Add Employee</h2>
                <span class="close" onclick="closeEmployeeFormModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="employee-form" method="post">
                    <div class="form-group">
                        <label for="employee-name">Name</label>
                        <input type="text" id="employee-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="employee-email">Email</label>
                        <input type="email" id="employee-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="employee-password">Password</label>
                        <div class="input-with-toggle">
                            <input type="password" id="employee-password" name="password" required>
                            <span class="password-toggle slashed" data-target="employee-password" title="Show password">👁️</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="employee-phone">Phone</label>
                        <input type="text" id="employee-phone" name="phone" required>
                    </div>
                    <div class="form-group">
                        <select id="employee-role" name="role" required>
                            <option value="">Select Role</option>
                            <option value="Admin">Admin</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="employee-pos-pin">POS Pin</label>
                        <input type="text" id="employee-pos-pin" name="pos_pin" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Employee</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEmployeeFormModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Edit Employee Modal -->
    <div id="employee-edit-modal" class="modal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="employee-edit-title">Edit Employee</h2>
                <span class="close" onclick="closeEmployeeEditModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="employee-edit-form" method="post">
                    <div class="form-group">
                        <label for="edit-employee-name">Name</label>
                        <input type="text" id="edit-employee-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-employee-email">Email</label>
                        <input type="email" id="edit-employee-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-employee-password">Password</label>
                        <div class="input-with-toggle">
                            <input type="password" id="edit-employee-password" name="password">
                            <span class="password-toggle slashed" data-target="edit-employee-password" title="Show password">👁️</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-employee-phone">Phone</label>
                        <input type="text" id="edit-employee-phone" name="phone" required>
                    </div>
                    <div class="form-group">
                        <select id="edit-employee-role" name="role" required>
                            <option value="">Select Role</option>
                            <option value="Admin">Admin</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-employee-pos-pin">POS Pin</label>
                        <input type="text" id="edit-employee-pos-pin" name="pos_pin" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEmployeeEditModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="employee.js"></script>
</body>
</html>
