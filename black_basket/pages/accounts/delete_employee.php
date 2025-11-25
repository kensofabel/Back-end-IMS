<?php
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once __DIR__ . '/../../scripts/log_audit.php';
require_once __DIR__ . '/../../partials/csrf.php';

// Basic auth check
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// CSRF check
$csrf = $_POST['csrf_token'] ?? '';
if (!csrf_validate($csrf)) {
    echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
    exit;
}

$employee_id = isset($_POST['employee_id']) ? intval($_POST['employee_id']) : 0;
if ($employee_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid employee id']);
    exit;
}

// Prevent self-delete
if (isset($_SESSION['user_id']) && intval($_SESSION['user_id']) === $employee_id) {
    echo json_encode(['success' => false, 'message' => 'Cannot delete currently logged-in account']);
    exit;
}

// Permission check: only allow owner accounts or users with the "Employee Management" permission (id = 11)
$actingUser = intval($_SESSION['user_id']);
$isAllowed = false;

// Check if acting user is an owner (owner_id IS NULL)
$ownerCheck = $conn->prepare('SELECT owner_id FROM users WHERE id = ? LIMIT 1');
if ($ownerCheck) {
    $ownerCheck->bind_param('i', $actingUser);
    $ownerCheck->execute();
    $ownerCheck->bind_result($owner_val);
    $ownerCheck->fetch();
    $ownerCheck->close();
    if ($owner_val === null) {
        $isAllowed = true;
    }
}

// If not owner, check role -> permission mapping for permission id 11 (Employee Management)
if (!$isAllowed) {
    $permId = 11; // Employee Management
    $permStmt = $conn->prepare('SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id WHERE ur.user_id = ? AND rp.permission_id = ? LIMIT 1');
    if ($permStmt) {
        $permStmt->bind_param('ii', $actingUser, $permId);
        $permStmt->execute();
        $permStmt->store_result();
        if ($permStmt->num_rows > 0) $isAllowed = true;
        $permStmt->close();
    }
}

if (!$isAllowed) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden: insufficient permissions']);
    exit;
}

$conn->begin_transaction();
try {
    // Delete user_roles
    $stmt = $conn->prepare('DELETE FROM user_roles WHERE user_id = ?');
    $stmt->bind_param('i', $employee_id);
    $stmt->execute();
    $stmt->close();

    // Delete user
    $stmt = $conn->prepare('DELETE FROM users WHERE id = ?');
    $stmt->bind_param('i', $employee_id);
    if (!$stmt->execute()) throw new Exception('Failed to delete user');
    $stmt->close();

    $conn->commit();
    // Audit: deleted employee
    $actor = intval($_SESSION['user_id'] ?? 0);
    @log_audit($conn, $actor, "Delete Employee #{$employee_id}");

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

exit;
