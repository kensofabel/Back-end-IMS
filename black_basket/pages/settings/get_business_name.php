<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}
require_once '../../config/db.php';
// Ensure settings table exists
$createSql = "CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
$conn->query($createSql);
// Fetch business name
$stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = 'business_name' LIMIT 1");
$stmt->execute();
$stmt->bind_result($businessName);
$stmt->fetch();
$stmt->close();
$businessName = $businessName ?: '';
echo json_encode(['success' => true, 'businessName' => $businessName]);
?>
