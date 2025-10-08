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
    <link rel="stylesheet" href="paymentreport.css">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
    <!-- Content Area -->
    <div class="content-area">
        <!-- Payment Report Section -->
        <section id="sales-report-section" class="section active">
            <div class="section-header">
                <h2>Payment Report</h2>
                <div class="report-filters">
                    <input type="date" id="report-start-date">
                    <input type="date" id="report-end-date">
                    <button class="btn btn-primary" onclick="generatePaymentReport()">
                        <i class="fas fa-money-check-alt"></i> Generate Report
                    </button>
                </div>
            </div>
            <div class="report-summary">
                <div class="summary-card">
                    <h3 id="total-payments">0</h3>
                    <p>Total Payments</p>
                </div>
                <div class="summary-card">
                    <h3 id="total-payment-amount">₱0.00</h3>
                    <p>Total Amount</p>
                </div>
                <div class="summary-card">
                    <h3 id="cash-payments">0</h3>
                    <p>Cash Payments</p>
                </div>
                <div class="summary-card">
                    <h3 id="card-payments">0</h3>
                    <p>Card Payments</p>
                </div>
            </div>
            <div class="sales-report-table-container">
                <table class="sales-report-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Date & Time</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="payment-report-table-body">
                        <!-- Payment report data will be populated by JavaScript -->
                    </tbody>
                </table>
            </div>
        </section>
    </div>
    <!-- Payment Report Page Specific JS -->
    <script src="paymentreport.js"></script>

</body>
</html>