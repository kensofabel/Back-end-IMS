<?php
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
        // Fetch all products with inventory info
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
        // Add new product and inventory
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input']);
            exit;
        }
        $name = $conn->real_escape_string($data['name']);
        $category = $conn->real_escape_string($data['category']);
        $unit_price = floatval($data['price']);
        $description = isset($data['description']) ? $conn->real_escape_string($data['description']) : '';
        $stock = intval($data['stock']);

        $conn->begin_transaction();
        try {
            $sql = "INSERT INTO products (name, category, unit_price, description, created_at) VALUES ('$name', '$category', $unit_price, '$description', NOW())";
            if (!$conn->query($sql)) {
                throw new Exception($conn->error);
            }
            $product_id = $conn->insert_id;

            $sql = "INSERT INTO inventory (product_id, quantity, last_updated) VALUES ($product_id, $stock, NOW())";
            if (!$conn->query($sql)) {
                throw new Exception($conn->error);
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
