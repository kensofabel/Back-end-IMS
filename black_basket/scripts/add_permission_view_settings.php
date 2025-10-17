<?php
require_once __DIR__ . '/../config/db.php';

$name = 'View Settings';
$desc = 'Modify all configurations';

/* Check if permission exists */
$stmt = $conn->prepare('SELECT id FROM permissions WHERE name = ? LIMIT 1');
if (!$stmt) {
    echo "DB prepare failed: " . $conn->error . "\n";
    exit(1);
}
$stmt->bind_param('s', $name);
$stmt->execute();
$res = $stmt->get_result();
if ($res && $row = $res->fetch_assoc()) {
    $perm_id = (int)$row['id'];
    echo "Permission already exists: $name (id=$perm_id)\n";
    $stmt->close();
} else {
    $stmt->close();
    $ins = $conn->prepare('INSERT INTO permissions (name, description) VALUES (?, ?)');
    if (!$ins) {
        echo "DB prepare failed for insert: " . $conn->error . "\n";
        exit(1);
    }
    $ins->bind_param('ss', $name, $desc);
    if ($ins->execute()) {
        $perm_id = $ins->insert_id;
        echo "Inserted permission: $name (id=$perm_id)\n";
    } else {
        echo "Failed to insert permission: " . $ins->error . "\n";
        $ins->close();
        exit(1);
    }
    $ins->close();
}

/* Assign to Owner roles */
$roleRes = $conn->query("SELECT id FROM roles WHERE name = 'Owner'");
if ($roleRes && $roleRes->num_rows > 0) {
    $insrp = $conn->prepare('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
    if (!$insrp) {
        echo "DB prepare failed for role_permissions insert: " . $conn->error . "\n";
        exit(1);
    }
    while ($role = $roleRes->fetch_assoc()) {
        $roleId = (int)$role['id'];
        $insrp->bind_param('ii', $roleId, $perm_id);
        $insrp->execute();
    }
    $insrp->close();
    echo "Assigned '$name' to Owner roles.\n";
} else {
    echo "No Owner roles found to assign permission to.\n";
}

echo "Done.\n";
