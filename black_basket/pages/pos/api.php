<?php
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';

// Optional debug bypass: when developing locally you can call GET api.php?debug=1
// to skip authentication for GET requests and receive extra diagnostics. Remove this in production.
$debugMode = (isset($_GET['debug']) && $_GET['debug'] === '1');
// Check if user is logged in (unless debug bypass is requested for GET)
if (!$debugMode) {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
} else {
    // Only allow debug bypass for GET requests to avoid exposing write operations.
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Debug bypass only allowed for GET']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch products for POS
        // Determine whether `inventory` table exists and whether `products.in_stock` exists
        $hasInventory = false;
        $hasProductInStock = false;
        $priceCol = 'unit_price';
        $hasUnitPrice = false;
        $hasPrice = false;
        try {
            $r = $conn->query("SHOW TABLES LIKE 'inventory'");
            if ($r && $r->num_rows > 0) $hasInventory = true;
        } catch (Exception $e) {
            // ignore
        }
        try {
            $r2 = $conn->query("SHOW COLUMNS FROM products LIKE 'in_stock'");
            if ($r2 && $r2->num_rows > 0) $hasProductInStock = true;
        } catch (Exception $e) {
            // ignore
        }
        // Detect which price column exists: prefer unit_price, fall back to price
        try {
            $r3 = $conn->query("SHOW COLUMNS FROM products LIKE 'unit_price'");
            if ($r3 && $r3->num_rows > 0) $hasUnitPrice = true;
        } catch (Exception $e) {}
        try {
            $r4 = $conn->query("SHOW COLUMNS FROM products LIKE 'price'");
            if ($r4 && $r4->num_rows > 0) $hasPrice = true;
        } catch (Exception $e) {}
        if ($hasUnitPrice) $priceCol = 'unit_price';
        else if ($hasPrice) $priceCol = 'price';
        else $priceCol = 'unit_price';

        // Build SQL depending on available schema
        // Category filtering support: ?category=Name (uses categories.name). Special values 'all','favourites','discounts' are reserved.
        $category = isset($_GET['category']) ? $conn->real_escape_string($_GET['category']) : '';
        $categoryCondition = '';
        // normalize for checks
        $categoryLower = strtolower(trim((string)$category));

        // Special handling for 'discounts' and 'favourites' views: if these tables don't exist or have no matching rows,
        // return an empty array so the UI can show a contextual empty state instead of listing all products.
        if ($categoryLower === 'discounts' || $categoryLower === 'discount') {
            // If discounts table does not exist, return empty result
            $hasDiscounts = false;
            try {
                $r = $conn->query("SHOW TABLES LIKE 'discounts'");
                if ($r && $r->num_rows > 0) $hasDiscounts = true;
            } catch (Exception $e) { /* ignore */ }
            if (!$hasDiscounts) {
                echo json_encode([]);
                break;
            }
            // Return products that match active discounts. Match when:
            //  - discounts.apply_to = 'product' and target_id = p.id
            //  - discounts.apply_to = 'category' and target_id = p.category_id
            //  - discounts.apply_to = 'all'
            // Only include active discounts (active = 1)
            $sql = "SELECT DISTINCT p.id, p.name, p." . $priceCol . ", COALESCE(i.quantity, p.in_stock) AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                    FROM products p
                    LEFT JOIN inventory i ON p.id = i.product_id
                    LEFT JOIN discounts d ON ((d.apply_to = 'product' AND d.target_id = p.id) OR (d.apply_to = 'category' AND d.target_id = p.category_id) OR (d.apply_to = 'all'))
                    WHERE d.active = 1 AND p.pos_available = 1
                    LIMIT 100";
            try {
                $result = $conn->query($sql);
            } catch (Exception $e) {
                // On any DB exception here, return an empty JSON array and exit immediately
                // so the frontend receives a clean response it can parse and show the empty-state UI.
                echo json_encode([]);
                exit;
            }
            $products = [];
            if (isset($result) && $result) {
                while ($row = $result->fetch_assoc()) {
                    $products[] = $row;
                }
            }
            echo json_encode($products);
            exit;
        }
        if ($categoryLower === 'favourites' || $categoryLower === 'favourite') {
            // If favourites table does not exist, return empty
            $hasFaves = false;
            try {
                $r = $conn->query("SHOW TABLES LIKE 'favourites'");
                if ($r && $r->num_rows > 0) $hasFaves = true;
            } catch (Exception $e) { /* ignore */ }
            if (!$hasFaves) { echo json_encode([]); break; }

            // Return products that are present in favourites table
            $sql = "SELECT p.id, p.name, p." . $priceCol . ", COALESCE(i.quantity, p.in_stock) AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                    FROM products p
                    LEFT JOIN inventory i ON p.id = i.product_id
                    INNER JOIN favourites f ON f.product_id = p.id
                    WHERE p.pos_available = 1
                    LIMIT 100";
            try {
                $result = $conn->query($sql);
            } catch (Exception $e) {
                // Return clean empty JSON on any DB error
                echo json_encode([]);
                exit;
            }
            $products = [];
            if (isset($result) && $result) {
                while ($row = $result->fetch_assoc()) { $products[] = $row; }
            }
            echo json_encode($products);
            exit;
        }

        if ($category !== '' && $categoryLower !== 'all') {
            // we'll join categories as c and filter by its name
            if ($categoryLower !== 'favourites' && $categoryLower !== 'discounts') {
                $categoryCondition = " AND (c.name = '" . $category . "')";
            }
        }
        if (isset($_GET['search'])) {
            $search = $conn->real_escape_string($_GET['search']);
                        if ($hasInventory && $hasProductInStock) {
                                // Prefer combined quantity when both inventory and product.in_stock exist
                                $sql = "SELECT p.id, p.name, p." . $priceCol . ", COALESCE(i.quantity, p.in_stock) AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                        FROM products p
                                        LEFT JOIN inventory i ON p.id = i.product_id
                                        LEFT JOIN categories c ON p.category_id = c.id
                                        WHERE p.pos_available = 1
                                            AND (p.name LIKE '%$search%' OR p.sku LIKE '%$search%' OR p.barcode LIKE '%$search%')" . $categoryCondition . "\n                                        LIMIT 20";
                        } else if ($hasInventory) {
                                $sql = "SELECT p.id, p.name, p." . $priceCol . ", i.quantity AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                        FROM products p
                                        LEFT JOIN inventory i ON p.id = i.product_id
                                        LEFT JOIN categories c ON p.category_id = c.id
                                        WHERE p.pos_available = 1
                                            AND (p.name LIKE '%$search%' OR p.sku LIKE '%$search%' OR p.barcode LIKE '%$search%')" . $categoryCondition . "\n                                        LIMIT 20";
                        } else if ($hasProductInStock) {
                                $sql = "SELECT p.id, p.name, p." . $priceCol . ", p.in_stock AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                        FROM products p
                                        LEFT JOIN categories c ON p.category_id = c.id
                                        WHERE p.pos_available = 1
                                            AND (p.name LIKE '%$search%' OR p.sku LIKE '%$search%' OR p.barcode LIKE '%$search%')" . $categoryCondition . "\n                                        LIMIT 20";
            } else {
                // No inventory info available; return products that are pos_available
                                                                $sql = "SELECT p.id, p.name, p." . $priceCol . ", NULL AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                        FROM products p
                                        LEFT JOIN categories c ON p.category_id = c.id
                                        WHERE p.pos_available = 1
                                            AND (p.name LIKE '%$search%' OR p.sku LIKE '%$search%' OR p.barcode LIKE '%$search%')" . $categoryCondition . "\n                                        LIMIT 20";
            }
        } else {
                if ($hasInventory && $hasProductInStock) {
                $sql = "SELECT p.id, p.name, p." . $priceCol . ", COALESCE(i.quantity, p.in_stock) AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.pos_available = 1" . $categoryCondition . "\n            LIMIT 50";
        } else if ($hasInventory) {
                $sql = "SELECT p.id, p.name, p." . $priceCol . ", i.quantity AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.pos_available = 1" . $categoryCondition . "\n            LIMIT 50";
        } else if ($hasProductInStock) {
                $sql = "SELECT p.id, p.name, p." . $priceCol . ", p.in_stock AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.pos_available = 1" . $categoryCondition . "\n            LIMIT 50";
            } else {
                $sql = "SELECT p.id, p.name, p." . $priceCol . ", NULL AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    WHERE p.pos_available = 1" . $categoryCondition . "\n                    LIMIT 50";
            }
        }

        // Execute safely with exception handling
        try {
            $result = $conn->query($sql);
        } catch (mysqli_sql_exception $e) {
            // If query failed due to missing column (pos_available) or inventory, try fallback without pos_available
            $dbErr = $e->getMessage();
            if (stripos($dbErr, 'pos_available') !== false || stripos($dbErr, 'unknown column') !== false) {
                // Fallback: build a similar SQL without p.pos_available checks
                if (isset($_GET['search'])) {
                    $search = $conn->real_escape_string($_GET['search']);
                                                            if ($hasInventory) {
                                                                                                                    $sql = "SELECT p.id, p.name, p." . $priceCol . ", i.quantity AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                                                                                                                    FROM products p
                                                                                                                                    LEFT JOIN inventory i ON p.id = i.product_id
                                                                                                                                    LEFT JOIN categories c ON p.category_id = c.id
                                                                                                                                    WHERE (p.name LIKE '%$search%' OR p.sku LIKE '%$search%' OR p.barcode LIKE '%$search%')
                                                                                                                                        AND i.quantity > 0" . $categoryCondition . "\n                                                                            LIMIT 20";
                    } else if ($hasProductInStock) {
                                                                                                                    $sql = "SELECT p.id, p.name, p." . $priceCol . ", p.in_stock AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                                                            FROM products p
                                                                            LEFT JOIN categories c ON p.category_id = c.id
                                                                            WHERE p.in_stock > 0
                                                                                AND (p.name LIKE '%$search%' OR p.sku LIKE '%$search%' OR p.barcode LIKE '%$search%')" . $categoryCondition . "\n                                                                            LIMIT 20";
                    } else {
                                                                                                                    $sql = "SELECT p.id, p.name, p." . $priceCol . ", NULL AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                                                            FROM products p
                                                                            LEFT JOIN categories c ON p.category_id = c.id
                                                                            WHERE (p.name LIKE '%$search%' OR p.sku LIKE '%$search%' OR p.barcode LIKE '%$search%')" . $categoryCondition . "\n                                                                            LIMIT 20";
                    }
                } else {
                    if ($hasInventory) {
                                    $sql = "SELECT p.id, p.name, p." . $priceCol . ", i.quantity AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                                                            FROM products p
                                                                            LEFT JOIN inventory i ON p.id = i.product_id
                                                                            LEFT JOIN categories c ON p.category_id = c.id
                                                                            WHERE i.quantity > 0" . $categoryCondition . "\n                                                                            LIMIT 50";
                    } else if ($hasProductInStock) {
                                    $sql = "SELECT p.id, p.name, p." . $priceCol . ", p.in_stock AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                                                            FROM products p
                                                                            LEFT JOIN categories c ON p.category_id = c.id
                                                                            WHERE p.in_stock > 0" . $categoryCondition . "\n                                                                            LIMIT 50";
                    } else {
                                    $sql = "SELECT p.id, p.name, p." . $priceCol . ", NULL AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                                        FROM products p
                                        LEFT JOIN categories c ON p.category_id = c.id" . $categoryCondition . "\n                                        LIMIT 50";
                    }
                }
                // Try the fallback
                try {
                    $result = $conn->query($sql);
                } catch (Exception $e2) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Database error', 'details' => $e2->getMessage()]);
                    exit;
                }
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Database error', 'details' => $dbErr]);
                exit;
            }
        }
        // If the DB doesn't have the pos_available column (older schema), fall back to query without the filter
        if ($result === false) {
            $dbErr = $conn->error;
            // Detect unknown column or reference to pos_available in error message
            if (stripos($dbErr, 'unknown column') !== false || stripos($dbErr, 'pos_available') !== false) {
                // Build a fallback SQL without the p.pos_available condition
                                if (isset($_GET['search'])) {
                                        $search = $conn->real_escape_string($_GET['search']);
                                        $sql = "SELECT p.id, p.name, p." . $priceCol . ", i.quantity AS quantity, p.low_stock
                                                FROM products p
                                                LEFT JOIN inventory i ON p.id = i.product_id
                                                WHERE (p.name LIKE '%$search%' OR p.sku LIKE '%$search%' OR p.barcode LIKE '%$search%')
                                                    AND i.quantity > 0
                                                LIMIT 20";
                } else {
                                        $sql = "SELECT p.id, p.name, p." . $priceCol . ", i.quantity AS quantity, p.low_stock
                                                FROM products p
                                                LEFT JOIN inventory i ON p.id = i.product_id
                                                WHERE i.quantity > 0
                                                LIMIT 50";
                }
                $result = $conn->query($sql);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Database error', 'details' => $dbErr]);
                exit;
            }
        }

        $products = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $products[] = $row;
            }
        }

        // If debug mode is enabled, include diagnostic info
        if ($debugMode) {
            $out = [
                'debug' => true,
                'sql' => $sql,
                'row_count' => count($products),
                'products' => $products
            ];
            // Include last DB error if any
            $dberr = $conn->error;
            if ($dberr) $out['db_error'] = $dberr;
            echo json_encode($out);
        } else {
            echo json_encode($products);
        }
        break;

    case 'POST':
        // Process completed sale (finalize transaction)
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['items']) || !is_array($data['items']) || empty($data['items'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid sale data']);
            exit;
        }

        $items = $data['items'];
        $payment_method = isset($data['payment_method']) ? $conn->real_escape_string($data['payment_method']) : 'cash';
        // legacy: we accept `channel` in input but prefer `cart_mode` (dinein|takeout|delivery)
        // $channel is intentionally not used for persistence to avoid confusion with `cart_mode`.
        $customer_name = isset($data['customer_name']) ? $conn->real_escape_string($data['customer_name']) : null;
        $reference = isset($data['reference']) ? $conn->real_escape_string($data['reference']) : null;
        $cart_mode = isset($data['cart_mode']) ? $conn->real_escape_string($data['cart_mode']) : null;

        // accept subtotal/tax/total if provided by client; otherwise compute
        $subtotal = isset($data['subtotal']) ? floatval($data['subtotal']) : null;
        $tax = isset($data['tax']) ? floatval($data['tax']) : null;
        $total_amount = isset($data['total_amount']) ? floatval($data['total_amount']) : null;

        // compute totals from items if missing or inconsistent
        $computed_sub = 0.0;
        foreach ($items as $item) {
            $q = isset($item['quantity']) ? intval($item['quantity']) : 0;
            $up = isset($item['unit_price']) ? floatval($item['unit_price']) : 0.0;
            $computed_sub += $q * $up;
        }
        if ($subtotal === null) $subtotal = $computed_sub;
        if ($tax === null) $tax = 0.0; // frontend may provide tax; otherwise assume 0
        if ($total_amount === null) $total_amount = floatval($subtotal + $tax);

        // optional payment bookkeeping
        $amount_received = isset($data['amount_received']) ? floatval($data['amount_received']) : null;
        $change = isset($data['change']) ? floatval($data['change']) : null;

        // who served the sale (from session if available)
        $employee_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;

        // detect inventory support, products.in_stock column, and product_variants support for fallback
        $hasInventory = false;
        $hasProductInStock = false;
        $hasProductVariants = false;
        // For variant stock support, prefer column names in this order: in_stock, quantity, stock, qty
        $variantStockCol = null; // will hold the actual column name to use for variant stock updates or null if none
        $hasProductTrack = false;
        $hasVariantTrack = false;
        try {
            $r = $conn->query("SHOW TABLES LIKE 'inventory'");
            if ($r && $r->num_rows > 0) $hasInventory = true;
        } catch (Exception $e) { }
        try {
            $r2 = $conn->query("SHOW COLUMNS FROM products LIKE 'in_stock'");
            if ($r2 && $r2->num_rows > 0) $hasProductInStock = true;
        } catch (Exception $e) { }
        // detect product_variants table and its in_stock column (if variants are tracked)
        try {
            $r3 = $conn->query("SHOW TABLES LIKE 'product_variants'");
            if ($r3 && $r3->num_rows > 0) {
                $hasProductVariants = true;
                // detect which stock column exists on product_variants
                $possible = ['in_stock', 'quantity', 'stock', 'qty'];
                foreach ($possible as $col) {
                    try {
                        $rc = $conn->query("SHOW COLUMNS FROM product_variants LIKE '" . $col . "'");
                        if ($rc && $rc->num_rows > 0) {
                            $variantStockCol = $col;
                            break;
                        }
                    } catch (Exception $e) { /* ignore */ }
                }
            }
        } catch (Exception $e) { }
        // detect track_stock columns if present
        try {
            $r5 = $conn->query("SHOW COLUMNS FROM products LIKE 'track_stock'");
            if ($r5 && $r5->num_rows > 0) $hasProductTrack = true;
        } catch (Exception $e) { }
        try {
            $r6 = $conn->query("SHOW COLUMNS FROM product_variants LIKE 'track_stock'");
            if ($r6 && $r6->num_rows > 0) $hasVariantTrack = true;
        } catch (Exception $e) { }

        $conn->begin_transaction();
        try {
            // Insert sale into `sales` (store subtotal/tax/total and metadata)
                // Note: some installs use `cart_mode` instead of `channel` (default 'dinein')
                $sql = "INSERT INTO sales (reference, customer_name, subtotal, tax, total_amount, payment_method, cart_mode, employee_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $conn->prepare($sql);
            if (!$stmt) throw new Exception($conn->error);
            // types: reference(s), customer_name(s), subtotal(d), tax(d), total_amount(d), payment_method(s), cart_mode(s), employee_id(i)
                $stmt->bind_param('ssdddssi', $reference, $customer_name, $subtotal, $tax, $total_amount, $payment_method, $cart_mode, $employee_id);
            if (!$stmt->execute()) throw new Exception($stmt->error);
            $sale_id = $conn->insert_id;
            $stmt->close();

            // Insert sale items (now supports variant_id for precise variant referencing)
            $itemSql = "INSERT INTO sale_items (sale_id, product_id, variant_id, name, unit_price, quantity, total_price, variant, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $itemStmt = $conn->prepare($itemSql);
            if (!$itemStmt) throw new Exception($conn->error);

            foreach ($items as $item) {
                $product_id = isset($item['product_id']) ? (is_numeric($item['product_id']) ? intval($item['product_id']) : null) : null;
                $variant_id = isset($item['variant_id']) ? (is_numeric($item['variant_id']) ? intval($item['variant_id']) : null) : null;
                $name = isset($item['name']) ? $item['name'] : '';
                $unit_price = isset($item['unit_price']) ? floatval($item['unit_price']) : 0.0;
                $quantity = isset($item['quantity']) ? intval($item['quantity']) : 0;
                $variant = isset($item['variant']) ? $item['variant'] : null;
                $total_price = floatval($unit_price * $quantity);

                // If client didn't provide variant_id but sent a variant id in product_id (legacy clients), detect and fix.
                if (($variant_id === null || $variant_id === 0) && $product_id !== null && $hasProductVariants) {
                    try {
                        $qpv = $conn->prepare("SELECT product_id FROM product_variants WHERE id = ? LIMIT 1");
                        if ($qpv) {
                            $qpv->bind_param('i', $product_id);
                            $qpv->execute();
                            $qpv->bind_result($pv_parent_id);
                            if ($qpv->fetch()) {
                                // treat original product_id as the variant id
                                $variant_id = $product_id;
                                $product_id = intval($pv_parent_id);
                            }
                            $qpv->close();
                        }
                    } catch (Exception $e) { /* ignore detection errors */ }
                }

                // bind params: sale_id(i), product_id(i), variant_id(i), name(s), unit_price(d), quantity(i), total_price(d), variant(s)
                $itemStmt->bind_param('iiisdids', $sale_id, $product_id, $variant_id, $name, $unit_price, $quantity, $total_price, $variant);
                if (!$itemStmt->execute()) throw new Exception($itemStmt->error);

                // Decide whether to deduct stock based on track_stock flags (if present)
                $shouldDeduct = true;
                // If variant track flag exists, prefer it
                if ($variant_id !== null && $hasProductVariants && $hasVariantTrack) {
                    try {
                        $qts = $conn->prepare("SELECT track_stock FROM product_variants WHERE id = ? LIMIT 1");
                        if ($qts) {
                            $qts->bind_param('i', $variant_id);
                            $qts->execute();
                            $qts->bind_result($vtrack);
                            if ($qts->fetch()) {
                                $shouldDeduct = (intval($vtrack) === 1);
                            }
                            $qts->close();
                        }
                    } catch (Exception $e) { /* ignore and keep default */ }
                } elseif ($product_id !== null && $hasProductTrack) {
                    try {
                        $qts = $conn->prepare("SELECT track_stock FROM products WHERE id = ? LIMIT 1");
                        if ($qts) {
                            $qts->bind_param('i', $product_id);
                            $qts->execute();
                            $qts->bind_result($ptrack);
                            if ($qts->fetch()) {
                                $shouldDeduct = (intval($ptrack) === 1);
                            }
                            $qts->close();
                        }
                    } catch (Exception $e) { /* ignore and keep default */ }
                }

                if ($shouldDeduct) {
                    // 1) If variant_id provided and a variant stock column exists, decrement that column on product_variants
                    if ($variant_id !== null && $hasProductVariants && $variantStockCol !== null) {
                        try {
                            $col = $variantStockCol;
                            $updSql = "UPDATE product_variants SET `" . $col . "` = GREATEST(0, CAST(`" . $col . "` AS SIGNED) - ?) WHERE id = ?";
                            $uvar = $conn->prepare($updSql);
                            if ($uvar) {
                                $uvar->bind_param('ii', $quantity, $variant_id);
                                $uvar->execute();
                                $uvar->close();
                            }
                        } catch (Exception $e) { /* ignore variant update errors */ }
                    } elseif ($hasInventory) {
                        $loc = 'Main Warehouse';
                        $upd = $conn->prepare("UPDATE inventory SET quantity = GREATEST(0, quantity - ?), last_updated = NOW() WHERE product_id = ? AND location = ?");
                        if ($upd) {
                            $upd->bind_param('iis', $quantity, $product_id, $loc);
                            $upd->execute();
                            $upd->close();
                        }
                    } elseif ($hasProductInStock && $product_id !== null) {
                        try {
                            $u2 = $conn->prepare("UPDATE products SET in_stock = GREATEST(0, CAST(in_stock AS SIGNED) - ?) WHERE id = ?");
                            if ($u2) {
                                $u2->bind_param('ii', $quantity, $product_id);
                                $u2->execute();
                                $u2->close();
                            }
                        } catch (Exception $e) { /* ignore update errors */ }
                    }
                }

                // If the sold item is a composite product, deduct its components' stock as well
                try {
                    $isComposite = false;
                    // prefer variant-level is_composite if variant exists
                    if ($variant_id !== null && $hasProductVariants) {
                        $qcomp = $conn->prepare("SELECT is_composite FROM product_variants WHERE id = ? LIMIT 1");
                        if ($qcomp) {
                            $qcomp->bind_param('i', $variant_id);
                            $qcomp->execute();
                            $qcomp->bind_result($vcomp);
                            if ($qcomp->fetch()) $isComposite = (intval($vcomp) === 1);
                            $qcomp->close();
                        }
                    }
                    if (!$isComposite && $product_id !== null) {
                        $qcomp2 = $conn->prepare("SELECT is_composite FROM products WHERE id = ? LIMIT 1");
                        if ($qcomp2) {
                            $qcomp2->bind_param('i', $product_id);
                            $qcomp2->execute();
                            $qcomp2->bind_result($pcomp);
                            if ($qcomp2->fetch()) $isComposite = (intval($pcomp) === 1);
                            $qcomp2->close();
                        }
                    }

                    if ($isComposite && $product_id !== null) {
                        $pc = $conn->prepare("SELECT component_product_id, component_variant_id, component_qty FROM product_components WHERE parent_product_id = ?");
                        if ($pc) {
                            $pc->bind_param('i', $product_id);
                            $pc->execute();
                            $pc->bind_result($comp_product_id, $comp_variant_id, $comp_qty);
                            while ($pc->fetch()) {
                                // compute required quantity (ceil to handle fractional component quantities)
                                $needed = (int) ceil(floatval($comp_qty) * $quantity);

                                // Insert a sale_items row for this component so components are recorded in the sale
                                try {
                                    $comp_name = null;
                                    // try variant name first if variant specified
                                    if ($comp_variant_id !== null && $hasProductVariants) {
                                        $qname = $conn->prepare("SELECT name FROM product_variants WHERE id = ? LIMIT 1");
                                        if ($qname) {
                                            $qname->bind_param('i', $comp_variant_id);
                                            $qname->execute();
                                            $qname->bind_result($comp_name_res);
                                            if ($qname->fetch()) $comp_name = $comp_name_res;
                                            $qname->close();
                                        }
                                    }
                                    if ($comp_name === null && $comp_product_id !== null) {
                                        $qname2 = $conn->prepare("SELECT name FROM products WHERE id = ? LIMIT 1");
                                        if ($qname2) {
                                            $qname2->bind_param('i', $comp_product_id);
                                            $qname2->execute();
                                            $qname2->bind_result($comp_name_res2);
                                            if ($qname2->fetch()) $comp_name = $comp_name_res2;
                                            $qname2->close();
                                        }
                                    }

                                    $comp_unit_price = 0.0;
                                    $comp_total_price = 0.0;
                                    $comp_variant = null;
                                    // Use the prepared $itemStmt to insert a record for the component
                                    if (isset($itemStmt) && $itemStmt) {
                                        $itemStmt->bind_param('iiisdids', $sale_id, $comp_product_id, $comp_variant_id, $comp_name, $comp_unit_price, $needed, $comp_total_price, $comp_variant);
                                        $itemStmt->execute();
                                    }
                                } catch (Exception $e) { /* ignore component insert errors */ }

                                // decide track_stock for component
                                $shouldDeductComp = true;
                                if ($comp_variant_id !== null && $hasProductVariants && $hasVariantTrack) {
                                    try {
                                        $qtsc = $conn->prepare("SELECT track_stock FROM product_variants WHERE id = ? LIMIT 1");
                                        if ($qtsc) {
                                            $qtsc->bind_param('i', $comp_variant_id);
                                            $qtsc->execute();
                                            $qtsc->bind_result($cvtrack);
                                            if ($qtsc->fetch()) $shouldDeductComp = (intval($cvtrack) === 1);
                                            $qtsc->close();
                                        }
                                    } catch (Exception $e) { }
                                } elseif ($comp_product_id !== null && $hasProductTrack) {
                                    try {
                                        $qtsc = $conn->prepare("SELECT track_stock FROM products WHERE id = ? LIMIT 1");
                                        if ($qtsc) {
                                            $qtsc->bind_param('i', $comp_product_id);
                                            $qtsc->execute();
                                            $qtsc->bind_result($cptrack);
                                            if ($qtsc->fetch()) $shouldDeductComp = (intval($cptrack) === 1);
                                            $qtsc->close();
                                        }
                                    } catch (Exception $e) { }
                                }

                                if (!$shouldDeductComp) continue;

                                // perform component deduction: prefer variant, then inventory, then product
                                if ($comp_variant_id !== null && $hasProductVariants && $variantStockCol !== null) {
                                    try {
                                        $col = $variantStockCol;
                                        $updCompSql = "UPDATE product_variants SET `" . $col . "` = GREATEST(0, CAST(`" . $col . "` AS SIGNED) - ?) WHERE id = ?";
                                        $ucompv = $conn->prepare($updCompSql);
                                        if ($ucompv) {
                                            $ucompv->bind_param('ii', $needed, $comp_variant_id);
                                            $ucompv->execute();
                                            $ucompv->close();
                                        }
                                    } catch (Exception $e) { }
                                } elseif ($hasInventory && $comp_product_id !== null) {
                                    try {
                                        $upl = $conn->prepare("UPDATE inventory SET quantity = GREATEST(0, quantity - ?), last_updated = NOW() WHERE product_id = ? AND location = ?");
                                        if ($upl) {
                                            $loc = 'Main Warehouse';
                                            $upl->bind_param('iis', $needed, $comp_product_id, $loc);
                                            $upl->execute();
                                            $upl->close();
                                        }
                                    } catch (Exception $e) { }
                                } elseif ($hasProductInStock && $comp_product_id !== null) {
                                    try {
                                        $ucomp = $conn->prepare("UPDATE products SET in_stock = GREATEST(0, CAST(in_stock AS SIGNED) - ?) WHERE id = ?");
                                        if ($ucomp) {
                                            $ucomp->bind_param('ii', $needed, $comp_product_id);
                                            $ucomp->execute();
                                            $ucomp->close();
                                        }
                                    } catch (Exception $e) { }
                                }
                            }
                            $pc->close();
                        }
                    }
                } catch (Exception $e) { /* ignore composite handling errors to avoid blocking sale */ }
            }
            $itemStmt->close();

            $conn->commit();

            // Prepare receipt-like response
            $receipt = [
                'sale_id' => $sale_id,
                'reference' => $reference,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total_amount' => $total_amount,
                'amount_received' => $amount_received,
                'change' => $change,
                'payment_method' => $payment_method,
                'cart_mode' => $cart_mode,
                'employee_id' => $employee_id,
            ];

            echo json_encode(['success' => true, 'sale_id' => $sale_id, 'receipt' => $receipt]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
