<?php
session_start();
header('Content-Type: application/json');
require '../config/db.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}

$user_id = intval($_SESSION['user_id']);
$old_password = $_POST['old_password'] ?? '';
$confirm_old_password = $_POST['confirm_old_password'] ?? '';
$new_password = $_POST['password'] ?? '';

if (!$old_password || !$confirm_old_password || !$new_password) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}
if ($old_password !== $confirm_old_password) {
    echo json_encode(['success' => false, 'message' => 'Old passwords do not match.']);
    exit;
}
if (strlen($new_password) < 4) {
    echo json_encode(['success' => false, 'message' => 'New password must be at least 4 characters.']);
    exit;
}

// Fetch current password hash
$stmt = $conn->prepare('SELECT password FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$stmt->bind_result($current_hash);
if (!$stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'User not found.']);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

if (!password_verify($old_password, $current_hash)) {
    echo json_encode(['success' => false, 'message' => 'Old password is incorrect.']);
    $conn->close();
    exit;
}
// Prevent new password from being the same as old password
if (password_verify($new_password, $current_hash)) {
    echo json_encode(['success' => false, 'message' => 'New password must be different from old password.']);
    $conn->close();
    exit;
}

$new_hash = password_hash($new_password, PASSWORD_DEFAULT);
$update = $conn->prepare('UPDATE users SET password = ? WHERE id = ?');
$update->bind_param('si', $new_hash, $user_id);
$success = $update->execute();
if ($success) {
    echo json_encode(['success' => true, 'message' => 'Password updated successfully!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error updating password: ' . $update->error]);
}
$update->close();
$conn->close();
?>