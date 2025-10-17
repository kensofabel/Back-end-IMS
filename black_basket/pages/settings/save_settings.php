<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once '../../config/db.php'; // $conn (mysqli)
// Enforce View Settings permission
require_once __DIR__ . '/../../partials/check_permission.php';
$stmtPerm = $conn->prepare('SELECT id FROM permissions WHERE name = ? LIMIT 1');
if ($stmtPerm) {
    $permName = 'View Settings';
    $stmtPerm->bind_param('s', $permName);
    $stmtPerm->execute();
    $r = $stmtPerm->get_result();
    if ($r && $row = $r->fetch_assoc()) {
        require_permission((int)$row['id']);
    }
    $stmtPerm->close();
}
// Example: Collect posted data (expand as you add more fields)
$data = json_decode(file_get_contents('php://input'), true);

// Validate and sanitize data (add more as needed)
$businessName = isset($data['businessName']) ? trim($data['businessName']) : '';
$businessType = isset($data['businessType']) ? trim($data['businessType']) : '';
$businessAddress = isset($data['businessAddress']) ? trim($data['businessAddress']) : '';
$businessPhone = isset($data['businessPhone']) ? trim($data['businessPhone']) : '';
$businessEmail = isset($data['businessEmail']) ? trim($data['businessEmail']) : '';
$currency = isset($data['currency']) ? trim($data['currency']) : '';
$taxRate = isset($data['taxRate']) ? floatval($data['taxRate']) : 0;

require_once '../../config/db.php'; // $conn (mysqli)

// Ensure settings table exists
$createSql = "CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
$conn->query($createSql);

// Map incoming fields to keys in settings table
$map = [
    'businessName' => 'business_name',
    'businessType' => 'business_type',
    'businessAddress' => 'business_address',
    'businessPhone' => 'business_phone',
    'businessEmail' => 'business_email',
    'currency' => 'currency',
    'taxRate' => 'tax_rate',
];

foreach ($map as $payloadKey => $settingKey) {
    if (!array_key_exists($payloadKey, $data)) continue;
    $value = $conn->real_escape_string((string)($data[$payloadKey] ?? ''));
    // Upsert per key
    $sql = "INSERT INTO settings (setting_key, setting_value) VALUES ('$settingKey', '$value')
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)";
    $conn->query($sql);
}

// Respond
$response = [
    'success' => true,
    'message' => 'Settings saved successfully!',
    'data' => [
        'businessName' => $businessName,
        'businessType' => $businessType,
        'businessAddress' => $businessAddress,
        'businessPhone' => $businessPhone,
        'businessEmail' => $businessEmail,
        'currency' => $currency,
        'taxRate' => $taxRate
    ]
];
echo json_encode($response);
