<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    exit;
}
include '../../config/db.php';

// Debug: print the database and table name at the top of the output
$dbName = $conn->query('SELECT DATABASE()')->fetch_row()[0];
echo '<!-- Connected DB: ' . htmlspecialchars($dbName) . ' | Table: audit_logs -->';

// Filtering
$action = $_GET['action'] ?? 'all';
$date_from = $_GET['date_from'] ?? '';
$date_to = $_GET['date_to'] ?? '';
$search = $_GET['search'] ?? '';
$export = isset($_GET['export']) && $_GET['export'] === 'csv';

$where = [];
$params = [];
$types = '';

if ($action && $action !== 'all') {
    $where[] = 'al.action = ?';
    $params[] = $action;
    $types .= 's';
}
if ($date_from) {
    $where[] = 'DATE(al.created_at) >= ?';
    $params[] = $date_from;
    $types .= 's';
}
if ($date_to) {
    $where[] = 'DATE(al.created_at) <= ?';
    $params[] = $date_to;
    $types .= 's';
}
if ($search) {
    $where[] = '(u.username LIKE ? OR al.action LIKE ? OR al.ip_address LIKE ?)';
    for ($i = 0; $i < 3; $i++) {
        $params[] = "%$search%";
        $types .= 's';
    }
}

$where_sql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
$sql = "SELECT al.*, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id $where_sql ORDER BY al.created_at DESC";

$stmt = $conn->prepare($sql);
if ($params) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

if ($export) {
    header('Content-Type: application/vnd.ms-excel');
    header('Content-Disposition: attachment; filename="audit_logs.xls"');
    $sep = "\t";
    echo "Timestamp{$sep}User{$sep}Action{$sep}Details{$sep}IP Address\n";
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            echo $row['created_at'] . $sep;
            echo ($row['username'] ?? 'Unknown') . $sep;
            echo $row['action'] . $sep;
            echo '' . $sep; // No details column
            echo $row['ip_address'] . "\n";
        }
    }
    $stmt->close();
    $conn->close();
    exit;
}

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo '<tr>';
        echo '<td>' . htmlspecialchars($row['created_at']) . '</td>';
        echo '<td>' . htmlspecialchars($row['username'] ?? 'Unknown') . '</td>';
        echo '<td>' . htmlspecialchars($row['action']) . '</td>';
        // No details column
        echo '<td></td>';
        echo '<td>' . htmlspecialchars($row['ip_address']) . '</td>';
        echo '</tr>';
    }
} else {
    echo '<tr><td colspan="5">No audit logs found.</td></tr>';
}
$stmt->close();
$conn->close();
?>
