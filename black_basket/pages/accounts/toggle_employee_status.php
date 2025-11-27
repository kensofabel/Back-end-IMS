<?php
// Toggle employee status (AJAX)
require_once '../../config/db.php';
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit();
}
header('Content-Type: application/json');
$id = intval($_POST['id'] ?? 0);
$actual_state = isset($_POST['actual_state']) ? trim($_POST['actual_state']) : null;
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid employee ID']);
    exit();
}
// Get current status
$stmt = $conn->prepare('SELECT status FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $id);
$stmt->execute();
$stmt->bind_result($status);
if ($stmt->fetch()) {
    $newStatus = ($status === 'active') ? 'inactive' : 'active';
    $stmt->close();
    $update = $conn->prepare('UPDATE users SET status = ? WHERE id = ?');
    $update->bind_param('si', $newStatus, $id);
    if ($update->execute()) {
        require_once __DIR__ . '/../../scripts/log_audit.php';
        $actor = intval($_SESSION['user_id'] ?? 0);
        $msg = "Toggle Employee #{$id} -> {$newStatus}";
        if ($actual_state !== null && $actual_state !== '') {
            $msg .= " (actual_state={$actual_state})";
        }
        @log_audit($conn, $actor, $msg);
        echo json_encode(['success' => true, 'new_status' => $newStatus, 'actual_state' => $actual_state]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update status']);
    }
    $update->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Employee not found']);
}
