<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}

include '../../config/db.php';

// Fetch all audit logs, newest first
$sql = "SELECT al.*, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC";
$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Management System</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="auditlogs.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
            <!-- Content Area -->
            <div class="content-area">
                    <!-- Audit Logs Section -->
                <section id="audit-logs-section" class="section active">
                    <div class="section-header">
                        <h2 class="header-title">
                            Audit Logs
                            <span class="header-breadcrumb">
                                |
                                <i class="fas fa-history"></i>
                                - Audit Logs
                            </span>
                        </h2>
                        <div class="header-search">
                            <input type="text" id="search-audit-logs" placeholder="Search users, actions, or IP addresses..." class="header-search-input">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                    </div>
                    <div class="audit-logs-content">
                        <div class="audit-logs-filters">
                            <select id="audit-log-filter">
                                <option value="all">All Activities</option>
                                <option value="login">Login/Logout</option>
                                <option value="product">Product Changes</option>
                                <option value="sales">Sales Transactions</option>
                                <option value="inventory">Inventory Updates</option>
                            </select>
                            <input type="date" id="audit-log-date-from" placeholder="From Date">
                            <input type="date" id="audit-log-date-to" placeholder="To Date">
                            <button class="btn btn-primary" onclick="filterAuditLogs()">
                                <i class="fas fa-filter"></i> Filter
                            </button>
                            <button class="btn btn-secondary" onclick="exportAuditLogs()">
                                <i class="fas fa-download"></i> Export
                            </button>
                            <button class="btn btn-secondary" type="button" onclick="resetAuditLogFilters()">
                                <i class="fas fa-undo"></i> Reset
                            </button>
                        </div>
                        <div class="audit-logs-table-container">
                            <table class="audit-logs-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                        <th>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody id="audit-logs-table-body">
                                    <!-- Realtime audit logs will be loaded here by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
    <script src="auditlogs.js"></script>
</body>
</html>