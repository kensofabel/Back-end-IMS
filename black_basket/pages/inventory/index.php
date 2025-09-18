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
            <!-- Inventory Section -->
            <section id="inventory-section" class="section active">
                <div class="section-header">
                    <h2>Inventory Management</h2>
                    <div class="search-box">
                        <input type="text" id="search-inventory" placeholder="Search products...">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
                <div class="inventory-table-container">
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body">
                            <!-- Inventory data will be populated by JavaScript -->
                        </tbody>
                    </table>
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
        </div>
    <script src="inventory.js"></script>
</body>
</html>
