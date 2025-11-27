<?php
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';

// Require login
// Allow a debug bypass for GET requests (useful during development). Do not allow for POST.
$debugMode = (isset($_GET['debug']) && $_GET['debug'] === '1');
if (!$debugMode) {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
} else {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Debug bypass only allowed for GET']);
        exit;
    }
}

// Allow the client to request more transactions; default to 100 and
// cap at a reasonable upper bound to avoid excessive load.
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
if ($limit <= 0) $limit = 100;
if ($limit > 1000) $limit = 1000;

// Detect optional bookkeeping columns (some installs may not have them yet)
$hasAmountReceived = false;
$hasChangeAmount = false;
try {
    $r = $conn->query("SHOW COLUMNS FROM sales LIKE 'amount_received'");
    if ($r && $r->num_rows > 0) $hasAmountReceived = true;
} catch (Exception $e) { /* ignore */ }
try {
    $r2 = $conn->query("SHOW COLUMNS FROM sales LIKE 'change_amount'");
    if ($r2 && $r2->num_rows > 0) $hasChangeAmount = true;
} catch (Exception $e) { /* ignore */ }

// Fetch recent sales with optional employee name
$selectExtras = '';
if ($hasAmountReceived) $selectExtras .= ', s.amount_received';
if ($hasChangeAmount) $selectExtras .= ', s.change_amount';

$sql = "SELECT s.id, s.reference, s.customer_name, s.subtotal, s.tax, s.total_amount, s.payment_method, s.cart_mode, s.employee_id, s.status, s.created_at" . $selectExtras . "\n    FROM sales s\n    ORDER BY s.created_at DESC\n    LIMIT ?";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'details' => $conn->error]);
    exit;
}
$stmt->bind_param('i', $limit);
$stmt->execute();
$result = $stmt->get_result();
$rows = [];
while ($row = $result->fetch_assoc()) {
    // normalize output types
        $rows[] = [
        'id' => (int)$row['id'],
        'reference' => $row['reference'],
        'customer_name' => $row['customer_name'],
            'status' => isset($row['status']) ? $row['status'] : null,
        'subtotal' => (float)$row['subtotal'],
        'tax' => (float)$row['tax'],
        'total_amount' => (float)$row['total_amount'],
        'payment_method' => $row['payment_method'],
        'cart_mode' => $row['cart_mode'],
        'employee_id' => $row['employee_id'] !== null ? (int)$row['employee_id'] : null,
        'amount_received' => array_key_exists('amount_received', $row) ? ($row['amount_received'] !== null ? (float)$row['amount_received'] : null) : null,
        'change_amount' => array_key_exists('change_amount', $row) ? ($row['change_amount'] !== null ? (float)$row['change_amount'] : null) : null,
        'employee_name' => null,
        'created_at' => $row['created_at']
    ];
}

// If we have sales, fetch sale_items for these sale ids in one query and attach
if (count($rows) > 0) {
    $ids = array_map(function($r){ return (int)$r['id']; }, $rows);
    // build comma-separated list
    $in = implode(',', $ids);
    $itemsSql = "SELECT sale_id, product_id, name, unit_price, quantity, total_price, variant FROM sale_items WHERE sale_id IN ($in) ORDER BY id ASC";
    $itemsResult = $conn->query($itemsSql);
    $itemsBySale = [];
    if ($itemsResult) {
        while ($it = $itemsResult->fetch_assoc()) {
            $sid = (int)$it['sale_id'];
            if (!isset($itemsBySale[$sid])) $itemsBySale[$sid] = [];
            $itemsBySale[$sid][] = [
                'product_id' => $it['product_id'] !== null ? (int)$it['product_id'] : null,
                'name' => $it['name'],
                'unit_price' => isset($it['unit_price']) ? (float)$it['unit_price'] : 0.0,
                'quantity' => isset($it['quantity']) ? (float)$it['quantity'] : 0,
                'total_price' => isset($it['total_price']) ? (float)$it['total_price'] : 0.0,
                'variant' => $it['variant']
            ];
        }
    }

    // attach items to each sale row
    foreach ($rows as &$r) {
        $r['items'] = isset($itemsBySale[$r['id']]) ? $itemsBySale[$r['id']] : [];
    }
    unset($r);

    // Resolve employee names separately to avoid referencing non-standard column names in SQL
    $employeeIds = [];
    foreach ($rows as $r) {
        if (!empty($r['employee_id'])) $employeeIds[] = (int)$r['employee_id'];
    }
    $employeeIds = array_values(array_unique($employeeIds));
    if (count($employeeIds) > 0) {
        $inUsers = implode(',', $employeeIds);
        $usersSql = "SELECT * FROM users WHERE id IN ($inUsers)";
        $usersRes = $conn->query($usersSql);
        $userNames = [];
        if ($usersRes) {
            while ($u = $usersRes->fetch_assoc()) {
                $uid = isset($u['id']) ? (int)$u['id'] : null;
                if ($uid === null) continue;
                $name = null;
                if (isset($u['fullname']) && $u['fullname'] !== '') $name = $u['fullname'];
                else if (isset($u['full_name']) && $u['full_name'] !== '') $name = $u['full_name'];
                else if (isset($u['name']) && $u['name'] !== '') $name = $u['name'];
                else if (isset($u['username']) && $u['username'] !== '') $name = $u['username'];
                $userNames[$uid] = $name;
            }
        }

        // attach resolved employee name
        foreach ($rows as &$r) {
            if (!empty($r['employee_id']) && isset($userNames[$r['employee_id']])) {
                $r['employee_name'] = $userNames[$r['employee_id']];
            }
        }
        unset($r);
    }
}

echo json_encode($rows);

?>