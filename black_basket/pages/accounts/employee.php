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
            <!-- Employee Section -->
            <section id="employee-section" class="section active">
                <div class="section-header">
                    <h2 class="access-header-title">
                        Employee Management
                        <span class="access-header-breadcrumb">
                            |
                            <i class="fas fa-users-cog" ></i>
                            - Employees
                        </span>
                    </h2>
                </div>
                <div class="employee-content">
                    <p>Employee management content will be displayed here.</p>
                    <!-- Add employee management specific content -->
                    <div class="employee-actions">
                        <button class="btn btn-edit" onclick="addEmployee()">
                            <i class="fas fa-user-plus"></i> Add Employee
                        </button>
                        <button class="btn btn-edit" onclick="manageEmployees()">
                            <i class="fas fa-users"></i> Manage Employees
                        </button>
                    </div>
                </div>
            </section>
        </div>

                <!-- Add/Edit Employee Form Modal -->
        <div id="employee-form-modal" class="modal">
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
                            <label for="employee-status">Status</label>
                            <select id="employee-status" name="status" required>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Leave">On Leave</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Employee</button>
                            <button type="button" class="btn btn-secondary" onclick="closeEmployeeFormModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
            
        <!-- Employee Management Modal -->
        <div id="employee-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Manage Employees</h2>
                    <span class="close" onclick="closeEmployeeModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="employee-actions">
                        <button class="btn btn-primary" onclick="showAddEmployeeForm()">
                            <i class="fas fa-plus"></i> Add New Employee
                        </button>
                    </div>
                    <div id="employees-list" class="employees-list">
                        <!-- Employee list will be populated here -->
                    </div>
                </div>
            </div>
        </div>
</body>
</html>