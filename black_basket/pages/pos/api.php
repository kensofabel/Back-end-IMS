<?php
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch products for POS
        if (isset($_GET['search'])) {
            $search = $conn->real_escape_string($_GET['search']);
            $sql = "SELECT p.id, p.name, p.unit_price, i.quantity
                    FROM products p
                    LEFT JOIN inventory i ON p.id = i.product_id
                    WHERE (p.name LIKE '%$search%' OR p.sku LIKE '%$search%' OR p.barcode LIKE '%$search%')
                    AND i.quantity > 0
                    LIMIT 20";
        } else {
            $sql = "SELECT p.id, p.name, p.unit_price, i.quantity
                    FROM products p
                    LEFT JOIN inventory i ON p.id = i.product_id
                    WHERE i.quantity > 0
                    LIMIT 50";
        }
        $result = $conn->query($sql);
        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        echo json_encode($products);
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
