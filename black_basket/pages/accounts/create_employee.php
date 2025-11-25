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

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$roleName = trim($_POST['role'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$pos_pin = trim($_POST['pos_pin'] ?? '');

if ($name === '' || $email === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Name, email and password are required']);
    exit;
}

$currentUser = intval($_SESSION['user_id']);
// Determine owner for the new user: if current user has owner_id NULL, they're the owner
$owner_for_new = null;
$stmt = $conn->prepare('SELECT owner_id FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $currentUser);
$stmt->execute();
$stmt->bind_result($owner_id);
$stmt->fetch();
$stmt->close();
if ($owner_id === null) {
    $owner_for_new = $currentUser;
} else {
    $owner_for_new = intval($owner_id);
}

// Create a username from the email local part and ensure uniqueness
$baseUsername = preg_replace('/[^a-z0-9_\-]/i', '', strstr($email, '@', true) ?: $email);
$username = $baseUsername;
$i = 0;
while (true) {
    $check = $conn->prepare('SELECT id FROM users WHERE username = ? LIMIT 1');
    $check->bind_param('s', $username);
    $check->execute();
    $check->store_result();
    if ($check->num_rows === 0) {
        $check->close();
        break;
    }
    $check->close();
    $i++;
    $username = $baseUsername . $i;
}

$hashed = password_hash($password, PASSWORD_DEFAULT);

// Ensure phone and pos_pin columns exist
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

// Insert user (include phone and pos_pin)
$stmt = $conn->prepare('INSERT INTO users (owner_id, username, full_name, email, password, phone, pos_pin, status) VALUES (?, ?, ?, ?, ?, ?, ?, "active")');
$stmt->bind_param('issssss', $owner_for_new, $username, $name, $email, $hashed, $phone, $pos_pin);
if (!$stmt->execute()) {
    // Log error for debugging
    @file_put_contents(__DIR__ . '/create_employee.log', date('c') . " - insert failed: " . $conn->error . "\nPOST:" . print_r($_POST, true) . "\n", FILE_APPEND);
    echo json_encode(['success' => false, 'message' => 'Failed to create user: ' . $conn->error]);
    exit;
}
$newId = $stmt->insert_id;
$stmt->close();

// Read back the inserted record to return full data
$rstmt = $conn->prepare('SELECT id, full_name, email, phone, pos_pin FROM users WHERE id = ? LIMIT 1');
$rstmt->bind_param('i', $newId);
$rstmt->execute();
$rres = $rstmt->get_result();
$userRow = $rres ? $rres->fetch_assoc() : null;
$rstmt->close();

// Assign role if provided
if ($roleName !== '') {
    // Try to find role for this owner
    $rstmt = $conn->prepare('SELECT id FROM roles WHERE owner_id = ? AND name = ? LIMIT 1');
    $rstmt->bind_param('is', $owner_for_new, $roleName);
    $rstmt->execute();
    $rstmt->store_result();
    if ($rstmt->num_rows > 0) {
        $rstmt->bind_result($roleId);
        $rstmt->fetch();
        $rstmt->close();
    } else {
        $rstmt->close();
        // Fallback to global role
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
        if (isset($roleId) && $roleId) {
            $ir = $conn->prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
            $ir->bind_param('ii', $newId, $roleId);
            $ir->execute();
            $ir->close();
        }
}
    // Prepare response user object
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

    // Audit log: created employee
    $actor = intval($_SESSION['user_id'] ?? 0);
    @log_audit($conn, $actor, "Create Employee #{$newId} ({$email})");

    echo json_encode(['success' => true, 'user' => $respUser]);
exit;

?>
