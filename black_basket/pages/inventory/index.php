<?php
session_start();
require_once '../../scripts/create_default_category.php'; // Include the default category creation
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}
// Ensure default category exists for this user
createDefaultCategory($_SESSION['user_id']);
?>

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
    <!-- Modal include -->
    <?php include 'popupmodal.php'; ?>
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
                                <?php
                                // Fetch categories from database
                                require_once '../../config/db.php';
                                $categories = [];
                                $catSql = "SELECT id, name FROM categories ORDER BY name ASC";
                                if ($result = $conn->query($catSql)) {
                                    while ($row = $result->fetch_assoc()) {
                                        $categories[$row['id']] = $row['name'];
                                        $safeName = htmlspecialchars($row['name'], ENT_QUOTES, 'UTF-8');
                                        echo "<option value=\"" . $safeName . "\">" . $safeName . "</option>\n";
                                    }
                                    $result->free();
                                }
                                ?>
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
                                <th style="width:40px; text-align:center;">
                                    <label class="permission-checkbox table-checkbox" style="margin-left: 20px;">
                                        <input type="checkbox" id="selectAllItems" title="Select all" />
                                        <span class="checkmark"></span>
                                    </label>
                                </th>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Cost</th>
                                <th>Margin</th>
                                <th>Stock</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body">
                            <?php
                            // Query products and their variants. We'll display variants as separate rows and products without variants as single rows.
                            $prodSql = "SELECT p.id AS product_id, p.name AS product_name, p.price AS product_price, p.cost AS product_cost, p.in_stock AS product_stock, p.low_stock AS low_stock, p.pos_available, p.track_stock AS track_stock, p.category_id, p.type, p.color, p.shape, p.image_url
                                        FROM products p ORDER BY p.name ASC";

                            if ($prodResult = $conn->query($prodSql)) {
                                while ($p = $prodResult->fetch_assoc()) {
                                    // Fetch variants for this product
                                    $variants = [];
                                    $vSql = "SELECT id, name, sku, barcode, price, cost, in_stock, low_stock, pos_available FROM product_variants WHERE product_id = " . (int)$p['product_id'] . " ORDER BY name ASC";
                                    if ($vResult = $conn->query($vSql)) {
                                        while ($v = $vResult->fetch_assoc()) {
                                            $variants[] = $v;
                                        }
                                        $vResult->free();
                                    }

                                    // If there are variants, show each
                                    if (!empty($variants)) {
                                        // Render a parent product row for products that have variants.
                                        // Variant rows will follow and are hidden by default; they
                                        // can be toggled open by the chevron button rendered here.
                                        $parentName = htmlspecialchars($p['product_name'], ENT_QUOTES, 'UTF-8');
                                        $categoryName = isset($categories[$p['category_id']]) ? htmlspecialchars($categories[$p['category_id']], ENT_QUOTES, 'UTF-8') : '';
                                        $pPrice = $p['product_price'];
                                        $pCost = $p['product_cost'];
                                        $pIsPriceNumeric = is_numeric($pPrice);
                                        $pIsCostNumeric = is_numeric($pCost);
                                        $parentDisplayPrice = $pIsPriceNumeric ? '₱' . number_format((float)$pPrice, 2) : htmlspecialchars((string)$pPrice, ENT_QUOTES, 'UTF-8');
                                        $parentDisplayCost = $pIsCostNumeric ? '₱' . number_format((float)$pCost, 2) : htmlspecialchars((string)$pCost, ENT_QUOTES, 'UTF-8');
                                        if ($pIsPriceNumeric && $pIsCostNumeric && (float)$pPrice != 0.0) {
                                            $parentMargin = round((((float)$pPrice - (float)$pCost) / (float)$pPrice) * 100, 2);
                                        } else {
                                            $parentMargin = '-';
                                        }
                                        // Compute parent stock as the sum of its variants' stock.
                                        $totalVariantStock = 0;
                                        foreach ($variants as $vv) {
                                            $totalVariantStock += (int) ($vv['in_stock'] ?? 0);
                                        }
                                        $parentStock = $totalVariantStock;
                                        $parentLowThreshold = (int) ($p['low_stock'] ?? 0);
                                        // determine stock status for parent row (out/low/in)
                                        if ($parentStock === 0) {
                                            $parentStockStatus = 'out';
                                            $parentLowFlag = '';
                                        } elseif ($parentStock <= $parentLowThreshold && $parentLowThreshold > 0) {
                                            $parentStockStatus = 'low';
                                            $parentLowFlag = 'low';
                                        } else {
                                            $parentStockStatus = 'in';
                                            $parentLowFlag = '';
                                        }

                                        $catIdAttr = isset($p['category_id']) && $p['category_id'] ? (int)$p['category_id'] : '';

                                        // Parent row: includes a chevron toggle (structure only)
                                        // Add data-stock and data-low attributes so parent rows are filterable by stock
                                        echo "<tr class='parent-row' data-product-id='" . (int)$p['product_id'] . "' data-category=\"" . $categoryName . "\" data-category-id=\"" . $catIdAttr . "\" data-stock=\"" . $parentStockStatus . "\" data-low=\"" . $parentLowFlag . "\">";
                                        echo "<td style=\"text-align:center;\">";
                                        // Chevron toggle (will be wired by JS). Keep accessible label.
                                        // Chevron button placed before the checkbox but will be
                                        // absolutely positioned via CSS so it doesn't affect layout
                                        // and the checkbox stays centered.
                                        echo "<button type='button' class='variant-toggle' data-product-id='" . (int)$p['product_id'] . "' aria-expanded='false' title='Show variants' style='background:transparent;border:none;cursor:pointer;padding:4px;'>";
                                        echo "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
                                        echo "</button>";
                                        echo "<label class='permission-checkbox table-checkbox' style='margin-left: 10px;display:inline-flex;justify-content:center;'>";
                                        echo "<input type='checkbox' class='row-select-checkbox' />";
                                        echo "<span class='checkmark'></span>";
                                        echo "</label>";
                                        echo "</td>";
                                        echo "<td>" . $parentName . "</td>";
                                        // Parent category editable dropdown (match variant rows behavior)
                                        echo "<td>";
                                        echo "<select class='category-select' data-product-id='" . (int)$p['product_id'] . "'>";
                                        foreach ($categories as $cid => $cname) {
                                            $safeName = htmlspecialchars($cname, ENT_QUOTES, 'UTF-8');
                                            $selected = ($cid == $p['category_id']) ? ' selected' : '';
                                            echo "<option value=\"" . (int)$cid . "\"" . $selected . ">" . $safeName . "</option>\n";
                                        }
                                        echo "</select>";
                                        echo "</td>";
                                        // Parent rows should not show price/cost/margin values.
                                        // Output empty placeholder TDs to preserve table column alignment.
                                        echo "<td class='parent-price-cell'></td>";
                                        echo "<td class='parent-cost-cell'></td>";
                                        echo "<td class='parent-margin-cell'></td>";
                                        echo "<td>" . $parentStock . "</td>";
                                        echo "</tr>\n";

                                        // Now render each variant as a hidden row tied to the parent product.
                                        foreach ($variants as $v) {
                                            // Show only the variant's own name (do not prefix with parent product name)
                                            $itemName = htmlspecialchars($v['name'], ENT_QUOTES, 'UTF-8');
                                            $price = is_null($v['price']) || $v['price'] === '' ? ($p['product_price'] ?? '') : $v['price'];
                                            $cost = is_null($v['cost']) || $v['cost'] === '' ? ($p['product_cost'] ?? '') : $v['cost'];
                                            $stock = (int)$v['in_stock'];
                                            $low = (int) ($v['low_stock'] ?? 0);
                                            $isPriceNumeric = is_numeric($price);
                                            $isCostNumeric = is_numeric($cost);
                                            if ($isPriceNumeric) {
                                                $displayPrice = '₱' . number_format((float)$price, 2);
                                            } else {
                                                $rawPrice = trim((string)$price);
                                                if (strcasecmp($rawPrice, 'variable') === 0) {
                                                    $displayPrice = 'Variable';
                                                } else {
                                                    $displayPrice = htmlspecialchars($rawPrice, ENT_QUOTES, 'UTF-8');
                                                }
                                            }
                                            $displayCost = $isCostNumeric ? '₱' . number_format((float)$cost, 2) : htmlspecialchars((string)$cost, ENT_QUOTES, 'UTF-8');
                                            if ($isPriceNumeric && $isCostNumeric && (float)$price != 0.0) {
                                                $margin = round((((float)$price - (float)$cost) / (float)$price) * 100, 2);
                                            } else {
                                                $margin = '-';
                                            }
                                            if ($stock === 0) {
                                                $stockStatus = 'out';
                                            } elseif ($stock <= $low) {
                                                $stockStatus = 'low';
                                            } else {
                                                $stockStatus = 'in';
                                            }
                                            $posAttr = isset($v['pos_available']) && $v['pos_available'] ? '1' : '0';
                                            $trackAttr = isset($p['track_stock']) && $p['track_stock'] ? '1' : '0';

                                            echo "<tr class='variant-row' data-parent-id='" . (int)$p['product_id'] . "' style='display:none;' data-category=\"" . $categoryName . "\" data-category-id=\"" . $catIdAttr . "\" data-stock=\"" . $stockStatus . "\" data-low=\"" . ($stockStatus === 'low' ? 'low' : '') . "\" data-pos=\"" . $posAttr . "\" data-track=\"" . $trackAttr . "\">";
                                            // Variant rows are not selectable; output an empty cell to
                                            // preserve table alignment. Add a class for future styling.
                                            echo "<td class='variant-checkbox-cell' style=\"text-align:center;\">&nbsp;</td>";
                                            echo "<td>" . $itemName . "</td>";
                                            // For variant rows we do not show the category selector UI.
                                            // Output an empty TD (keeps table alignment) and add a
                                            // class so CSS can target it if you later want to hide/adjust it.
                                            echo "<td class='variant-category-cell'></td>";
                                            echo "<td>" . $displayPrice . "</td>";
                                            echo "<td>" . $displayCost . "</td>";
                                            echo "<td>" . ($margin === '-' ? $margin : $margin . "%") . "</td>";
                                            echo "<td>" . $stock . "</td>";
                                            if ($stockStatus === 'low') {
                                                echo "<td class='stock-indicator-cell'><span class='low-stock-badge'>Low stock</span></td>";
                                            }
                                            echo "</tr>\n";
                                        }
                                    } else {
                                        // No variants: show product row
                                        $itemName = htmlspecialchars($p['product_name'], ENT_QUOTES, 'UTF-8');
                                        $categoryName = isset($categories[$p['category_id']]) ? htmlspecialchars($categories[$p['category_id']], ENT_QUOTES, 'UTF-8') : '';
                                        // Preserve textual values like 'variable'. Compute margin only when numeric.
                                        $stock = (int)$p['product_stock'];
                                        $low = (int) ($p['low_stock'] ?? 0);
                                        $isPriceNumeric = is_numeric($p['product_price']);
                                        $isCostNumeric = is_numeric($p['product_cost']);
                                        if ($isPriceNumeric) {
                                            $displayPrice = '₱' . number_format((float)$p['product_price'], 2);
                                        } else {
                                            $rawPrice = trim((string)$p['product_price']);
                                            if (strcasecmp($rawPrice, 'variable') === 0) {
                                                $displayPrice = 'Variable';
                                            } else {
                                                $displayPrice = htmlspecialchars($rawPrice, ENT_QUOTES, 'UTF-8');
                                            }
                                        }
                                        $displayCost = $isCostNumeric ? '₱' . number_format((float)$p['product_cost'], 2) : htmlspecialchars((string)$p['product_cost'], ENT_QUOTES, 'UTF-8');
                                        if ($isPriceNumeric && $isCostNumeric && (float)$p['product_price'] != 0.0) {
                                            $margin = round((((float)$p['product_price'] - (float)$p['product_cost']) / (float)$p['product_price']) * 100, 2);
                                        } else {
                                            $margin = '-';
                                        }
                                        if ($stock === 0) {
                                            $stockStatus = 'out';
                                        } elseif ($stock <= $low) {
                                            $stockStatus = 'low';
                                        } else {
                                            $stockStatus = 'in';
                                        }
                                        $posAttr = isset($p['pos_available']) && $p['pos_available'] ? '1' : '0';
                                        $trackAttr = isset($p['track_stock']) && $p['track_stock'] ? '1' : '0';
                                        $catIdAttr = isset($p['category_id']) && $p['category_id'] ? (int)$p['category_id'] : '';
                                        echo "<tr data-category=\"" . $categoryName . "\" data-category-id=\"" . $catIdAttr . "\" data-stock=\"" . $stockStatus . "\" data-low=\"" . ($stockStatus === 'low' ? 'low' : '') . "\" data-pos=\"" . $posAttr . "\" data-track=\"" . $trackAttr . "\">";
                                        echo "<td style=\"text-align:center;\">";
                                        echo "<label class='permission-checkbox table-checkbox' style='margin-left: 10px;display:inline-flex;justify-content:center;'>";
                                        echo "<input type='checkbox' class='row-select-checkbox' />";
                                        echo "<span class='checkmark'></span>";
                                        echo "</label>";
                                        echo "</td>";
                                        echo "<td>" . $itemName . "</td>";
                                        // Category dropdown (editable)
                                        echo "<td>";
                                        echo "<select class='category-select' data-product-id='" . (int)$p['product_id'] . "'>";
                                        foreach ($categories as $cid => $cname) {
                                            $safeName = htmlspecialchars($cname, ENT_QUOTES, 'UTF-8');
                                            $selected = ($cid == $p['category_id']) ? ' selected' : '';
                                            echo "<option value=\"" . (int)$cid . "\"" . $selected . ">" . $safeName . "</option>\n";
                                        }
                                        echo "</select>";
                                        echo "</td>";
                                        echo "<td>" . $displayPrice . "</td>";
                                        echo "<td>" . $displayCost . "</td>";
                                        echo "<td>" . ($margin === '-' ? $margin : $margin . "%") . "</td>";
                                        // Stock number cell (keeps numeric alignment)
                                        echo "<td>" . $stock . "</td>";
                                        // Only output an extra indicator cell when this row is low; otherwise
                                        // do not output an extra td (we'll manage indicator column dynamically in JS)
                                        if ($stockStatus === 'low') {
                                            echo "<td class='stock-indicator-cell'><span class='low-stock-badge'>Low stock</span></td>";
                                        }
                                        echo "</tr>\n";
                                    }
                                }
                                $prodResult->free();
                            }
                            ?>
                        </tbody>
                    </table>
                    <div class="inventory-pagination-bar dark-theme-pagination" style="display:flex;align-items:center;justify-content:flex-start;gap:10px;padding:12px 16px;margin-top:0;background:#181818;border-top:1px solid #333;border-bottom-left-radius:12px;border-bottom-right-radius:12px;">
                        <button class="pagination-btn pagination-prev" disabled title="Previous page" style="background:#232323;border:none;color:#fff;padding:0 8px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;font-size:0.95rem;transition:background 0.2s; margin-left: 6px;">&#60;</button>
                        <button class="pagination-btn pagination-next" disabled title="Next page" style="background:#232323;border:none;color:#fff;padding:0 8px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;font-size:0.95rem;transition:background 0.2s;">&#62;</button>
                        <span style="color:#fff;font-size:0.95rem;margin-left:6px;">Page</span>
                        <input type="number" class="pagination-page-input" min="1" value="1" style="width:44px;text-align:center;padding:0 6px;border:1px solid #222;border-radius:4px;font-size:0.95rem;margin:0 6px;background:#232323;color:#fff;height:32px;" />
                        <span style="color:#fff;font-size:1rem;">of</span>
                        <span class="pagination-total-pages" style="color:#fff;font-size:0.95rem;margin:0 6px;">1</span>
                        <span style="color:#fff;font-size:0.95rem;margin-left:10px;">Rows per page:</span>
                        <select class="pagination-rows-select" style="padding:4px 8px;border-radius:4px;border:1px solid #444;font-size:0.95rem;margin-left:8px;background:#232323;color:#fff;height:32px;">
                            <option value="10" selected>10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
    </div>
</body>
</html>
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
    // Cleanup any leftover portal clones from previous runs (dev hot-reload or errors)
    try {
        document.querySelectorAll('.category-menu-portal').forEach(c => c.remove());
        document.querySelectorAll('.category-menu').forEach(m => { if (m.dataset && m.dataset.hidden) { m.style.display = ''; delete m.dataset.hidden; } });
    } catch (e) { /* ignore */ }
    // Connect Add Item button to modal
    var addProductBtn = document.getElementById('addProductBtn');
    var scannerModal = document.getElementById('scannerModal');
    if (addProductBtn && scannerModal) {
        addProductBtn.addEventListener('click', function() {
            // Open modal but do not force a specific tab so we preserve previous state
            scannerModal.style.display = 'block';
            // If the modal tab logic is loaded, restore the last active tab (currentTab) when available.
            // Fallback to 'scan' only if the tab state isn't defined yet.
            if (typeof showTab === 'function') {
                try {
                    var tabToShow = (typeof currentTab !== 'undefined' && currentTab) ? currentTab : 'sWcan';
                    showTab(tabToShow, false);
                } catch (e) {
                    // Fallback: show scan tab
                    showTab('scan', false);
                }
            }
            // Start scanner/camera only if the scan panel is actually visible
            var scanPanel = document.getElementById('scanTabPanel');
            if (scanPanel && scanPanel.style.display !== 'none') {
                if (typeof startQuaggaScanner === 'function') {
                    startQuaggaScanner();
                }
            }
        });
    }

    const toggleButton = document.getElementById('itemTypeToggle');
    const searchToggle = document.getElementById('searchToggle');
    const searchControls = document.getElementById('searchControls');
    const filterControls = document.getElementById('filterControls');
    const searchInput = document.getElementById('search-inventory');

    // Check inventory on page load                             
    checkInventoryAndToggleControls();

    // Observer to watch for changes in inventory table
    const inventoryTableBodyObserverEl = document.getElementById('inventory-table-body');
    if (inventoryTableBodyObserverEl) {
        const observer = new MutationObserver(function() {
            checkInventoryAndToggleControls();
        });
        observer.observe(inventoryTableBodyObserverEl, { childList: true, subtree: true });
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

        // Re-run filters so the new state is applied
        filterRows();
    });

    // Client-side filtering: category, stock status, search and pagination
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter = document.getElementById('stockAlert');

    // Pagination elements and state
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventoryTable = document.querySelector('.inventory-table');
    const paginationBar = document.querySelector('.inventory-pagination-bar');
    const pageInput = paginationBar ? paginationBar.querySelector('.pagination-page-input') : null;
    const totalSpan = paginationBar ? paginationBar.querySelector('.pagination-total-pages') : null;
    const prevBtn = paginationBar ? paginationBar.querySelector('.pagination-prev') : null;
    const paginationNextBtn = paginationBar ? paginationBar.querySelector('.pagination-next') : null;
    const rowsSelect = paginationBar ? paginationBar.querySelector('.pagination-rows-select') : null;
    let rowsPerPage = rowsSelect ? parseInt(rowsSelect.value, 10) || 10 : 10;
    let currentPage = 1;
    // Sorting state: key can be 'name','category','price','cost','margin','stock'
    let sortState = { key: 'name', dir: 1 };
    // Ensure sortable headers are only initialized once (prevents duplicate listeners)
    let headersInitialized = false;

    function filterRows() {
        const rows = Array.from(document.querySelectorAll('#inventory-table-body tr'));
        const catVal = categoryFilter ? categoryFilter.value.trim().toLowerCase() : '';
        const stockVal = stockFilter ? stockFilter.value : '';
        const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const typeState = toggleButton ? toggleButton.getAttribute('data-current') : 'all';

        rows.forEach(row => {
            let show = true;
            const rowCat = (row.getAttribute('data-category') || '').toLowerCase();
            const rowStock = row.getAttribute('data-stock') || '';
            const rowLow = row.getAttribute('data-low') || '';
            const text = row.textContent.toLowerCase();

            if (catVal && rowCat !== catVal) show = false;

            if (stockVal) {
                if (stockVal === 'low' && rowLow !== 'low') show = false;
                if (stockVal === 'out' && rowStock !== 'out') show = false;
                if (stockVal === 'in' && rowStock !== 'in') show = false;
            }

            if (q && !text.includes(q)) show = false;

            // itemTypeToggle enforcement
            if (typeState === 'pos') {
                // show only rows that have data-pos='1'
                if (row.getAttribute('data-pos') !== '1') show = false;
            } else if (typeState === 'stock') {
                // show only rows where product tracks stock (data-track='1') and also must be in stock status
                if (row.getAttribute('data-track') !== '1') show = false;
                if (rowStock !== 'in') show = false;
            }

            // Mark row as filtered or not. We'll let renderTablePage control actual visibility per page.
            if (show) {
                row.removeAttribute('data-filtered');
            } else {
                row.setAttribute('data-filtered', '1');
            }
        });

        // After filtering, run pagination so only the filtered items are paged
        renderTablePage(1);
    }

    if (categoryFilter) categoryFilter.addEventListener('change', filterRows);
    if (stockFilter) stockFilter.addEventListener('change', filterRows);
    if (searchInput) searchInput.addEventListener('input', function() {
        // debounce simple
        clearTimeout(this._filterTimer);
        this._filterTimer = setTimeout(filterRows, 150);
    });

    // Pagination helper: renders only the visible (filtered) rows for the requested page
    function renderTablePage(page) {
        if (!inventoryTableBody) return;
        const allRows = Array.from(inventoryTableBody.querySelectorAll('tr'));
    // Consider only rows that are currently visible by filter (not marked data-filtered)
    const visibleRows = allRows.filter(r => !r.hasAttribute('data-filtered'));
        // Exclude variant rows from pagination counting (they should not affect total pages)
        const visibleNonVariantRows = visibleRows.filter(r => !r.classList.contains('variant-row'));
        // Apply sorting to non-variant rows before paging
        if (sortState && sortState.key) {
            visibleNonVariantRows.sort(function(a, b) {
                function getRowValue(row, key) {
                    if (!row) return '';
                    // name => td:nth-child(2)
                    if (key === 'name') return (row.querySelector('td:nth-child(2)') ? row.querySelector('td:nth-child(2)').textContent.trim().toLowerCase() : '');
                    if (key === 'category') return (row.getAttribute('data-category') || '').toLowerCase();
                    if (key === 'stock') {
                        // stock cell is usually in column 7
                        const t = row.querySelector('td:nth-child(7)');
                        if (t) {
                            const n = parseFloat((t.textContent || '').replace(/[^0-9.-]/g, ''));
                            return isNaN(n) ? -Infinity : n;
                        }
                        return -Infinity;
                    }
                    // price/cost/margin: numeric parsing from their respective columns
                    if (key === 'price') {
                        const t = row.querySelector('td:nth-child(4)');
                        if (t) {
                            const n = parseFloat((t.textContent || '').replace(/[^0-9.-]/g, ''));
                            return isNaN(n) ? Infinity : n; // place non-numeric (Variable) at end
                        }
                        return Infinity;
                    }
                    if (key === 'cost') {
                        const t = row.querySelector('td:nth-child(5)');
                        if (t) {
                            const n = parseFloat((t.textContent || '').replace(/[^0-9.-]/g, ''));
                            return isNaN(n) ? Infinity : n;
                        }
                        return Infinity;
                    }
                    if (key === 'margin') {
                        const t = row.querySelector('td:nth-child(6)');
                        if (t) {
                            const txt = (t.textContent || '').replace('%','').trim();
                            const n = parseFloat(txt.replace(/[^0-9.-]/g, ''));
                            return isNaN(n) ? Infinity : n;
                        }
                        return Infinity;
                    }
                    return '';
                }
                const va = getRowValue(a, sortState.key);
                const vb = getRowValue(b, sortState.key);
                if (typeof va === 'string' && typeof vb === 'string') {
                    return sortState.dir * va.localeCompare(vb);
                } else {
                    return sortState.dir * ( (va === vb) ? 0 : (va < vb ? -1 : 1) );
                }
            });
        }
        const totalPages = Math.max(1, Math.ceil(visibleNonVariantRows.length / rowsPerPage));
        currentPage = Math.max(1, Math.min(page, totalPages));

        // First, hide all rows. We'll re-show only those belonging to the current page.
    allRows.forEach(r => r.style.display = 'none');

        const start = (currentPage - 1) * rowsPerPage;
        const end = currentPage * rowsPerPage;
        // Determine which non-variant rows belong to this page
        const pageRows = visibleNonVariantRows.slice(start, end);

        // Show the non-variant rows for the current page
        pageRows.forEach(row => {
            row.style.display = '';
        });

        // If any of the displayed rows are parent rows and are expanded, show their variant rows
        pageRows.forEach(function(row) {
            if (row.classList && row.classList.contains('parent-row')) {
                const pid = row.getAttribute('data-product-id');
                const parentBtn = inventoryTableBody ? inventoryTableBody.querySelector('.variant-toggle[data-product-id="' + pid + '"]') : null;
                const isExpanded = parentBtn && parentBtn.getAttribute('aria-expanded') === 'true';
                if (isExpanded) {
                    const variantRows = Array.from(inventoryTableBody.querySelectorAll('tr.variant-row[data-parent-id="' + pid + '"]'));
                    variantRows.forEach(function(vr) {
                        // Show only variants that aren't filtered out
                        if (!vr.hasAttribute('data-filtered')) vr.style.display = '';
                    });
                }
            }
        });


    // Initialize sortable headers: make th clickable and show sort indicators
    function initSortableHeaders() {
        if (!inventoryTable) return;
        const headerCells = Array.from(inventoryTable.querySelectorAll('thead th'));
        // mapping column index to sort key (1-based th index)
        const keyMap = {2: 'name', 3: 'category', 4: 'price', 5: 'cost', 6: 'margin', 7: 'stock'};

        headerCells.forEach(function(th, idx) {
            const col = idx + 1;
            const key = keyMap[col];
            if (!key) return; // skip non-sortable columns
            th.classList.add('sortable');
            // append indicator if missing
            let ind = th.querySelector('.sort-indicator');
            if (!ind) {
                ind = document.createElement('span');
                ind.className = 'sort-indicator';
                ind.style.marginLeft = '8px';
                th.appendChild(ind);
            }

            // Avoid adding multiple listeners to the same th
            if (th._sortableInit) return;
            th._sortableInit = true;

            th.addEventListener('click', function() {
                if (sortState.key === key) {
                    sortState.dir = -sortState.dir; // toggle
                } else {
                    sortState.key = key;
                    sortState.dir = 1;
                }
                // update header classes
                headerCells.forEach(function(h, i) {
                    h.classList.remove('sorted-asc','sorted-desc');
                    const k = keyMap[i+1];
                    if (k === sortState.key) h.classList.add(sortState.dir === 1 ? 'sorted-asc' : 'sorted-desc');
                });
                renderTablePage(1);
            });
        });

        // Reflect initial sort state on headers (so the indicator shows on load)
        headerCells.forEach(function(h, i) {
            const k = keyMap[i+1];
            if (k === sortState.key) {
                h.classList.add(sortState.dir === 1 ? 'sorted-asc' : 'sorted-desc');
            }
        });

        headersInitialized = true;
    }

    // call once to wire headers
    initSortableHeaders();
        if (pageInput) pageInput.value = currentPage;
        if (totalSpan) totalSpan.textContent = totalPages;
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (paginationNextBtn) paginationNextBtn.disabled = currentPage === totalPages;
        if (prevBtn) prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
        if (paginationNextBtn) paginationNextBtn.style.cursor = paginationNextBtn.disabled ? 'not-allowed' : 'pointer';
        // Update indicator column (adds/removes header dynamically depending on visible low-stock badges)
        updateIndicatorColumn();
    }

    // Insert or remove the indicator header depending on whether any visible rows
    // on the current page have a low-stock badge. This keeps the DOM light while
    // ensuring the indicator only appears when necessary (per your request).
    function updateIndicatorColumn() {
        const theadRow = document.querySelector('.inventory-table thead tr');
        if (!theadRow) return;

        // Find visible rows on current page
        const allRows = Array.from(inventoryTableBody ? inventoryTableBody.querySelectorAll('tr') : []);
        const visibleRows = allRows.filter(r => r.style.display !== 'none');

        const hasVisibleBadge = visibleRows.some(r => (r.getAttribute('data-low') || '') === 'low');
        const headerExists = !!theadRow.querySelector('th.stock-indicator-header');

        if (hasVisibleBadge && !headerExists) {
            // Create header cell and insert after the Stock header (7th th)
            const th = document.createElement('th');
            th.className = 'stock-indicator-header';
            th.style.width = '110px';
            th.style.textAlign = 'left';
            th.style.paddingLeft = '0px';
            th.innerHTML = '&nbsp;';
            // Try to insert after 7th header if possible
            const headers = Array.from(theadRow.children);
            if (headers.length >= 7) {
                const after = headers[6].nextSibling; // index 6 is the 7th th
                theadRow.insertBefore(th, after);
            } else {
                theadRow.appendChild(th);
            }
        }

        if (hasVisibleBadge) {
            // Ensure each visible row has an indicator cell. Server emits the
            // indicator TD only for low rows; here we add empty indicator TDs
            // to non-low rows so all rows on the page have the same column count.
            visibleRows.forEach(row => {
                if (!row.querySelector('td.stock-indicator-cell')) {
                    const td = document.createElement('td');
                    td.className = 'stock-indicator-cell';
                    // prefer CSS but set a safe inline fallback to left-align and pad
                    td.style.textAlign = 'left';
                    td.style.paddingLeft = '8px';
                    td.style.whiteSpace = 'nowrap';
                    td.innerHTML = '';
                    row.appendChild(td);
                }
            });
        } else if (headerExists) {
            // Remove header and any indicator tds from visible rows when none are low
            const h = theadRow.querySelector('th.stock-indicator-header');
            if (h) h.remove();
            visibleRows.forEach(row => {
                const td = row.querySelector('td.stock-indicator-cell');
                if (td) td.remove();
            });
        }
    }

    // Wire pagination controls
    if (prevBtn) prevBtn.addEventListener('click', function() { renderTablePage(currentPage - 1); });
    if (paginationNextBtn) paginationNextBtn.addEventListener('click', function() { renderTablePage(currentPage + 1); });
    if (pageInput) pageInput.addEventListener('change', function() { const p = parseInt(this.value, 10) || 1; renderTablePage(p); });
    if (rowsSelect) rowsSelect.addEventListener('change', function() { rowsPerPage = parseInt(this.value, 10) || 10; renderTablePage(1); });

    // initial filter pass (this will call renderTablePage via filterRows)
    filterRows();


    // Make category <select> editable: delegate change handling to the table body
    if (inventoryTableBody) {
        inventoryTableBody.addEventListener('change', function(e) {
            const target = e.target;
            if (!target || !target.classList || !target.classList.contains('category-select')) return;
            const prodId = parseInt(target.getAttribute('data-product-id') || 0, 10);
            const variantId = target.getAttribute('data-variant-id') ? parseInt(target.getAttribute('data-variant-id'), 10) : null;
            const catVal = target.value === '' ? null : parseInt(target.value, 10);

            // optimistic UI: disable while saving
            target.disabled = true;

            fetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_category', product_id: prodId, category_id: catVal })
            }).then(resp => resp.json()).then(res => {
                if (res && res.success) {
                    const row = target.closest('tr');
                    if (row) {
                        const name = res.category_name ? res.category_name : (target.options[target.selectedIndex] ? target.options[target.selectedIndex].text : '');
                        row.setAttribute('data-category', name);
                        row.setAttribute('data-category-id', catVal ? String(catVal) : '');
                    }
                } else {
                    alert('Failed to update category: ' + (res && res.error ? res.error : 'Unknown error'));
                }
            }).catch(err => {
                console.error('update_category error', err);
                alert('Failed to update category');
            }).finally(() => { target.disabled = false; });
        }); 
    }

    // Initialize styled dropdowns that mirror .category-select
    function initStyledSelects(root) {
        root = root || document;
    // Initialize styled selects for row-level category selects, plus the
    // filter controls and pagination rows select so they all share the same
    // visual treatment.
    const selects = root.querySelectorAll && root.querySelectorAll('select.category-select, select#categoryFilter, select#stockAlert, select.pagination-rows-select');
        if (!selects || !selects.length) return;

        selects.forEach(function(select) {
            // Avoid double-init
            if (select._styledInit) return;
            select._styledInit = true;

            // Create wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'styled-select';
            // Keep select but hide it visually while keeping it in DOM for form semantics.
            // Disable pointer events so the native browser dropdown doesn't appear on click.
            select.style.position = 'absolute';
            select.style.opacity = '0';
            select.style.left = '0';
            select.style.top = '0';
            select.style.width = '100%';
            select.style.height = '100%';
            select.style.margin = '0';
            select.style.zIndex = '0';
            select.style.pointerEvents = 'none';

            // Build display element
            const display = document.createElement('div');
            display.className = 'styled-display';
            const label = document.createElement('div');
            label.className = 'label';
            const chev = document.createElement('div');
            chev.className = 'chev';
            // Use a filled downward-pointing triangle (keeps the same visual size as the previous 12x12 chevron)
            chev.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="6,8 18,8 12,16" fill="currentColor"/></svg>';
            display.appendChild(label);
            display.appendChild(chev);

            // Build options menu
            const menu = document.createElement('div');
            menu.className = 'styled-menu';

            // Populate menu from select options
            function rebuildMenu() {
                menu.innerHTML = '';
                // Build an array of option elements and move the currently selected
                // option to the front so it appears first in the rendered menu.
                const opts = Array.from(select.options);
                const selIdx = opts.findIndex(o => String(o.value) === String(select.value));
                if (selIdx > 0) {
                    const [sel] = opts.splice(selIdx, 1);
                    opts.unshift(sel);
                }

                opts.forEach(function(opt, idx) {
                    const o = document.createElement('div');
                    o.className = 'styled-option';
                    o.setAttribute('data-value', opt.value);
                    // data-index refers to the position inside the rendered menu (not the original select index)
                    o.setAttribute('data-index', String(idx));
                    o.textContent = opt.textContent || opt.innerText || opt.value;
                    if (opt.classList && opt.classList.contains('new-category')) o.classList.add('new-category');
                    if (String(select.value) === String(opt.value)) o.classList.add('active');
                    o.addEventListener('click', function(e) {
                        // set native select and trigger change
                        select.value = opt.value;
                        const ev = new Event('change', { bubbles: true });
                        select.dispatchEvent(ev);
                        closeMenu();
                    });
                    menu.appendChild(o);
                });
            }

            function openMenu() {
                // close other menus and wrappers so only the current one appears "open"
                document.querySelectorAll('.styled-select .styled-menu.show').forEach(m => m.classList.remove('show'));
                document.querySelectorAll('.styled-select.open').forEach(w => w.classList.remove('open'));
                menu.classList.add('show');
                wrapper.classList.add('open');
            }
            function closeMenu() {
                menu.classList.remove('show');
                wrapper.classList.remove('open');
            }

            // Show selected label
            function refreshLabel() {
                const opt = select.options[select.selectedIndex];
                label.textContent = opt ? opt.textContent : 'No Category';
                // update active option in menu
                const opts = menu.querySelectorAll('.styled-option');
                opts.forEach(el => el.classList.remove('active'));
                const active = menu.querySelector('.styled-option[data-value="' + (select.value || '') + '"]');
                if (active) active.classList.add('active');
            }

            // Compose DOM: wrapper contains display + hidden select (absolute) + menu
            // We'll place wrapper where select currently is
            const parent = select.parentNode;
            parent.insertBefore(wrapper, select);
            wrapper.appendChild(display);
            wrapper.appendChild(select);
            wrapper.appendChild(menu);

            // Initialize
            rebuildMenu();
            refreshLabel();

            // Events
            // Make the visible display focusable and toggleable via keyboard
            display.tabIndex = 0;
            display.addEventListener('click', function(e) {
                e.stopPropagation();
                if (menu.classList.contains('show')) closeMenu(); else openMenu();
            });
            display.addEventListener('keydown', function(e) {
                // Enter or Space toggles
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (menu.classList.contains('show')) closeMenu(); else openMenu();
                } else if (e.key === 'Escape') {
                    closeMenu();
                }
            });

            // Toggle-only behavior: click to open/close. Hover open disabled to avoid accidental menus on touch/hover.

            // Keep native select changes in sync (e.g., when changed programmatically or by keyboard)
            select.addEventListener('change', function() {
                refreshLabel();
            });

            // Close on outside click
            document.addEventListener('click', function docClick(ev) {
                if (!wrapper.contains(ev.target)) {
                    closeMenu();
                }
            });

            // Rebuild menu if options change (rare, but good to support)
            const obs = new MutationObserver(function() { rebuildMenu(); refreshLabel(); });
            obs.observe(select, { childList: true, subtree: false });
        });
    }

    // Initialize styled selects now and whenever inventory rows change
    initStyledSelects(document);
    if (inventoryTableBody) {
        const mo = new MutationObserver(function() { initStyledSelects(inventoryTableBody); });
        mo.observe(inventoryTableBody, { childList: true, subtree: true });
    }

    // Variant toggle behavior: clicking the chevron on a parent row will
    // show/hide its variant rows (structure-only logic).
    if (inventoryTableBody) {
        inventoryTableBody.addEventListener('click', function(ev) {
            const btn = ev.target.closest && ev.target.closest('.variant-toggle');
            if (!btn) return;
            const pid = btn.getAttribute('data-product-id');
            if (!pid) return;
            const variantRows = inventoryTableBody.querySelectorAll('tr.variant-row[data-parent-id="' + pid + '"]');
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            variantRows.forEach(function(r) {
                r.style.display = isExpanded ? 'none' : '';
            });
            btn.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        });
    }
});

</script>
<script>
// Checkbox select-all behavior
document.addEventListener('DOMContentLoaded', function() {
    const selectAll = document.getElementById('selectAllItems');
    const tableBody = document.getElementById('inventory-table-body');

    function updateSelectAllState() {
        const checkboxes = tableBody ? Array.from(tableBody.querySelectorAll('.row-select-checkbox')) : [];
        if (!checkboxes.length) {
            if (selectAll) selectAll.checked = false;
            return;
        }
        const allChecked = checkboxes.every(cb => cb.checked);
        const someChecked = checkboxes.some(cb => cb.checked);
        if (selectAll) {
            selectAll.checked = allChecked;
            selectAll.indeterminate = !allChecked && someChecked;
        }
    }

    // When header checkbox toggled, set all visible (non-filtered) rows
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = tableBody ? Array.from(tableBody.querySelectorAll('.row-select-checkbox')) : [];
            // Only toggle checkboxes for rows that are currently visible (not data-filtered)
            checkboxes.forEach(cb => {
                const row = cb.closest('tr');
                if (row && !row.hasAttribute('data-filtered')) {
                    cb.checked = selectAll.checked;
                }
            });
        });
    }

    // Delegate clicks on row checkboxes to update header state
    if (tableBody) {
        tableBody.addEventListener('change', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('row-select-checkbox')) {
                updateSelectAllState();
            }
        });
    }

    // Observe DOM changes (pagination or filtering) to refresh select-all state
    if (tableBody) {
        const obs = new MutationObserver(function() {
            // small timeout to allow inputs to render
            setTimeout(updateSelectAllState, 50);
        });
        obs.observe(tableBody, { childList: true, subtree: true, attributes: true });
    }

});
</script>
