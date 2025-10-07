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

require_once '../../config/db.php';

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
                default: if ($val !== '') { $symbol = $val; }
            }
        }
    }
    return $symbol;
}

// Fetch inventory snapshot
$sql = "
    SELECT p.id, p.name, p.category, p.unit_price, COALESCE(i.quantity,0) AS stock
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
";
$res = $conn->query($sql);
if ($res === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to load inventory.']);
    exit;
}

$rows = [];
$totalValue = 0.0;
$totalItems = 0;
$lowStock = 0;
$outOfStock = 0;
while ($r = $res->fetch_assoc()) {
    $price = (float)($r['unit_price'] ?? 0);
    $qty = (int)($r['stock'] ?? 0);
    $totalValue += $price * $qty;
    $totalItems++;
    if ($qty === 0) $outOfStock++;
    else if ($qty > 0 && $qty <= 10) $lowStock++;
    $rows[] = [
        'name' => (string)$r['name'],
        'category' => (string)($r['category'] ?? ''),
        'price' => $price,
        'stock' => $qty,
        'status' => $qty === 0 ? 'out' : ($qty <= 10 ? 'low' : 'ok')
    ];
}

echo json_encode([
    'success' => true,
    'currencySymbol' => get_currency_symbol($conn),
    'summary' => [
        'totalValue' => $totalValue,
        'totalItems' => $totalItems,
        'lowStock' => $lowStock,
        'outOfStock' => $outOfStock
    ],
    'items' => $rows
]);
?>