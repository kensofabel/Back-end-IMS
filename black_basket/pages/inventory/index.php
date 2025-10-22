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
    <div class="content-area accounts-content-area">
        <div class="section-header">
            <h2 class="accounts-header-title">
                Inventory
                <span class="accounts-header-breadcrumb">
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
                <!-- Import Button and File Input -->
                <form id="importForm" action="import_inventory.php" method="post" enctype="multipart/form-data" style="display:inline;">
                    <input type="file" name="import_file" id="importFile" accept=".csv" style="display:none;">
                    <button type="button" class="btn btn-outline" id="importBtn" title="Import" onclick="document.getElementById('importFile').click();"><i class="fa fa-download"></i></button>
                </form>
                <!-- Export Button -->
                <form id="exportForm" action="export_inventory.php" method="get" style="display:inline;">
                    <button type="submit" class="btn btn-outline" id="exportBtn" title="Export"><i class="fa fa-upload"></i></button>
                </form>
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
                    <table class="inventory-table" id="inventory-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Cost</th>
                                <th>Margin</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body">
                            <!-- Inventory data will be populated by JavaScript -->
                        </tbody>
                    </table>
                    <div class="inventory-pagination-bar dark-theme-pagination" style="display:flex;align-items:center;justify-content:flex-start;gap:12px;padding:8px 16px 8px 16px;margin-top:18px;background:#181818;border-radius:7px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                        <button class="pagination-btn pagination-prev" disabled title="Previous page" style="background:#232323;border:none;color:#fff;padding:5px 10px;border-radius:4px;font-size:1rem;transition:background 0.2s;">&#60;</button>
                        <button class="pagination-btn pagination-next" disabled title="Next page" style="background:#232323;border:none;color:#fff;padding:5px 10px;border-radius:4px;font-size:1rem;transition:background 0.2s;">&#62;</button>
                        <span style="color:#fff;font-size:1rem;margin-left:8px;">Page</span>
                        <input type="number" class="pagination-page-input" min="1" value="1" style="width:36px;text-align:center;padding:3px 0;border:1px solid #222;border-radius:4px;font-size:1rem;margin:0 4px;background:#232323;color:#fff;" />
                        <span style="color:#fff;font-size:1rem;">of</span>
                        <span class="pagination-total-pages" style="color:#fff;font-size:1rem;margin:0 4px;">1</span>
                        <span style="color:#fff;font-size:1rem;margin-left:12px;">Rows per page:</span>
                        <select class="pagination-rows-select" style="padding:3px 8px;border-radius:4px;border:1px solid #444;font-size:1rem;margin-left:4px;background:#232323;color:#fff;">
                            <option value="10" selected>10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
    <!-- Close main content area -->
    </div>

<!-- Scanner/Manual Modal (moved outside content area) -->
<div class="modal" id="scannerModal">
    <div class="modal-content scanner-modal">
        <div class="modal-header">
            <h2>Add Item</h2>
            <!-- Tab Style Navigation -->
            <button class="scanner-tab active" id="scanTab">SCAN</button>
            <button class="scanner-tab" id="manualTab">MANUAL</button>
            <span class="close" id="closeScanner">&times;</span>
        </div>
        <div class="modal-body">
            
            <!-- Scanner Mode -->
            <div id="scannerMode" class="mode-content">
                <!-- Camera Scanner -->
                <div id="cameraScanner" class="scanner-section">
                    <div class="camera-container">
                        <video id="cameraVideo" autoplay playsinline></video>
                        <div class="scanner-overlay">
                            <div class="scanner-line"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Hardware Scanner -->
                <div id="hardwareScanner" class="scanner-section" style="display:none;">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <h3>SCANNING VIA SCANNER...</h3>
                    </div>
                </div>
            </div>
            
            <!-- Manual Mode -->
            <div id="manualMode" class="mode-content" style="display:none;">
                <div class="manual-form">
                    <div class="form-description">
                        <p>Enter the product's barcode or SKU to identify the item you want to add to inventory.</p>
                    </div>
                    <div class="form-group checkbox-group">
                        <input type="checkbox" id="enableBarcode" class="field-checkbox">
                        <input type="text" id="manualBarcode" required>
                        <label for="manualBarcode">Barcode</label>
                    </div>
                    <div class="form-group checkbox-group">
                        <input type="checkbox" id="enableSKU" class="field-checkbox">
                        <input type="text" id="manualSKU" required>
                        <label for="manualSKU">SKU</label>
                    </div>
                    <button class="btn btn-primary" id="nextBtn">Next</button>
                </div>
            </div>

            
            <!-- Product Form Mode -->
            <div id="formMode" class="mode-content" style="display:none;">
                <div class="form-header">
                    <button class="go-back-btn" id="goBackBtn">
                        <i class="fas fa-arrow-left"></i> Go Back
                    </button>
                </div>
                <div class="product-form">
                    <div class="form-group">
                        <input type="text" id="productName" required>
                        <label for="productName">Name</label>
                    </div>
                    <div class="form-group">
                        <select id="productCategory" required>
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
                    <div class="form-group checkbox-group">
                        <input type="checkbox" id="trackStock" class="field-checkbox">
                        <label for="trackStock" class="checkbox-label">Track Stock</label>
                    </div>
                    <div id="stockSection" class="stock-section" style="display:none;">
                        <div class="form-group">
                            <input type="number" id="inStock" min="0">
                            <label for="inStock">In Stock</label>
                        </div>
                        <div class="form-group">
                            <input type="number" id="lowStock" min="0">
                            <label for="lowStock">Low Stock Alert</label>
                        </div>
                    </div>
                    <div class="form-group checkbox-group">
                        <input type="checkbox" id="availableInPOS" class="field-checkbox">
                        <label for="availableInPOS" class="checkbox-label">Available in POS</label>
                    </div>
                    <button class="btn btn-primary" id="saveProductBtn">Save Product</button>
                </div>
            </div>
            
            <!-- Skip Option -->
            <div class="skip-section">
                <button class="skip-btn" id="skipBtn">Skip for now</button>
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

