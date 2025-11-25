<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/db.php';
// capture current user from session if available
if (session_status() === PHP_SESSION_NONE) session_start();
$current_user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['items']) || !is_array($input['items'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    http_response_code(400);
    exit;
}

$items = $input['items'];
$ref = isset($input['ref']) ? trim($input['ref']) : null;
$cart_mode = isset($input['cart_mode']) ? trim($input['cart_mode']) : 'dinein';
$updateOrderId = isset($input['order_id']) && intval($input['order_id']) ? intval($input['order_id']) : null;
$subtotal = isset($input['subtotal']) ? floatval($input['subtotal']) : 0;
$tax = isset($input['tax']) ? floatval($input['tax']) : 0;
$total = isset($input['total']) ? floatval($input['total']) : 0;
$payment_method = isset($input['payment_method']) ? trim($input['payment_method']) : 'unknown';

// Basic validation
if (count($items) === 0) {
    echo json_encode(['success' => false, 'error' => 'Cart is empty']);
    http_response_code(400);
    exit;
}

// Insert order and items using transaction
$conn->autocommit(false);
try {
    // If an order_id was provided, update existing order (replace items)
    if ($updateOrderId !== null) {
        // check exists
        $chk = $conn->prepare('SELECT id FROM orders WHERE id = ?');
        if (!$chk) throw new Exception($conn->error);
        $chk->bind_param('i', $updateOrderId);
        if (!$chk->execute()) throw new Exception($chk->error);
        $res = $chk->get_result();
        if (!$res || $res->num_rows === 0) throw new Exception('Order not found for update');
        $chk->close();

        if ($current_user_id !== null) {
            $ustmt = $conn->prepare("UPDATE orders SET reference = ?, subtotal = ?, tax = ?, total_amount = ?, payment_method = ?, cart_mode = ?, status = 'open', updated_at = NOW(), employee_id = ? WHERE id = ?");
            if (!$ustmt) throw new Exception($conn->error);
            $ustmt->bind_param('sdddssii', $ref, $subtotal, $tax, $total, $payment_method, $cart_mode, $current_user_id, $updateOrderId);
        } else {
            $ustmt = $conn->prepare("UPDATE orders SET reference = ?, subtotal = ?, tax = ?, total_amount = ?, payment_method = ?, cart_mode = ?, status = 'open', updated_at = NOW() WHERE id = ?");
            if (!$ustmt) throw new Exception($conn->error);
            $ustmt->bind_param('sdddssi', $ref, $subtotal, $tax, $total, $payment_method, $cart_mode, $updateOrderId);
        }
        if (!$ustmt->execute()) throw new Exception($ustmt->error);
        $ustmt->close();

        // remove existing items
        $del = $conn->prepare('DELETE FROM order_items WHERE order_id = ?');
        if (!$del) throw new Exception($conn->error);
        $del->bind_param('i', $updateOrderId);
        if (!$del->execute()) throw new Exception($del->error);
        $del->close();

        // insert new items
        $itemStmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, variant) VALUES (?, ?, ?, ?, ?, ?)");
        if (!$itemStmt) throw new Exception($conn->error);
        foreach ($items as $it) {
            $pid = isset($it['product_id']) ? $it['product_id'] : null;
            $name = isset($it['name']) ? $it['name'] : '';
            $up = isset($it['unit_price']) ? floatval($it['unit_price']) : 0;
            $qty = isset($it['quantity']) ? intval($it['quantity']) : 1;
            $variant = isset($it['variant']) ? $it['variant'] : null;
            $itemStmt->bind_param('iisdis', $updateOrderId, $pid, $name, $up, $qty, $variant);
            if (!$itemStmt->execute()) throw new Exception($itemStmt->error);
        }
        $itemStmt->close();

        $conn->commit();
        echo json_encode(['success' => true, 'order_id' => $updateOrderId, 'updated' => true]);
        exit;
    }

    // include employee_id when available (insert new order)
    if ($current_user_id !== null) {
        $stmt = $conn->prepare("INSERT INTO orders (reference, subtotal, tax, total_amount, payment_method, cart_mode, status, created_at, employee_id) VALUES (?, ?, ?, ?, ?, ?, 'open', NOW(), ?)");
        if (!$stmt) throw new Exception($conn->error);
        $stmt->bind_param('sdddssi', $ref, $subtotal, $tax, $total, $payment_method, $cart_mode, $current_user_id);
    } else {
        $stmt = $conn->prepare("INSERT INTO orders (reference, subtotal, tax, total_amount, payment_method, cart_mode, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'open', NOW())");
        if (!$stmt) throw new Exception($conn->error);
        $stmt->bind_param('sdddss', $ref, $subtotal, $tax, $total, $payment_method, $cart_mode);
    }
    if (!$stmt->execute()) throw new Exception($stmt->error);
    $order_id = $conn->insert_id;
    $stmt->close();

    $itemStmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, variant) VALUES (?, ?, ?, ?, ?, ?)");
    if (!$itemStmt) throw new Exception($conn->error);

    foreach ($items as $it) {
        $pid = isset($it['product_id']) ? $it['product_id'] : null;
        $name = isset($it['name']) ? $it['name'] : '';
        $up = isset($it['unit_price']) ? floatval($it['unit_price']) : 0;
        $qty = isset($it['quantity']) ? intval($it['quantity']) : 1;
        $variant = isset($it['variant']) ? $it['variant'] : null;
        $itemStmt->bind_param('iisdis', $order_id, $pid, $name, $up, $qty, $variant);
        if (!$itemStmt->execute()) throw new Exception($itemStmt->error);
    }
    $itemStmt->close();

    $conn->commit();
    echo json_encode(['success' => true, 'order_id' => $order_id]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
