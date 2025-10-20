<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['user'])) {
    http_response_code(403);
    exit('Not logged in');
}

$user_id = intval($_SESSION['user']);

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    header('Location: profile_popup.php?error=upload');
    exit;
}

$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowed)) {
    header('Location: profile_popup.php?error=type');
    exit;
}

$uploadDir = __DIR__ . '/../uploads/avatars/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}
$filename = 'user_' . $user_id . '_' . time() . '.' . $ext;
$target = $uploadDir . $filename;
$relativePath = '/black_basket/uploads/avatars/' . $filename;

if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $target)) {
    header('Location: profile_popup.php?error=move');
    exit;
}

// Update DB
$stmt = $conn->prepare('UPDATE users SET avatar = ? WHERE id = ?');
$stmt->bind_param('si', $relativePath, $user_id);
$stmt->execute();
$stmt->close();
$conn->close();

header('Location: profile_popup.php?success=1');
exit;
