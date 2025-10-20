<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once '../../config/db.php'; // provides $conn (mysqli)

// Ensure settings table exists (safety in case schema not imported)
$createSql = "CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
$conn->query($createSql);

// Define the required keys corresponding to fields in the UI
$requiredKeys = [
    'business_name',
    'business_type',
    'business_address',
    'business_phone',
    'business_email',
    'currency',
    'tax_rate'
];

// Fetch all settings
$kv = [];
$res = $conn->query("SELECT setting_key, setting_value FROM settings");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $kv[$row['setting_key']] = $row['setting_value'];
    }
}

$total = count($requiredKeys);
$completed = 0;
foreach ($requiredKeys as $key) {
    $val = isset($kv[$key]) ? trim((string)$kv[$key]) : '';
    if ($val !== '') {
        $completed++;
    }
}
$pending = max(0, $total - $completed);

// Simple security score heuristic
$securePercent = 0;
if ($total > 0) {
    $securePercent = (int) round(($completed / $total) * 100);
}
// Small boosts for valid email and numeric tax rate in range
if (!empty($kv['business_email']) && filter_var($kv['business_email'], FILTER_VALIDATE_EMAIL)) {
    $securePercent = min(100, $securePercent + 5);
}
if (isset($kv['tax_rate'])) {
    $tr = floatval($kv['tax_rate']);
    if ($tr >= 0 && $tr <= 100) {
        $securePercent = min(100, $securePercent + 5);
    }
}

echo json_encode([
    'success' => true,
    'completed' => $completed,
    'pending' => $pending,
    'total' => $total,
    'securePercent' => $securePercent
]);
?>
