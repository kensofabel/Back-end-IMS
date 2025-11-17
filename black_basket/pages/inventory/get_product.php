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
    // Include barcode in product selection so clients can prefill barcode field
    // include track_stock so clients know whether stock fields should be shown
    $stmt = $conn->prepare("SELECT id, name, sku, barcode, price, cost, in_stock, low_stock, track_stock, pos_available, type, color, shape, image_url, is_composite FROM products WHERE id = ? LIMIT 1");
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
        'barcode' => isset($prod['barcode']) ? $prod['barcode'] : '',
        'price' => $prod['price'],
        'cost' => $prod['cost'],
        'in_stock' => $prod['in_stock'],
        'low_stock' => $prod['low_stock'],
        'track_stock' => isset($prod['track_stock']) ? (int)$prod['track_stock'] : 0,
        'pos_available' => isset($prod['pos_available']) ? (int)$prod['pos_available'] : 0,
        'type' => $prod['type'],
        'color' => isset($prod['color']) ? $prod['color'] : '',
        'shape' => isset($prod['shape']) ? $prod['shape'] : '',
        'image_url' => isset($prod['image_url']) ? $prod['image_url'] : '',
        'is_composite' => isset($prod['is_composite']) ? (int)$prod['is_composite'] : 0,
        'variants' => $variants
    ];

    // If product is composite, include component rows from product_components table
    $components = [];
    try {
        $compSql = "SELECT pc.component_product_id, pc.component_variant_id, pc.component_qty, pc.component_cost, pc.component_name, pc.component_sku FROM product_components pc WHERE pc.parent_product_id = ? ORDER BY pc.id ASC";
        if ($cstmt = $conn->prepare($compSql)) {
            $cstmt->bind_param('i', $pid);
            $cstmt->execute();
            $cres = $cstmt->get_result();
            while ($c = $cres->fetch_assoc()) {
                $comp = [
                    'component_product_id' => $c['component_product_id'] !== null ? (int)$c['component_product_id'] : null,
                    'component_variant_id' => $c['component_variant_id'] !== null ? (int)$c['component_variant_id'] : null,
                    'component_qty' => $c['component_qty'] !== null ? $c['component_qty'] : null,
                    'component_cost' => $c['component_cost'] !== null ? $c['component_cost'] : null,
                    'component_name' => $c['component_name'] !== null ? $c['component_name'] : '',
                    'component_sku' => $c['component_sku'] !== null ? $c['component_sku'] : ''
                ];

                // Enrich component with product/variant metadata when available
                if ($comp['component_variant_id']) {
                    $vstmt = $conn->prepare("SELECT id, product_id, name, sku, price, cost FROM product_variants WHERE id = ? LIMIT 1");
                    if ($vstmt) {
                        $vstmt->bind_param('i', $comp['component_variant_id']);
                        $vstmt->execute();
                        $vres = $vstmt->get_result();
                        if ($vr = $vres->fetch_assoc()) {
                            // fetch parent product basic info
                            $pp = null;
                            $ppStmt = $conn->prepare("SELECT id, name, sku, price, cost FROM products WHERE id = ? LIMIT 1");
                            if ($ppStmt) {
                                $ppStmt->bind_param('i', $vr['product_id']);
                                $ppStmt->execute();
                                $ppres = $ppStmt->get_result();
                                if ($pprow = $ppres->fetch_assoc()) {
                                    $pp = $pprow;
                                }
                                $ppStmt->close();
                            }
                            $comp['product'] = $pp ? [
                                'id' => (int)$pp['id'],
                                'name' => $pp['name'],
                                'sku' => $pp['sku'],
                                'price' => $pp['price'],
                                'cost' => $pp['cost']
                            ] : null;
                            $comp['variant'] = [
                                'id' => (int)$vr['id'],
                                'name' => $vr['name'],
                                'sku' => $vr['sku'],
                                'price' => $vr['price'],
                                'cost' => $vr['cost']
                            ];
                        }
                        $vstmt->close();
                    }
                } else if ($comp['component_product_id']) {
                    // component is a whole product (no specific variant)
                    $ppStmt = $conn->prepare("SELECT id, name, sku, price, cost FROM products WHERE id = ? LIMIT 1");
                    if ($ppStmt) {
                        $ppStmt->bind_param('i', $comp['component_product_id']);
                        $ppStmt->execute();
                        $ppres = $ppStmt->get_result();
                        if ($pprow = $ppres->fetch_assoc()) {
                            $comp['product'] = [
                                'id' => (int)$pprow['id'],
                                'name' => $pprow['name'],
                                'sku' => $pprow['sku'],
                                'price' => $pprow['price'],
                                'cost' => $pprow['cost']
                            ];
                        }
                        $ppStmt->close();
                    }
                }

                $components[] = $comp;
            }
            $cstmt->close();
        }
    } catch (Exception $e) {
        // non-fatal: ignore components on error
    }

    if (!empty($components)) $product['components'] = $components;

    echo json_encode(["success" => true, "product" => $product]);
    exit;
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => "exception", "message" => $e->getMessage()]);
    exit;
}
