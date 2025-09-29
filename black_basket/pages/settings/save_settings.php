<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
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

// TODO: Save to database or config file here
// For now, just return success

// Example: You can use PDO to update your settings table
// require_once '../../config/db.php';
// $stmt = $pdo->prepare('UPDATE settings SET ... WHERE user_id = ?');
// $stmt->execute([...]);

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
