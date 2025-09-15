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
            <!-- POS Section -->
            <section id="pos-section" class="section active">
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
            
            <!-- Add Product Section -->
            <section id="add-product-section" class="section active">
                <div class="section-header">
                    <h2>Add New Product</h2>
                </div>
                <form id="add-product-form" class="product-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-name">Product Name</label>
                            <input type="text" id="product-name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="product-category">Category</label>
                            <select id="product-category" name="category" required>
                                <option value="">Select Category</option>
                                <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                                <option value="Dairy & Eggs">Dairy & Eggs</option>
                                <option value="Meat & Poultry">Meat & Poultry</option>
                                <option value="Bakery">Bakery</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Snacks">Snacks</option>
                                <option value="Frozen Foods">Frozen Foods</option>
                                <option value="Household">Household</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-price">Price ($)</label>
                            <input type="number" id="product-price" name="price" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label for="product-stock">Initial Stock</label>
                            <input type="number" id="product-stock" name="stock" min="0" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="product-description">Description (Optional)</label>
                        <textarea id="product-description" name="description" rows="3"></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Add Product</button>
                </form>
            </section>

            <!-- Sales Section -->
            <section id="sales-section" class="section active">
                <div class="section-header">
                    <h2>Sales History</h2>
                </div>
                <div class="sales-table-container">
                    <table class="sales-table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Date & Time</th>
                                <th>Products</th>
                                <th>Total Amount</th>
                                <th>Payment Method</th>
                            </tr>
                        </thead>
                        <tbody id="sales-table-body">
                            <!-- Sales data will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
</body>
</html>
