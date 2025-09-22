<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}
require_once '../../config/db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $role_id = isset($_POST['role_id']) ? intval($_POST['role_id']) : 0;
    if ($role_id) {
        // Remove role_permissions first (optional, for referential integrity)
        $conn->query("DELETE FROM role_permissions WHERE role_id = $role_id");
        $stmt = $conn->prepare("DELETE FROM roles WHERE id = ?");
        $stmt->bind_param('i', $role_id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete role.']);
        }
        $stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid input.']);
    }
    exit;
}
echo json_encode(['success' => false, 'message' => 'Invalid request.']);
