<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /black_basket/index.php');
    exit();
}
require_once '../../config/db.php';

// Set proper content type for JSON response
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    // Use session owner_id if available, otherwise use user_id
    if (isset($_SESSION['owner_id']) && $_SESSION['owner_id']) {
        $owner_id = intval($_SESSION['owner_id']);
    } elseif (isset($_SESSION['user_id'])) {
        $owner_id = intval($_SESSION['user_id']);
    } else {
        $owner_id = null;
    }
    if ($name === '') {
        echo json_encode(['success' => false, 'message' => 'Role name is required.']);
        exit;
    }
    if ($owner_id !== null) {
        $stmt = $conn->prepare("INSERT INTO roles (owner_id, name, description) VALUES (?, ?, ?)");
        $stmt->bind_param('iss', $owner_id, $name, $description);
    } else {
        $stmt = $conn->prepare("INSERT INTO roles (owner_id, name, description) VALUES (NULL, ?, ?)");
        $stmt->bind_param('ss', $name, $description);
    }
    if ($stmt->execute()) {
        $id = $stmt->insert_id;
        // Assign all permissions to this new role
        $allPerms = $conn->query("SELECT id FROM permissions");
        if ($allPerms && $allPerms->num_rows > 0) {
            $values = [];
            while ($perm = $allPerms->fetch_assoc()) {
                $values[] = "($id, {$perm['id']})";
            }
            if (!empty($values)) {
                $permResult = $conn->query("INSERT INTO role_permissions (role_id, permission_id) VALUES " . implode(',', $values));
                if (!$permResult) {
                    // Log the error but don't fail the role creation
                    error_log("Failed to assign permissions to role $id: " . $conn->error);
                }
            }
        }
        echo json_encode(['success' => true, 'role_id' => $id, 'name' => $name, 'description' => $description, 'owner_id' => $owner_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add role.']);
    }
    $stmt->close();
    exit;
}
echo json_encode(['success' => false, 'message' => 'Invalid request.']);
