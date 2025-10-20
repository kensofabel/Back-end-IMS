<?php
// delete_roles.php
session_start();
require_once '../../config/db.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['role_ids']) || !is_array($data['role_ids'])) {
    echo json_encode(['success' => false, 'message' => 'No roles specified.']);
    exit;
}

$role_ids = array_map('intval', $data['role_ids']);
if (empty($role_ids)) {
    echo json_encode(['success' => false, 'message' => 'No valid roles specified.']);
    exit;
}

$ids_str = implode(',', $role_ids);

// Delete from role_permissions first (to avoid FK constraint)
$conn->query("DELETE FROM role_permissions WHERE role_id IN ($ids_str)");
// Delete from user_roles if you have that table
$conn->query("DELETE FROM user_roles WHERE role_id IN ($ids_str)");
// Delete from roles
$result = $conn->query("DELETE FROM roles WHERE id IN ($ids_str)");

if ($result) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete roles.']);
}
