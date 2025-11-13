<?php
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';

// Support GET to return favourite products, and POST to add/remove favourites.
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Determine price column and inventory presence similar to pos api
    $priceCol = 'unit_price';
    $hasUnitPrice = false;
    $hasPrice = false;
    $hasInventory = false;
    $hasProductInStock = false;
    try { $r = $conn->query("SHOW COLUMNS FROM products LIKE 'unit_price'"); if ($r && $r->num_rows > 0) $hasUnitPrice = true; } catch (Exception $e) {}
    try { $r2 = $conn->query("SHOW COLUMNS FROM products LIKE 'price'"); if ($r2 && $r2->num_rows > 0) $hasPrice = true; } catch (Exception $e) {}
    if ($hasUnitPrice) $priceCol = 'unit_price'; else if ($hasPrice) $priceCol = 'price'; else $priceCol = 'unit_price';
    try { $r = $conn->query("SHOW TABLES LIKE 'inventory'"); if ($r && $r->num_rows > 0) $hasInventory = true; } catch (Exception $e) {}
    try { $r2 = $conn->query("SHOW COLUMNS FROM products LIKE 'in_stock'"); if ($r2 && $r2->num_rows > 0) $hasProductInStock = true; } catch (Exception $e) {}

    // Build SQL to select favourite products. If user logged in, include their favourites and global (NULL user_id).
    $user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
    if ($hasInventory && $hasProductInStock) {
        $sql = "SELECT DISTINCT p.id, p.name, p." . $priceCol . ", COALESCE(i.quantity, p.in_stock) AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                FROM products p
                LEFT JOIN inventory i ON p.id = i.product_id
                INNER JOIN favourites f ON f.product_id = p.id
                WHERE p.pos_available = 1";
    } else if ($hasInventory) {
        $sql = "SELECT DISTINCT p.id, p.name, p." . $priceCol . ", i.quantity AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                FROM products p
                LEFT JOIN inventory i ON p.id = i.product_id
                INNER JOIN favourites f ON f.product_id = p.id
                WHERE p.pos_available = 1";
    } else if ($hasProductInStock) {
        $sql = "SELECT DISTINCT p.id, p.name, p." . $priceCol . ", p.in_stock AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                FROM products p
                INNER JOIN favourites f ON f.product_id = p.id
                WHERE p.pos_available = 1";
    } else {
        $sql = "SELECT DISTINCT p.id, p.name, p." . $priceCol . ", NULL AS quantity, p.low_stock, p.track_stock, p.type, p.color, p.shape, p.image_url
                FROM products p
                INNER JOIN favourites f ON f.product_id = p.id
                WHERE p.pos_available = 1";
    }

    if ($user_id !== null) {
        $sql .= " AND (f.user_id = " . $user_id . " OR f.user_id IS NULL)";
    } else {
        $sql .= " AND f.user_id IS NULL";
    }
    $sql .= "\nLIMIT 200";

    try {
        $result = $conn->query($sql);
    } catch (Exception $e) {
        echo json_encode([]);
        exit;
    }
    $products = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) { $products[] = $row; }
    }
    echo json_encode($products);
    exit;
}

// POST: add/remove favourites
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['product_id']) || !isset($data['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$product_id = intval($data['product_id']);
$action = $data['action'] === 'add' ? 'add' : ($data['action'] === 'remove' ? 'remove' : '');
if (!$action) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
    exit;
}

// Optional user-scoped favourites. If session user exists, use it; otherwise store NULL (global favourite)
$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;

try {
    if ($action === 'add') {
        // Avoid duplicate entries
        if ($user_id !== null) {
            $stmt = $conn->prepare("SELECT id FROM favourites WHERE product_id = ? AND user_id = ? LIMIT 1");
            $stmt->bind_param('ii', $product_id, $user_id);
        } else {
            $stmt = $conn->prepare("SELECT id FROM favourites WHERE product_id = ? AND user_id IS NULL LIMIT 1");
            $stmt->bind_param('i', $product_id);
        }
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            echo json_encode(['success' => true, 'existing' => true]);
            exit;
        }

        if ($user_id !== null) {
            $ins = $conn->prepare("INSERT INTO favourites (user_id, product_id, created_at) VALUES (?, ?, NOW())");
            $ins->bind_param('ii', $user_id, $product_id);
        } else {
            $ins = $conn->prepare("INSERT INTO favourites (user_id, product_id, created_at) VALUES (NULL, ?, NOW())");
            $ins->bind_param('i', $product_id);
        }
        if (!$ins->execute()) {
            throw new Exception($ins->error);
        }
        echo json_encode(['success' => true, 'insert_id' => $conn->insert_id]);
        exit;
    } else {
        // remove
        if ($user_id !== null) {
            $del = $conn->prepare("DELETE FROM favourites WHERE product_id = ? AND user_id = ?");
            $del->bind_param('ii', $product_id, $user_id);
        } else {
            $del = $conn->prepare("DELETE FROM favourites WHERE product_id = ? AND user_id IS NULL");
            $del->bind_param('i', $product_id);
        }
        if (!$del->execute()) {
            throw new Exception($del->error);
        }
        echo json_encode(['success' => true, 'affected' => $del->affected_rows]);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
    exit;
}

?>
