<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';

// Simple product search endpoint used by the create-tab autocomplete.
// Returns an array of products with fields: id, name, category, unit_price, quantity

if (!isset($_SESSION['user']) && !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([]);
    exit;
}

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$limit = 50;

// Detect which price column exists in products table
$priceCol = null;
$candidates = ['unit_price', 'price', 'product_price'];
foreach ($candidates as $c) {
    $chk = $conn->query("SHOW COLUMNS FROM `products` LIKE '" . $conn->real_escape_string($c) . "'");
    if ($chk && $chk->num_rows > 0) { $priceCol = $c; break; }
}
$priceExpr = $priceCol ? "p.`" . $priceCol . "`" : "0";

// Detect cost column if present
$costCol = null;
$costChk = $conn->query("SHOW COLUMNS FROM `products` LIKE 'cost'");
if ($costChk && $costChk->num_rows > 0) $costCol = 'cost';

// Detect SKU / barcode columns (pick primary sku and barcode if present)
$skuCol = null;
$barcodeCol = null;
$skuCandidates = ['sku', 'product_sku', 'code', 'ref'];
foreach ($skuCandidates as $c) {
    $chk = $conn->query("SHOW COLUMNS FROM `products` LIKE '" . $conn->real_escape_string($c) . "'");
    if ($chk && $chk->num_rows > 0) { $skuCol = $c; break; }
}
$barcodeChk = $conn->query("SHOW COLUMNS FROM `products` LIKE 'barcode'");
if ($barcodeChk && $barcodeChk->num_rows > 0) $barcodeCol = 'barcode';


// Check if inventory table exists to include quantity
$invExists = false;
$check = $conn->query("SHOW TABLES LIKE 'inventory'");
if ($check && $check->num_rows > 0) $invExists = true;

$products = [];
try {
    if ($q !== '') {
    $term = '%' . $conn->real_escape_string($q) . '%';
    // Build select list dynamically to include sku/barcode if present
    $sql = "SELECT p.id, p.name, COALESCE(c.name, '') AS category, " . $priceExpr . " AS unit_price";
    // include cost
    if ($costCol) $sql .= ", p.`" . $costCol . "` AS cost";
    else $sql .= ", NULL AS cost";
    // include sku/barcode if detected
    if ($skuCol) $sql .= ", p.`" . $skuCol . "` AS sku";
    else $sql .= ", NULL AS sku";
    if ($barcodeCol) $sql .= ", p.`" . $barcodeCol . "` AS barcode";
    else $sql .= ", NULL AS barcode";
        if ($invExists) $sql .= ", COALESCE(i.quantity,0) AS quantity";
        else $sql .= ", 0 AS quantity";
        $sql .= " FROM products p LEFT JOIN categories c ON p.category_id = c.id";
        if ($invExists) $sql .= " LEFT JOIN inventory i ON p.id = i.product_id";
        // Use detected sku/barcode columns in WHERE when present to avoid errors
        $whereParts = [];
        $whereParts[] = "p.name LIKE '" . $term . "'";
        if ($skuCol) $whereParts[] = "p.`" . $skuCol . "` LIKE '" . $term . "'";
        if ($barcodeCol) $whereParts[] = "p.`" . $barcodeCol . "` LIKE '" . $term . "'";
        $sql .= " WHERE (" . implode(' OR ', $whereParts) . ") ORDER BY p.name ASC LIMIT " . intval($limit);
    } else {
    // No query: return recent/popular products (limit)
    $sql = "SELECT p.id, p.name, COALESCE(c.name, '') AS category, " . $priceExpr . " AS unit_price";
    if ($costCol) $sql .= ", p.`" . $costCol . "` AS cost";
    else $sql .= ", NULL AS cost";
    if ($skuCol) $sql .= ", p.`" . $skuCol . "` AS sku";
    else $sql .= ", NULL AS sku";
    if ($barcodeCol) $sql .= ", p.`" . $barcodeCol . "` AS barcode";
    else $sql .= ", NULL AS barcode";
        if ($invExists) $sql .= ", COALESCE(i.quantity,0) AS quantity";
        else $sql .= ", 0 AS quantity";
        $sql .= " FROM products p LEFT JOIN categories c ON p.category_id = c.id";
        if ($invExists) $sql .= " LEFT JOIN inventory i ON p.id = i.product_id";
        $sql .= " ORDER BY p.name ASC LIMIT " . intval($limit);
    }

    $res = $conn->query($sql);
    if ($res && $res->num_rows > 0) {
        while ($row = $res->fetch_assoc()) {
            // Normalize types
            $row['unit_price'] = $row['unit_price'] !== null ? (float)$row['unit_price'] : 0;
            // Provide backwards-compatible keys frontend expects: 'price' and 'cost'
            if (!isset($row['price'])) $row['price'] = $row['unit_price'];
            if (!isset($row['cost'])) $row['cost'] = ($row['cost'] !== null ? (float)$row['cost'] : ($row['unit_price'] !== null ? (float)$row['unit_price'] : 0));
            $row['quantity'] = isset($row['quantity']) ? (int)$row['quantity'] : 0;
            $products[] = $row;
        }
    }
} catch (Exception $e) {
    // On error, return empty array (frontend handles empty results)
    $products = [];
}

echo json_encode($products);

?>
