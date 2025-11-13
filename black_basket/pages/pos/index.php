<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Point of Sale - Black Basket</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>

    <div class="content-area">
        <section id="audit-logs-section" class="section active">
            <div class="section-header">
                <h2 class="header-title">
                    POS
                    <span class="header-breadcrumb">
                        |
                        <i class="fas fa-cash-register"></i>
                        - Point of Sale
                    </span>
                </h2>
            </div>
            <div class="pos-container">
                <!-- Product Search and Selection -->
                <div class="pos-left">
                    <div class="pos-section">
                        <h3>Product Search</h3>
                        <div class="search-box">
                            <div class="search-row">
                                <div class="category-toggle-container">
                                    <button id="category-toggle" class="category-toggle">
                                        <span class="toggle-label">All Items</span>
                                        <span class="toggle-chevron">▾</span>
                                    </button>
                                    <ul id="category-list" class="category-list" aria-hidden="true">
                                        <li data-category="all" class="active">All Items</li>
                                        <!-- additional categories can be injected dynamically -->
                                    </ul>
                                </div>

                                <button id="scan-btn" class="scan-btn" aria-label="Scan barcode" title="Scan barcode">
                                    <i class="fas fa-barcode"></i>
                                </button>

                                <div class="search-input-wrapper">
                                    <button id="search-toggle" class="search-toggle" aria-label="Open search">
                                        <i class="fas fa-search"></i>
                                    </button>
                                    <input type="text" id="product-search" placeholder="search product...">
                                    <button id="search-submit" class="search-submit" aria-label="Search now" title="Search">
                                        <i class="fas fa-search"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pos-section product-selection">
                        <h3>Available Products</h3>
                        <div class="product-grid" id="product-grid">
                            <!-- Products will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Cart and Checkout -->
                <div class="pos-right">
                    <div class="pos-section">
                        <h3>Current Sale</h3>
                        <div class="cart-items" id="cart-items">
                            <!-- Cart items will be displayed here -->
                        </div>
                        <div class="cart-total">
                            <div class="total-row">
                                <span>Subtotal:</span>
                                <span id="subtotal">₱0.00</span>
                            </div>
                            <div class="total-row">
                                <span>Tax (<span id="tax-rate-label">12%</span>):</span>
                                <span id="tax">₱0.00</span>
                            </div>
                            <div class="total-row total">
                                <span>Total:</span>
                                <span id="total">₱0.00</span>
                            </div>
                        </div>
                    </div>

                <div class="pos-section">
                        <h3>Payment</h3>
                        <div class="payment-methods">
                            <button class="payment-btn active" data-method="cash">Cash</button>
                            <button class="payment-btn" data-method="card">Card</button>
                            <button class="payment-btn" data-method="online">Online</button>
                        </div>
                        <div class="payment-input">
                            <label for="amount-received">Amount Received:</label>
                            <input type="number" id="amount-received" step="0.01" min="0">
                        </div>
                        <div class="change-amount">
                            <span>Change:</span>
                            <span id="change">₱0.00</span>
                        </div>
                        <button id="complete-sale-btn" class="complete-sale-btn">Complete Sale</button>
                        <button id="clear-cart-btn" class="clear-cart-btn">Clear Cart</button>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <script src="pos.js"></script>
</body>
</html>
