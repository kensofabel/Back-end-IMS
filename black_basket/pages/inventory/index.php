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
            </div>
</body>
</html>
