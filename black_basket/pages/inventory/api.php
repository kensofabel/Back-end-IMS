<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';

// Check if user is logged in and has permission (simplified example)
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Quick find endpoint: ?find=sku:VALUE or ?find=barcode:VALUE
        if (isset($_GET['find'])) {
            $find = $conn->real_escape_string(trim($_GET['find']));
            // Expect format type:value or just value (search sku and barcode)
            $parts = explode(':', $find, 2);
            if (count($parts) === 2) {
                $type = $parts[0];
                $value = $parts[1];
            } else {
                $type = '';
                $value = $parts[0];
            }

            if ($type === 'sku') {
                // New behavior: for SKU, return product and its variants (like barcode)
                $sql = "SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.sku='" . $conn->real_escape_string($value) . "' LIMIT 1";
                $res = $conn->query($sql);
                if ($res && $res->num_rows > 0) {
                    $row = $res->fetch_assoc();
                    $row['type'] = 'product';
                    // Fetch variants for this product
                    $variants = [];
                    $var_sql = "SELECT pv.id AS variant_id, pv.product_id, pv.name AS variant_name, pv.sku, pv.barcode, pv.in_stock AS variant_in_stock, pv.low_stock AS variant_low_stock, pv.pos_available FROM product_variants pv WHERE pv.product_id=" . intval($row['id']);
                    $var_res = $conn->query($var_sql);
                    if ($var_res && $var_res->num_rows > 0) {
                        while ($vrow = $var_res->fetch_assoc()) {
                            $variants[] = $vrow;
                        }
                    }
                    $row['variants'] = $variants;
                    echo json_encode(['found' => true, 'results' => [$row], 'product' => $row]);
                } else {
                    echo json_encode(['found' => false]);
                }
            } else if ($type === 'barcode') {
                // For barcode searches, return products with this barcode and group their variants
                $val = $conn->real_escape_string($value);
                $results = [];

                // Products that have this barcode
                $prod_sql = "SELECT p.id, p.name, p.track_stock, p.in_stock, p.low_stock, p.sku, p.barcode, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.barcode='" . $val . "'";
                $prod_res = $conn->query($prod_sql);
                if ($prod_res && $prod_res->num_rows > 0) {
                    while ($row = $prod_res->fetch_assoc()) {
                        $row['type'] = 'product';
                        // Fetch variants for this product
                        $variants = [];
                        $var_sql = "SELECT pv.id AS variant_id, pv.product_id, pv.name AS variant_name, pv.sku, pv.barcode, pv.in_stock AS variant_in_stock, pv.low_stock AS variant_low_stock, pv.pos_available FROM product_variants pv WHERE pv.product_id=" . intval($row['id']);
                        $var_res = $conn->query($var_sql);
                        if ($var_res && $var_res->num_rows > 0) {
                            while ($vrow = $var_res->fetch_assoc()) {
                                $variants[] = $vrow;
                            }
                        }
                        $row['variants'] = $variants;
                        $results[] = $row;
                    }
                }

                // Variants that have this barcode but whose parent product does NOT have this barcode
                $var_sql = "SELECT pv.id AS variant_id, pv.product_id, pv.name AS variant_name, pv.sku, pv.barcode, pv.in_stock AS variant_in_stock, pv.low_stock AS variant_low_stock, pv.pos_available, p.name AS product_name, p.track_stock AS product_track_stock, c.name AS category FROM product_variants pv LEFT JOIN products p ON pv.product_id = p.id LEFT JOIN categories c ON p.category_id = c.id WHERE pv.barcode='" . $val . "' AND (p.barcode IS NULL OR p.barcode != '" . $val . "')";
                $var_res = $conn->query($var_sql);
                if ($var_res && $var_res->num_rows > 0) {
                    while ($row = $var_res->fetch_assoc()) {
                        $row['type'] = 'variant';
                        $results[] = $row;
                    }
                }

                if (count($results) > 0) {
                    // If exactly one result and it's a product, include 'product' for backward compatibility
                    $singleProduct = (count($results) === 1 && $results[0]['type'] === 'product') ? $results[0] : null;
                    echo json_encode(['found' => true, 'results' => $results, 'product' => $singleProduct]);
                } else {
                    echo json_encode(['found' => false]);
                }
            } else {
                // search both (legacy behavior)
                $sql = "SELECT * FROM products WHERE sku='" . $conn->real_escape_string($value) . "' OR barcode='" . $conn->real_escape_string($value) . "' LIMIT 1";
                $res = $conn->query($sql);
                if ($res && $res->num_rows > 0) {
                    echo json_encode(['found' => true, 'product' => $res->fetch_assoc()]);
                } else {
                    echo json_encode(['found' => false]);
                }
            }
            break;
        }

        if (isset($_GET['categories'])) {
            // Return all category names
            $cat_sql = "SELECT name FROM categories ORDER BY name ASC";
            $cat_res = $conn->query($cat_sql);
            $categories = [];
            while ($row = $cat_res->fetch_assoc()) {
                $categories[] = $row['name'];
            }
            echo json_encode($categories);
            break;
        }

        // ...existing code for products...
        $sql = "SELECT p.id, p.name, p.category, p.unit_price, i.quantity
                FROM products p
                LEFT JOIN inventory i ON p.id = i.product_id";
        $result = $conn->query($sql);
        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        echo json_encode($products);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input']);
            exit;
        }

        // Lightweight action: update product-level track_stock from client toggles
        if (isset($data['action']) && $data['action'] === 'update_track') {
            $product_id = isset($data['product_id']) ? intval($data['product_id']) : 0;
            $value = isset($data['value']) ? intval($data['value']) : 0;
            if ($product_id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid product id']);
                exit;
            }
            $upd_sql = "UPDATE products SET track_stock = " . ($value ? 1 : 0) . " WHERE id = " . $product_id;
            if ($conn->query($upd_sql)) {
                echo json_encode(['success' => true, 'product_id' => $product_id, 'track_stock' => ($value ? 1 : 0)]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $conn->error]);
            }
            exit;
        }
        // Lightweight action: update product category
        if (isset($data['action']) && $data['action'] === 'update_category') {
            $product_id = isset($data['product_id']) ? intval($data['product_id']) : 0;
            // category_id may be null (unset) or integer
            $category_id = array_key_exists('category_id', $data) ? $data['category_id'] : null;
            if ($product_id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid product id']);
                exit;
            }

            try {
                if ($category_id === null || $category_id === '') {
                    // Clear category
                    $upd = "UPDATE products SET category_id = NULL WHERE id = " . $product_id;
                    if ($conn->query($upd)) {
                        echo json_encode(['success' => true, 'product_id' => $product_id, 'category_id' => null, 'category_name' => '']);
                    } else {
                        http_response_code(500);
                        echo json_encode(['error' => $conn->error]);
                    }
                    exit;
                } else {
                    $cat_id = intval($category_id);
                    // Validate category exists
                    $cres = $conn->query("SELECT name FROM categories WHERE id = " . $cat_id . " LIMIT 1");
                    if (!$cres || $cres->num_rows === 0) {
                        http_response_code(404);
                        echo json_encode(['error' => 'Category not found']);
                        exit;
                    }
                    $cat_row = $cres->fetch_assoc();
                    $cat_name = $cat_row['name'];
                    $upd = "UPDATE products SET category_id = " . $cat_id . " WHERE id = " . $product_id;
                    if ($conn->query($upd)) {
                        echo json_encode(['success' => true, 'product_id' => $product_id, 'category_id' => $cat_id, 'category_name' => $cat_name]);
                    } else {
                        http_response_code(500);
                        echo json_encode(['error' => $conn->error]);
                    }
                    exit;
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
                exit;
            }
        }
        // Lightweight action: add stock to product or variant
        if (isset($data['action']) && $data['action'] === 'add_stock') {
            $product_id = isset($data['product_id']) ? intval($data['product_id']) : 0;
            $variant_id = isset($data['variant_id']) ? intval($data['variant_id']) : 0; // 0 means none
            $qty = isset($data['qty']) ? floatval($data['qty']) : null;
            $unit = isset($data['unit']) ? trim($data['unit']) : '';

            if ($qty === null || $qty <= 0 || $product_id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid parameters']);
                exit;
            }

            // Helper to parse numeric + unit from stored string like '5 pcs' or '10'
            $parse = function($s) {
                $s = trim((string)$s);
                if ($s === '' || $s === null) return [0.0, ''];
                // Match leading number (integer or float)
                if (preg_match('/^([0-9]+(?:\.[0-9]+)?)(?:\s*(.*))?$/', $s, $m)) {
                    $num = floatval($m[1]);
                    $u = isset($m[2]) ? trim($m[2]) : '';
                    return [$num, $u];
                }
                return [0.0, ''];
            };

            try {
                if ($variant_id && $variant_id > 0) {
                    // Update variant
                    $sel = $conn->query("SELECT in_stock, low_stock FROM product_variants WHERE id=" . $variant_id . " AND product_id=" . $product_id . " LIMIT 1");
                    if (!$sel || $sel->num_rows === 0) {
                        http_response_code(404);
                        echo json_encode(['error' => 'Variant not found']);
                        exit;
                    }
                    $row = $sel->fetch_assoc();
                    list($curNum, $curUnit) = $parse($row['in_stock']);
                    list($lowNum, $lowUnit) = $parse($row['low_stock']);
                    $unitToUse = ($curUnit !== '' && $curUnit !== '- -') ? $curUnit : (($unit !== '' && $unit !== '- -') ? $unit : '');
                    $newNum = $curNum + $qty;
                    // Format new_in_stock (integer if whole)
                    $new_in_stock = ($newNum == floor($newNum)) ? (string)intval($newNum) : (string)round($newNum, 2);
                    if ($unitToUse) $new_in_stock .= ' ' . $conn->real_escape_string($unitToUse);
                    $upd = "UPDATE product_variants SET in_stock='" . $conn->real_escape_string($new_in_stock) . "' WHERE id=" . $variant_id;
                    if (!$conn->query($upd)) throw new Exception($conn->error);
                    // Determine status for variant
                    $status = 'In stock';
                    if ($newNum <= 0) $status = 'Out of stock';
                    else if ($lowNum > 0 && $newNum <= $lowNum) $status = 'Low stock';

                    // Recalculate parent product total by summing numeric parts of variants
                    $pv_res = $conn->query("SELECT in_stock FROM product_variants WHERE product_id=" . intval($product_id));
                    $parentSum = 0.0;
                    $parentUnit = '';
                    if ($pv_res) {
                        while ($pv_row = $pv_res->fetch_assoc()) {
                            $txt = trim((string)$pv_row['in_stock']);
                            if ($txt === '') continue;
                            if (preg_match('/^([0-9]+(?:\.[0-9]+)?)(?:\s*(.*))?$/', $txt, $mm)) {
                                $n = floatval($mm[1]);
                                $u = isset($mm[2]) ? trim($mm[2]) : '';
                                $parentSum += $n;
                                if ($parentUnit === '' && $u !== '' && $u !== '- -') $parentUnit = $u;
                            }
                        }
                    }
                    // Format parent new_in_stock
                    $parentNew = ($parentSum == floor($parentSum)) ? (string)intval($parentSum) : (string)round($parentSum, 2);
                    if ($parentUnit) $parentNew .= ' ' . $conn->real_escape_string($parentUnit);
                    // Persist to products table
                    $upd2 = "UPDATE products SET in_stock='" . $conn->real_escape_string($parentNew) . "' WHERE id=" . intval($product_id);
                    if (!$conn->query($upd2)) {
                        // If parent update fails, continue but include error info
                        // Do not throw to avoid losing variant update
                        $parentUpdateError = $conn->error;
                    } else {
                        $parentUpdateError = null;
                    }
                    // Determine parent status using products.low_stock when available
                    $parentLow = '';
                    $p_sel = $conn->query("SELECT low_stock FROM products WHERE id=" . intval($product_id) . " LIMIT 1");
                    if ($p_sel && $p_sel->num_rows > 0) {
                        $p_row = $p_sel->fetch_assoc();
                        $parentLow = trim((string)$p_row['low_stock']);
                    }
                    $parentStatus = '—';
                    if ($parentSum !== 0.0 || $parentSum === 0.0) {
                        if ($parentSum <= 0) $parentStatus = 'Out of stock';
                        else if ($parentLow !== '' && floatval($parentLow) > 0 && $parentSum <= floatval($parentLow)) $parentStatus = 'Low stock';
                        else $parentStatus = 'In stock';
                    }

                    echo json_encode(['success' => true, 'variant_id' => $variant_id, 'product_id' => $product_id, 'new_in_stock' => $new_in_stock, 'status' => $status, 'parent_new_in_stock' => $parentNew, 'parent_status' => $parentStatus, 'parent_update_error' => $parentUpdateError]);
                    exit;
                } else {
                    // Update product-level
                    $sel = $conn->query("SELECT in_stock, low_stock FROM products WHERE id=" . $product_id . " LIMIT 1");
                    if (!$sel || $sel->num_rows === 0) {
                        http_response_code(404);
                        echo json_encode(['error' => 'Product not found']);
                        exit;
                    }
                    $row = $sel->fetch_assoc();
                    list($curNum, $curUnit) = $parse($row['in_stock']);
                    list($lowNum, $lowUnit) = $parse($row['low_stock']);
                    $unitToUse = ($curUnit !== '' && $curUnit !== '- -') ? $curUnit : (($unit !== '' && $unit !== '- -') ? $unit : '');
                    $newNum = $curNum + $qty;
                    $new_in_stock = ($newNum == floor($newNum)) ? (string)intval($newNum) : (string)round($newNum, 2);
                    if ($unitToUse) $new_in_stock .= ' ' . $conn->real_escape_string($unitToUse);
                    $upd = "UPDATE products SET in_stock='" . $conn->real_escape_string($new_in_stock) . "' WHERE id=" . $product_id;
                    if (!$conn->query($upd)) throw new Exception($conn->error);
                    $status = 'In stock';
                    if ($newNum <= 0) $status = 'Out of stock';
                    else if ($lowNum > 0 && $newNum <= $lowNum) $status = 'Low stock';
                    echo json_encode(['success' => true, 'product_id' => $product_id, 'new_in_stock' => $new_in_stock, 'status' => $status]);
                    exit;
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
                exit;
            }
        }
        // If this POST is NOT a lightweight action, treat it as product creation
        if (!isset($data['action']) || $data['action'] === '') {
         	$name = isset($data['name']) ? $conn->real_escape_string($data['name']) : '';
        	if ($name === '') {
        		http_response_code(400);
        		echo json_encode(['error' => 'Name is required']);
        		exit;
        	}
        	// (continue below with product creation)
        }
        // Lightweight action: adjust stock by signed qty (supports undo by negative qty)
        if (isset($data['action']) && $data['action'] === 'adjust_stock') {
            $product_id = isset($data['product_id']) ? intval($data['product_id']) : 0;
            $variant_id = isset($data['variant_id']) ? intval($data['variant_id']) : 0;
            // qty can be positive or negative
            $qty = isset($data['qty']) ? floatval($data['qty']) : null;
            $unit = isset($data['unit']) ? trim($data['unit']) : '';

            if ($qty === null || $product_id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid parameters']);
                exit;
            }

            try {
                if ($variant_id && $variant_id > 0) {
                    $sel = $conn->query("SELECT in_stock, low_stock FROM product_variants WHERE id=" . $variant_id . " AND product_id=" . $product_id . " LIMIT 1");
                    if (!$sel || $sel->num_rows === 0) {
                        http_response_code(404);
                        echo json_encode(['error' => 'Variant not found']);
                        exit;
                    }
                    $row = $sel->fetch_assoc();
                    // parse existing
                    if (preg_match('/^([0-9]+(?:\.[0-9]+)?)(?:\s*(.*))?$/', trim((string)$row['in_stock']), $m)) {
                        $curNum = floatval($m[1]);
                        $curUnit = isset($m[2]) ? trim($m[2]) : '';
                    } else {
                        $curNum = 0.0; $curUnit = '';
                    }
                    if (preg_match('/^([0-9]+(?:\.[0-9]+)?)(?:\s*(.*))?$/', trim((string)$row['low_stock']), $m2)) {
                        $lowNum = floatval($m2[1]);
                    } else { $lowNum = 0.0; }

                    $unitToUse = ($curUnit !== '' && $curUnit !== '- -') ? $curUnit : (($unit !== '' && $unit !== '- -') ? $unit : '');
                    $newNum = $curNum + $qty;
                    if ($newNum < 0) $newNum = 0; // clamp
                    $new_in_stock = ($newNum == floor($newNum)) ? (string)intval($newNum) : (string)round($newNum, 2);
                    if ($unitToUse) $new_in_stock .= ' ' . $conn->real_escape_string($unitToUse);

                    $upd = "UPDATE product_variants SET in_stock='" . $conn->real_escape_string($new_in_stock) . "' WHERE id=" . $variant_id;
                    if (!$conn->query($upd)) throw new Exception($conn->error);

                    $status = 'In stock';
                    if ($newNum <= 0) $status = 'Out of stock';
                    else if ($lowNum > 0 && $newNum <= $lowNum) $status = 'Low stock';

                    // Recalculate and persist parent total
                    $pv_res = $conn->query("SELECT in_stock FROM product_variants WHERE product_id=" . intval($product_id));
                    $parentSum = 0.0; $parentUnit = '';
                    if ($pv_res) {
                        while ($pv_row = $pv_res->fetch_assoc()) {
                            $txt = trim((string)$pv_row['in_stock']);
                            if ($txt === '') continue;
                            if (preg_match('/^([0-9]+(?:\.[0-9]+)?)(?:\s*(.*))?$/', $txt, $mm)) {
                                $n = floatval($mm[1]);
                                $u = isset($mm[2]) ? trim($mm[2]) : '';
                                $parentSum += $n;
                                if ($parentUnit === '' && $u !== '' && $u !== '- -') $parentUnit = $u;
                            }
                        }
                    }
                    $parentNew = ($parentSum == floor($parentSum)) ? (string)intval($parentSum) : (string)round($parentSum, 2);
                    if ($parentUnit) $parentNew .= ' ' . $conn->real_escape_string($parentUnit);
                    $upd2 = "UPDATE products SET in_stock='" . $conn->real_escape_string($parentNew) . "' WHERE id=" . intval($product_id);
                    if (!$conn->query($upd2)) { $parentUpdateError = $conn->error; } else { $parentUpdateError = null; }
                    $p_sel = $conn->query("SELECT low_stock FROM products WHERE id=" . intval($product_id) . " LIMIT 1");
                    $parentLow = '';
                    if ($p_sel && $p_sel->num_rows > 0) { $parentLow = trim((string)$p_sel->fetch_assoc()['low_stock']); }
                    $parentStatus = '—';
                    if ($parentSum !== 0.0 || $parentSum === 0.0) {
                        if ($parentSum <= 0) $parentStatus = 'Out of stock';
                        else if ($parentLow !== '' && floatval($parentLow) > 0 && $parentSum <= floatval($parentLow)) $parentStatus = 'Low stock';
                        else $parentStatus = 'In stock';
                    }

                    echo json_encode(['success' => true, 'variant_id' => $variant_id, 'product_id' => $product_id, 'new_in_stock' => $new_in_stock, 'status' => $status, 'parent_new_in_stock' => $parentNew, 'parent_status' => $parentStatus, 'parent_update_error' => $parentUpdateError]);
                    exit;
                } else {
                    $sel = $conn->query("SELECT in_stock, low_stock FROM products WHERE id=" . $product_id . " LIMIT 1");
                    if (!$sel || $sel->num_rows === 0) {
                        http_response_code(404);
                        echo json_encode(['error' => 'Product not found']);
                        exit;
                    }
                    $row = $sel->fetch_assoc();
                    if (preg_match('/^([0-9]+(?:\.[0-9]+)?)(?:\s*(.*))?$/', trim((string)$row['in_stock']), $m)) {
                        $curNum = floatval($m[1]);
                        $curUnit = isset($m[2]) ? trim($m[2]) : '';
                    } else {
                        $curNum = 0.0; $curUnit = '';
                    }
                    if (preg_match('/^([0-9]+(?:\.[0-9]+)?)(?:\s*(.*))?$/', trim((string)$row['low_stock']), $m2)) {
                        $lowNum = floatval($m2[1]);
                    } else { $lowNum = 0.0; }

                    $unitToUse = ($curUnit !== '' && $curUnit !== '- -') ? $curUnit : (($unit !== '' && $unit !== '- -') ? $unit : '');
                    $newNum = $curNum + $qty;
                    if ($newNum < 0) $newNum = 0;
                    $new_in_stock = ($newNum == floor($newNum)) ? (string)intval($newNum) : (string)round($newNum, 2);
                    if ($unitToUse) $new_in_stock .= ' ' . $conn->real_escape_string($unitToUse);

                    $upd = "UPDATE products SET in_stock='" . $conn->real_escape_string($new_in_stock) . "' WHERE id=" . $product_id;
                    if (!$conn->query($upd)) throw new Exception($conn->error);

                    $status = 'In stock';
                    if ($newNum <= 0) $status = 'Out of stock';
                    else if ($lowNum > 0 && $newNum <= $lowNum) $status = 'Low stock';

                    echo json_encode(['success' => true, 'product_id' => $product_id, 'new_in_stock' => $new_in_stock, 'status' => $status]);
                    exit;
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
                exit;
            }
        }

        // Duplicate SKU error (does not block flow, just returns error)
        $sku = isset($data['sku']) ? $conn->real_escape_string($data['sku']) : '';
        if ($sku !== '') {
            $dup_sql = "SELECT id FROM products WHERE sku='$sku' LIMIT 1";
            $dup_res = $conn->query($dup_sql);
            if ($dup_res && $dup_res->num_rows > 0) {
                http_response_code(409);
                echo json_encode(['error' => 'You already have an item with this SKU.']);
                exit;
            }
        }
        $category = isset($data['category']) ? $conn->real_escape_string($data['category']) : '';
        // Accept 'variable' as a string for price, otherwise float
        if (isset($data['price']) && $data['price'] === 'variable') {
            $price = 'variable';
        } else if (isset($data['price']) && $data['price'] !== '') {
            $price = floatval($data['price']);
        } else {
            $price = null;
        }
        $cost = isset($data['cost']) && $data['cost'] !== '' ? floatval($data['cost']) : null;
        $track_stock = isset($data['track_stock']) ? intval($data['track_stock']) : 0;
        // If variantsTrackStock is provided, consider it when deciding product-level tracking.
        $variantsTrackStock = isset($data['variantsTrackStock']) ? intval($data['variantsTrackStock']) : 0;
        // Ensure product.track_stock is enabled if either the main toggle or the variants toggle requests tracking.
        if ($variantsTrackStock === 1) {
            $track_stock = 1;
        }
    // Accept in_stock and low_stock as VARCHAR (with unit suffix)
    // Behavior: empty or sentinel -> NULL (no data). Explicit '0' is preserved.
    $in_stock = isset($data['in_stock']) ? trim($data['in_stock']) : null;
    if ($track_stock === 0) {
        // If tracking disabled, treat as no value
        $in_stock = null;
    } else {
        if ($in_stock === '' || $in_stock === '0 - -') {
            $in_stock = null;
        }
        // if $in_stock === '0' we keep it as explicit zero string
    }
    $low_stock = isset($data['low_stock']) ? trim($data['low_stock']) : null;
    if ($track_stock === 0) {
        $low_stock = null;
    } else {
        if ($low_stock === '' || $low_stock === '0 - -') {
            $low_stock = null;
        }
    }
        $pos_available = isset($data['pos_available']) ? intval($data['pos_available']) : 1;
        $type = isset($data['type']) ? $conn->real_escape_string($data['type']) : 'color_shape';
        $color = isset($data['color']) ? $conn->real_escape_string($data['color']) : '';
        $shape = isset($data['shape']) ? $conn->real_escape_string($data['shape']) : '';
        $image_url = isset($data['image_url']) ? $conn->real_escape_string($data['image_url']) : '';
        $variants = isset($data['variants']) ? $data['variants'] : [];
        $sku = isset($data['sku']) ? $conn->real_escape_string($data['sku']) : '';
        $barcode = isset($data['barcode']) ? $conn->real_escape_string($data['barcode']) : '';
        // If price is null, set to 'variable' (string)
    $price_sql = ($price === 'variable') ? "'variable'" : ($price !== null ? $price : 'NULL');

        $conn->begin_transaction();
        try {
            // Category: create if not exists
            $category_id = null;
            if ($category) {
                $cat_sql = "SELECT id FROM categories WHERE name='$category' LIMIT 1";
                $cat_res = $conn->query($cat_sql);
                if ($cat_res && $cat_res->num_rows > 0) {
                    $category_id = $cat_res->fetch_assoc()['id'];
                } else {
                    $cat_ins = "INSERT INTO categories (name) VALUES ('$category')";
                    if (!$conn->query($cat_ins)) throw new Exception($conn->error);
                    $category_id = $conn->insert_id;
                }
            }
            // Insert product
            $prod_sql = "INSERT INTO products (name, category_id, price, cost, sku, barcode, track_stock, in_stock, low_stock, pos_available, type, color, shape, image_url) VALUES ('"
                . $name . "', "
                . ($category_id ? $category_id : 'NULL') . ", "
                . $price_sql . ", "
                . ($cost !== null ? $cost : 'NULL') . ", '"
                . $sku . "', '"
                . $barcode . "', "
                . $track_stock . ", "
                . ($in_stock !== null ? "'" . $in_stock . "'" : "NULL") . ", "
                . ($low_stock !== null ? "'" . $low_stock . "'" : "NULL") . ", "
                . $pos_available . ", '"
                . $type . "', '"
                . $color . "', '"
                . $shape . "', '"
                . $image_url . "')";
            if (!$conn->query($prod_sql)) throw new Exception($conn->error);
            $product_id = $conn->insert_id;

            // Insert variants
            foreach ($variants as $variant) {
                $vname = $conn->real_escape_string($variant['name']);
                // Handle price: if blank or 'variable', store as 'variable', else float
                $vprice = isset($variant['price']) ? trim($variant['price']) : '';
                if ($vprice === '' || $vprice === 'variable') {
                    $vprice_sql = "'variable'";
                } else {
                    $vprice_sql = floatval($vprice);
                }
                $vcost = floatval($variant['cost']);
                // Accept in_stock and low_stock as VARCHAR (with unit suffix)
                $vin_stock = isset($variant['in_stock']) ? trim($variant['in_stock']) : null;
                if ($vin_stock === '' || $vin_stock === '0 - -') {
                    $vin_stock = null;
                }
                // explicit '0' remains as '0'
                $vlow_stock = isset($variant['low_stock']) ? trim($variant['low_stock']) : null;
                if ($vlow_stock === '' || $vlow_stock === '0 - -') {
                    $vlow_stock = null;
                }
                $vsku = $conn->real_escape_string($variant['sku']);
                $vbarcode = $conn->real_escape_string($variant['barcode']);
                $vpos_available = intval($variant['pos_available']);
                $var_sql = "INSERT INTO product_variants (product_id, name, price, cost, in_stock, low_stock, sku, barcode, pos_available) VALUES ("
                    . $product_id . ", '"
                    . $vname . "', "
                    . $vprice_sql . ", "
                    . $vcost . ", "
                    . ($vin_stock !== null ? "'" . $vin_stock . "'" : "NULL") . ", "
                    . ($vlow_stock !== null ? "'" . $vlow_stock . "'" : "NULL") . ", '"
                    . $vsku . "', '"
                    . $vbarcode . "', "
                    . $vpos_available . ")";
                if (!$conn->query($var_sql)) throw new Exception($conn->error);
            }

            // If variants were provided, calculate parent in_stock as the sum of variant in_stock numeric parts
            try {
                if (!empty($variants)) {
                    $pv_res = $conn->query("SELECT in_stock FROM product_variants WHERE product_id=" . intval($product_id));
                    $parentSum = 0.0;
                    $parentUnit = '';
                    if ($pv_res) {
                        while ($pv_row = $pv_res->fetch_assoc()) {
                            $txt = trim((string)$pv_row['in_stock']);
                            if ($txt === '') continue;
                            if (preg_match('/^([0-9]+(?:\.[0-9]+)?)(?:\s*(.*))?$/', $txt, $mm)) {
                                $n = floatval($mm[1]);
                                $u = isset($mm[2]) ? trim($mm[2]) : '';
                                $parentSum += $n;
                                if ($parentUnit === '' && $u !== '' && $u !== '- -') $parentUnit = $u;
                            }
                        }
                    }
                    // Format parent new_in_stock
                    $parentNew = ($parentSum == floor($parentSum)) ? (string)intval($parentSum) : (string)round($parentSum, 2);
                    if ($parentUnit) $parentNew .= ' ' . $conn->real_escape_string($parentUnit);
                    // Persist aggregated parent in_stock
                    $updParent = "UPDATE products SET in_stock='" . $conn->real_escape_string($parentNew) . "' WHERE id=" . intval($product_id);
                    if (!$conn->query($updParent)) throw new Exception($conn->error);
                }
            } catch (Exception $e) {
                // If parent update fails, rollback to avoid partial state
                throw $e;
            }

            $conn->commit();
            echo json_encode(['success' => true, 'product_id' => $product_id]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
