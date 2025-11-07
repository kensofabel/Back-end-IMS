<?php
header('Content-Type: application/json');
// Simple endpoint to return product + variants by product_id
// Expects GET parameter: product_id

require_once __DIR__ . '/../../config/db.php';

if (!isset($_GET['product_id']) || !is_numeric($_GET['product_id'])) {
    echo json_encode(["success" => false, "error" => "missing_product_id"]);
    exit;
}

$pid = (int) $_GET['product_id'];

try {
    $stmt = $conn->prepare("SELECT id, name, sku, price, cost, in_stock, low_stock, type FROM products WHERE id = ? LIMIT 1");
    $stmt->bind_param('i', $pid);
    $stmt->execute();
    $res = $stmt->get_result();
    $prod = $res->fetch_assoc();
    $stmt->close();

    if (!$prod) {
        echo json_encode(["success" => false, "error" => "not_found"]);
        exit;
    }

    // fetch variants if table exists
    $variants = [];
    $vSql = "SELECT id, name, sku, barcode, price, cost, in_stock, low_stock, pos_available FROM product_variants WHERE product_id = ? ORDER BY name ASC";
    if ($vstmt = $conn->prepare($vSql)) {
        $vstmt->bind_param('i', $pid);
        $vstmt->execute();
        $vres = $vstmt->get_result();
        while ($v = $vres->fetch_assoc()) {
            $variants[] = [
                'id' => (int)$v['id'],
                'name' => $v['name'],
                'sku' => $v['sku'],
                'barcode' => $v['barcode'],
                'price' => $v['price'],
                'cost' => $v['cost'],
                'in_stock' => $v['in_stock'],
                'low_stock' => $v['low_stock'],
                'pos_available' => (int)$v['pos_available']
            ];
        }
        $vstmt->close();
    }

    // normalize product
    $product = [
        'id' => (int)$prod['id'],
        'name' => $prod['name'],
        'sku' => $prod['sku'],
        'price' => $prod['price'],
        'cost' => $prod['cost'],
        'in_stock' => $prod['in_stock'],
        'low_stock' => $prod['low_stock'],
        'type' => $prod['type'],
        'variants' => $variants
    ];

    echo json_encode(["success" => true, "product" => $product]);
    exit;
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => "exception", "message" => $e->getMessage()]);
    exit;
}
