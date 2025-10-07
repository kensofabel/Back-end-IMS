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
    'tax_rate'
];

// Fetch values
$placeholders = implode(',', array_fill(0, count($keys), '?'));
$stmt = $conn->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ($placeholders)");
if ($stmt) {
    // Bind dynamic params
    $types = str_repeat('s', count($keys));
    $stmt->bind_param($types, ...$keys);
    $stmt->execute();
    $res = $stmt->get_result();
} else {
    $res = false;
}

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
    'taxRate'        => $kv['tax_rate']
];

echo json_encode(['success' => true, 'data' => $data]);
?>