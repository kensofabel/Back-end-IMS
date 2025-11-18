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
    <style>
        /* Show the select column and checkboxes for the employees table on this page only */
        #employees-table th.select-col,
        #employees-table td.select-col {
            display: table-cell !important;
            width: 40px;
            text-align: center;
        }
        #employees-table .employee-select,
        #employees-table #select-all-employees {
            display: inline-block !important;
            cursor: pointer;
        }
        /* Confirmation modal styles */
        #confirm-modal {
            position: fixed; left:0; top:0; right:0; bottom:0; display:none; align-items:center; justify-content:center; z-index:20000; background: rgba(0,0,0,0.6);
        }
        #confirm-modal .modal-content { background: #151515; border-radius:8px; color:#eee; }
        #confirm-modal .modal-header { display:flex; align-items:center; justify-content:space-between; }
        #confirm-modal .modal-body { color:#ddd; }
        #confirm-modal .modal-actions .btn { min-width:96px; }

        /* Toast styles */
        #toast-container .bb-toast { transition: all 0.28s ease; }
        /* Hide per-row delete buttons for employee rows (use bulk delete instead) */
        tr.employee-row .btn-delete-role { display: none !important; }
    </style>
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
                <div class="tab-info-actions" id="tab-info-actions">
                    <button class="btn-add-role" id="btn-add-employee"><i class="fas fa-user-plus"></i> Add Employee</button>
                    <button id="btn-bulk-delete" class="btn-select-role delete" style="margin-left:8px; display:none;"><i class="fas fa-trash"></i> Delete selected</button>
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

// Detect optional columns (phone, pos_pin) to avoid fatal errors pre-migration
$hasPhone = false;
$hasPosPin = false;
if ($colRes = $conn->query("SHOW COLUMNS FROM users LIKE 'phone'")) { $hasPhone = $colRes->num_rows > 0; $colRes->free(); }
if ($colRes = $conn->query("SHOW COLUMNS FROM users LIKE 'pos_pin'")) { $hasPosPin = $colRes->num_rows > 0; $colRes->free(); }

// Build SELECT list
$selectCols = ['u.id','u.full_name','u.email','u.status'];
if ($hasPhone) $selectCols[] = 'u.phone';
if ($hasPosPin) $selectCols[] = 'u.pos_pin';
$selectCols[] = '(SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = u.id LIMIT 1) as role_name';
$sql = 'SELECT ' . implode(', ', $selectCols) . ' FROM users u WHERE u.owner_id = ? AND u.id <> ? ORDER BY u.full_name ASC';

$stmt = $conn->prepare($sql);
$stmt->bind_param('ii', $owner_for_query, $currentUser);
$employees = [];
if ($stmt->execute()) {
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        if (!$hasPhone) $row['phone'] = '';
        if (!$hasPosPin) $row['pos_pin'] = '';
        $employees[] = $row;
    }
    $res->free();
}
$stmt->close();
// Build a small unique role list from fetched employees for the role filter
$roles = array();
foreach ($employees as $e) {
    if (!empty($e['role_name'])) $roles[] = $e['role_name'];
}
$roles = array_values(array_unique($roles));

if (count($employees) > 0) {
    // Render client-side filter controls
    // Filters: left = search, right = role/status/clear
    echo '<div class="employee-filters" style="margin:14px 0 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap;">';
    echo '  <div class="employee-filters-left" style="display:flex; gap:10px; align-items:center; min-width:0;">';
    echo '    <input type="search" id="employee-search" placeholder="Search employees (name, email, phone, role)" style="padding:8px 12px;border-radius:6px;border:1px solid #444;background:#1e1e1e;color:#fff;min-width:260px;" />';
    echo '  </div>';
    echo '  <div class="employee-filters-right" style="display:flex; gap:10px; align-items:center; margin-left:auto;">';
    echo '    <select id="employee-role-filter" style="padding:8px 10px;border-radius:6px;border:1px solid #444;background:#1e1e1e;color:#fff;">';
    echo '      <option value="">All roles</option>';
    foreach ($roles as $r) {
        $rEsc = htmlspecialchars($r);
        echo "      <option value=\"{$rEsc}\">{$rEsc}</option>";
    }
    echo '    </select>';
    echo '    <select id="employee-status-filter" style="padding:8px 10px;border-radius:6px;border:1px solid #444;background:#1e1e1e;color:#fff;">';
    echo '      <option value="">All status</option><option value="active">Active</option><option value="inactive">Inactive</option>';
    echo '    </select>';
    echo '    <button id="employee-clear-filters" class="btn-add-role" style="padding:8px 14px;margin-left:6px;">Clear</button>';
    echo '  </div>';
    echo '</div>';

    echo '<table class="roles-table" id="employees-table">';
    echo '<thead><tr>';
    // Select column for bulk actions
    echo '<th class="select-col" style="width:40px;text-align:center;"><input id="select-all-employees" type="checkbox" aria-label="Select all employees" /></th>';
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
        $rrole = htmlspecialchars($row['role_name'] ?? '');
    echo "<tr data-employee-id=\"{$rid}\" class=\"employee-row\">\n";
    // Checkbox cell (keeps existing editable-cell column ordering untouched since checkbox is outside editable-cell)
    $rNameForAria = htmlspecialchars($row['full_name'] ?? '');
    echo "    <td class=\"select-col\" style=\"text-align:center;\"><input type=\"checkbox\" class=\"employee-select\" name=\"selected_employees[]\" value=\"{$rid}\" aria-label=\"Select {$rNameForAria}\" /></td>\n";
    echo "    <td class=\"editable-cell employee-name-cell\">{$rname}</td>\n";
    echo "    <td class=\"editable-cell employee-email-cell\">{$remail}</td>\n";
    echo "    <td class=\"editable-cell employee-phone-cell\">{$rphone}</td>\n";
    echo "    <td class=\"editable-cell employee-role-cell\">{$rrole}</td>\n";
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
    echo '  <input type="number" class="pagination-page-input" min="1" value="1" style="width:44px;text-align:center;padding:4px 0;border:1px solid #222;border-radius:4px;font-size:1.04rem;margin:0 6px;" />';
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
    <!-- Confirmation modal (used to replace window.confirm) -->
    <div id="confirm-modal" class="modal" style="display:none;">
        <div class="modal-content" style="max-width:420px;padding:18px;">
            <div class="modal-header">
                <h2 id="confirm-modal-title">Confirm</h2>
                <span class="close" id="confirm-modal-close">&times;</span>
            </div>
            <div class="modal-body" id="confirm-modal-body" style="padding:10px 0; color:#ddd;"></div>
            <div class="modal-actions" style="display:flex; gap:10px; justify-content:flex-end; margin-top:12px;">
                <button id="confirm-modal-cancel" class="btn btn-secondary">Cancel</button>
                <button id="confirm-modal-ok" class="btn btn-primary">Confirm</button>
            </div>
        </div>
    </div>

    <!-- Toast container for non-blocking messages -->
    <div id="toast-container" style="position:fixed; right:18px; bottom:18px; z-index:20000; display:flex; flex-direction:column; gap:8px;"></div>
</body>
</html>

