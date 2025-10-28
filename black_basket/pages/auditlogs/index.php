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
                        <!-- Employee-style pagination bar (dark theme) copied into Audit Logs -->
                        <div class="employee-pagination-bar dark-theme-pagination" style="display:flex;align-items:center;gap:8px;margin-top:12px;justify-content:space-between;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <button id="prev-page" class="pagination-btn pagination-prev btn btn-secondary" disabled title="Previous page">&#60;</button>
                                <button id="next-page" class="pagination-btn pagination-next btn btn-secondary" disabled title="Next page">&#62;</button>
                                <span style="color:#fff;font-size:1.04rem;margin-left:12px;">Page</span>
                                <input id="pagination-page-input" type="number" class="pagination-page-input" min="1" value="1" style="width:44px;text-align:center;padding:4px 0;border:1px solid #222;border-radius:4px;font-size:1.04rem;margin:0 6px;" />
                                <span style="color:#fff;font-size:1.04rem;">of</span>
                                <span id="pagination-total-pages" class="pagination-total-pages" style="color:#fff;font-size:1.04rem;margin:0 6px;">1</span>
                                <span style="color:#fff;font-size:1.04rem;margin-left:18px;">Rows per page:</span>
                                <select id="rows-per-page" class="pagination-rows-select" style="padding:4px 8px;border-radius:4px;border:1px solid #444;font-size:1.04rem;margin-left:6px;background:#232323;color:#fff;">
                                    <option value="10" selected>10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
    <script src="auditlogs.js"></script>
</body>
</html>