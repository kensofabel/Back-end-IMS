<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once '../../config/db.php'; // provides $conn (mysqli)

// Helper: check column existence to ensure schema is up to date
function hasColumn(mysqli $conn, string $table, string $column): bool {
    $db = $conn->real_escape_string($conn->query('SELECT DATABASE()')->fetch_row()[0]);
    $table = $conn->real_escape_string($table);
    $column = $conn->real_escape_string($column);
    $sql = "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='$table' AND COLUMN_NAME='$column' LIMIT 1";
    $res = $conn->query($sql);
    return $res && $res->num_rows > 0;
}

$payloadRaw = file_get_contents('php://input');
$payload = json_decode($payloadRaw, true);
if (!is_array($payload)) {
    // Fallback to form-encoded
    $payload = $_POST;
}

$targetUserId = isset($payload['user_id']) ? intval($payload['user_id']) : 0;
$roleId       = isset($payload['role_id']) ? intval($payload['role_id']) : 0;
$action       = isset($payload['action']) ? strtolower(trim($payload['action'])) : '';

if ($targetUserId <= 0 || $roleId <= 0 || !in_array($action, ['set','unset'], true)) {
    echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
    exit();
}

if (!hasColumn($conn, 'user_roles', 'is_primary')) {
    echo json_encode(['success' => false, 'message' => 'Database schema missing user_roles.is_primary. Please apply the latest SQL migrations.']);
    exit();
}

$actingUserId = intval($_SESSION['user_id']);

// Begin transaction
$conn->begin_transaction();
try {
    // Ensure the assignment exists if action is set
    if ($action === 'set') {
        $stmt = $conn->prepare('SELECT 1 FROM user_roles WHERE user_id=? AND role_id=?');
        $stmt->bind_param('ii', $targetUserId, $roleId);
        $stmt->execute();
        $exists = $stmt->get_result()->num_rows > 0;
        $stmt->close();

        if (!$exists) {
            $stmt = $conn->prepare('INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by, is_primary) VALUES (?, ?, NOW(), ?, 0)');
            $stmt->bind_param('iii', $targetUserId, $roleId, $actingUserId);
            if (!$stmt->execute()) {
                throw new Exception('Failed to assign role: ' . $conn->error);
            }
            $stmt->close();
        }

        // Unset any existing primary for this user
        $stmt = $conn->prepare('UPDATE user_roles SET is_primary = 0 WHERE user_id = ?');
        $stmt->bind_param('i', $targetUserId);
        if (!$stmt->execute()) {
            throw new Exception('Failed to clear existing primary role: ' . $conn->error);
        }
        $stmt->close();

        // Set new primary
        $stmt = $conn->prepare('UPDATE user_roles SET is_primary = 1, assigned_at = NOW(), assigned_by = ? WHERE user_id = ? AND role_id = ?');
        $stmt->bind_param('iii', $actingUserId, $targetUserId, $roleId);
        if (!$stmt->execute() || $stmt->affected_rows === 0) {
            throw new Exception('Failed to set primary role');
        }
        $stmt->close();
    } else { // unset
        $stmt = $conn->prepare('UPDATE user_roles SET is_primary = 0 WHERE user_id = ? AND role_id = ?');
        $stmt->bind_param('ii', $targetUserId, $roleId);
        if (!$stmt->execute()) {
            throw new Exception('Failed to unset primary role: ' . $conn->error);
        }
        $stmt->close();
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => $action === 'set' ? 'Primary role set' : 'Primary role unset']);
} catch (Throwable $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
