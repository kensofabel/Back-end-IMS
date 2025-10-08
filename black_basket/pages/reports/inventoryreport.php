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
    <title>Inventory Management System</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
    <link rel="stylesheet" href="inventoryreport.css">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
    <!-- Content Area -->
    <div class="content-area">
        <!-- Inventory Report Section -->
        <section id="sales-report-section" class="section active">
            <div class="section-header">
                <h2>Inventory Report</h2>
                <div class="report-filters">
                    <input type="date" id="report-start-date">
                    <input type="date" id="report-end-date">
                    <button class="btn btn-primary" onclick="generateInventoryReport()">
                        <i class="fas fa-chart-bar"></i> Generate Report
                    </button>
                </div>
            </div>
            <div class="report-summary">
                <div class="summary-card">
                    <h3 id="total-inventory-items">0</h3>
                    <p>Total Items</p>
                </div>
                <div class="summary-card">
                    <h3 id="total-inventory-value">₱0.00</h3>
                    <p>Total Inventory Value</p>
                </div>
                <div class="summary-card">
                    <h3 id="low-stock-count">0</h3>
                    <p>Low Stock Items</p>
                </div>
                <div class="summary-card">
                    <h3 id="out-of-stock-count">0</h3>
                    <p>Out of Stock Items</p>
                </div>
            </div>
            <div class="sales-report-table-container">
                <table class="sales-report-table">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-report-table-body">
                        <!-- Inventory report data will be populated by JavaScript -->
                    </tbody>
                </table>
            </div>
        </section>
    </div>
    <!-- Inventory Report Page Specific JS -->
    <script src="inventoryreport.js"></script>

</body>
</html>