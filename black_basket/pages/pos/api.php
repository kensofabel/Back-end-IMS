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
        // Process sale
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['items']) || empty($data['items'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid sale data']);
            exit;
        }

        $items = $data['items'];
        $payment_method = isset($data['payment_method']) ? $data['payment_method'] : 'cash';
        $channel = isset($data['channel']) ? $data['channel'] : 'in-store';
        $customer_name = isset($data['customer_name']) ? $conn->real_escape_string($data['customer_name']) : null;

        $total_amount = 0;
        foreach ($items as $item) {
            $total_amount += $item['quantity'] * $item['unit_price'];
        }

        $conn->begin_transaction();
        try {
            // Insert sale
            $sql = "INSERT INTO sales (customer_name, sale_date, total_amount, payment_method, channel, created_at) VALUES (?, NOW(), ?, ?, ?, NOW())";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sdss", $customer_name, $total_amount, $payment_method, $channel);
            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            $sale_id = $conn->insert_id;

            // Insert sale items and update inventory
            foreach ($items as $item) {
                $product_id = $item['product_id'];
                $quantity = $item['quantity'];
                $unit_price = $item['unit_price'];

                // Insert sale item
                $sql = "INSERT INTO sale_items (sale_id, product_id, quantity_sold, unit_price, total_price) VALUES (?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $total_price = $quantity * $unit_price;
                $stmt->bind_param("iiidd", $sale_id, $product_id, $quantity, $unit_price, $total_price);
                if (!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }

                // Update inventory (deduct from Main Warehouse)
                $location = 'Main Warehouse';
                $sql = "UPDATE inventory SET quantity = quantity - ?, last_updated=NOW() WHERE product_id = ? AND location = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iis", $quantity, $product_id, $location);
                if (!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
            }

            $conn->commit();
            echo json_encode(['success' => true, 'sale_id' => $sale_id, 'total' => $total_amount]);
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
