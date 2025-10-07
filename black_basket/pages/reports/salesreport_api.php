<?php
session_start();
header('Content-Type: application/json');
// Ensure PHP notices/warnings don't leak HTML into JSON
@ini_set('display_errors', '0');
@error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once '../../config/db.php'; // $conn (mysqli)

// Helper: fetch currency symbol from settings
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
                    // Try to use the provided string if it looks like a symbol
                    if ($val !== '') { $symbol = $val; }
            }
        }
    }
    return $symbol;
}

// Helper for consistent error responses
function json_fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

// Parse dates
$start = isset($_GET['start']) ? trim($_GET['start']) : '';
$end   = isset($_GET['end']) ? trim($_GET['end']) : '';

// Defaults: last 30 days
if ($start === '' || $end === '') {
    $endDate = new DateTime('today');
    $startDate = (clone $endDate)->modify('-30 days');
} else {
    try {
        $startDate = new DateTime($start);
        $endDate = new DateTime($end);
    } catch (Exception $e) {
        json_fail(400, 'Invalid date format');
    }
}

// Build queries
$currencySymbol = get_currency_symbol($conn);

// Transactions list
$txSql = "
    SELECT 
        s.id AS sale_id,
        DATE_FORMAT(s.sale_date, '%Y-%m-%d %H:%i') AS sale_date,
        s.total_amount,
        s.payment_method,
        COALESCE(si.total_qty, 0) AS total_qty,
        COALESCE(si.products, '') AS products
    FROM sales s
    LEFT JOIN (
        SELECT 
            si.sale_id,
            SUM(si.quantity_sold) AS total_qty,
            GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS products
        FROM sale_items si
        JOIN products p ON p.id = si.product_id
        GROUP BY si.sale_id
    ) si ON si.sale_id = s.id
    WHERE s.sale_date >= ? AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)
    ORDER BY s.sale_date DESC, s.id DESC
";

$stmt = $conn->prepare($txSql);
if (!$stmt) {
    json_fail(500, 'Failed to prepare query (transactions).');
}
$startStr = $startDate->format('Y-m-d');
$endStr = $endDate->format('Y-m-d');
$stmt->bind_param('ss', $startStr, $endStr);
if (!$stmt->execute()) {
    $stmt->close();
    json_fail(500, 'Failed to execute query (transactions).');
}
$res = $stmt->get_result();
if ($res === false) {
    $stmt->close();
    json_fail(500, 'Failed to fetch results (transactions).');
}
$transactions = [];
$ids = [];
while ($row = $res->fetch_assoc()) {
    $transactions[] = [
        'id' => (int)$row['sale_id'],
        'date' => $row['sale_date'],
        'products' => $row['products'],
        'qty' => (int)$row['total_qty'],
        'total' => (float)$row['total_amount'],
        'method' => $row['payment_method'],
    ];
    $ids[] = (int)$row['sale_id'];
}
$stmt->close();

// Summary metrics
$sumSql = "SELECT COUNT(*) AS cnt, COALESCE(SUM(total_amount),0) AS revenue FROM sales WHERE sale_date >= ? AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)";
$stmt = $conn->prepare($sumSql);
if (!$stmt) {
    json_fail(500, 'Failed to prepare query (summary).');
}
$stmt->bind_param('ss', $startStr, $endStr);
if (!$stmt->execute()) {
    $stmt->close();
    json_fail(500, 'Failed to execute query (summary).');
}
$res2 = $stmt->get_result();
if ($res2 === false) {
    $stmt->close();
    json_fail(500, 'Failed to fetch results (summary).');
}
$sumRes = $res2->fetch_assoc();
$stmt->close();

$count = (int)($sumRes['cnt'] ?? 0);
$revenue = (float)($sumRes['revenue'] ?? 0.0);
$avg = $count > 0 ? ($revenue / $count) : 0.0;

// Top product by quantity in range
$topSql = "
    SELECT p.name, SUM(si.quantity_sold) AS qty
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE s.sale_date >= ? AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)
    GROUP BY p.id
    ORDER BY qty DESC
    LIMIT 1
";
$stmt = $conn->prepare($topSql);
if ($stmt) {
    $stmt->bind_param('ss', $startStr, $endStr);
    if ($stmt->execute()) {
        $res3 = $stmt->get_result();
        $topRes = $res3 ? $res3->fetch_assoc() : null;
    }
    $stmt->close();
}
$topProduct = $topRes ? (string)$topRes['name'] : 'N/A';

echo json_encode([
    'success' => true,
    'currencySymbol' => $currencySymbol,
    'summary' => [
        'count' => $count,
        'revenue' => $revenue,
        'average' => $avg,
        'topProduct' => $topProduct,
        'start' => $startStr,
        'end' => $endStr
    ],
    'transactions' => $transactions
]);
?>