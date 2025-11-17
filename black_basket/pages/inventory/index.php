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
    <style>
        /* Small hover effect for the Delete button - match Add Item and avoid shifting on hover */
        #deleteSelectedBtn {
            /* Only animate visual properties, avoid transform so the button doesn't move */
            transition: box-shadow 120ms ease, opacity 120ms ease;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            /* space between icon and label */
            gap: 8px;
            border-radius: 6px;
            /* Match common button sizing used across the toolbar */
            height: 35px;
            padding: 6px 20px;
            font-size: 0.95rem;
            box-sizing: border-box;
        }
        #deleteSelectedBtn:hover {
            /* Visual emphasis only — no translate so layout stays stable */
            box-shadow: 0 6px 18px rgba(0,0,0,0.25);
            opacity: 0.98;
            transform: none;
        }
        /* Confirmation modal styles (improved color palette) */
        .confirm-modal-backdrop {
            position: fixed;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            /* slightly stronger backdrop for better contrast */
            background: rgba(0,0,0,0.55);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1200;
        }
        .confirm-modal {
            background: #232323;
            color: #111;
            border-radius: 10px;
            padding: 18px 20px;
            max-width: 420px;
            width: 100%;
            box-shadow: 0 14px 44px rgba(0,0,0,0.35);
            border: 1px solid rgba(0,0,0,0.06);
        }
        .confirm-modal p { margin: 0 0 14px 0; color: #dbdbdb; font-weight: 400; }
        .confirm-modal .confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .confirm-modal .btn { min-width: 84px; }
        /* Cancel / outline button inside the modal */
        .confirm-modal .btn-outline {
            background: transparent;
            color: #dbdbdb;
        }
        .confirm-modal .btn-outline:hover { background: #f5f7f9; color: #232323;}
        /* Stronger, friendlier red for destructive action */
        .confirm-modal .btn-danger {
            background: #e74c3c; /* vivid red */
            border-color: #e74c3c;
            color: #fff;
        }
        .confirm-modal .btn-danger:hover { background: #c43b2b; border-color: #c43b2b; }
        /* Toast / Snackbar */
        .app-toast {
            position: fixed;
            left: 50%;
            top: 18px;
            /* start slightly above and slide down when shown */
            transform: translate(-50%, -8px);
            min-width: 220px;
            max-width: 420px;
            padding: 12px 16px;
            border-radius: 8px;
            color: #fff;
            display: none;
            align-items: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.35);
            z-index: 1400;
            font-size: 0.95rem;
            opacity: 0;
            transition: transform 180ms ease, opacity 180ms ease;
            pointer-events: auto;
        }
        .app-toast.show { display: flex; transform: translate(-50%, 0); opacity: 1; }
        .app-toast.success { background: linear-gradient(90deg,#2ecc71,#27ae60); }
        .app-toast.error { background: linear-gradient(90deg,#e74c3c,#c0392b); }
        .app-toast.info { background: linear-gradient(90deg,#3498db,#2980b9); }
        .app-toast .toast-icon { margin-right: 10px; font-size: 1.05rem; }
        .app-toast .toast-msg { flex: 1; }

        /* Fixed row height for inventory table rows
           - Ensures all rows have a consistent height and vertical centering
           - Uses truncation/ellipsis to keep long text from breaking layout
           - Provides a smaller height on narrow screens for better fit */
        .inventory-table tbody tr {
            height: 56px; /* change this value to taste */
            max-height: 56px;
            box-sizing: border-box;
        }
        .inventory-table tbody tr td {
            padding-top: 8px;
            padding-bottom: 8px;
            vertical-align: middle;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            max-height: 56px;
        }
        /* Slightly tighter spacing for variant rows if desired */
        .inventory-table tbody tr.variant-row td {
            padding-top: 6px;
            padding-bottom: 6px;
        }
        /* Ensure name/category cells truncate gracefully */
        .inventory-table tbody tr td .br-name,
        .inventory-table tbody tr td .item-name {
            display: inline-block;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            vertical-align: middle;
        }

        @media (max-width: 720px) {
            .inventory-table tbody tr { height: 48px; max-height: 48px; }
            .inventory-table tbody tr td { padding-top: 6px; padding-bottom: 6px; }
        }
    </style>
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
                <button class="btn btn-danger" id="deleteSelectedBtn" style="display:none; margin-left:8px;"><i class="fa fa-trash"></i> Delete</button>
    <!-- Modal include -->
    <?php include 'popupmodal.php'; ?>
                <button class="btn btn-outline" id="importBtn" title="Import"><i class="fa fa-download"></i></button>
                <button class="btn btn-outline" id="exportBtn" title="Export"><i class="fa fa-upload"></i></button>
            </div>
            <!-- Hidden import form used by the Import button and empty-state import action -->
            <form id="importForm" action="import_items.php" method="post" enctype="multipart/form-data" style="display:none;">
                <input type="file" name="import_file" id="importFileInput" accept=".csv,text/csv" />
            </form>
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
                            <input type="text" id="search-inventory" placeholder="Search items...">
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
                                <option value="in">In Stock</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                                <option value="estimated">Estimated</option>
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
                            // Include is_composite so we can calculate estimated stock for composite products
                            $prodSql = "SELECT p.id AS product_id, p.name AS product_name, p.sku AS product_sku, p.barcode AS product_barcode, p.price AS product_price, p.cost AS product_cost, p.in_stock AS product_stock, p.low_stock AS low_stock, p.pos_available, p.track_stock AS track_stock, p.category_id, p.type, p.color, p.shape, p.image_url, p.is_composite AS is_composite
                                        FROM products p ORDER BY p.name ASC";

                            // Track whether any products were rendered so we can show
                            // a friendly empty-state when the inventory is empty.
                            $hasProducts = false;
                            if ($prodResult = $conn->query($prodSql)) {
                                while ($p = $prodResult->fetch_assoc()) {
                                    $hasProducts = true;
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

                                        // If composite, compute estimated possible assemblies now so we can
                                        // include an attribute on the parent row. Otherwise use parentStock.
                                        $displayStock = $parentStock;
                                        $isEstimated = false;
                                        if (!empty($p['is_composite'])) {
                                            $estimates = [];
                                            $compSql = "SELECT component_product_id, component_variant_id, component_qty FROM product_components WHERE parent_product_id = " . (int)$p['product_id'];
                                            $compRes = $conn->query($compSql);
                                            if ($compRes && $compRes->num_rows > 0) {
                                                while ($comp = $compRes->fetch_assoc()) {
                                                    $needed = floatval($comp['component_qty']) ?: 0;
                                                    if ($needed <= 0) { $estimates[] = 0; continue; }
                                                    $availableRaw = null;
                                                    if (!empty($comp['component_variant_id'])) {
                                                        $cq = $conn->query("SELECT in_stock FROM product_variants WHERE id = " . intval($comp['component_variant_id']) . " LIMIT 1");
                                                        if ($cq && $cq->num_rows > 0) $availableRaw = $cq->fetch_assoc()['in_stock'];
                                                    } else if (!empty($comp['component_product_id'])) {
                                                        $cq = $conn->query("SELECT in_stock FROM products WHERE id = " . intval($comp['component_product_id']) . " LIMIT 1");
                                                        if ($cq && $cq->num_rows > 0) $availableRaw = $cq->fetch_assoc()['in_stock'];
                                                    }
                                                    $availableNum = 0.0;
                                                    if ($availableRaw !== null && $availableRaw !== '') {
                                                        if (preg_match('/^([0-9]+(?:\.[0-9]+)?)/', trim((string)$availableRaw), $m)) {
                                                            $availableNum = floatval($m[1]);
                                                        }
                                                    }
                                                    $possible = ($needed > 0) ? floor($availableNum / $needed) : 0;
                                                    $estimates[] = (int)$possible;
                                                }
                                            }
                                            if (!empty($estimates)) {
                                                $displayStock = min($estimates);
                                                $isEstimated = true;
                                            }
                                        }

                                        // determine stock status for parent row (out/low/in) based on the
                                        // displayStock (estimated or actual parent stock)
                                        $statusBase = $displayStock;
                                        if ($statusBase === 0) {
                                            $parentStockStatus = 'out';
                                            $parentLowFlag = '';
                                        } elseif ($statusBase <= $parentLowThreshold && $parentLowThreshold > 0) {
                                            $parentStockStatus = 'low';
                                            $parentLowFlag = 'low';
                                        } else {
                                            $parentStockStatus = 'in';
                                            $parentLowFlag = '';
                                        }

                                        $catIdAttr = isset($p['category_id']) && $p['category_id'] ? (int)$p['category_id'] : '';

                                        // Parent row: includes a chevron toggle (structure only)
                                        // Add data-stock and data-low attributes so parent rows are filterable by stock
                                        // Also include data-estimated if we computed an estimate.
                                        $dataEstimatedAttr = $isEstimated ? " data-estimated='1'" : "";
                                        $prodSkuAttr = htmlspecialchars((string)($p['product_sku'] ?? ''), ENT_QUOTES, 'UTF-8');
                                        $prodBarcodeAttr = htmlspecialchars((string)($p['product_barcode'] ?? ''), ENT_QUOTES, 'UTF-8');
                                        echo "<tr class='parent-row' data-product-id='" . (int)$p['product_id'] . "' data-category=\"" . $categoryName . "\" data-category-id=\"" . $catIdAttr . "\" data-stock=\"" . $parentStockStatus . "\" data-low=\"" . $parentLowFlag . "\" data-sku=\"" . $prodSkuAttr . "\" data-barcode=\"" . $prodBarcodeAttr . "\"" . $dataEstimatedAttr . ">";
                                        echo "<td style=\"text-align:center;\">";
                                        // Chevron toggle (will be wired by JS). Keep accessible label.
                                        // Chevron button placed before the checkbox but will be
                                        // absolutely positioned via CSS so it doesn't affect layout
                                        // and the checkbox stays centered.
                                        echo "<button type='button' class='variant-toggle' data-product-id='" . (int)$p['product_id'] . "' aria-expanded='false' title='Show variants' style='background:transparent;border:none;cursor:pointer;padding:4px;'>";
                                        echo "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
                                        echo "</button>";
                                        echo "<label class='permission-checkbox table-checkbox' style='margin-left: 10px;display:inline-flex;justify-content:center;'>";
                                        echo "<input type='checkbox' class='row-select-checkbox' data-product-id='" . (int)$p['product_id'] . "' />";
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
                                        echo "<td>" . htmlspecialchars((string)$displayStock, ENT_QUOTES, 'UTF-8') . "</td>";
                                        // Indicator cell is created client-side by updateIndicatorColumn
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

                                            $varSkuAttr = htmlspecialchars((string)($v['sku'] ?? ''), ENT_QUOTES, 'UTF-8');
                                            $varBarcodeAttr = htmlspecialchars((string)($v['barcode'] ?? ''), ENT_QUOTES, 'UTF-8');
                                            echo "<tr class='variant-row' data-parent-id='" . (int)$p['product_id'] . "' style='display:none;' data-category=\"" . $categoryName . "\" data-category-id=\"" . $catIdAttr . "\" data-stock=\"" . $stockStatus . "\" data-low=\"" . ($stockStatus === 'low' ? 'low' : '') . "\" data-pos=\"" . $posAttr . "\" data-track=\"" . $trackAttr . "\" data-sku=\"" . $varSkuAttr . "\" data-barcode=\"" . $varBarcodeAttr . "\">";
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
                                            // Indicator cell (low/estimated) is added by client JS; do not emit here.
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
                                        // If this product is a composite, compute estimated assemblies to
                                        // influence displayed stock and row attributes.
                                        $displayStock = $stock;
                                        $isEstimated = false;
                                        if (!empty($p['is_composite'])) {
                                            $estimates = [];
                                            $compSql = "SELECT component_product_id, component_variant_id, component_qty FROM product_components WHERE parent_product_id = " . (int)$p['product_id'];
                                            $compRes = $conn->query($compSql);
                                            if ($compRes && $compRes->num_rows > 0) {
                                                while ($comp = $compRes->fetch_assoc()) {
                                                    $needed = floatval($comp['component_qty']) ?: 0;
                                                    if ($needed <= 0) { $estimates[] = 0; continue; }
                                                    $availableRaw = null;
                                                    if (!empty($comp['component_variant_id'])) {
                                                        $cq = $conn->query("SELECT in_stock FROM product_variants WHERE id = " . intval($comp['component_variant_id']) . " LIMIT 1");
                                                        if ($cq && $cq->num_rows > 0) $availableRaw = $cq->fetch_assoc()['in_stock'];
                                                    } else if (!empty($comp['component_product_id'])) {
                                                        $cq = $conn->query("SELECT in_stock FROM products WHERE id = " . intval($comp['component_product_id']) . " LIMIT 1");
                                                        if ($cq && $cq->num_rows > 0) $availableRaw = $cq->fetch_assoc()['in_stock'];
                                                    }
                                                    $availableNum = 0.0;
                                                    if ($availableRaw !== null && $availableRaw !== '') {
                                                        if (preg_match('/^([0-9]+(?:\.[0-9]+)?)/', trim((string)$availableRaw), $m)) {
                                                            $availableNum = floatval($m[1]);
                                                        }
                                                    }
                                                    $possible = ($needed > 0) ? floor($availableNum / $needed) : 0;
                                                    $estimates[] = (int)$possible;
                                                }
                                            }
                                            if (!empty($estimates)) {
                                                $displayStock = min($estimates);
                                                $isEstimated = true;
                                            }
                                        }

                                        // determine stock status based on displayStock
                                        if ($displayStock === 0) {
                                            $stockStatus = 'out';
                                        } elseif ($displayStock <= $low) {
                                            $stockStatus = 'low';
                                        } else {
                                            $stockStatus = 'in';
                                        }
                                        $posAttr = isset($p['pos_available']) && $p['pos_available'] ? '1' : '0';
                                        $trackAttr = isset($p['track_stock']) && $p['track_stock'] ? '1' : '0';
                                        $catIdAttr = isset($p['category_id']) && $p['category_id'] ? (int)$p['category_id'] : '';
                                        $dataEstimatedAttr = $isEstimated ? " data-estimated='1'" : "";
                                        $prodSkuAttr = htmlspecialchars((string)($p['product_sku'] ?? ''), ENT_QUOTES, 'UTF-8');
                                        $prodBarcodeAttr = htmlspecialchars((string)($p['product_barcode'] ?? ''), ENT_QUOTES, 'UTF-8');
                                        echo "<tr data-product-id='" . (int)$p['product_id'] . "' data-category=\"" . $categoryName . "\" data-category-id=\"" . $catIdAttr . "\" data-stock=\"" . $stockStatus . "\" data-low=\"" . ($stockStatus === 'low' ? 'low' : '') . "\" data-pos=\"" . $posAttr . "\" data-track=\"" . $trackAttr . "\" data-sku=\"" . $prodSkuAttr . "\" data-barcode=\"" . $prodBarcodeAttr . "\"" . $dataEstimatedAttr . ">";
                                        echo "<td style=\"text-align:center;\">";
                                        echo "<label class='permission-checkbox table-checkbox' style='margin-left: 10px;display:inline-flex;justify-content:center;'>";
                                        echo "<input type='checkbox' class='row-select-checkbox' data-product-id='" . (int)$p['product_id'] . "' />";
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
                                        echo "<td>" . htmlspecialchars((string)$displayStock, ENT_QUOTES, 'UTF-8') . "</td>";
                                        // Indicator cell is handled client-side (updateIndicatorColumn).
                                        echo "</tr>\n";
                                    }
                                }
                                $prodResult->free();
                            }

                            // If there are no products, show an empty-state row with actions
                            if (empty($hasProducts)) {
                                echo '<tr class="empty-state">';
                                echo '<td colspan="7" style="padding:40px;text-align:center;">';
                                echo '<div style="max-width:760px;margin:0 auto;">';
                                echo '<h3 style="margin:0 0 8px 0;color:#e6e6e6;">No items in inventory yet</h3>';
                                echo '<p style="margin:0 0 16px 0;color:#9e9e9e;">Add items manually, or import from a spreadsheet to get started.</p>';
                                echo '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">';
                                echo '<button class="btn btn-primary" id="emptyAddItemBtn" type="button"><i class="fa fa-plus"></i> Add Item</button>';
                                echo '<button class="btn btn-outline" id="emptyImportBtn" type="button"><i class="fa fa-file-import"></i> Import Items</button>';
                                echo '<a class="btn btn-outline" href="download_sample.php" id="downloadSampleLink" style="display:inline-flex;align-items:center;gap:8px;">';
                                echo '<i class="fa fa-file-csv"></i> Download sample CSV</a>';
                                echo '</div>';
                                echo '<p style="margin-top:12px;color:#7f8c8d;font-size:0.95rem;">Tip: The sample file contains header columns you can edit in Excel. Save as CSV before uploading.</p>';
                                echo '</div>';
                                echo '</td>';
                                echo '</tr>';
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
<!-- Confirmation modal (used instead of window.confirm) -->
<div class="confirm-modal-backdrop" id="confirmModal" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="confirm-modal" role="document">
        <p id="confirmModalMessage">Are you sure?</p>
        <div class="confirm-actions" style="margin-top:8px;">
            <button class="btn btn-outline" id="confirmCancelBtn">Cancel</button>
            <button class="btn btn-danger" id="confirmOkBtn">Delete</button>
        </div>
    </div>
</div>
<!-- Toast container -->
<div id="appToast" class="app-toast" role="status" aria-live="polite">
    <div class="toast-icon" id="appToastIcon">✓</div>
    <div class="toast-msg" id="appToastMsg">Saved</div>
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
            // If the button label indicates Create mode, open Create tab and prefill with checked items
            var label = (addProductBtn.textContent || '').trim().toLowerCase();
            var isCreateMode = label.indexOf('create') !== -1;

            // Show the modal in any case
            scannerModal.style.display = 'block';

            if (isCreateMode) {
                // collect checked product rows
                var checked = Array.from(document.querySelectorAll('.row-select-checkbox:checked'));
                var items = checked.map(function(cb) {
                    try {
                        var row = cb.closest && cb.closest('tr') ? cb.closest('tr') : null;
                        var pid = cb.dataset && cb.dataset.productId ? cb.dataset.productId : (row ? row.getAttribute('data-product-id') : null);
                        var nameCell = row ? row.querySelector('td:nth-child(2)') : null;
                        var costCell = row ? row.querySelector('td:nth-child(5)') : null;
                        var name = nameCell ? (nameCell.textContent || '').trim() : '';
                        var rawCost = costCell ? (costCell.textContent || '') : '';
                        // parse numeric cost from displayed string like '₱1,234.00'
                        var parsedCost = 0;
                        try {
                            var num = String(rawCost).replace(/[^0-9.\-]/g, '');
                            parsedCost = num === '' ? 0 : parseFloat(num);
                        } catch (e) { parsedCost = 0; }
                        return { id: pid ? pid : null, name: name, cost: parsedCost };
                    } catch (e) { return null; }
                }).filter(Boolean);

                // Show the create tab
                if (typeof showTab === 'function') {
                    try { showTab('create', false); } catch (e) { /* ignore */ }
                } else {
                    // fallback: show panels manually
                    document.querySelectorAll('.tab-panel').forEach(function(p) { p.style.display = 'none'; });
                    var createPanel = document.getElementById('createTabPanel');
                    if (createPanel) createPanel.style.display = 'block';
                }

                // Store pending items so the modal helper can pick them up when ready.
                try {
                    console.debug('Create mode detected, collected items:', items);
                    window._pendingCreateItems = items;
                    // If helper is already available, call it immediately and clear pending
                    if (window.appendCreateComponents) {
                        try { console.debug('appendCreateComponents available, invoking'); window.appendCreateComponents(items); window._pendingCreateItems = []; } catch(e) { console.warn('appendCreateComponents failed', e); }
                    } else {
                        // As a safety fallback, if the modal hasn't initialized yet, try to append simple rows
                        // directly into the Create components body after a short delay so the UI shows something.
                        setTimeout(function() {
                            try {
                                if (window.appendCreateComponents) {
                                    console.debug('appendCreateComponents became available, invoking now');
                                    window.appendCreateComponents(items);
                                    window._pendingCreateItems = [];
                                    return;
                                }
                                var cb = document.getElementById('createComponentsBody');
                                if (!cb) {
                                    console.debug('createComponentsBody not present yet');
                                    return;
                                }
                                // Clear and insert rows that match the modal's component-row structure and styles
                                cb.innerHTML = '';

                                // formatting helper
                                function _formatCurrency(n) { return '₱' + Number(n||0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}); }

                                // Local fallback recalc function (mirrors modal recalcTotal)
                                function _fallbackRecalcTotal() {
                                    try {
                                        var total = 0;
                                        var rows = cb.querySelectorAll('tr.component-row');
                                        rows.forEach(function(r) {
                                            var q = parseFloat((r.querySelector('.comp-qty') && r.querySelector('.comp-qty').value) || 0) || 0;
                                            var c = parseFloat((r.querySelector('.comp-cost') && r.querySelector('.comp-cost').value || '').replace(/[^0-9.-]/g, '')) || 0;
                                            total += q * c;
                                        });
                                        var totalEl = document.getElementById('createTotalCost');
                                        if (totalEl) totalEl.textContent = _formatCurrency(total);
                                    } catch (e) { console.warn('fallback recalc error', e); }
                                }

                                // Create a lightweight variant dropdown if not already present (one instance)
                                var fallbackDropdown = document.querySelector('.comp-variant-dropdown');
                                if (!fallbackDropdown) {
                                    fallbackDropdown = document.createElement('div');
                                    fallbackDropdown.className = 'create-dropdown comp-variant-dropdown';
                                    fallbackDropdown.style.position = 'absolute';
                                    fallbackDropdown.style.zIndex = 99999;
                                    fallbackDropdown.style.display = 'none';
                                    document.body.appendChild(fallbackDropdown);
                                }

                                // open dropdown positioned under triggerEl
                                function openFallbackVariantDropdown(triggerEl, row, product, variants) {
                                    try {
                                        fallbackDropdown.innerHTML = '';
                                        // Build list (variants may be empty)
                                        if (!variants || !variants.length) {
                                            var noOpt = document.createElement('div');
                                            noOpt.className = 'create-option';
                                            noOpt.style.opacity = '0.7';
                                            noOpt.style.cursor = 'default';
                                            noOpt.textContent = 'No variants';
                                            fallbackDropdown.appendChild(noOpt);
                                        } else {
                                            // Place selected variant first if dataset present
                                            var variantsToRender = Array.prototype.slice.call(variants || []);
                                            try {
                                                var curId = row && row.dataset && row.dataset.selectedVariantId ? String(row.dataset.selectedVariantId) : '';
                                                if (curId) {
                                                    var idx = variantsToRender.findIndex(function(x){ return String(x.id) === curId; });
                                                    if (idx > 0) {
                                                        var found = variantsToRender.splice(idx,1)[0];
                                                        variantsToRender.unshift(found);
                                                    }
                                                }
                                            } catch(e) {}

                                            variantsToRender.forEach(function(v) {
                                                var opt = document.createElement('div');
                                                opt.className = 'create-option';
                                                var parentName = product && product.name ? product.name : '';
                                                var variantName = v.name || '';
                                                var sku = v.sku || '';
                                                var cost = (v.cost !== undefined && v.cost !== null) ? v.cost : (v.price !== undefined && v.price !== null ? v.price : '');
                                                opt.innerHTML = '<div style="display:grid; grid-template-columns: 1fr 100px; align-items:center; gap:8px; width:100%;">'
                                                    + '<div style="min-width:0;">'
                                                    + '<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; color:#e6e6e6;">' + (variantName ? variantName : '') + '</div>'
                                                    + (sku ? '<div style="color:#9e9e9e; font-size:12px; margin-top:4px;">SKU: ' + sku + '</div>' : '')
                                                    + '</div>'
                                                    + '<div style="text-align:right; color:#9ca3af; white-space:nowrap;">' + (cost !== '' ? ('₱' + Number(cost).toFixed(2)) : '') + '</div>'
                                                    + '</div>';
                                                opt.addEventListener('mousedown', function(e){ e.preventDefault(); });
                                                opt.addEventListener('click', function() {
                                                    try {
                                                        var nameTextEl = row.querySelector('.comp-name-text');
                                                        var skuEl = row.querySelector('.comp-sku');
                                                        var costInput = row.querySelector('.comp-cost');
                                                        if (nameTextEl) nameTextEl.textContent = (product.name || '') + (variantName ? ' (' + variantName + ')' : '');
                                                        if (skuEl) skuEl.textContent = sku ? ('SKU: ' + sku) : (product.sku ? ('SKU: ' + product.sku) : '\u00A0');
                                                        if (costInput) costInput.value = _formatCurrency(parseFloat(cost) || 0);
                                                        try { row.dataset.selectedVariantId = v.id || ''; } catch(e){}
                                                        _fallbackRecalcTotal();
                                                    } catch(e) { console.warn('apply variant selection error', e); }
                                                    closeFallbackVariantDropdown();
                                                });
                                                fallbackDropdown.appendChild(opt);
                                            });
                                        }

                                        // position
                                        var r = triggerEl.getBoundingClientRect();
                                        var left = r.left + window.scrollX;
                                        var width = Math.max(240, Math.round(r.width));
                                        var maxRight = window.scrollX + document.documentElement.clientWidth - 8;
                                        if (left + width > maxRight) left = Math.max(8 + window.scrollX, maxRight - width);
                                        if (left < 8 + window.scrollX) left = 8 + window.scrollX;
                                        fallbackDropdown.style.width = width + 'px';
                                        fallbackDropdown.style.left = left + 'px';
                                        fallbackDropdown.style.display = 'block';
                                        // mark trigger open
                                        try { triggerEl.classList.add('open'); } catch(e) {}
                                        var dh = fallbackDropdown.offsetHeight || fallbackDropdown.scrollHeight || 200;
                                        var topCover = r.top + window.scrollY;
                                        var viewportBottom = window.scrollY + document.documentElement.clientHeight - 8;
                                        if (topCover < window.scrollY + 8 || (topCover + dh) > viewportBottom) {
                                            fallbackDropdown.style.top = (r.bottom + window.scrollY + 6) + 'px';
                                        } else {
                                            fallbackDropdown.style.top = topCover + 'px';
                                        }
                                    } catch (e) { console.warn('openFallbackVariantDropdown error', e); }
                                }

                                function closeFallbackVariantDropdown() {
                                    try {
                                        fallbackDropdown.style.display = 'none';
                                        fallbackDropdown.innerHTML = '';
                                        // remove open class from any .comp-name
                                        var openEl = document.querySelector('.comp-name.open'); if (openEl) openEl.classList.remove('open');
                                    } catch (e) { /* ignore */ }
                                }

                                // close on outside click or escape
                                document.addEventListener('click', function(e) {
                                    if (!fallbackDropdown) return;
                                    if (!fallbackDropdown.contains(e.target)) {
                                        // allow clicks inside comp-name to open/close
                                        if (e.target && e.target.closest && e.target.closest('.comp-name')) return;
                                        closeFallbackVariantDropdown();
                                    }
                                });
                                document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeFallbackVariantDropdown(); });

                                // For each item: if it has a product id, try to fetch product+variants
                                // so we can show SKU and variant options (fallback to provided data otherwise).
                                var pendingFetches = [];
                                items.forEach(function(it) {
                                    try {
                                        var pid = it && (it.id || it.product_id) ? (it.id || it.product_id) : null;
                                        if (pid) {
                                            // fetch authoritative product info to populate SKU/variants
                                            var p = fetch('get_product.php?product_id=' + encodeURIComponent(pid))
                                                .then(function(resp) { return resp.json(); })
                                                .then(function(data) {
                                                    try { console.debug('get_product result for', pid, data); } catch(e) {}
                                                
                                                    try {
                                                        if (data && data.success && data.product) {
                                                            var product = data.product;
                                                            var variants = Array.isArray(product.variants) ? product.variants : [];
                                                            // create row using product and variants
                                                            var tr = document.createElement('tr');
                                                            tr.className = 'component-row';
                                                            tr.style.borderBottom = '1px solid #2b2b2b';

                                                            var tdName = document.createElement('td'); tdName.style.padding = '8px'; tdName.style.color = '#dbdbdb';
                                                            var nameWrapper = document.createElement('div'); nameWrapper.className = 'comp-name'; nameWrapper.style.overflow = 'hidden'; nameWrapper.style.textOverflow = 'ellipsis'; nameWrapper.style.whiteSpace = 'nowrap';
                                                            var nameText = document.createElement('div'); nameText.className = 'comp-name-text'; nameText.textContent = (product.name || it.name || '');
                                                            var skuDiv = document.createElement('div'); skuDiv.className = 'comp-sku'; skuDiv.style.color = '#9e9e9e'; skuDiv.style.fontSize = '12px'; skuDiv.style.marginTop = '0'; skuDiv.textContent = product.sku ? ('SKU: ' + product.sku) : '\u00A0';
                                                            nameWrapper.appendChild(nameText); nameWrapper.appendChild(skuDiv); tdName.appendChild(nameWrapper);

                                                            var tdQty = document.createElement('td'); tdQty.style.padding = '8px'; tdQty.style.width = '120px'; tdQty.style.textAlign = 'right';
                                                            var qtyInput = document.createElement('input'); qtyInput.className = 'comp-qty'; qtyInput.type = 'number'; qtyInput.min = '0'; qtyInput.value = (it.qty !== undefined && it.qty !== null) ? it.qty : 1; qtyInput.style.width = '100%'; qtyInput.style.padding = '6px'; qtyInput.style.background = '#171717'; qtyInput.style.border = '1px solid #333'; qtyInput.style.color = '#fff'; qtyInput.style.borderRadius = '4px'; qtyInput.style.textAlign = 'right'; tdQty.appendChild(qtyInput);

                                                            var tdCost = document.createElement('td'); tdCost.style.padding = '8px'; tdCost.style.width = '120px'; tdCost.style.textAlign = 'right';
                                                            var costVal = (product.cost !== undefined && product.cost !== null) ? product.cost : (product.price !== undefined && product.price !== null ? product.price : (it.cost || 0));
                                                            var costInput = document.createElement('input'); costInput.className = 'comp-cost'; costInput.setAttribute('currency-localization','₱'); costInput.readOnly = true; costInput.value = _formatCurrency(Number(costVal || 0)); costInput.style.width = '100%'; costInput.style.background = '#171717'; costInput.style.border = 'none'; costInput.style.color = '#fff'; costInput.style.cursor = 'default'; costInput.style.pointerEvents = 'none'; costInput.style.textAlign = 'right'; tdCost.appendChild(costInput);

                                                            var tdAction = document.createElement('td'); tdAction.style.padding = '8px'; tdAction.style.width = '45px'; tdAction.style.textAlign = 'center';
                                                            var remBtn = document.createElement('button'); remBtn.className = 'comp-remove btn'; remBtn.title = 'Remove'; remBtn.style.background = 'transparent'; remBtn.style.border = 'none'; remBtn.style.color = '#bbb'; remBtn.style.fontSize = '18px'; remBtn.style.lineHeight = '1'; remBtn.style.width = '30px'; remBtn.style.height = '34px'; remBtn.style.display = 'inline-flex'; remBtn.style.alignItems = 'center'; remBtn.style.justifyContent = 'center'; remBtn.textContent = '🗑'; tdAction.appendChild(remBtn);

                                                            tr.appendChild(tdName); tr.appendChild(tdQty); tr.appendChild(tdCost); tr.appendChild(tdAction);
                                                            cb.appendChild(tr);

                                                            try { qtyInput.addEventListener('input', function() { _fallbackRecalcTotal(); }); } catch(e) {}
                                                            try { remBtn.addEventListener('click', function() { tr.remove(); _fallbackRecalcTotal(); }); } catch (e) {}

                                                            // wire variants if present
                                                            if (variants && variants.length) {
                                                                try { tr._variants = variants; tr._product = { id: product.id || pid, name: product.name || it.name || '', sku: product.sku || '' }; } catch(e){}
                                                                try { nameWrapper.classList.add('interactive'); nameWrapper.addEventListener('click', function(ev){ ev.stopPropagation(); openFallbackVariantDropdown(nameWrapper, tr, tr._product, tr._variants); }); } catch(e){}
                                                            }
                                                        } else {
                                                            // fallback to simple row with provided data
                                                            throw new Error('product not found');
                                                        }
                                                    } catch (err) {
                                                        console.warn('get_product processing error', err);
                                                        // fallback create basic row
                                                        createBasicRow(it);
                                                    }
                                                })
                                                .catch(function(err) {
                                                    console.warn('get_product fetch failed', err);
                                                    createBasicRow(it);
                                                });
                                            pendingFetches.push(p);
                                        } else {
                                            // no product id — create basic row immediately
                                            createBasicRow(it);
                                        }
                                    } catch (ee) { console.warn('fallback append row error', ee); }
                                });

                                // helper to create a basic row from item data
                                function createBasicRow(it) {
                                    try {
                                        var tr = document.createElement('tr');
                                        tr.className = 'component-row';
                                        tr.style.borderBottom = '1px solid #2b2b2b';

                                        var tdName = document.createElement('td'); tdName.style.padding = '8px'; tdName.style.color = '#dbdbdb';
                                        var nameWrapper = document.createElement('div'); nameWrapper.className = 'comp-name'; nameWrapper.style.overflow = 'hidden'; nameWrapper.style.textOverflow = 'ellipsis'; nameWrapper.style.whiteSpace = 'nowrap';
                                        var nameText = document.createElement('div'); nameText.className = 'comp-name-text'; nameText.textContent = it.name || '';
                                        var skuDiv = document.createElement('div'); skuDiv.className = 'comp-sku'; skuDiv.style.color = '#9e9e9e'; skuDiv.style.fontSize = '12px'; skuDiv.style.marginTop = '0'; skuDiv.textContent = it.sku ? ('SKU: ' + it.sku) : '\u00A0';
                                        nameWrapper.appendChild(nameText); nameWrapper.appendChild(skuDiv); tdName.appendChild(nameWrapper);

                                        var tdQty = document.createElement('td'); tdQty.style.padding = '8px'; tdQty.style.width = '120px'; tdQty.style.textAlign = 'right';
                                        var qtyInput = document.createElement('input'); qtyInput.className = 'comp-qty'; qtyInput.type = 'number'; qtyInput.min = '0'; qtyInput.value = (it.qty !== undefined && it.qty !== null) ? it.qty : 1; qtyInput.style.width = '100%'; qtyInput.style.padding = '6px'; qtyInput.style.background = '#171717'; qtyInput.style.border = '1px solid #333'; qtyInput.style.color = '#fff'; qtyInput.style.borderRadius = '4px'; qtyInput.style.textAlign = 'right'; tdQty.appendChild(qtyInput);

                                        var tdCost = document.createElement('td'); tdCost.style.padding = '8px'; tdCost.style.width = '120px'; tdCost.style.textAlign = 'right';
                                        var costInput = document.createElement('input'); costInput.className = 'comp-cost'; costInput.setAttribute('currency-localization','₱'); costInput.readOnly = true; costInput.value = _formatCurrency(Number(it.cost || 0)); costInput.style.width = '100%'; costInput.style.background = '#171717'; costInput.style.border = 'none'; costInput.style.color = '#fff'; costInput.style.cursor = 'default'; costInput.style.pointerEvents = 'none'; costInput.style.textAlign = 'right'; tdCost.appendChild(costInput);

                                        var tdAction = document.createElement('td'); tdAction.style.padding = '8px'; tdAction.style.width = '45px'; tdAction.style.textAlign = 'center';
                                        var remBtn = document.createElement('button'); remBtn.className = 'comp-remove btn'; remBtn.title = 'Remove'; remBtn.style.background = 'transparent'; remBtn.style.border = 'none'; remBtn.style.color = '#bbb'; remBtn.style.fontSize = '18px'; remBtn.style.lineHeight = '1'; remBtn.style.width = '30px'; remBtn.style.height = '34px'; remBtn.style.display = 'inline-flex'; remBtn.style.alignItems = 'center'; remBtn.style.justifyContent = 'center'; remBtn.textContent = '🗑'; tdAction.appendChild(remBtn);

                                        tr.appendChild(tdName); tr.appendChild(tdQty); tr.appendChild(tdCost); tr.appendChild(tdAction);
                                        cb.appendChild(tr);
                                        try { qtyInput.addEventListener('input', function() { _fallbackRecalcTotal(); }); } catch(e) {}
                                        try { remBtn.addEventListener('click', function() { tr.remove(); _fallbackRecalcTotal(); }); } catch(e) {}
                                    } catch (e) { console.warn('createBasicRow error', e); }
                                }

                                // After all fetches complete, run an initial recalc
                                Promise.allSettled(pendingFetches).finally(function() { try { _fallbackRecalcTotal(); } catch(e){} });
                            } catch (er) { console.warn('create fallback error', er); }
                        }, 220);
                    }
                } catch (e) { console.warn('populate create components error', e); }

                return;
            }

            // Normal Add Item flow: restore previous tab (scan/manual) if available
            // If the modal tab logic is loaded, restore the last active tab (currentTab) when available.
            if (typeof showTab === 'function') {
                try {
                    var tabToShow = (typeof currentTab !== 'undefined' && currentTab) ? currentTab : 'scan';
                    showTab(tabToShow, false);
                } catch (e) {
                    // Fallback: show scan tab
                    try { showTab('scan', false); } catch (err) { /* ignore */ }
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
    // Persist selected product ids across pagination/filtering
    // Make the set global so multiple DOMContentLoaded handlers can access it without ReferenceError
    window.selectedProductIds = window.selectedProductIds || new Set();
    var selectedProductIds = window.selectedProductIds;
    // Sorting state: key can be 'name','category','price','cost','margin','stock'
    let sortState = { key: 'name', dir: 1 };
    // Ensure sortable headers are only initialized once (prevents duplicate listeners)
    let headersInitialized = false;

    function filterRows() {
        const rows = Array.from(document.querySelectorAll('#inventory-table-body tr'));
        const catVal = categoryFilter ? categoryFilter.value.trim().toLowerCase() : '';
        const stockVal = stockFilter ? stockFilter.value : '';
            const qRaw = searchInput ? searchInput.value.trim() : '';
            const q = qRaw.toLowerCase();
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
                else if (stockVal === 'out' && rowStock !== 'out') show = false;
                else if (stockVal === 'in' && rowStock !== 'in') show = false;
                else if (stockVal === 'estimated') {
                    // Show rows that were marked as estimated (server set data-estimated='1')
                    const isEstimated = (row.getAttribute('data-estimated') || '') === '1';
                    if (!isEstimated) show = false;
                }
            }

            // Support special searches: "sku:VALUE" and "barcode:VALUE" (case-insensitive)
            const skuPrefix = 'sku:';
            const barcodePrefix = 'barcode:';
            let matched = false;
            const rowSku = (row.getAttribute('data-sku') || '').toLowerCase();
            const rowBarcode = (row.getAttribute('data-barcode') || '').toLowerCase();

            if (q.startsWith(skuPrefix)) {
                const v = q.slice(skuPrefix.length).trim();
                if (v === '' || (rowSku && rowSku.indexOf(v) !== -1)) matched = true;
            } else if (q.startsWith(barcodePrefix)) {
                const v = q.slice(barcodePrefix.length).trim();
                if (v === '' || (rowBarcode && rowBarcode.indexOf(v) !== -1)) matched = true;
            } else {
                // Default behavior: match visible text OR SKU OR barcode
                if (q === '' || text.includes(q) || (rowSku && rowSku.indexOf(q) !== -1) || (rowBarcode && rowBarcode.indexOf(q) !== -1)) matched = true;
            }

            if (!matched) show = false;

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

        // Sync checkbox state for visible rows based on selectedProductIds so selections persist across pages
        try {
            const allCheckboxes = inventoryTableBody ? Array.from(inventoryTableBody.querySelectorAll('.row-select-checkbox')) : [];
            const visibleCheckboxes = allCheckboxes.filter(cb => {
                const r = cb.closest && cb.closest('tr');
                return r && r.style.display !== 'none';
            });
            visibleCheckboxes.forEach(cb => {
                const pid = cb.dataset && cb.dataset.productId ? parseInt(cb.dataset.productId, 10) : null;
                if (pid && !isNaN(pid) && selectedProductIds.has(pid)) cb.checked = true; else cb.checked = false;
            });
        } catch (e) { console.warn('sync checkboxes error', e); }

        // Ensure header/controls reflect the current visible selection
        try { updateSelectAllState(); } catch (e) {}


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

        // Determine whether any visible row requires an indicator cell:
        // either a low-stock badge or an estimated badge.
        const hasVisibleBadge = visibleRows.some(r => {
            const low = (r.getAttribute('data-low') || '') === 'low';
            const est = (r.getAttribute('data-estimated') || '') === '1';
            return low || est;
        });
        const headerExists = !!theadRow.querySelector('th.stock-indicator-header');

        // Defer header insertion until after we ensure each visible row has an
        // indicator cell. The later block below will create the header once if
        // needed. This avoids duplicate insertion caused by checking
        // headerExists before it's updated.

        if (hasVisibleBadge) {
            // Ensure each visible row has an indicator cell. Fill it with
            // the appropriate badge based on row attributes (low vs estimated).
            visibleRows.forEach(row => {
                let td = row.querySelector('td.stock-indicator-cell');
                if (!td) {
                    td = document.createElement('td');
                    td.className = 'stock-indicator-cell';
                    td.style.textAlign = 'left';
                    td.style.paddingLeft = '8px';
                    td.style.whiteSpace = 'nowrap';
                    row.appendChild(td);
                }
                // Decide badge content
                const isLow = (row.getAttribute('data-low') || '') === 'low';
                const isEstimated = (row.getAttribute('data-estimated') || '') === '1';
                if (isLow) {
                    td.innerHTML = "<span class='low-stock-badge'>Low stock</span>";
                } else if (isEstimated) {
                    td.innerHTML = "<span class='estimated-badge low-stock-badge'>Estimated</span>";
                } else {
                    td.innerHTML = '';
                }
            });
            // Ensure header exists
            if (!headerExists) {
                const th = document.createElement('th');
                th.className = 'stock-indicator-header';
                th.style.width = '110px';
                th.style.textAlign = 'left';
                th.style.paddingLeft = '0px';
                th.innerHTML = '&nbsp;';
                const headers = Array.from(theadRow.children);
                if (headers.length >= 7) {
                    const after = headers[6].nextSibling;
                    theadRow.insertBefore(th, after);
                } else {
                    theadRow.appendChild(th);
                }
            }
        } else if (headerExists) {
            // Remove header and any indicator tds from visible rows when none are low/estimated
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

        // NOTE: Removed hover-based Delete visibility. Delete button should only
        // appear when a checkbox is checked. Hovering near a row or checkbox
        // will no longer show the Delete button.
    }
});

</script>
<script>
// Wire import/download/empty-state actions
document.addEventListener('DOMContentLoaded', function() {
    try {
        var importBtn = document.getElementById('importBtn');
        var importFileInput = document.getElementById('importFileInput');
        var importForm = document.getElementById('importForm');
        if (importBtn && importFileInput) {
            importBtn.addEventListener('click', function() { importFileInput.click(); });
        }
        if (importFileInput && importForm) {
            importFileInput.addEventListener('change', function() { if (importFileInput.files && importFileInput.files.length) importForm.submit(); });
        }

        var emptyImportBtn = document.getElementById('emptyImportBtn');
        if (emptyImportBtn && importFileInput) {
            emptyImportBtn.addEventListener('click', function() { importFileInput.click(); });
        }
        var emptyAddItemBtn = document.getElementById('emptyAddItemBtn');
        var addProductBtn = document.getElementById('addProductBtn');
        if (emptyAddItemBtn && addProductBtn) {
            emptyAddItemBtn.addEventListener('click', function() { addProductBtn.click(); });
        }
        // Prevent clicks on the empty-state row from bubbling up to table-level
        // handlers that may open edit/create modals. Buttons inside the empty
        // row will still receive events because stopPropagation is applied on
        // the row itself, not on the button elements.
        try {
            var emptyStateRow = document.querySelector('#inventory-table-body tr.empty-state');
            if (emptyStateRow) {
                emptyStateRow.addEventListener('click', function(ev) { ev.stopPropagation(); });
                emptyStateRow.addEventListener('dblclick', function(ev) { ev.stopPropagation(); });
            }
        } catch (e) { /* ignore */ }
    } catch (e) { console.warn('import handlers init failed', e); }
});
</script>
<script>
// Checkbox select-all behavior
document.addEventListener('DOMContentLoaded', function() {
    const selectAll = document.getElementById('selectAllItems');
    const tableBody = document.getElementById('inventory-table-body');

    function updateSelectAllState() {
        // Only consider checkboxes that are currently visible (on the current page)
        const allCheckboxes = tableBody ? Array.from(tableBody.querySelectorAll('.row-select-checkbox')) : [];
        const checkboxes = allCheckboxes.filter(cb => {
            const row = cb.closest && cb.closest('tr');
            return row && row.style.display !== 'none';
        });
        if (!checkboxes.length) {
            if (selectAll) {
                selectAll.checked = false;
                selectAll.indeterminate = false;
            }
            updateDeleteButtonVisibility();
            return;
        }
        const allChecked = checkboxes.every(cb => cb.checked);
        const someChecked = checkboxes.some(cb => cb.checked);
        if (selectAll) {
            selectAll.checked = allChecked;
            selectAll.indeterminate = !allChecked && someChecked;
        }
        updateDeleteButtonVisibility();
    }

    function updateDeleteButtonVisibility() {
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        if (!deleteBtn) return;
        // Only consider currently visible checkboxes (current page)
        const allCheckboxes = tableBody ? Array.from(tableBody.querySelectorAll('.row-select-checkbox')) : [];
        const visibleCheckboxes = allCheckboxes.filter(cb => {
            const row = cb.closest && cb.closest('tr');
            return row && row.style.display !== 'none';
        });
        const anyChecked = visibleCheckboxes.some(cb => cb.checked);
    // Show the delete button only when at least one visible checkbox is checked.
    const shouldShow = anyChecked;
        deleteBtn.style.display = shouldShow ? '' : 'none';

        // Hide import/export while items are selected (anyChecked true). Restore when none selected.
        const importBtn = document.getElementById('importBtn');
        const exportBtn = document.getElementById('exportBtn');
        if (importBtn) importBtn.style.display = anyChecked ? 'none' : '';
        if (exportBtn) exportBtn.style.display = anyChecked ? 'none' : '';
        // Change the Add Item button label to Create Item only when two or more
        // visible rows are selected. Keep Delete/import/export behavior unchanged.
        try {
            const addBtn = document.getElementById('addProductBtn');
            if (addBtn) {
                // Count number of visible checked boxes (on current page / filter)
                const selectedCount = visibleCheckboxes.filter(cb => cb.checked).length;
                if (selectedCount >= 2) {
                    // keep the same icon, change label to "Create Item"
                    addBtn.innerHTML = '<i class="fa fa-plus"></i> Create Item';
                } else {
                    // For 0 or 1 selected items, show normal Add Item label
                    addBtn.innerHTML = '<i class="fa fa-plus"></i> Add Item';
                }
            }
        } catch (e) { console.warn('update add button label error', e); }
    }

    // showConfirmModal(message) -> Promise<boolean>
    // Resolves true when user confirms, false on cancel/escape.
    function showConfirmModal(message) {
        return new Promise(function(resolve) {
            var modal = document.getElementById('confirmModal');
            var msg = document.getElementById('confirmModalMessage');
            var ok = document.getElementById('confirmOkBtn');
            var cancel = document.getElementById('confirmCancelBtn');
            if (!modal || !ok || !cancel || !msg) {
                // Fallback to native confirm if modal not available
                resolve(window.confirm(message));
                return;
            }
            msg.textContent = message;
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');

            function cleanup() {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
                ok.removeEventListener('click', onOk);
                cancel.removeEventListener('click', onCancel);
                document.removeEventListener('keydown', onKey);
            }

            function onOk(e) { e.preventDefault(); cleanup(); resolve(true); }
            function onCancel(e) { e.preventDefault(); cleanup(); resolve(false); }
            function onKey(e) {
                if (e.key === 'Escape') { onCancel(e); }
                if (e.key === 'Enter') { onOk(e); }
            }

            ok.addEventListener('click', onOk);
            cancel.addEventListener('click', onCancel);
            document.addEventListener('keydown', onKey);

            // Focus OK for keyboard users
            setTimeout(function() { try { ok.focus(); } catch (e) {} }, 10);
        });
    }

    // Lightweight toast/snackbar: showToast(message, type = 'success', duration = 3000)
    function showToast(message, type, duration) {
        type = type || 'success';
        duration = typeof duration === 'number' ? duration : 3000;
        var toast = document.getElementById('appToast');
        var msg = document.getElementById('appToastMsg');
        var icon = document.getElementById('appToastIcon');
        if (!toast || !msg || !icon) return;
        msg.textContent = message;
        // icon per type
        if (type === 'success') icon.textContent = '✓';
        else if (type === 'error') icon.textContent = '⚠';
        else icon.textContent = 'ℹ';
        toast.classList.remove('success','error','info');
        toast.classList.add(type);
        // show
        toast.style.display = 'flex';
        // trigger reflow to ensure transition
        void toast.offsetWidth;
        toast.classList.add('show');
        // auto hide
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(function() {
            toast.classList.remove('show');
            // wait for transition then hide
            setTimeout(function() { try { toast.style.display = 'none'; } catch(e) {} }, 220);
        }, duration);
    }

    // Delete handler: collects selected product ids and calls API
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function() {
            const checkboxes = tableBody ? Array.from(tableBody.querySelectorAll('.row-select-checkbox')) : [];
            // Only delete selected checkboxes (no hover fallback)
            const ids = checkboxes.filter(cb => cb.checked && cb.dataset && cb.dataset.productId).map(cb => parseInt(cb.dataset.productId, 10)).filter(id => !isNaN(id));
            const targetIds = ids.slice();
            if (!targetIds.length) {
                alert('No items selected to delete');
                return;
            }
            const confirmed = await showConfirmModal('Are you sure you want to delete the selected item(s)? This action cannot be undone.');
            if (!confirmed) return;

            // Call API to delete
            fetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_products', product_ids: targetIds })
            }).then(resp => resp.json()).then(res => {
                if (res && res.success) {
                        // Remove any rows (parent/product rows, standalone product rows, and variant rows)
                        targetIds.forEach(id => {
                            try {
                                // 1) Parent row (product with variants)
                                const parentRow = tableBody.querySelector('tr.parent-row[data-product-id="' + id + '"]');
                                if (parentRow) parentRow.remove();

                                // 2) Any row that contains a checkbox for this product (products without variants)
                                const checkbox = tableBody.querySelector('input.row-select-checkbox[data-product-id="' + id + '"]');
                                if (checkbox) {
                                    const tr = checkbox.closest('tr');
                                    if (tr) tr.remove();
                                }

                                // 3) Any variant rows that belong to this product
                                const variantRows = Array.from(tableBody.querySelectorAll('tr.variant-row[data-parent-id="' + id + '"]'));
                                variantRows.forEach(r => r.remove());

                                // 4) Clean from selection set
                                selectedProductIds.delete(id);
                            } catch (e) { console.warn('cleanup deleted row error', e); }
                        });

                        // Clear any temporary hover metadata
                        try { deleteBtn.dataset.hoverProductId = ''; } catch (e) {}

                        // Refresh filters/pagination and controls so page recalculates visible rows
                        setTimeout(() => {
                            try { if (typeof filterRows === 'function') filterRows(); } catch (e) {}
                            try { updateSelectAllState(); } catch (e) {}
                            try { updateDeleteButtonVisibility(); } catch (e) {}
                        }, 40);

                        // Friendly feedback (non-blocking toast)
                        try { if (typeof showSuccessPopup === 'function') showSuccessPopup('Deleted selected items'); else showToast('Deleted selected items', 'success', 3000); } catch (e) {}
                } else {
                    try {
                        var errMsg = (res && res.error) ? res.error : 'Unknown';
                            if (typeof showErrorPopup === 'function') showErrorPopup('Failed to delete items: ' + errMsg);
                            else showToast('Failed to delete items: ' + errMsg, 'error', 5000);
                    } catch (e) {}
                }
            }).catch(err => {
                console.error('delete_products error', err);
                    try { if (typeof showErrorPopup === 'function') showErrorPopup('Delete failed'); else showToast('Delete failed', 'error', 4000); } catch (e) {}
            }).finally(() => { updateDeleteButtonVisibility(); updateSelectAllState(); });
        });
    }

    // When header checkbox toggled, set all visible (non-filtered) rows
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            // Toggle only checkboxes that are currently visible on the page (display != 'none')
            const allCheckboxes = tableBody ? Array.from(tableBody.querySelectorAll('.row-select-checkbox')) : [];
            const visibleCheckboxes = allCheckboxes.filter(cb => {
                const row = cb.closest && cb.closest('tr');
                return row && row.style.display !== 'none';
            });
            visibleCheckboxes.forEach(cb => {
                cb.checked = selectAll.checked;
                // Update selectedProductIds accordingly
                try {
                    const pid = cb.dataset && cb.dataset.productId ? parseInt(cb.dataset.productId, 10) : null;
                    if (pid && !isNaN(pid)) {
                        if (selectAll.checked) selectedProductIds.add(pid);
                        else selectedProductIds.delete(pid);
                    }
                } catch (e) { /* ignore */ }
            });
            // Update state and Delete button visibility after toggling
            setTimeout(updateSelectAllState, 0);
        });
    }

        // Delegate clicks on row checkboxes to update header state and selection set
    if (tableBody) {
        tableBody.addEventListener('change', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('row-select-checkbox')) {
                try {
                    const cb = e.target;
                    const pid = cb.dataset && cb.dataset.productId ? parseInt(cb.dataset.productId, 10) : null;
                    if (pid && !isNaN(pid)) {
                        if (cb.checked) selectedProductIds.add(pid);
                        else selectedProductIds.delete(pid);
                    }
                } catch (err) { console.warn('row checkbox change error', err); }
                // If after this change there are no visible checked boxes, set a short
                // ignore flag so hover doesn't immediately re-show the delete button
                // while the mouse is still on the row the user just unchecked.
                try {
                    const deleteBtn = document.getElementById('deleteSelectedBtn');
                    if (deleteBtn && tableBody) {
                        const allCheckboxes = Array.from(tableBody.querySelectorAll('.row-select-checkbox'));
                        const visibleCheckboxes = allCheckboxes.filter(cb => {
                            const row = cb.closest && cb.closest('tr');
                            return row && row.style.display !== 'none';
                        });
                        const anyChecked = visibleCheckboxes.some(cb => cb.checked);
                        // Hover/ignore flag removed — visibility controlled only by checkbox state
                    }
                } catch (e) { /* ignore */ }
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
