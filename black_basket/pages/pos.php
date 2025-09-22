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
    <link rel="stylesheet" href="../assets/css/style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="https://github.com/kensofabel/B2-IMS/blob/main/Inventory%20Management%20System-20250829T034006Z-1-001/Inventory%20Management%20System/Gemini_Generated_Image_lup4cylup4cylup4__1_-removebg-preview.png?raw=true">
</head>
<body>
    <?php include '../partials/navigation.php'; ?>
    <?php include '../partials/header.php'; ?>
            <!-- Content Area -->
            <div class="content-area">
             <!-- POS Section -->
                <section id="pos-section" class="section">
                    <div class="section-header">
                        <h2>Point of Sale</h2>
                        <div class="search-box">
                            <input type="text" id="pos-search" placeholder="Search products...">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    <div class="pos-content">
                        <div class="product-grid" id="product-grid">
                            <!-- Products will be populated by JavaScript -->
                        </div>
                        <div class="cart-section">
                            <h3>Cart</h3>
                            <div id="cart-items" class="cart-items">
                                <!-- Cart items will be populated by JavaScript -->
                            </div>
                            <div class="cart-summary">
                                <div class="summary-row">
                                    <span>Subtotal:</span>
                                    <span id="subtotal">$0.00</span>
                                </div>
                                <div class="summary-row">
                                    <span>Tax:</span>
                                    <span id="tax">$0.00</span>
                                </div>
                                <div class="summary-row total">
                                    <span>Total:</span>
                                    <span id="total">$0.00</span>
                                </div>
                            </div>
                            <div class="payment-buttons">
                                <button class="btn btn-primary" onclick="posSystem.processPayment('Cash')">Cash</button>
                                <button class="btn btn-primary" onclick="posSystem.processPayment('Card')">Card</button>
                                <button class="btn btn-secondary" onclick="posSystem.clearCart()">Clear Cart</button>
                            </div>
                        </div>
                    </div>
                </section>
                
            </div>
        </div>
    </div>
</body>
</html>
