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
$desired_status = isset($_POST['desired_status']) ? trim($_POST['desired_status']) : null;
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
    // If client provided an explicit desired_status, respect it (must be either 'active' or 'inactive').
    if ($desired_status === 'active' || $desired_status === 'inactive') {
        $newStatus = $desired_status;
    } else {
        // default: toggle
        $newStatus = ($status === 'active') ? 'inactive' : 'active';
    }
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
            if ($desired_status !== null && $desired_status !== '') {
                $msg .= " (desired_status={$desired_status})";
            }
        @log_audit($conn, $actor, $msg);
        echo json_encode(['success' => true, 'new_status' => $newStatus, 'actual_state' => $actual_state, 'desired_status' => $desired_status]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update status']);
    }
    $update->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Employee not found']);
}
