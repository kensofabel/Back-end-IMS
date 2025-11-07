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
$hasName = false; $hasSku = false; $hasCost = false; $hasPrice = false; $hasQty = false; $hasProductId = false;
$colsRes = $conn->query("SHOW COLUMNS FROM `" . $conn->real_escape_string($variantTable) . "`");
if ($colsRes) {
    while ($c = $colsRes->fetch_assoc()) {
        $col = $c['Field'];
        if (in_array($col, ['name','variant_name','title'])) $hasName = true;
        if (in_array($col, ['sku','variant_sku','code','ref'])) $hasSku = true;
        if (in_array($col, ['cost','variant_cost'])) $hasCost = true;
        if (in_array($col, ['price','variant_price','unit_price'])) $hasPrice = true;
        if (in_array($col, ['quantity','qty','stock','inventory'])) $hasQty = true;
        if (in_array($col, ['product_id','parent_id'])) $hasProductId = true;
    }
}

// Determine product_id column name (fallback to product_id)
$productIdCol = $hasProductId ? 'product_id' : 'product_id';

// Build select
$selectCols = [];
if ($hasName) $selectCols[] = "COALESCE(`name`, '') AS name";
else $selectCols[] = "'' AS name";
if ($hasSku) $selectCols[] = "COALESCE(`sku`, '') AS sku";
else $selectCols[] = "'' AS sku";
if ($hasCost) $selectCols[] = "COALESCE(`cost`, NULL) AS cost";
else $selectCols[] = "NULL AS cost";
if ($hasPrice) $selectCols[] = "COALESCE(`price`, NULL) AS price";
else $selectCols[] = "NULL AS price";
if ($hasQty) $selectCols[] = "COALESCE(`quantity`,0) AS quantity";
else $selectCols[] = "0 AS quantity";
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
            $variant['cost'] = isset($row['cost']) && $row['cost'] !== null ? (float)$row['cost'] : (isset($row['price']) && $row['price'] !== null ? (float)$row['price'] : 0);
            $variant['price'] = isset($row['price']) && $row['price'] !== null ? (float)$row['price'] : null;
            $variant['quantity'] = isset($row['quantity']) ? (int)$row['quantity'] : 0;
            $variants[] = $variant;
        }
    }
} catch (Exception $e) {
    // ignore and return empty
    $variants = [];
}

echo json_encode($variants);

?>