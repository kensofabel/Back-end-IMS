
<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Management</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="../../assets/css/content.css">
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
                <div class="tab-info-actions" id="tab-info-actions">
                    <button class="btn-add-role" id="btn-add-employee"><i class="fas fa-user-plus"></i> Add Employee</button>
                </div>
            </div>
            <div class="tab-content" id="content-manage-employees">
                <table class="roles-table" id="employees-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th class="status-col">Status</th>
                            <th class="action-col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Example row, replace with PHP loop for real data -->
                        <tr data-employee-id="1">
                            <td class="editable-cell">John Doe</td>
                            <td class="editable-cell">john@example.com</td>
                            <td class="editable-cell">09123456789</td>
                            <td class="editable-cell">Admin</td>
                            <td class="status-col">
                                <span class="status-badge status-active status-badge-edit" style="cursor:pointer;" title="Toggle Status">
                                    <i class="fas fa-check-circle"></i>
                                    <span class="status-text">Active</span>
                                </span>
                            </td>
                            <td class="action-col">
                                <button class="btn-edit-role" title="Edit"><i class="fas fa-pen"></i> <span>Edit</span></button>
                                <button class="btn-delete-role" title="Delete" style="display:none;"><i class="fas fa-trash"></i> <span>Delete</span></button>
                            </td>
                        </tr>
                        <!-- Add more rows as needed -->
                    </tbody>
                </table>
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
                <form id="employee-form">
                    <div class="form-group">
                        <label for="employee-name">Name</label>
                        <input type="text" id="employee-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="employee-email">Email</label>
                        <input type="email" id="employee-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="employee-phone">Phone</label>
                        <input type="text" id="employee-phone" name="phone" required>
                    </div>
                    <div class="form-group">
                        <label for="employee-role">Role</label>
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
                <form id="employee-edit-form">
                    <div class="form-group">
                        <label for="edit-employee-name">Name</label>
                        <input type="text" id="edit-employee-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-employee-email">Email</label>
                        <input type="email" id="edit-employee-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-employee-phone">Phone</label>
                        <input type="text" id="edit-employee-phone" name="phone" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-employee-role">Role</label>
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
                    <div class="form-group">
                        <label for="edit-employee-hire-date">Hire Date</label>
                        <input type="date" id="edit-employee-hire-date" name="hire_date" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEmployeeEditModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="../../assets/js/content.js"></script>
    <script>
    // Modal open/close logic
    function openEmployeeFormModal() {
        document.getElementById('employee-form-modal').classList.add('show');
    }
    function closeEmployeeFormModal() {
        document.getElementById('employee-form-modal').classList.remove('show');
    }
    function openEmployeeEditModal() {
        document.getElementById('employee-edit-modal').classList.add('show');
    }
    function closeEmployeeEditModal() {
        document.getElementById('employee-edit-modal').classList.remove('show');
    }

    // Add Employee button handler
    document.getElementById('btn-add-employee').onclick = openEmployeeFormModal;

    // Edit button handler (example, should be dynamic for real data)
    document.querySelectorAll('.btn-edit-role').forEach(function(btn) {
        btn.onclick = function() {
            openEmployeeEditModal();
            // Populate modal fields with selected employee data
            var row = btn.closest('tr');
            document.getElementById('edit-employee-name').value = row.children[0].innerText;
            document.getElementById('edit-employee-email').value = row.children[1].innerText;
            document.getElementById('edit-employee-phone').value = row.children[2].innerText;
            document.getElementById('edit-employee-role').value = row.children[3].innerText;
            // For demo, pos pin and hire date left blank
        };
    });

    // Status badge toggle handler
    document.querySelectorAll('.status-badge-edit').forEach(function(badge) {
        badge.onclick = function() {
            var icon = badge.querySelector('i');
            var text = badge.querySelector('.status-text');
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

    // Delete button handler (example, should be dynamic for real data)
    document.querySelectorAll('.btn-delete-role').forEach(function(btn) {
        btn.onclick = function() {
            if (confirm('Are you sure you want to delete this employee?')) {
                var row = btn.closest('tr');
                row.remove();
            }
        };
    });
    </script>
</body>
</html>
