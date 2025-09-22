<?php
session_start();
require_once '../../config/db.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}
header('Content-Type: application/json');


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $role_id = isset($_POST['role_id']) ? intval($_POST['role_id']) : 0;
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $status = isset($_POST['status']) ? $_POST['status'] : null;
    $valid_status = in_array($status, ['active', 'inactive']);
    if ($role_id && $name !== '') {
        if ($status !== null && $valid_status) {
            $stmt = $conn->prepare("UPDATE roles SET name = ?, description = ?, status = ? WHERE id = ?");
            $stmt->bind_param('sssi', $name, $description, $status, $role_id);
        } else {
            $stmt = $conn->prepare("UPDATE roles SET name = ?, description = ? WHERE id = ?");
            $stmt->bind_param('ssi', $name, $description, $role_id);
        }
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update role.']);
        }
        $stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid input.']);
    }
    exit;
}
echo json_encode(['success' => false, 'message' => 'Invalid request.']);
