<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}
// update_role_permissions.php
require_once '../../config/db.php';

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['role_id']) || !isset($data['permission_ids']) || !is_array($data['permission_ids'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input.']);
    exit;
}

$role_id = intval($data['role_id']);
$permission_ids = array_map('intval', $data['permission_ids']);

// Debug: log received data
file_put_contents(__DIR__ . '/update_role_permissions.log', date('c') . "\n" . json_encode($data) . "\n", FILE_APPEND);

$conn->autocommit(false);
$del = $conn->query("DELETE FROM role_permissions WHERE role_id = $role_id");
if (!$del) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Delete failed: ' . $conn->error]);
    exit;
}

if (!empty($permission_ids)) {
    $values = array();
    foreach ($permission_ids as $pid) {
        $values[] = "($role_id, $pid)";
    }
    $values_str = implode(',', $values);
    $ins = $conn->query("INSERT INTO role_permissions (role_id, permission_id) VALUES $values_str");
    if (!$ins) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Insert failed: ' . $conn->error]);
        exit;
    }
}
$conn->commit();
$conn->autocommit(true);

echo json_encode(['success' => true]);
