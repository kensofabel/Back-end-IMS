<?php
require_once '../config/db.php';

// Get all Owner roles
$roles = $conn->query("SELECT id FROM roles WHERE name = 'Owner'");
if ($roles) {
    while ($role = $roles->fetch_assoc()) {
        $role_id = $role['id'];
        // Find permissions not yet assigned to this role
        $sql = "
            SELECT p.id FROM permissions p
            LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role_id = ?
            WHERE rp.permission_id IS NULL
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $role_id);
        $stmt->execute();
        $result = $stmt->get_result();
        // Assign missing permissions
        $insert = $conn->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
        while ($row = $result->fetch_assoc()) {
            $perm_id = $row['id'];
            $insert->bind_param('ii', $role_id, $perm_id);
            $insert->execute();
        }
        $insert->close();
        $stmt->close();
    }
    $roles->free();
}
echo 'All new permissions assigned to Owner roles.';
?>
