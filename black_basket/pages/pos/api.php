<?php
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';

// Normalize popular cart_mode and payment_method values before persistence.
function normalize_mode($val, $type = 'payment') {
    if ($val === null) return null;
    $v = trim((string)$val);
    if ($v === '') return null;
    $low = strtolower($v);

    if ($type === 'cart') {
        // Map common variants to canonical cart modes
        if (in_array($low, ['dine in', 'dinein', 'dine-in', 'dine'])) return 'Dine in';
        if (in_array($low, ['take out', 'takeout', 'take-away', 'take away', 'takeaway', 'pickup', 'pick up'])) return 'Take out';
        if (in_array($low, ['delivery', 'deliver'])) return 'Delivery';
        // default: Capitalize first letter only (e.g. "Dine in", "Take out")
        return ucfirst(strtolower($v));
    }

    // payment mapping
    if ($type === 'payment') {
        if (in_array($low, ['cash', 'cashier'])) return 'Cash';
        if (in_array($low, ['card', 'credit card', 'debit card', 'credit', 'debit', 'pos', 'chip'])) return 'Card';
        if (in_array($low, ['online', 'e-wallet', 'ewallet', 'gcash', 'paymaya', 'paypal', 'stripe', 'merchant'])) return 'Online';
        if (in_array($low, ['mobile', 'mobilepay', 'mpesa'])) return 'Online';
        // default: Capitalize first letter only
        return ucfirst(strtolower($v));
    }

    return ucfirst(strtolower($v));
}

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
        // Support refund action: creates a new sale row with status='refund' and inserts only the checked items.
        if (isset($data['action']) && $data['action'] === 'refund') {
            $orig_sale_id = isset($data['original_sale_id']) ? intval($data['original_sale_id']) : null;
            $refund_items = is_array($data['items']) ? $data['items'] : [];
            if (!$orig_sale_id || empty($refund_items)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid refund payload']);
                exit;
            }

            // Fetch original sale to reuse metadata
            $orig = null;
            try {
                $q = $conn->prepare("SELECT id, reference, customer_name, subtotal, tax, total_amount, payment_method, cart_mode, employee_id FROM sales WHERE id = ? LIMIT 1");
                if ($q) {
                    $q->bind_param('i', $orig_sale_id);
                    $q->execute();
                    $res = $q->get_result();
                    $orig = $res->fetch_assoc();
                    $q->close();
                }
            } catch (Exception $e) { }

            if (!$orig) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Original sale not found']);
                exit;
            }

            // Compute refund totals from provided items
            $r_sub = 0.0;
            foreach ($refund_items as $it) {
                $q = isset($it['quantity']) ? intval($it['quantity']) : 0;
                $up = isset($it['unit_price']) ? floatval($it['unit_price']) : 0.0;
                $r_sub += $q * $up;
            }
            $r_tax = 0.0;
            $r_total = floatval($r_sub + $r_tax);

            $r_amount_received = 0.0;
            $r_change = 0.0;

            $r_employee_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : (isset($orig['employee_id']) ? intval($orig['employee_id']) : null);
            $r_payment_method = isset($orig['payment_method']) ? $orig['payment_method'] : 'Cash';
            $r_cart_mode = isset($orig['cart_mode']) ? $orig['cart_mode'] : null;
            $r_reference = isset($orig['reference']) ? $orig['reference'] : ('Refund for #' . $orig_sale_id);

            // Determine whether caller wants to cancel the original sale entirely.
            $cancel_original = isset($data['cancel_original']) && $data['cancel_original'] === true;
            // determine original sale item count so we can check for full-cancel cases
            $origCount = null;
            try {
                $qcnt = $conn->prepare("SELECT COUNT(*) AS cnt FROM sale_items WHERE sale_id = ?");
                if ($qcnt) {
                    $qcnt->bind_param('i', $orig_sale_id);
                    $qcnt->execute();
                    $qcnt->bind_result($origCountRes);
                    if ($qcnt->fetch()) $origCount = intval($origCountRes);
                    $qcnt->close();
                }
            } catch (Exception $e) { $origCount = null; }

            $refundedCount = count($refund_items);

            // If caller requested cancel AND they selected all items from the original
            // sale, perform an in-place cancellation: update the original sale to
            // status='cancelled' and set an informative customer_name. Do not create
            // a separate refund sale/receipt for a pure cancellation.
            if ($cancel_original && $origCount !== null && $refundedCount >= $origCount) {
                $conn->begin_transaction();
                try {
                    $up = $conn->prepare("UPDATE sales SET status = 'cancelled' WHERE id = ?");
                    if ($up) {
                        $up->bind_param('i', $orig_sale_id);
                        $up->execute();
                        $up->close();
                    }
                    // Insert audit log for sale cancellation
                    try {
                        $audit_user = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;
                        $audit_action = 'Sale Cancelled';
                        $audit_details = 'Sale ' . $orig_sale_id . ' : ' . (isset($orig['reference']) ? $orig['reference'] : '');
                        $audit_ip = !empty($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '');
                        $audit_agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
                        $ain = $conn->prepare("INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
                        if ($ain) {
                            $ain->bind_param('issss', $audit_user, $audit_action, $audit_details, $audit_ip, $audit_agent);
                            $ain->execute();
                            $ain->close();
                        }
                    } catch (Exception $e) { /* don't break cancellation if audit fails */ }
                    $conn->commit();
                    echo json_encode(['success' => true, 'refund_sale_id' => null, 'message' => 'Sale cancelled']);
                    exit;
                } catch (Exception $e) {
                    $conn->rollback();
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                    exit;
                }
            }

            // Begin transaction for refund
            $conn->begin_transaction();
                try {
                // Insert refund sale row without overriding reference or customer_name
                $sql = "INSERT INTO sales (subtotal, tax, total_amount, payment_method, cart_mode, amount_received, change_amount, employee_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
                $stmt = $conn->prepare($sql);
                if (!$stmt) throw new Exception($conn->error);
                $status = 'refund';
                $stmt->bind_param('dddssddis', $r_sub, $r_tax, $r_total, $r_payment_method, $r_cart_mode, $r_amount_received, $r_change, $r_employee_id, $status);
                if (!$stmt->execute()) throw new Exception($stmt->error);
                $refund_sale_id = $conn->insert_id;
                $stmt->close();

                // insert refund items
                $itemSql = "INSERT INTO sale_items (sale_id, product_id, variant_id, name, unit_price, quantity, total_price, variant, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
                $itemStmt = $conn->prepare($itemSql);
                if (!$itemStmt) throw new Exception($conn->error);
                foreach ($refund_items as $it) {
                    $product_id = isset($it['product_id']) && is_numeric($it['product_id']) ? intval($it['product_id']) : null;
                    $variant_id = isset($it['variant_id']) && is_numeric($it['variant_id']) ? intval($it['variant_id']) : null;
                    $name = isset($it['name']) ? $it['name'] : '';
                    $unit_price = isset($it['unit_price']) ? floatval($it['unit_price']) : 0.0;
                    $quantity = isset($it['quantity']) ? intval($it['quantity']) : 0;
                    $variant = isset($it['variant']) ? $it['variant'] : null;
                    $total_price = floatval($unit_price * $quantity);
                    $itemStmt->bind_param('iiisddds', $refund_sale_id, $product_id, $variant_id, $name, $unit_price, $quantity, $total_price, $variant);
                    if (!$itemStmt->execute()) throw new Exception($itemStmt->error);
                }
                $itemStmt->close();

                // If all items refunded (or caller requested cancel), mark original sale cancelled
                $cancel_original = isset($data['cancel_original']) && $data['cancel_original'] === true;
                // determine if all
                try {
                    $qcnt = $conn->prepare("SELECT COUNT(*) AS cnt FROM sale_items WHERE sale_id = ?");
                    if ($qcnt) {
                        $qcnt->bind_param('i', $orig_sale_id);
                        $qcnt->execute();
                        $qcnt->bind_result($origCount);
                        $qcnt->fetch();
                        $qcnt->close();
                    }
                } catch (Exception $e) { $origCount = null; }
                $refundedCount = count($refund_items);
                if ($cancel_original || ($origCount !== null && $refundedCount >= intval($origCount))) {
                    try {
                        $up = $conn->prepare("UPDATE sales SET status = 'cancelled' WHERE id = ?");
                        if ($up) { $up->bind_param('i', $orig_sale_id); $up->execute(); $up->close(); }
                    } catch (Exception $e) { /* ignore */ }
                }

                // Insert audit log for refund action (record original sale and refund id)
                try {
                    $audit_user = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;
                    $audit_action = 'Sale Refunded';
                    $audit_details = 'Sale ' . $orig_sale_id . (isset($refund_sale_id) ? (' (refund ' . $refund_sale_id . ')') : '') . ' : ' . (isset($orig['reference']) ? $orig['reference'] : '');
                    $audit_ip = !empty($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '');
                    $audit_agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
                    $ain2 = $conn->prepare("INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
                    if ($ain2) {
                        $ain2->bind_param('issss', $audit_user, $audit_action, $audit_details, $audit_ip, $audit_agent);
                        $ain2->execute();
                        $ain2->close();
                    }
                } catch (Exception $e) { /* do not block refund if audit fails */ }

                $conn->commit();
                echo json_encode(['success' => true, 'refund_sale_id' => $refund_sale_id, 'message' => 'Sale refunded']);
                exit;
            } catch (Exception $e) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                exit;
            }
        }
        $payment_method = isset($data['payment_method']) ? $conn->real_escape_string($data['payment_method']) : 'cash';
        // Normalize payment mode to canonical form (e.g., Cash, Card, Online)
        $payment_raw = isset($data['payment_method']) ? $data['payment_method'] : 'cash';
        $payment_method = $conn->real_escape_string(normalize_mode($payment_raw, 'payment'));
        // legacy: we accept `channel` in input but prefer `cart_mode` (dinein|takeout|delivery)
        // $channel is intentionally not used for persistence to avoid confusion with `cart_mode`.
        $customer_name = isset($data['customer_name']) ? $conn->real_escape_string($data['customer_name']) : null;
        $reference = isset($data['reference']) ? $conn->real_escape_string($data['reference']) : null;
        // Normalize cart mode to canonical form (e.g., Dine in, Take out, Delivery)
        $cart_raw = isset($data['cart_mode']) ? $data['cart_mode'] : null;
        $cart_mode = $cart_raw !== null ? $conn->real_escape_string(normalize_mode($cart_raw, 'cart')) : null;

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
                // We now persist the payment bookkeeping fields `amount_received` and `change_amount` on the sales row.
                // Persist sale with status set to 'completed' so POS-completed orders are marked accordingly
                $sql = "INSERT INTO sales (reference, customer_name, subtotal, tax, total_amount, payment_method, cart_mode, amount_received, change_amount, employee_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $conn->prepare($sql);
            if (!$stmt) throw new Exception($conn->error);
            // types: reference(s), customer_name(s), subtotal(d), tax(d), total_amount(d), payment_method(s), cart_mode(s), amount_received(d), change_amount(d), employee_id(i), status(s)
                $status = 'completed';
                $stmt->bind_param('ssdddssddis', $reference, $customer_name, $subtotal, $tax, $total_amount, $payment_method, $cart_mode, $amount_received, $change, $employee_id, $status);
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

                // bind params: sale_id(i), product_id(i), variant_id(i), name(s), unit_price(d), quantity(d), total_price(d), variant(s)
                // use 'd' for quantity to support fractional component quantities when inserting component rows later
                $itemStmt->bind_param('iiisddds', $sale_id, $product_id, $variant_id, $name, $unit_price, $quantity, $total_price, $variant);
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
                    $mainItemDeducted = false;
                    // 1) If variant_id provided and a variant stock column exists, decrement that column on product_variants
                    if ($variant_id !== null && $hasProductVariants && $variantStockCol !== null) {
                        try {
                            $col = $variantStockCol;
                            // Handle VARCHAR in_stock: extract numeric part, do calculation, preserve unit if present
                            $qmvstock = $conn->prepare("SELECT `" . $col . "` FROM product_variants WHERE id = ? LIMIT 1");
                            $mvcurrentStock = null;
                            $mvstockUnit = '';
                            if ($qmvstock) {
                                $qmvstock->bind_param('i', $variant_id);
                                $qmvstock->execute();
                                $qmvstock->bind_result($mvstockVal);
                                if ($qmvstock->fetch() && $mvstockVal !== null) {
                                    $mvcurrentStock = $mvstockVal;
                                    // Try to extract unit (everything after the first space)
                                    if (preg_match('/^([\d.]+)\s*(.+)$/', trim($mvstockVal), $matches)) {
                                        $mvstockUnit = ' ' . trim($matches[2]);
                                    }
                                }
                                $qmvstock->close();
                            }
                            
                            // Calculate new stock value
                            $mvstockNum = ($mvcurrentStock !== null) ? floatval($mvcurrentStock) : 0;
                            $mvnewStockNum = max(0, $mvstockNum - floatval($quantity));
                            $mvnewStock = ($mvnewStockNum == floor($mvnewStockNum)) ? (string)intval($mvnewStockNum) : (string)round($mvnewStockNum, 2);
                            $mvnewStock .= $mvstockUnit;
                            
                            $updSql = "UPDATE product_variants SET `" . $col . "` = ? WHERE id = ?";
                            $uvar = $conn->prepare($updSql);
                            if ($uvar) {
                                $uvar->bind_param('si', $mvnewStock, $variant_id);
                                $uvar->execute();
                                $uvar->close();
                                $mainItemDeducted = true;
                            }
                        } catch (Exception $e) { /* ignore variant update errors */ }
                    }
                    
                    if (!$mainItemDeducted && $hasInventory) {
                        $loc = 'Main Warehouse';
                        $upd = $conn->prepare("UPDATE inventory SET quantity = GREATEST(0, quantity - ?), last_updated = NOW() WHERE product_id = ? AND location = ?");
                        if ($upd) {
                            $qval = floatval($quantity);
                            // bind as double, int, string
                            $upd->bind_param('dis', $qval, $product_id, $loc);
                            if ($upd->execute() && $upd->affected_rows > 0) {
                                $mainItemDeducted = true;
                            }
                            $upd->close();
                        }
                    }
                    
                    if (!$mainItemDeducted && $hasProductInStock && $product_id !== null) {
                        try {
                            // Handle VARCHAR in_stock: extract numeric part, do calculation, preserve unit if present
                            $qmpstock = $conn->prepare("SELECT in_stock FROM products WHERE id = ? LIMIT 1");
                            $mpcurrentStock = null;
                            $mpstockUnit = '';
                            if ($qmpstock) {
                                $qmpstock->bind_param('i', $product_id);
                                $qmpstock->execute();
                                $qmpstock->bind_result($mpstockVal);
                                if ($qmpstock->fetch() && $mpstockVal !== null) {
                                    $mpcurrentStock = $mpstockVal;
                                    // Try to extract unit (everything after the first space)
                                    if (preg_match('/^([\d.]+)\s*(.+)$/', trim($mpstockVal), $matches)) {
                                        $mpstockUnit = ' ' . trim($matches[2]);
                                    }
                                }
                                $qmpstock->close();
                            }
                            
                            // Calculate new stock value
                            $mpstockNum = ($mpcurrentStock !== null) ? floatval($mpcurrentStock) : 0;
                            $mpnewStockNum = max(0, $mpstockNum - floatval($quantity));
                            $mpnewStock = ($mpnewStockNum == floor($mpnewStockNum)) ? (string)intval($mpnewStockNum) : (string)round($mpnewStockNum, 2);
                            $mpnewStock .= $mpstockUnit;
                            
                            $u2 = $conn->prepare("UPDATE products SET in_stock = ? WHERE id = ?");
                            if ($u2) {
                                $u2->bind_param('si', $mpnewStock, $product_id);
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

                    // Always attempt to lookup components by parent id (product or resolved variant parent).
                    // Some installs may not set `is_composite` flags consistently, so checking components
                    // directly ensures deductions occur when product_components rows exist.
                    if ($product_id !== null || ($variant_id !== null)) {
                        // Helper function to evaluate component_qty expressions (like "1/4", "2", etc.)
                        if (!function_exists('evaluate_quantity_expr')) {
                            function evaluate_quantity_expr($s) {
                                $s = trim((string)$s);
                                if ($s === '') return 0.0;
                                // remove common grouping/currency characters but treat spaces as addition
                                // e.g. "1 1/2" -> "1+1/2"
                                $s = preg_replace('/[,_\x{20B1}\$]/u', '', $s);
                                $s = preg_replace('/\s+/', '+', $s);
                                // trim any leading/trailing plus signs introduced
                                $s = preg_replace('/^\++|\++$/', '', $s);
                                // allow only digits, operators, parentheses, decimal point and whitespace
                                if (!preg_match('/^[0-9+\-\*\/().\s]+$/', $s)) return 0.0;
                                // block suspicious operator combos
                                if (preg_match('/\/\/|\/\*|\*\*/', $s)) return 0.0;
                                // evaluate in a restricted way
                                try {
                                    $val = @eval('return (' . $s . ');');
                                    if ($val === null || $val === false) return 0.0;
                                    if (is_numeric($val)) return floatval($val);
                                    return 0.0;
                                } catch (Exception $e) {
                                    return 0.0;
                                }
                            }
                        }
                        
                        // Determine which parent id to use for components lookup:
                        // prefer product_id if available, otherwise try to resolve parent product from variant
                        $parent_for_components = $product_id;
                        if (($parent_for_components === null || $parent_for_components === 0) && $variant_id !== null && $hasProductVariants) {
                            try {
                                $qpv_parent = $conn->prepare("SELECT product_id FROM product_variants WHERE id = ? LIMIT 1");
                                if ($qpv_parent) {
                                    $qpv_parent->bind_param('i', $variant_id);
                                    $qpv_parent->execute();
                                    $qpv_parent->bind_result($resolved_parent_pid);
                                    if ($qpv_parent->fetch() && $resolved_parent_pid !== null && $resolved_parent_pid > 0) {
                                        $parent_for_components = intval($resolved_parent_pid);
                                    }
                                    $qpv_parent->close();
                                }
                            } catch (Exception $e) { /* ignore resolution errors */ }
                        }

                        $pc = $conn->prepare("SELECT component_product_id, component_variant_id, component_qty FROM product_components WHERE parent_product_id = ?");
                        if ($pc) {
                            $pc->bind_param('i', $parent_for_components);
                            if (!$pc->execute()) {
                                error_log("Failed to execute component query for parent_product_id: " . $product_id . ", Error: " . $pc->error);
                                $pc->close();
                            } else {
                            // Store result and report count when debugging so callers can see whether
                            // components existed for the resolved parent id.
                            try { $pc->store_result(); } catch (Exception $e) { /* ignore */ }
                            $pc_num = property_exists($pc, 'num_rows') ? $pc->num_rows : null;
                            if (isset($postDebug) && $postDebug) {
                                $debug_components[] = [ 'action' => 'components_query', 'parent_for_components' => $parent_for_components, 'found' => $pc_num ];
                            }
                            $pc->bind_result($comp_product_id, $comp_variant_id, $comp_qty);
                                $componentCount = 0;
                            while ($pc->fetch()) {
                                    $componentCount++;
                                // Handle NULL values - convert to proper null
                                $comp_product_id = ($comp_product_id === null || $comp_product_id === 0) ? null : intval($comp_product_id);
                                $comp_variant_id = ($comp_variant_id === null || $comp_variant_id === 0) ? null : intval($comp_variant_id);
                                
                                // compute required quantity as sold_quantity * component_qty (allow fractional and expressions)
                                $comp_qty_num = evaluate_quantity_expr($comp_qty ?: '0');
                                $needed = $comp_qty_num * floatval($quantity);

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
                                        // quantity may be fractional; bind as double
                                        $itemStmt->bind_param('iiisddds', $sale_id, $comp_product_id, $comp_variant_id, $comp_name, $comp_unit_price, $needed, $comp_total_price, $comp_variant);
                                        $itemStmt->execute();
                                    }
                                } catch (Exception $e) { /* ignore component insert errors */ }

                                // decide track_stock for component
                                // Default to true (deduct) if track_stock column doesn't exist
                                $shouldDeductComp = true;
                                if ($comp_variant_id !== null && $comp_variant_id > 0 && $hasProductVariants && $hasVariantTrack) {
                                    try {
                                        $qtsc = $conn->prepare("SELECT track_stock FROM product_variants WHERE id = ? LIMIT 1");
                                        if ($qtsc) {
                                            $qtsc->bind_param('i', $comp_variant_id);
                                            $qtsc->execute();
                                            $qtsc->bind_result($cvtrack);
                                            if ($qtsc->fetch()) {
                                                $shouldDeductComp = (intval($cvtrack) === 1);
                                            }
                                            $qtsc->close();
                                        }
                                    } catch (Exception $e) { }
                                } elseif ($comp_product_id !== null && $comp_product_id > 0 && $hasProductTrack) {
                                    try {
                                        $qtsc = $conn->prepare("SELECT track_stock FROM products WHERE id = ? LIMIT 1");
                                        if ($qtsc) {
                                            $qtsc->bind_param('i', $comp_product_id);
                                            $qtsc->execute();
                                            $qtsc->bind_result($cptrack);
                                            if ($qtsc->fetch()) {
                                                $shouldDeductComp = (intval($cptrack) === 1);
                                            }
                                            $qtsc->close();
                                        }
                                    } catch (Exception $e) { }
                                }
                                
                                // Also check if component has variant but no track_stock column - still need to check product level
                                if (!$shouldDeductComp && $comp_variant_id !== null && $comp_variant_id > 0 && !$hasVariantTrack) {
                                    // Variant exists but no track_stock column, try to get product_id from variant and check its track_stock
                                    try {
                                        $qvar = $conn->prepare("SELECT product_id FROM product_variants WHERE id = ? LIMIT 1");
                                        if ($qvar) {
                                            $qvar->bind_param('i', $comp_variant_id);
                                            $qvar->execute();
                                            $qvar->bind_result($var_pid);
                                            if ($qvar->fetch() && $var_pid !== null && $var_pid > 0 && $hasProductTrack) {
                                                $qtsc2 = $conn->prepare("SELECT track_stock FROM products WHERE id = ? LIMIT 1");
                                                if ($qtsc2) {
                                                    $qtsc2->bind_param('i', $var_pid);
                                                    $qtsc2->execute();
                                                    $qtsc2->bind_result($cptrack2);
                                                    if ($qtsc2->fetch()) {
                                                        $shouldDeductComp = (intval($cptrack2) === 1);
                                                    }
                                                    $qtsc2->close();
                                                }
                                            } elseif ($qvar->fetch() && $var_pid !== null && $var_pid > 0 && !$hasProductTrack) {
                                                // No track_stock column on products either, default to deduct
                                                $shouldDeductComp = true;
                                            }
                                            $qvar->close();
                                        }
                                    } catch (Exception $e) { }
                                }

                                if (!$shouldDeductComp) continue;

                                // perform component deduction based on component type
                                // If component_variant_id exists -> deduct from product_variants
                                // Otherwise -> deduct from products.in_stock
                                if ($comp_variant_id !== null && $comp_variant_id > 0 && $hasProductVariants) {
                                    try {
                                        if ($variantStockCol !== null) {
                                            $col = $variantStockCol;
                                            $qvstock = $conn->prepare("SELECT `" . $col . "` FROM product_variants WHERE id = ? LIMIT 1");
                                            $vcurrentStock = null;
                                            $vstockUnit = '';
                                            if ($qvstock) {
                                                $qvstock->bind_param('i', $comp_variant_id);
                                                $qvstock->execute();
                                                $qvstock->bind_result($vstockVal);
                                                if ($qvstock->fetch() && $vstockVal !== null) {
                                                    $vcurrentStock = $vstockVal;
                                                    if (preg_match('/^([\d.]+)\s*(.+)$/', trim($vstockVal), $matches)) {
                                                        $vstockUnit = ' ' . trim($matches[2]);
                                                    }
                                                }
                                                $qvstock->close();
                                            }

                                            $vstockNum = ($vcurrentStock !== null) ? floatval($vcurrentStock) : 0;
                                            $vnewStockNum = max(0, $vstockNum - floatval($needed));
                                            $vnewStock = ($vnewStockNum == floor($vnewStockNum)) ? (string)intval($vnewStockNum) : (string)round($vnewStockNum, 2);
                                            $vnewStock .= $vstockUnit;

                                            $updCompSql = "UPDATE product_variants SET `" . $col . "` = ? WHERE id = ?";
                                            $ucompv = $conn->prepare($updCompSql);
                                            if ($ucompv) {
                                                $ucompv->bind_param('si', $vnewStock, $comp_variant_id);
                                                $ucompv->execute();
                                                $ucompv->close();
                                            }
                                        } else {
                                            // No variant stock column; fall back to parent product in_stock if possible
                                            $qvar = $conn->prepare("SELECT product_id FROM product_variants WHERE id = ? LIMIT 1");
                                            if ($qvar) {
                                                $qvar->bind_param('i', $comp_variant_id);
                                                $qvar->execute();
                                                $qvar->bind_result($var_pid);
                                                if ($qvar->fetch() && $var_pid !== null && $var_pid > 0) {
                                                    // deduct from products.in_stock for parent product
                                                    $tpid = intval($var_pid);
                                                    $qstock = $conn->prepare("SELECT in_stock FROM products WHERE id = ? LIMIT 1");
                                                    if ($qstock) {
                                                        $qstock->bind_param('i', $tpid);
                                                        $qstock->execute();
                                                        $qstock->bind_result($stockVal);
                                                        $currentStock = null;
                                                        $stockUnit = '';
                                                        if ($qstock->fetch()) {
                                                            $currentStock = $stockVal;
                                                            if ($stockVal !== null && preg_match('/^([\d.]+)\s*(.+)$/', trim($stockVal), $matches)) {
                                                                $stockUnit = ' ' . trim($matches[2]);
                                                            }
                                                        }
                                                        $qstock->close();

                                                        $stockNum = ($currentStock !== null && $currentStock !== '') ? floatval($currentStock) : 0;
                                                        $newStockNum = max(0, $stockNum - floatval($needed));
                                                        $newStock = ($newStockNum == floor($newStockNum)) ? (string)intval($newStockNum) : (string)round($newStockNum, 2);
                                                        if ($stockUnit !== '') $newStock .= $stockUnit;

                                                        $ucomp = $conn->prepare("UPDATE products SET in_stock = ? WHERE id = ?");
                                                        if ($ucomp) {
                                                            $ucomp->bind_param('si', $newStock, $tpid);
                                                            $ucomp->execute();
                                                            $ucomp->close();
                                                        }
                                                    }
                                                }
                                                $qvar->close();
                                            }
                                        }
                                    } catch (Exception $e) { error_log('Component variant deduction error: ' . $e->getMessage()); }
                                } elseif ($comp_product_id !== null && $comp_product_id > 0) {
                                    // Deduct from products.in_stock for component product
                                    try {
                                        $tpid = intval($comp_product_id);
                                        $qstock = $conn->prepare("SELECT in_stock FROM products WHERE id = ? LIMIT 1");
                                        $currentStock = null;
                                        $stockUnit = '';
                                        if ($qstock) {
                                            $qstock->bind_param('i', $tpid);
                                            $qstock->execute();
                                            $qstock->bind_result($stockVal);
                                            if ($qstock->fetch()) {
                                                $currentStock = $stockVal;
                                                if ($stockVal !== null && preg_match('/^([\d.]+)\s*(.+)$/', trim($stockVal), $matches)) {
                                                    $stockUnit = ' ' . trim($matches[2]);
                                                }
                                            }
                                            $qstock->close();
                                        }

                                        $stockNum = ($currentStock !== null && $currentStock !== '') ? floatval($currentStock) : 0;
                                        $newStockNum = max(0, $stockNum - floatval($needed));
                                        $newStock = ($newStockNum == floor($newStockNum)) ? (string)intval($newStockNum) : (string)round($newStockNum, 2);
                                        if ($stockUnit !== '') $newStock .= $stockUnit;

                                        $ucomp = $conn->prepare("UPDATE products SET in_stock = ? WHERE id = ?");
                                        if ($ucomp) {
                                            $ucomp->bind_param('si', $newStock, $tpid);
                                            $ucomp->execute();
                                            $ucomp->close();
                                        }
                                    } catch (Exception $e) { error_log('Component product deduction error: ' . $e->getMessage()); }
                                } else {
                                    // No valid component id found
                                    error_log('Component row missing both component_product_id and component_variant_id for parent ' . ($product_id ?? 'NULL'));
                                }
                            }
                            $pc->close();
                                if ($componentCount === 0) {
                                    // As a fallback: if we tried the resolved parent (product) and found no components,
                                    // try again using the variant id itself as parent (some setups may store components against variant ids).
                                    if ($variant_id !== null && $variant_id > 0) {
                                        try {
                                            $pc2 = $conn->prepare("SELECT component_product_id, component_variant_id, component_qty FROM product_components WHERE parent_product_id = ?");
                                            if ($pc2) {
                                                $pc2->bind_param('i', $variant_id);
                                                if ($pc2->execute()) {
                                                    $pc2->bind_result($comp_product_id, $comp_variant_id, $comp_qty);
                                                    $foundAny = false;
                                                    while ($pc2->fetch()) {
                                                        $foundAny = true;
                                                        // Re-run the same component handling logic for this row by duplicating the handling
                                                        // For simplicity, log that a component was found under variant parent and let next sale commit handle it
                                                        error_log("Found components for composite under variant parent (variant_id): " . $variant_id . ", component_product_id: " . ($comp_product_id ?? 'NULL'));
                                                    }
                                                }
                                                $pc2->close();
                                            }
                                        } catch (Exception $e) { /* ignore fallback errors */ }
                                    }
                                    error_log("No components found for composite product_id/parent: " . ($parent_for_components ?? 'NULL'));
                                }
                            }
                        } else {
                            error_log("Failed to prepare component query for parent_product_id: " . $product_id . ", Error: " . $conn->error);
                        }
                    } else {
                        if ($product_id === null) {
                            error_log("Composite check skipped: product_id is null");
                        } elseif (!$isComposite) {
                            // Not a composite, skip silently
                        }
                    }
                } catch (Exception $e) { 
                    error_log("Exception in composite handling for product_id: " . ($product_id ?? 'NULL') . ", Error: " . $e->getMessage());
                    // Don't fail the sale, but log the error
                }
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
