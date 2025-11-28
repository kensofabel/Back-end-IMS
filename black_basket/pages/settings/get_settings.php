<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once '../../config/db.php'; // provides $conn (mysqli)

// Ensure settings table exists (safety)
$createSql = "CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
$conn->query($createSql);

// Keys used in UI
$keys = [
    'business_name',
    'business_type',
    'business_address',
    'business_phone',
    'business_email',
    'currency',
    'tax_rate',
    'payment_methods',
    'language',
    'timezone',
    'date_format',
    'theme'
];

// Fetch values (use a simple IN list since keys are static)
$in = "'" . implode("','", $keys) . "'";
$sql = "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ($in)";
$res = $conn->query($sql);

$kv = array_fill_keys($keys, '');
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $kv[$row['setting_key']] = (string)$row['setting_value'];
    }
}

// Map to frontend payload keys
$data = [
    'businessName'   => $kv['business_name'],
    'businessType'   => $kv['business_type'],
    'businessAddress'=> $kv['business_address'],
    'businessPhone'  => $kv['business_phone'],
    'businessEmail'  => $kv['business_email'],
    'currency'       => $kv['currency'] !== '' ? $kv['currency'] : 'PHP',
    'taxRate'        => $kv['tax_rate'] !== '' ? $kv['tax_rate'] : '0',
    'paymentMethods' => $kv['payment_methods'] !== '' ? json_decode($kv['payment_methods'], true) : ['cash' => 1, 'card' => 1],
    'language'       => $kv['language'] !== '' ? $kv['language'] : 'English',
    'timezone'       => $kv['timezone'] !== '' ? $kv['timezone'] : 'UTC',
    'dateFormat'     => $kv['date_format'] !== '' ? $kv['date_format'] : 'MM/DD/YYYY',
    'theme'          => $kv['theme'] !== '' ? $kv['theme'] : 'dark'
];

echo json_encode(['success' => true, 'data' => $data]);
?>