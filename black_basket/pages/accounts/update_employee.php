<?php
session_start();
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once __DIR__ . '/../../scripts/log_audit.php';
require_once __DIR__ . '/../../partials/csrf.php';

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

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? null; // optional
$roleName = trim($_POST['role'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$pos_pin = trim($_POST['pos_pin'] ?? '');

if ($id <= 0 || $name === '' || $email === '') {
    echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
    exit;
}

// Prevent updating certain protected accounts? Skipped here.

// Update basic fields
// Ensure columns exist before updating
$colCheck = $conn->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('phone','pos_pin')");
if ($colCheck) {
    $colCheck->execute();
    $colRes = $colCheck->get_result();
    $cols = [];
    while ($crow = $colRes->fetch_assoc()) $cols[] = $crow['COLUMN_NAME'];
    $colCheck->close();
    if (!in_array('phone', $cols)) {
        $conn->query("ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL");
    }
    if (!in_array('pos_pin', $cols)) {
        $conn->query("ALTER TABLE users ADD COLUMN pos_pin VARCHAR(50) DEFAULT NULL");
    }
}

if ($password !== null && $password !== '') {
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare('UPDATE users SET full_name = ?, email = ?, password = ?, phone = ?, pos_pin = ? WHERE id = ?');
    $stmt->bind_param('sssssi', $name, $email, $hashed, $phone, $pos_pin, $id);
} else {
    $stmt = $conn->prepare('UPDATE users SET full_name = ?, email = ?, phone = ?, pos_pin = ? WHERE id = ?');
    $stmt->bind_param('ssssi', $name, $email, $phone, $pos_pin, $id);
}
if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Failed to update user: ' . $conn->error]);
    exit;
}
$stmt->close();

// Update role mapping if provided
if ($roleName !== '') {
    // find role id (try owner-specific then global)
    $ownerStmt = $conn->prepare('SELECT owner_id FROM users WHERE id = ? LIMIT 1');
    $ownerStmt->bind_param('i', $id);
    $ownerStmt->execute();
    $ownerStmt->bind_result($owner_id);
    $ownerStmt->fetch();
    $ownerStmt->close();

    $roleId = null;
    $rstmt = $conn->prepare('SELECT id FROM roles WHERE owner_id = ? AND name = ? LIMIT 1');
    $rstmt->bind_param('is', $owner_id, $roleName);
    $rstmt->execute();
    $rstmt->store_result();
    if ($rstmt->num_rows > 0) {
        $rstmt->bind_result($roleId);
        $rstmt->fetch();
        $rstmt->close();
    } else {
        $rstmt->close();
        $r2 = $conn->prepare('SELECT id FROM roles WHERE owner_id IS NULL AND name = ? LIMIT 1');
        $r2->bind_param('s', $roleName);
        $r2->execute();
        $r2->store_result();
        if ($r2->num_rows > 0) {
            $r2->bind_result($roleId);
            $r2->fetch();
        }
        $r2->close();
    }

    if ($roleId) {
        // remove existing user_roles for this user and insert new mapping
        $del = $conn->prepare('DELETE FROM user_roles WHERE user_id = ?');
        $del->bind_param('i', $id);
        $del->execute();
        $del->close();

        $ins = $conn->prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
        $ins->bind_param('ii', $id, $roleId);
        $ins->execute();
        $ins->close();
    }
}

// Read back the updated user to return authoritative values (including phone, pos_pin)
$userRow = null;
$r = $conn->prepare('SELECT id, full_name, email, phone, pos_pin FROM users WHERE id = ? LIMIT 1');
$r->bind_param('i', $id);
$r->execute();
$res = $r->get_result();
if ($res && $res->num_rows > 0) {
    $userRow = $res->fetch_assoc();
}
if ($r) $r->close();

$respUser = null;
if ($userRow) {
    $respUser = [
        'id' => (int)$userRow['id'],
        'full_name' => $userRow['full_name'],
        'email' => $userRow['email'],
        'phone' => $userRow['phone'],
        'pos_pin' => $userRow['pos_pin'],
        'role' => $roleName
    ];
}
// Audit: update employee (include employee name when available for clarity)
$actor = intval($_SESSION['user_id'] ?? 0);
$employeeNameForLog = $respUser['full_name'] ?? '';
if ($employeeNameForLog) {
    @log_audit($conn, $actor, "Update Employee #{$id} ({$employeeNameForLog})");
} else {
    @log_audit($conn, $actor, "Update Employee #{$id}");
}

echo json_encode(['success' => true, 'user' => $respUser]);
exit;

?>
