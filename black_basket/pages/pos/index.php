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
                        <div class="section-header-inline">
                            <h3>Available Products</h3>
                            <div class="view-toggle" id="view-toggle">
                                <button id="view-toggle-btn" class="view-toggle-btn" title="Toggle view" aria-pressed="false" aria-label="Toggle grid or list view">
                                    <i class="fa fa-th" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <div class="product-grid" id="product-grid">
                            <!-- Products will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Cart and Checkout -->
                <div class="pos-right">
                    <div class="pos-section">
                        <div class="section-header-inline">
                            <h3 id="current-sale-title">Current Sale</h3>
                            <div class="header-actions" style="margin-right: -12px;">
                                <button id="add-customer-btn" class="view-toggle-btn" title="Add customer" aria-label="Add customer">
                                    <i class="fa fa-user-plus" aria-hidden="true"></i>
                                </button>
                                <div class="more-menu-wrap">
                                    <button id="sale-more-btn" class="view-toggle-btn" title="More options" aria-label="More options" aria-expanded="false" aria-haspopup="true">
                                        <i class="fa fa-ellipsis-v" aria-hidden="true"></i>
                                        </button>
                                        <ul id="sale-more-list" class="sale-more-list" aria-hidden="true">
                                        <li data-action="clear"><i class="fa fa-trash" aria-hidden="true"></i><span>Clear order</span></li>
                                        <li data-action="split"><img src="https://img.icons8.com/android/24/e6e6e6/split.png" alt="Split" width="24" height="24"><span>Split Order</span></li>
                                        <li data-action="merge"><i class="fas fa-compress-arrows-alt " aria-hidden="true"></i><span>Merge Order</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="cart-mode-label">
                            <div class="total-row">
                                <button id="cart-mode-btn" class="cart-mode-btn" aria-haspopup="true" aria-expanded="false">
                                    <span class="cart-mode-label-text">Dine in</span>
                                </button>
                                <span id="cart-mode-chevron" class="cart-mode-chevron" tabindex="0" role="button" aria-label="Open cart mode">▾</span>
                                <ul id="cart-mode-list" class="cart-mode-list" aria-hidden="true">
                                    <li data-mode="dinein"><i class="fa fa-utensils" aria-hidden="true"></i><span>Dine in</span></li>
                                    <li data-mode="takeout"><i class="fa fa-shopping-bag" aria-hidden="true"></i><span>Take out</span></li>
                                    <li data-mode="delivery"><i class="fa fa-truck" aria-hidden="true"></i><span>Delivery</span></li>
                                </ul>
                            </div>
                        </div>
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
                            <input type="text" id="amount-received" inputmode="decimal" placeholder="" autocomplete="off">
                            <button type="button" id="amount-clear-btn" class="amount-clear-btn" aria-label="Clear amount">
                                <i class="fa fa-times" aria-hidden="true"></i>
                            </button>
                            <div id="quick-amounts" class="quick-amounts" aria-label="Quick amounts" role="group" style="margin-top:8px;">
                                <button type="button" class="quick-amount" data-amount="50" aria-label="Add 50">50</button>
                                <button type="button" class="quick-amount" data-amount="100" aria-label="Add 100">100</button>
                                <button type="button" class="quick-amount" data-amount="500" aria-label="Add 500">500</button>
                                <button type="button" class="quick-amount" data-amount="1000" aria-label="Add 1000">1000</button>
                            </div>
                        </div>
                        <div class="change-amount">
                            <span>Change:</span>
                            <span id="change">₱0.00</span>
                        </div>
                        <button id="complete-sale-btn" class="complete-sale-btn">Complete Order</button>
                        <button id="open-orders-btn" class="open-orders-btn">Saved Orders</button>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <script src="pos.js"></script>
</body>
</html>
