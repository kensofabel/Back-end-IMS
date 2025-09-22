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
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
            <!-- Content Area -->
            <div class="content-area">   
                <!-- Payment Reports Section -->
                <section id="payment-reports-section" class="section active">
                    <div class="section-header">
                        <h2>Payment Reports</h2>
                        <div class="report-filters">
                            <input type="date" id="payment-report-start-date">
                            <input type="date" id="payment-report-end-date">
                            <button class="btn btn-primary" onclick="generatePaymentReport()">
                                <i class="fas fa-chart-line"></i> Generate Report
                            </button>
                        </div>
                    </div>
                    <div class="report-summary">
                        <div class="summary-card">
                            <h3 id="total-payment-transactions">0</h3>
                            <p>Total Transactions</p>
                        </div>
                        <div class="summary-card">
                            <h3 id="total-payment-revenue">$0.00</h3>
                            <p>Total Revenue</p>
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
                    <div class="payment-report-table-container">
                        <table class="payment-report-table">
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Date & Time</th>
                                    <th>Payment Method</th>
                                    <th>Amount</th>
                                    <th>Products</th>
                                </tr>
                            </thead>
                            <tbody id="payment-report-table-body">
                                <!-- Payment report data will be populated by JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

</body>
</html>