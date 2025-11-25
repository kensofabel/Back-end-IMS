<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/db.php';

// Handle deletion via POST { action: 'delete', order_id: ### }
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['action'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid request']);
        http_response_code(400);
        exit;
    }
    $action = $data['action'];
    if ($action === 'delete' && isset($data['order_id'])) {
        $order_id = intval($data['order_id']);
        // delete items then order (or mark closed)
        $stmt = $conn->prepare('DELETE FROM order_items WHERE order_id = ?');
        if ($stmt) { $stmt->bind_param('i', $order_id); $stmt->execute(); $stmt->close(); }
        $stmt2 = $conn->prepare('DELETE FROM orders WHERE id = ?');
        if ($stmt2) { $stmt2->bind_param('i', $order_id); $stmt2->execute(); $stmt2->close(); }
        echo json_encode(['success' => true]);
        exit;
    }
    // Merge selected orders into a target order
    if ($action === 'merge' && isset($data['target_id']) && isset($data['order_ids']) && is_array($data['order_ids'])) {
        $target_id = intval($data['target_id']);
        // sources expected to be array of ids (strings or ints)
        $sources = array_filter(array_map('intval', $data['order_ids']));
        // remove target if accidentally included
        $sources = array_values(array_filter($sources, function($v) use ($target_id){ return $v !== $target_id; }));
        if (empty($sources)) {
            echo json_encode(['success' => false, 'error' => 'No source orders provided']);
            http_response_code(400);
            exit;
        }

        // Begin transaction
        $conn->begin_transaction();
        try {
            // Verify target exists and is open
            $stmt = $conn->prepare('SELECT id FROM orders WHERE id = ? AND status = "open" LIMIT 1');
            if (!$stmt) throw new Exception('DB prepare failed (target verify)');
            $stmt->bind_param('i', $target_id);
            $stmt->execute();
            $res = $stmt->get_result();
            if (!$res || $res->num_rows === 0) throw new Exception('Target order not found or not open');
            $stmt->close();

            // Prepare statements
            $selectTargetItem = $conn->prepare('SELECT id, quantity FROM order_items WHERE order_id = ? AND product_id = ? AND IFNULL(variant, \'\') = ? LIMIT 1');
            $updateItemQty = $conn->prepare('UPDATE order_items SET quantity = quantity + ? WHERE id = ?');
            $insertItem = $conn->prepare('INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, variant) VALUES (?, ?, ?, ?, ?, ?)');
            $deleteSourceItems = $conn->prepare('DELETE FROM order_items WHERE order_id = ?');

            if (!$selectTargetItem || !$updateItemQty || !$insertItem || !$deleteSourceItems) throw new Exception('DB prepare failed');

            // For each source order, move items
            foreach ($sources as $srcId) {
                // fetch items for source
                $itStmt = $conn->prepare('SELECT product_id, name, unit_price, quantity, IFNULL(variant,\'\') AS variant FROM order_items WHERE order_id = ?');
                if (!$itStmt) throw new Exception('DB prepare failed (fetch source items)');
                $itStmt->bind_param('i', $srcId);
                $itStmt->execute();
                $itRes = $itStmt->get_result();
                while ($row = $itRes->fetch_assoc()) {
                    $prodId = intval($row['product_id']);
                    $name = $row['name'];
                    $unitPrice = floatval($row['unit_price']);
                    $qty = intval($row['quantity']);
                    $variant = (string)($row['variant'] ?? '');

                    // check if target already has this product+variant
                    $selectTargetItem->bind_param('iis', $target_id, $prodId, $variant);
                    $selectTargetItem->execute();
                    $tres = $selectTargetItem->get_result();
                    $found = $tres->fetch_assoc();
                    if ($found && isset($found['id'])) {
                        // update existing quantity
                        $updateItemQty->bind_param('ii', $qty, $found['id']);
                        $updateItemQty->execute();
                    } else {
                        // insert new item into target
                        $insertItem->bind_param('iisdis', $target_id, $prodId, $name, $unitPrice, $qty, $variant);
                        $insertItem->execute();
                    }
                    // free result
                    if ($tres) $tres->free();
                }
                $itStmt->close();

                // remove source order items
                $deleteSourceItems->bind_param('i', $srcId);
                $deleteSourceItems->execute();

                // delete the source order row
                $delOrder = $conn->prepare('DELETE FROM orders WHERE id = ?');
                if ($delOrder) { $delOrder->bind_param('i', $srcId); $delOrder->execute(); $delOrder->close(); }
            }

            // Recalculate totals for target order
            $sumStmt = $conn->prepare('SELECT COALESCE(SUM(unit_price * quantity),0) AS subtotal FROM order_items WHERE order_id = ?');
            if (!$sumStmt) throw new Exception('DB prepare failed (sum)');
            $sumStmt->bind_param('i', $target_id);
            $sumStmt->execute();
            $sres = $sumStmt->get_result();
            $row = $sres->fetch_assoc();
            $newSubtotal = floatval($row['subtotal'] ?? 0);
            $sumStmt->close();

            // Determine tax rate from existing order (fallback to 0.0)
            $taxRate = 0.0;
            $trStmt = $conn->prepare('SELECT subtotal, tax FROM orders WHERE id = ? LIMIT 1');
            if ($trStmt) {
                $trStmt->bind_param('i', $target_id);
                $trStmt->execute();
                $trRes = $trStmt->get_result();
                if ($trRow = $trRes->fetch_assoc()) {
                    $oldSubtotal = floatval($trRow['subtotal'] ?? 0);
                    $oldTax = floatval($trRow['tax'] ?? 0);
                    if ($oldSubtotal > 0) $taxRate = $oldTax / $oldSubtotal;
                }
                $trStmt->close();
            }

            $newTax = $newSubtotal * $taxRate;
            $newTotal = $newSubtotal + $newTax;

            $upd = $conn->prepare('UPDATE orders SET subtotal = ?, tax = ?, total_amount = ?, updated_at = NOW() WHERE id = ?');
            if (!$upd) throw new Exception('DB prepare failed (update order)');
            $upd->bind_param('dddi', $newSubtotal, $newTax, $newTotal, $target_id);
            $upd->execute();
            $upd->close();

            // commit
            $conn->commit();
            echo json_encode(['success' => true, 'merged_into' => $target_id]);
            exit;
        } catch (Exception $ex) {
            $conn->rollback();
            echo json_encode(['success' => false, 'error' => 'Merge failed: ' . $ex->getMessage()]);
            http_response_code(500);
            exit;
        }
    }
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
    exit;
}

// If id is provided, return a single order with items
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    // include employee name if available
    $stmt = $conn->prepare('SELECT o.id, o.reference, o.subtotal, o.tax, o.total_amount, o.payment_method, o.cart_mode, o.created_at, o.employee_id, u.full_name AS employee FROM orders o LEFT JOIN users u ON o.employee_id = u.id WHERE o.id = ? LIMIT 1');
    if ($stmt) {
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $order = $res->fetch_assoc();
        $stmt->close();
        if ($order) {
            $items = [];
            $itStmt = $conn->prepare('SELECT product_id, name, unit_price, quantity, variant FROM order_items WHERE order_id = ?');
            if ($itStmt) {
                $itStmt->bind_param('i', $id);
                $itStmt->execute();
                $itRes = $itStmt->get_result();
                while ($itRow = $itRes->fetch_assoc()) {
                    $items[] = $itRow;
                }
                $itStmt->close();
            }
            $order['items'] = $items;
            echo json_encode(['success' => true, 'order' => $order]);
            exit;
        }
    }
    echo json_encode(['success' => false, 'error' => 'Order not found']);
    exit;
}

// GET: return list of saved orders with items
$orders = [];
// Fetch saved orders; include employee name via LEFT JOIN to users
    $res = $conn->query("SELECT o.id, o.reference, o.subtotal, o.tax, o.total_amount, o.payment_method, o.cart_mode, o.created_at, o.employee_id, u.full_name AS employee FROM orders o LEFT JOIN users u ON o.employee_id = u.id WHERE o.status = 'open' ORDER BY o.created_at DESC");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $oid = $row['id'];
        $items = [];
        $itStmt = $conn->prepare('SELECT product_id, name, unit_price, quantity, variant FROM order_items WHERE order_id = ?');
        if ($itStmt) {
            $itStmt->bind_param('i', $oid);
            $itStmt->execute();
            $itRes = $itStmt->get_result();
            while ($itRow = $itRes->fetch_assoc()) {
                $items[] = $itRow;
            }
            $itStmt->close();
        }
        $row['items'] = $items;
        $orders[] = $row;
    }
    $res->close();
}

echo json_encode(['success' => true, 'orders' => $orders]);

?>
