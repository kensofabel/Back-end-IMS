<?php
require_once __DIR__ . '/../config/db.php';

// Permissions to ensure exist
$needed = [
    ['Inventory Management', 'View and manage inventory'],
    ['Add Products', 'Add new products to inventory'],
    ['Edit Products', 'Edit existing products'],
    ['View Inventory Report', 'Access inventory reports'],
    ['Manage Roles', 'Create and manage user roles'],
    ['Set Permissions', 'Assign permissions to roles']
];

$added = [];
$existing = [];

foreach ($needed as $p) {
    $name = $p[0];
    $desc = $p[1];
    // Check if exists
    $stmt = $conn->prepare('SELECT id FROM permissions WHERE name = ? LIMIT 1');
    if (!$stmt) {
        echo "Prepare failed: " . $conn->error . "\n";
        continue;
    }
    $stmt->bind_param('s', $name);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $row = $res->fetch_assoc()) {
        $existing[$name] = (int)$row['id'];
        $stmt->close();
        continue;
    }
    $stmt->close();

    // Insert
    $ins = $conn->prepare('INSERT INTO permissions (name, description) VALUES (?, ?)');
    if ($ins) {
        $ins->bind_param('ss', $name, $desc);
        if ($ins->execute()) {
            $newId = $ins->insert_id;
            $added[$name] = $newId;
            echo "Inserted permission: $name (id=$newId)\n";
        } else {
            echo "Failed to insert permission $name: " . $ins->error . "\n";
        }
        $ins->close();
    } else {
        echo "Prepare insert failed for $name: " . $conn->error . "\n";
    }
}

// Re-collect ids of all needed permissions
$perm_ids = [];
$names = array_map(function($p){return $p[0];}, $needed);
$placeholders = implode(',', array_fill(0, count($names), '?'));
$types = str_repeat('s', count($names));
$sql = "SELECT id, name FROM permissions WHERE name IN ($placeholders)";
$stmt = $conn->prepare($sql);
if ($stmt) {
    $stmt->bind_param($types, ...$names);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) {
        $perm_ids[$r['name']] = (int)$r['id'];
    }
    $stmt->close();
}

// Assign these permissions to Owner roles
$roleRes = $conn->query("SELECT id FROM roles WHERE name = 'Owner'");
if ($roleRes && $roleRes->num_rows > 0) {
    $insrp = $conn->prepare('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
    while ($role = $roleRes->fetch_assoc()) {
        $roleId = (int)$role['id'];
        foreach ($perm_ids as $pname => $pid) {
            $insrp->bind_param('ii', $roleId, $pid);
            $insrp->execute();
        }
    }
    if ($insrp) $insrp->close();
    echo "Assigned ensured permissions to Owner roles.\n";
} else {
    echo "No Owner roles found to assign permissions to.\n";
}

// Summary
echo "Summary:\n";
foreach ($needed as $p) {
    $n = $p[0];
    if (isset($perm_ids[$n])) {
        echo " - $n => id=" . $perm_ids[$n] . "\n";
    } else if (isset($added[$n])) {
        echo " - $n => id=" . $added[$n] . "\n";
    } else {
        echo " - $n => MISSING\n";
    }
}

echo "Done.\n";
