<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit('Unauthorized');
}

// Ensure only owners or users with Audit Logs Access (permission id=12) can fetch logs
require_once __DIR__ . '/../../partials/check_permission.php';
require_permission(12);

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

// Helper: format raw action strings into human-friendly text
function beautify_action($action, $details = '') {
    if (!$action) return '';

    // Normalize spacing
    $a = trim(preg_replace('/\s+/', ' ', $action));

    // Helper to safely fetch a field from details (if details include name/id info)
    $extract_from_details = function($pattern) use ($details) {
        if (!$details) return null;
        if (preg_match($pattern, $details, $m)) return $m[1] ?? null;
        return null;
    };

    // 1) Toggle Employee (common pattern)
    if (preg_match('/Toggle\s+Employee\s*#?(\d+)\s*->\s*(active|inactive)/i', $a, $m)) {
        $id = $m[1];
        $state = strtolower($m[2]);
        $verb = $state === 'active' ? 'Activated' : 'Deactivated';
        $actual = null;
        if (preg_match('/actual_state\s*=\s*(\w+)/i', $a, $m2) || preg_match('/actual_state\s*=\s*(\w+)/i', $details, $m2)) {
            $actual = strtolower($m2[1]);
        }
        return 'Employee #' . $id . ' — ' . $verb . ($actual ? ' (state: ' . $actual . ')' : '');
    }

    // 2) Generic Toggle pattern for other resources: Toggle <Entity> #<id> -> <state>
    if (preg_match('/Toggle\s+([A-Za-z_ ]+)\s*#?(\d+)\s*->\s*(\w+)/i', $a, $m)) {
        $entity = trim($m[1]);
        $id = $m[2];
        $state = strtolower($m[3]);
        $entityNice = ucwords(str_replace('_', ' ', $entity));
        $verb = in_array($state, ['active','enabled','on']) ? 'Enabled' : (in_array($state, ['inactive','disabled','off']) ? 'Disabled' : ucfirst($state));
        return "{$entityNice} #{$id} — {$verb}";
    }

    // 3) Product actions: Created, Updated, Deleted
    if (preg_match('/(Create|Created|Add|Added)\s+Product\b/i', $a)) {
        $name = $extract_from_details('/name\s*[:=]\s*"?([^"]+)"?/i') ?: $extract_from_details('/product_name\s*[:=]\s*"?([^"]+)"?/i');
        return $name ? 'Product created — ' . $name : 'Product created';
    }
    if (preg_match('/(Update|Updated|Edit|Edited)\s+Product\b/i', $a)) {
        $name = $extract_from_details('/name\s*[:=]\s*"?([^"]+)"?/i') ?: $extract_from_details('/product_name\s*[:=]\s*"?([^"]+)"?/i');
        return $name ? 'Product updated — ' . $name : 'Product updated';
    }
    if (preg_match('/(Delete|Deleted|Remove|Removed)\s+Product\b/i', $a)) {
        $name = $extract_from_details('/name\s*[:=]\s*"?([^"]+)"?/i') ?: $extract_from_details('/product_name\s*[:=]\s*"?([^"]+)"?/i');
        return $name ? 'Product deleted — ' . $name : 'Product deleted';
    }

    // 4) Inventory updates: Stock adjusted, SKU changed, Category changed
    if (preg_match('/(Stock|Quantity)\s+(Adjusted|Change|Updated)\b/i', $a) || preg_match('/adjust stock|stock adjusted/i', $a)) {
        $sku = $extract_from_details('/sku\s*[:=]\s*"?([A-Za-z0-9\-]+)"?/i');
        return $sku ? 'Inventory adjusted — SKU: ' . $sku : 'Inventory adjusted';
    }
    if (preg_match('/Change\s+Category|category\s+changed/i', $a)) {
        return 'Category changed';
    }
    if (preg_match('/get_next_sku|sku/i', $a) && strpos(strtolower($details), 'sku') !== false) {
        return 'SKU updated';
    }

    // 5) Sales transactions: Sale recorded, Refund processed
    if (preg_match('/(Sale|Sales|Transaction|Payment).*(record|created|completed|processed)/i', $a)) {
        $amount = $extract_from_details('/amount\s*[:=]\s*"?([0-9\.]+)"?/i');
        return $amount ? 'Sale recorded — ' . '$' . $amount : 'Sale recorded';
    }
    if (preg_match('/refund|refunded/i', $a)) {
        return 'Refund processed';
    }

    // 6) Role and permission changes
    if (preg_match('/add role|created role|create role/i', $a)) {
        $role = $extract_from_details('/role\s*[:=]\s*"?([\w -]+)"?/i');
        return $role ? 'Role added — ' . $role : 'Role added';
    }
    if (preg_match('/delete role|removed role/i', $a)) {
        $role = $extract_from_details('/role\s*[:=]\s*"?([\w -]+)"?/i');
        return $role ? 'Role removed — ' . $role : 'Role removed';
    }
    if (preg_match('/update role permissions|permissions updated|set permissions/i', $a)) {
        return 'Role permissions updated';
    }

    // 7) Employee management generic messages
    if (preg_match('/create employee|added employee/i', $a)) {
        $name = $extract_from_details('/name\s*[:=]\s*"?([^\"]+)"?/i');
        return $name ? 'Employee added — ' . $name : 'Employee added';
    }
    if (preg_match('/delete employee|removed employee/i', $a)) {
        return 'Employee removed';
    }

    // 8) Login/logout (more robust)
    if (preg_match('/\b(logged in|login|sign in)\b/i', $a)) return 'User logged in';
    if (preg_match('/\b(logged out|logout|sign out)\b/i', $a)) return 'User logged out';

    // 9) Fallback & cleanup: make small readability changes
    $a = str_replace('->', '→', $a);
    $a = str_replace('_', ' ', $a);
    $a = preg_replace('/\s*→\s*/', ' → ', $a);
    $a = trim($a);
    $a = preg_replace('/\s+/', ' ', $a);
    $a = mb_strtoupper(mb_substr($a, 0, 1)) . mb_substr($a, 1);

    return $a;
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
        // Add details if available (from the database schema, there might be details)
        $details = $row['details'] ?? $row['description'] ?? '';
        // Beautify action for a clearer, human-friendly message, keep raw action/details on hover
        $rawAction = $row['action'] ?? '';
        $formattedAction = beautify_action($rawAction, $details);
        $titleAttr = htmlspecialchars($rawAction . ($details ? ' — ' . $details : ''));
        echo '<td><span class="action-badge" title="' . $titleAttr . '">' . htmlspecialchars($formattedAction) . '</span></td>';
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
