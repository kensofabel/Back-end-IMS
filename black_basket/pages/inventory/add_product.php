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
    <title>Add Product - Inventory Management System</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="../../assets/css/content.css">
    <link rel="stylesheet" href="inventory.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
    <div class="content-area accounts-content-area">
        <div class="section-header">
            <button class="go-back-btn" onclick="goBack()">
                <i class="fas fa-arrow-left"></i> Go Back
            </button>
            <h2 class="accounts-header-title">
                Add Product
                <span class="accounts-header-breadcrumb">
                    |
                    <i class="fas fa-plus"></i>
                    - Add New Product
                </span>
            </h2>
        </div>

        <div class="add-product-container">
            <div class="product-form">
                <form id="addProductForm" method="POST" action="api.php">
                    <div class="form-group">
                        <input type="text" id="productName" name="productName" required>
                        <label for="productName">Product Name</label>
                    </div>
                    
                    <div class="form-group">
                        <select id="productCategory" name="productCategory" required>
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
                        <label for="productCategory">Category</label>
                    </div>
                    
                    <div class="form-group">
                        <input type="text" id="productBarcode" name="productBarcode">
                        <label for="productBarcode">Barcode</label>
                    </div>
                    
                    <div class="form-group">
                        <input type="text" id="productSKU" name="productSKU">
                        <label for="productSKU">SKU</label>
                    </div>
                    
                    <div class="form-group">
                        <input type="number" id="productPrice" name="productPrice" step="0.01" min="0" required>
                        <label for="productPrice">Unit Price ($)</label>
                    </div>
                    
                    <div class="form-group">
                        <input type="number" id="productCost" name="productCost" step="0.01" min="0">
                        <label for="productCost">Unit Cost ($)</label>
                    </div>
                    
                    <div class="form-group">
                        <input type="number" id="productQuantity" name="productQuantity" min="0" required>
                        <label for="productQuantity">Initial Stock Quantity</label>
                    </div>
                    
                    <div class="form-group">
                        <input type="number" id="minStockLevel" name="minStockLevel" min="0">
                        <label for="minStockLevel">Minimum Stock Level</label>
                    </div>
                    
                    <div class="form-group checkbox-group">
                        <input type="checkbox" id="availableInPOS" name="availableInPOS" class="field-checkbox">
                        <label for="availableInPOS" class="checkbox-label">Available in POS</label>
                    </div>
                    
                    <div id="representationSection" class="representation-section" style="display:none;">
                        <div class="form-group">
                            <label class="section-label">Representation:</label>
                            <div class="radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="representation" value="color-shape" checked>
                                    <span class="radio-text">Color and shape</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="representation" value="image">
                                    <span class="radio-text">Image</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="goBack()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        // Go back function
        function goBack() {
            window.location.href = 'index.php';
        }
        
        // Available in POS checkbox functionality and URL parameter handling
        document.addEventListener('DOMContentLoaded', function() {
            const availableInPOSCheckbox = document.getElementById('availableInPOS');
            const representationSection = document.getElementById('representationSection');
            
            if (availableInPOSCheckbox && representationSection) {
                availableInPOSCheckbox.addEventListener('change', function() {
                    if (this.checked) {
                        representationSection.style.display = 'block';
                    } else {
                        representationSection.style.display = 'none';
                    }
                });
            }
            
            // Handle URL parameters for barcode and SKU
            const urlParams = new URLSearchParams(window.location.search);
            const barcode = urlParams.get('barcode');
            const sku = urlParams.get('sku');
            
            if (barcode) {
                document.getElementById('productBarcode').value = barcode;
            }
            if (sku) {
                document.getElementById('productSKU').value = sku;
            }
            
            // Form submission handler
            const addProductForm = document.getElementById('addProductForm');
            if (addProductForm) {
                addProductForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // Get form data
                    const formData = new FormData(this);
                    formData.append('action', 'add_product');
                    
                    // Submit form
                    fetch('api.php', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Product added successfully!');
                            window.location.href = 'index.php';
                        } else {
                            alert('Error adding product: ' + (data.message || 'Unknown error'));
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Error adding product. Please try again.');
                    });
                });
            }
        });
    </script>
</body>
</html>