<?php
header('Content-Type: application/json');
// Simple endpoint to return product + variants by product_id
// Expects GET parameter: product_id

require_once __DIR__ . '/../../config/db.php';

// Safe evaluator for quantity expressions (fractions/arithmetic like "1/4" or "3+1/2")
if (!function_exists('evaluate_quantity_expr')) {
    function evaluate_quantity_expr($s) {
        $s = trim((string)$s);
        if ($s === '') return 0.0;
        // remove common grouping/currency characters
        $s = preg_replace('/[,_\s\x{20B1}\$]/u', '', $s);
        // allow only digits, operators, parentheses, decimal point and whitespace
        if (!preg_match('/^[0-9+\-\*\/().\s]+$/', $s)) return 0.0;
        // block suspicious operator combos
        if (preg_match('/\/\/|\/\*|\*\*/', $s)) return 0.0;
        // evaluate in a restricted way
        $__tmp = null;
        $code = '$__tmp = (' . $s . ');';
        $ok = @eval($code);
        if ($ok === false) return 0.0;
        if (isset($__tmp) && is_numeric($__tmp)) { $v = floatval($__tmp); unset($__tmp); return $v; }
        unset($__tmp);
        return 0.0;
    }
}

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
        // New product_components schema: component_cost/name/sku are not stored here.
        // Select only references and qty; resolve metadata from products/product_variants below.
        $compSql = "SELECT pc.component_product_id, pc.component_variant_id, pc.component_qty FROM product_components pc WHERE pc.parent_product_id = ? ORDER BY pc.id ASC";
        if ($cstmt = $conn->prepare($compSql)) {
            $cstmt->bind_param('i', $pid);
            $cstmt->execute();
            $cres = $cstmt->get_result();
            // We'll compute a derived cost from components (sum of component cost * qty)
            $computedCost = 0.0;
            while ($c = $cres->fetch_assoc()) {
                $comp = [
                    'component_product_id' => $c['component_product_id'] !== null ? (int)$c['component_product_id'] : null,
                    'component_variant_id' => $c['component_variant_id'] !== null ? (int)$c['component_variant_id'] : null,
                    'component_qty' => $c['component_qty'] !== null ? $c['component_qty'] : null,
                    // We'll resolve these from referenced rows below
                    'component_cost' => null,
                    'component_name' => '',
                    'component_sku' => ''
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
                            // Resolve component display fields from variant
                            $comp['component_name'] = isset($vr['name']) ? $vr['name'] : '';
                            $comp['component_sku'] = isset($vr['sku']) ? $vr['sku'] : '';
                            $comp['component_cost'] = isset($vr['cost']) ? $vr['cost'] : null;
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
                            $comp['component_name'] = isset($pprow['name']) ? $pprow['name'] : '';
                            $comp['component_sku'] = isset($pprow['sku']) ? $pprow['sku'] : '';
                            $comp['component_cost'] = isset($pprow['cost']) ? $pprow['cost'] : null;
                        }
                        $ppStmt->close();
                    }
                }

                // Accumulate computed cost where possible (evaluate stored qty expressions safely)
                $compQty = 0.0;
                if ($comp['component_qty'] !== null) {
                    $compQty = evaluate_quantity_expr($comp['component_qty']);
                }
                $compCost = $comp['component_cost'] !== null ? floatval($comp['component_cost']) : 0.0;
                $computedCost += ($compCost * $compQty);

                $components[] = $comp;
            }

            // If composite product and parent cost missing/zero, prefer computed cost from components
            if (!empty($components) && isset($product['is_composite']) && intval($product['is_composite']) === 1) {
                $parentCostIsEmpty = ($product['cost'] === null || $product['cost'] === '' || floatval($product['cost']) == 0);
                if ($parentCostIsEmpty) {
                    $product['cost'] = $computedCost;
                }
                // If SKU/name missing on parent, attempt to fallback to first component's values
                if ((empty($product['sku']) || $product['sku'] === null) && count($components) > 0) {
                    foreach ($components as $cc) {
                        if (!empty($cc['component_sku'])) { $product['sku'] = $cc['component_sku']; break; }
                    }
                }
                if ((empty($product['name']) || $product['name'] === null) && count($components) > 0) {
                    foreach ($components as $cc) {
                        if (!empty($cc['component_name'])) { $product['name'] = $cc['component_name']; break; }
                    }
                }
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
