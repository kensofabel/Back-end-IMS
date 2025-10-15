<?php
require_once '../config/db.php';

// Find all owners (users with owner_id IS NULL or owner_id = id)
$owners = $conn->query("SELECT id FROM users WHERE owner_id IS NULL OR owner_id = id");
if ($owners) {
    while ($owner = $owners->fetch_assoc()) {
        $owner_id = $owner['id'];
        foreach (['Admin' => 'Admin role with elevated permissions', 'Staff' => 'Staff role with limited permissions'] as $role_name => $role_desc) {
            // Check if role exists for this owner
            $stmt = $conn->prepare("SELECT id FROM roles WHERE owner_id = ? AND name = ? LIMIT 1");
            $stmt->bind_param('is', $owner_id, $role_name);
            $stmt->execute();
            $stmt->store_result();
            if ($stmt->num_rows == 0) {
                // Create the role
                $insert = $conn->prepare("INSERT INTO roles (owner_id, name, description) VALUES (?, ?, ?)");
                $insert->bind_param('iss', $owner_id, $role_name, $role_desc);
                $insert->execute();
                $insert->close();
            }
            $stmt->close();
        }
    }
    $owners->free();
}
echo 'Default Admin and Staff roles created for all owners (if missing).';
?>