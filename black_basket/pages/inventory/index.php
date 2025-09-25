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
    <link rel="stylesheet" href="../../assets/css/content.css">
    <link rel="stylesheet" href="inventory.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="../../assets/images/icon.webp">
</head>
<body>
    <?php include '../../partials/navigation.php'; ?>
    <?php include '../../partials/header.php'; ?>
    <div class="content-area access-content-area">
        <div class="section-header">
            <h2 class="access-header-title">
                Inventory
                <span class="access-header-breadcrumb">
                    |
                    <i class="fas fa-boxes"></i>
                    - Inventory
                </span>
            </h2>
        </div>

        <div class="tabs">
            <div class="tab first-child active" id="tab-manage-inventory" onclick="showInventoryTab('manage-inventory')">Manage Inventory</div>
        </div>

        <div class="tab-info-bar">
            <span class="tab-info-text" id="tab-info-text">
                Manage your product inventory. Add new products, record waste, import/export data, and filter by categories or stock levels.
            </span>
            <div id="tab-info-actions">
                <button class="btn btn-primary" id="addProductBtn"><i class="fa fa-plus"></i> Add Item</button>
                <button class="btn btn-secondary" id="wasteBtn"><i class="fa fa-trash"></i> Record Waste</button>
                <button class="btn btn-outline" id="importBtn" title="Import"><i class="fa fa-download"></i></button>
                <button class="btn btn-outline" id="exportBtn" title="Export"><i class="fa fa-upload"></i></button>
            </div>
        </div>
                
                <!-- Filter Controls -->
                <div class="inventory-controls" id="inventoryControls" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <!-- Left Side: Search Controls -->
                    <div class="search-controls collapsed" id="searchControls">
                        <!-- Search Icon (visible when collapsed) -->
                        <button class="search-icon-btn" id="searchToggle">
                            <i class="fas fa-search"></i>
                        </button>
                        
                        <!-- Search Box (visible when expanded) -->
                        <div class="search-box">
                            <input type="text" id="search-inventory" placeholder="Search products...">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    
                    <!-- Right Side: Filter Controls -->
                    <div class="filter-controls" id="filterControls">
                        <button class="single-toggle-btn" id="itemTypeToggle" data-current="all">
                            <i class="fas fa-boxes"></i> All Items
                        </button>
                        <select id="categoryFilter">
                            <option value="">All Categories</option>
                            <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                            <option value="Dairy & Eggs">Dairy & Eggs</option>
                            <option value="Meat & Poultry">Meat & Poultry</option>
                            <option value="Bakery">Bakery</option>
                            <option value="Beverages">Beverages</option>
                            <option value="Snacks">Snacks</option>
                            <option value="Frozen Foods">Frozen Foods</option>
                            <option value="Household">Household</option>
                        </select>
                        <select id="stockAlert">
                            <option value="">All Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                            <option value="in">In Stock</option>
                        </select>
                    </div>
                </div>
                <div class="inventory-table-container">
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Cost</th>
                                <th>Margin</th>
                                <th>Stock</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body">
                            <!-- Inventory data will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
        <!-- Add Product Modal (Composite Product Example) -->
<div class="modal" id="productModal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Add Item</h2>
            <span class="close" id="closeModal">&times;</span>
        </div>
        <div class="modal-body">
            <form id="add-product-form" autocomplete="off">
                <input type="hidden" id="productId" name="id">
                <div class="form-row">
                    <div class="form-group">
                        <label for="productName">Item Name</label>
                        <input type="text" id="productName" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="productType">Type</label>
                        <select id="productType" name="type" required>
                            <option value="product">Product (for sale)</option>
                            <option value="item">Inventory Item (stockable)</option>
                        </select>
                    </div>
                </div>
                <div class="form-row" id="variantRow" style="display:none;">
                    <div class="form-group" style="flex:2;">
                        <label>Components / Variants</label>
                        <div id="componentsList"></div>
                        <button type="button" id="addComponentBtn" class="btn btn-secondary" style="margin-top:8px;">Add Component</button>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productStock">Quantity</label>
                        <input type="number" id="productStock" name="stock" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="productPrice">Price</label>
                        <input type="number" id="productPrice" name="price" min="0" step="0.01" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" id="saveProductBtn">Save</button>
                    <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                </div>
            </form>
        </div>
    </div>
        </div>
    </div>

<script>
function showInventoryTab(tab) {
    // For now, only one tab, but structure is ready for more
    document.getElementById('tab-manage-inventory').classList.add('active');
}

// Check if inventory has items and toggle controls/table visibility
function checkInventoryAndToggleControls() {
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventoryControls = document.getElementById('inventoryControls');
    const inventoryTableContainer = document.querySelector('.inventory-table-container');
    const hasItems = inventoryTableBody && inventoryTableBody.children.length > 0;
    
    if (inventoryControls) {
        inventoryControls.style.display = hasItems ? 'flex' : 'none';
    }
    
    if (inventoryTableContainer) {
        inventoryTableContainer.style.display = hasItems ? 'block' : 'none';
    }
}

// Search toggle and item type toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('itemTypeToggle');
    const searchToggle = document.getElementById('searchToggle');
    const searchControls = document.getElementById('searchControls');
    const filterControls = document.getElementById('filterControls');
    const searchInput = document.getElementById('search-inventory');
    
    // Check inventory on page load
    checkInventoryAndToggleControls();
    
    // Observer to watch for changes in inventory table
    const inventoryTableBody = document.getElementById('inventory-table-body');
    if (inventoryTableBody) {
        const observer = new MutationObserver(function() {
            checkInventoryAndToggleControls();
        });
        observer.observe(inventoryTableBody, { childList: true, subtree: true });
    }
    
    // Search toggle functionality (only for mobile devices)
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    searchToggle.addEventListener('click', function() {
        if (isMobile()) {
            searchControls.classList.remove('collapsed');
            searchControls.classList.add('expanded');
            filterControls.style.display = 'none';
            setTimeout(() => {
                searchInput.focus();
            }, 100);
        }
    });
    
    // Click outside or press escape to collapse search (mobile only)
    document.addEventListener('click', function(e) {
        if (isMobile() && !searchControls.contains(e.target)) {
            searchControls.classList.remove('expanded');
            searchControls.classList.add('collapsed');
            filterControls.style.display = 'flex';
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (isMobile() && e.key === 'Escape') {
            searchControls.classList.remove('expanded');
            searchControls.classList.add('collapsed');
            filterControls.style.display = 'flex';
        }
    });
    
    // Reset on window resize
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            searchControls.classList.remove('expanded');
            searchControls.classList.add('collapsed');
            filterControls.style.display = 'flex';
        }
    });
    
    // Single toggle button functionality
    const states = [
        { key: 'all', label: 'All Items', icon: 'fas fa-boxes' },
        { key: 'pos', label: 'POS Items', icon: 'fas fa-cash-register' },
        { key: 'stock', label: 'Stock Items', icon: 'fas fa-warehouse' }
    ];
    
    toggleButton.addEventListener('click', function() {
        const currentState = this.getAttribute('data-current');
        const currentIndex = states.findIndex(state => state.key === currentState);
        const nextIndex = (currentIndex + 1) % states.length;
        const nextState = states[nextIndex];
        
        // Update button
        this.setAttribute('data-current', nextState.key);
        this.innerHTML = `<i class="${nextState.icon}"></i> ${nextState.label}`;
        
        // Log the selected type
        console.log('Selected item type:', nextState.key);
        
        // TODO: Add filtering logic for inventory table
        // filterInventoryByType(nextState.key);
    });
});
</script>
<script src="inventory.js"></script>
</body>
</html>

