<?php
require_once '../config/db.php';

// Define default permission IDs for each role
$admin_permissions = [1,2,3,4,5,6,7,8,11]; // All except roles/permissions/audit
$staff_permissions = [1,2,3,6,7,8]; // Basic access

// Find all owners
$owners = $conn->query("SELECT id FROM users WHERE owner_id IS NULL OR owner_id = id");
if ($owners) {
    while ($owner = $owners->fetch_assoc()) {
        $owner_id = $owner['id'];
        foreach ([
            'Admin' => ['desc' => 'Admin role with elevated permissions', 'perms' => $admin_permissions],
            'Staff' => ['desc' => 'Staff role with limited permissions', 'perms' => $staff_permissions]
        ] as $role_name => $role_info) {
            // Check if role exists for this owner
            $stmt = $conn->prepare("SELECT id FROM roles WHERE owner_id = ? AND name = ? LIMIT 1");
            $stmt->bind_param('is', $owner_id, $role_name);
            $stmt->execute();
            $stmt->store_result();
            if ($stmt->num_rows == 0) {
                // Create the role
                $insert = $conn->prepare("INSERT INTO roles (owner_id, name, description) VALUES (?, ?, ?)");
                $insert->bind_param('iss', $owner_id, $role_name, $role_info['desc']);
                $insert->execute();
                $role_id = $insert->insert_id;
                $insert->close();
            } else {
                $stmt->bind_result($role_id);
                $stmt->fetch();
            }
            $stmt->close();

            // Assign default permissions to the role
            foreach ($role_info['perms'] as $perm_id) {
                // Check if already assigned
                $check = $conn->prepare("SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ? LIMIT 1");
                $check->bind_param('ii', $role_id, $perm_id);
                $check->execute();
                $check->store_result();
                if ($check->num_rows == 0) {
                    $assign = $conn->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
                    $assign->bind_param('ii', $role_id, $perm_id);
                    $assign->execute();
                    $assign->close();
                }
                $check->close();
            }
        }
    }
    $owners->free();
}
echo 'Default Admin and Staff roles and permissions set for all owners.';
?>