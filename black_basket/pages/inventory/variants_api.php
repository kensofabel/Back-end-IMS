<?php
// Simple, schema-tolerant variants endpoint for the create-tab.
// Returns JSON array of variants for a product: id, name, sku, cost, price, quantity

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';

if (!isset($_SESSION['user']) && !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([]);
    exit;
}

$product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;
if ($product_id <= 0) {
    echo json_encode([]);
    exit;
}

// Try to detect a variants table. Common names: variants, product_variants, item_variants
$variantTable = null;
$candidates = ['variants', 'product_variants', 'item_variants', 'product_variation', 'product_options'];
foreach ($candidates as $tbl) {
    $chk = $conn->query("SHOW TABLES LIKE '" . $conn->real_escape_string($tbl) . "'");
    if ($chk && $chk->num_rows > 0) { $variantTable = $tbl; break; }
}

$variants = [];
if (!$variantTable) {
    // No variants table detected
    echo json_encode([]);
    exit;
}

// Detect columns on variant table
$hasName = false; $hasSku = false; $hasCost = false; $hasPrice = false; $hasQty = false; $hasProductId = false; $hasLowStock = false;
$nameCol = 'name'; $skuCol = 'sku'; $costCol = 'cost'; $priceCol = 'price'; $qtyCol = null; $productIdCol = 'product_id'; $lowStockCol = null;
$colsRes = $conn->query("SHOW COLUMNS FROM `" . $conn->real_escape_string($variantTable) . "`");
if ($colsRes) {
    while ($c = $colsRes->fetch_assoc()) {
        $col = $c['Field'];
        if (in_array($col, ['name','variant_name','title'])) { $hasName = true; $nameCol = $col; }
        if (in_array($col, ['sku','variant_sku','code','ref'])) { $hasSku = true; $skuCol = $col; }
        if (in_array($col, ['cost','variant_cost'])) { $hasCost = true; $costCol = $col; }
        if (in_array($col, ['price','variant_price','unit_price'])) { $hasPrice = true; $priceCol = $col; }
        if (in_array($col, ['quantity','qty','stock','inventory','in_stock'])) { $hasQty = true; $qtyCol = $col; }
        if (in_array($col, ['product_id','parent_id'])) { $hasProductId = true; $productIdCol = $col; }
        if ($col === 'low_stock') { $hasLowStock = true; $lowStockCol = $col; }
    }
}

// Determine product_id column name (fallback to product_id)
$productIdCol = $hasProductId ? 'product_id' : 'product_id';

// Build select
$selectCols = [];
if ($hasName) $selectCols[] = "COALESCE(`" . $conn->real_escape_string($nameCol) . "`, '') AS name";
else $selectCols[] = "'' AS name";
if ($hasSku) $selectCols[] = "COALESCE(`" . $conn->real_escape_string($skuCol) . "`, '') AS sku";
else $selectCols[] = "'' AS sku";
if ($hasCost) $selectCols[] = "COALESCE(`" . $conn->real_escape_string($costCol) . "`, NULL) AS cost";
else $selectCols[] = "NULL AS cost";
if ($hasPrice) $selectCols[] = "COALESCE(`" . $conn->real_escape_string($priceCol) . "`, NULL) AS price";
else $selectCols[] = "NULL AS price";
if ($hasQty && $qtyCol) $selectCols[] = "COALESCE(`" . $conn->real_escape_string($qtyCol) . "`,0) AS quantity";
else $selectCols[] = "0 AS quantity";
if ($hasLowStock && $lowStockCol) $selectCols[] = "COALESCE(`" . $conn->real_escape_string($lowStockCol) . "`, NULL) AS low_stock";
else $selectCols[] = "NULL AS low_stock";
$selectCols[] = "COALESCE(`id`,0) AS id";

$sql = "SELECT " . implode(', ', $selectCols) . " FROM `" . $conn->real_escape_string($variantTable) . "` WHERE `product_id` = " . intval($product_id) . " ORDER BY `id` ASC LIMIT 500";

try {
    $res = $conn->query($sql);
    if ($res && $res->num_rows > 0) {
        while ($row = $res->fetch_assoc()) {
            // normalize
            $variant = [];
            $variant['id'] = isset($row['id']) ? (int)$row['id'] : 0;
            $variant['name'] = isset($row['name']) ? $row['name'] : '';
            $variant['sku'] = isset($row['sku']) ? $row['sku'] : '';
            // Normalize cost and price. Preserve non-numeric price values like the literal 'variable'.
            if (isset($row['cost']) && $row['cost'] !== null && is_numeric($row['cost'])) {
                $variant['cost'] = (float)$row['cost'];
            } else {
                $variant['cost'] = 0;
            }

            if (isset($row['price']) && $row['price'] !== null) {
                $rawPrice = $row['price'];
                // If price is numeric, cast to float. If it's a string like 'variable', preserve as-is.
                if (is_numeric($rawPrice)) {
                    $variant['price'] = (float)$rawPrice;
                } else {
                    $variant['price'] = trim((string)$rawPrice);
                }
            } else {
                $variant['price'] = null;
            }
            $variant['quantity'] = isset($row['quantity']) ? (int)$row['quantity'] : 0;
            $variant['low_stock'] = isset($row['low_stock']) && $row['low_stock'] !== null ? (int)$row['low_stock'] : null;
            $variants[] = $variant;
        }
    }
} catch (Exception $e) {
    // ignore and return empty
    $variants = [];
}

echo json_encode($variants);

?>