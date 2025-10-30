<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Basic auth check: require logged-in user
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit();
}

require_once '../../config/db.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    // fallback to form data
    $data = $_POST;
}

$product_id = isset($data['product_id']) ? (int)$data['product_id'] : 0;
$variant_id = isset($data['variant_id']) && $data['variant_id'] !== '' ? (int)$data['variant_id'] : 0;
$category_id = array_key_exists('category_id', $data) && $data['category_id'] !== null && $data['category_id'] !== '' ? (int)$data['category_id'] : null;

if ($variant_id && !$product_id) {
    // resolve product id from variant
    $stmt = $conn->prepare('SELECT product_id FROM product_variants WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $variant_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($r = $res->fetch_assoc()) {
        $product_id = (int)$r['product_id'];
    }
    $stmt->close();
}

if (!$product_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing product id']);
    exit();
}

// Update product category (allow null)
if ($category_id === null) {
    $stmt = $conn->prepare('UPDATE products SET category_id = NULL WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $product_id);
} else {
    $stmt = $conn->prepare('UPDATE products SET category_id = ? WHERE id = ? LIMIT 1');
    $stmt->bind_param('ii', $category_id, $product_id);
}

$ok = $stmt->execute();
$stmt->close();

if (!$ok) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database update failed']);
    exit();
}

$catName = '';
if ($category_id !== null) {
    $stmt = $conn->prepare('SELECT name FROM categories WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $category_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($r = $res->fetch_assoc()) {
        $catName = $r['name'];
    }
    $stmt->close();
}

echo json_encode(['success' => true, 'product_id' => $product_id, 'category_id' => $category_id, 'category_name' => $catName]);
exit();
