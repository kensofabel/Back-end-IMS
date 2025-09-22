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
                        <h2>Audit Logs</h2>
                        <div class="search-box">
                            <input type="text" id="search-audit-logs" placeholder="Search audit logs...">
                            <i class="fas fa-search"></i>
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
                            <input type="date" id="audit-log-date-from">
                            <input type="date" id="audit-log-date-to">
                            <button class="btn btn-primary" onclick="filterAuditLogs()">
                                <i class="fas fa-filter"></i> Filter
                            </button>
                            <button class="btn btn-secondary" onclick="exportAuditLogs()">
                                <i class="fas fa-download"></i> Export
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
                                    <?php if ($result && $result->num_rows > 0): ?>
                                        <?php while($row = $result->fetch_assoc()): ?>
                                            <tr>
                                                <td><?= htmlspecialchars($row['created_at']) ?></td>
                                                <td><?= htmlspecialchars($row['username'] ?? 'Unknown') ?></td>
                                                <td><?= htmlspecialchars($row['action']) ?></td>
                                                <td><?= htmlspecialchars($row['details'] ?? '') ?></td>
                                                <td><?= htmlspecialchars($row['ip_address']) ?></td>
                                            </tr>
                                        <?php endwhile; ?>
                                    <?php else: ?>
                                        <tr><td colspan="5">No audit logs found.</td></tr>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

</body>
</html>