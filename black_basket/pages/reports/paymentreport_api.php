<?php
session_start();
header('Content-Type: application/json');
@ini_set('display_errors', '0');
@error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once '../../config/db.php'; // $conn

function get_currency_symbol(mysqli $conn): string {
    $symbol = '₱';
    $sql = "SELECT setting_value FROM settings WHERE setting_key='currency' LIMIT 1";
    if ($res = $conn->query($sql)) {
        if ($row = $res->fetch_assoc()) {
            $val = strtoupper(trim((string)$row['setting_value']));
            switch ($val) {
                case 'PHP': $symbol = '₱'; break;
                case 'USD': $symbol = '$'; break;
                case 'EUR': $symbol = '€'; break;
                case 'JPY': $symbol = '¥'; break;
                default:
                    if ($val !== '') { $symbol = $val; }
            }
        }
    }
    return $symbol;
}

// Parse date range
$start = isset($_GET['start']) ? trim($_GET['start']) : '';
$end   = isset($_GET['end']) ? trim($_GET['end']) : '';
if ($start === '' || $end === '') {
    $endDate = new DateTime('today');
    $startDate = (clone $endDate)->modify('-30 days');
} else {
    try {
        $startDate = new DateTime($start);
        $endDate = new DateTime($end);
    } catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid date format']);
    exit;
    }
}
$startStr = $startDate->format('Y-m-d');
$endStr = $endDate->format('Y-m-d');

$currencySymbol = get_currency_symbol($conn);

// Transactions list with products
$txSql = "
    SELECT 
        s.id AS sale_id,
        DATE_FORMAT(s.sale_date, '%Y-%m-%d %H:%i') AS sale_date,
        s.payment_method,
        s.total_amount,
        COALESCE(si.products, '') AS products
    FROM sales s
    LEFT JOIN (
        SELECT si.sale_id, GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS products
        FROM sale_items si
        JOIN products p ON p.id = si.product_id
        GROUP BY si.sale_id
    ) si ON si.sale_id = s.id
    WHERE s.sale_date >= ? AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)
    ORDER BY s.sale_date DESC, s.id DESC
";
$stmt = $conn->prepare($txSql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to prepare query (transactions).']);
    exit;
}
$stmt->bind_param('ss', $startStr, $endStr);
if (!$stmt->execute()) {
    $stmt->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to execute query (transactions).']);
    exit;
}
$res = $stmt->get_result();
$transactions = [];
while ($row = $res->fetch_assoc()) {
    $transactions[] = [
        'id' => (int)$row['sale_id'],
        'date' => $row['sale_date'],
        'method' => $row['payment_method'],
        'amount' => (float)$row['total_amount'],
        'products' => (string)$row['products'],
    ];
}
$stmt->close();

// Summary metrics
$sumSql = "SELECT COUNT(*) AS cnt, COALESCE(SUM(total_amount),0) AS revenue FROM sales WHERE sale_date >= ? AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)";
$stmt = $conn->prepare($sumSql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to prepare query (summary).']);
    exit;
}
$stmt->bind_param('ss', $startStr, $endStr);
if (!$stmt->execute()) {
    $stmt->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to execute query (summary).']);
    exit;
}
$sumRes = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Counts by method
$methodSql = "SELECT LOWER(payment_method) AS method, COUNT(*) AS cnt FROM sales WHERE sale_date >= ? AND sale_date < DATE_ADD(?, INTERVAL 1 DAY) GROUP BY LOWER(payment_method)";
$stmt = $conn->prepare($methodSql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to prepare query (by method).']);
    exit;
}
$stmt->bind_param('ss', $startStr, $endStr);
if (!$stmt->execute()) {
    $stmt->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to execute query (by method).']);
    exit;
}
$mRes = $stmt->get_result();
$byMethod = [];
while ($row = $mRes->fetch_assoc()) {
    $byMethod[$row['method']] = (int)$row['cnt'];
}
$stmt->close();

$count = (int)($sumRes['cnt'] ?? 0);
$revenue = (float)($sumRes['revenue'] ?? 0.0);
$cash = $byMethod['cash'] ?? 0;
$card = $byMethod['card'] ?? 0;

echo json_encode([
    'success' => true,
    'currencySymbol' => $currencySymbol,
    'summary' => [
        'count' => $count,
        'revenue' => $revenue,
        'cash' => $cash,
        'card' => $card,
        'byMethod' => $byMethod,
        'start' => $startStr,
        'end' => $endStr
    ],
    'transactions' => $transactions
]);
?>