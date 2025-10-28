<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit('Unauthorized');
}

try {
    include '../../config/db.php';
    
    // Check database connection
    if (!$conn || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    
    // Add timestamp for real-time tracking
    $currentTime = date('Y-m-d H:i:s');
    echo '<!-- Last Updated: ' . $currentTime . ' -->';
    
} catch (Exception $e) {
    http_response_code(500);
    echo '<tr><td colspan="5">Error: Unable to connect to database</td></tr>';
    exit;
}

// Filtering
$action = $_GET['action'] ?? 'all';
$date_from = $_GET['date_from'] ?? '';
$date_to = $_GET['date_to'] ?? '';
$search = $_GET['search'] ?? '';
$export = isset($_GET['export']) && $_GET['export'] === 'csv';

// Pagination params
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$per_page = isset($_GET['per_page']) ? max(1, intval($_GET['per_page'])) : 10;

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

// If export requested, return full result without pagination
if ($export) {
    $sql = "SELECT al.*, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id $where_sql ORDER BY al.created_at DESC";
    $stmt = $conn->prepare($sql);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
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

// For non-export, compute total rows for pagination
$count_sql = "SELECT COUNT(*) as total FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id $where_sql";
$count_stmt = $conn->prepare($count_sql);
if ($params) {
    $count_stmt->bind_param($types, ...$params);
}
$count_stmt->execute();
$count_result = $count_stmt->get_result();
$total = 0;
if ($count_result && $count_row = $count_result->fetch_assoc()) {
    $total = intval($count_row['total']);
}
$count_stmt->close();

$total_pages = $per_page > 0 ? (int) ceil($total / $per_page) : 1;
if ($total_pages < 1) $total_pages = 1;
if ($page > $total_pages) $page = $total_pages;
$offset = ($page - 1) * $per_page;

$sql = "SELECT al.*, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id $where_sql ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
$stmt = $conn->prepare($sql);
// bind filter params first, then per_page and offset
if ($params) {
    $combined_types = $types . 'ii';
    $combined_params = array_merge($params, [$per_page, $offset]);
    $stmt->bind_param($combined_types, ...$combined_params);
} else {
    $stmt->bind_param('ii', $per_page, $offset);
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
    // Output pagination metadata as an HTML comment for the client-side JS to parse
    $paginationMeta = json_encode([
        'page' => $page,
        'per_page' => $per_page,
        'total' => $total,
        'pages' => $total_pages
    ]);
    echo '<!-- PAGINATION: ' . $paginationMeta . ' -->';
    while($row = $result->fetch_assoc()) {
        // Use raw timestamp for client-side processing
        $rawTimestamp = $row['created_at'];
        
        // Add data attributes for real-time sorting and processing
        echo '<tr data-timestamp="' . htmlspecialchars($rawTimestamp) . '" data-log-id="' . htmlspecialchars($row['id'] ?? '') . '">';
        
        // Let JavaScript handle the timestamp formatting for real-time updates
        echo '<td class="timestamp-cell" title="' . htmlspecialchars($rawTimestamp) . '">Loading...</td>';
        
        echo '<td>' . htmlspecialchars($row['username'] ?? 'System') . '</td>';
        echo '<td><span class="action-badge action-' . strtolower(htmlspecialchars($row['action'])) . '">' . htmlspecialchars($row['action']) . '</span></td>';
        // Add details if available (from the database schema, there might be details)
        $details = $row['details'] ?? $row['description'] ?? '';
        echo '<td>' . htmlspecialchars($details) . '</td>';
        echo '<td>' . htmlspecialchars($row['ip_address'] ?? 'N/A') . '</td>';
        echo '</tr>';
    }
} else {
    echo '<tr><td colspan="5" class="no-data">No audit logs found. Waiting for activity...</td></tr>';
}
$stmt->close();
$conn->close();
?>
