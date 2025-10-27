<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}
require_once __DIR__ . '/../../partials/check_permission.php';
require_permission(11);
require_once __DIR__ . '/../../config/db.php';

$currentUser = intval($_SESSION['user_id']);
$owner_for_query = $currentUser;
$oStmt = $conn->prepare('SELECT owner_id FROM users WHERE id = ? LIMIT 1');
$oStmt->bind_param('i', $currentUser);
$oStmt->execute();
$oStmt->bind_result($owner_id_val);
$oStmt->fetch();
$oStmt->close();
if ($owner_id_val !== null) $owner_for_query = intval($owner_id_val);

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$role = isset($_GET['role']) ? trim($_GET['role']) : '';
$status = isset($_GET['status']) ? trim($_GET['status']) : '';
$page = max(1, intval($_GET['page'] ?? 1));
$per_page = intval($_GET['per_page'] ?? 10);
$per_page = $per_page > 0 ? $per_page : 10;
$offset = ($page - 1) * $per_page;

$wheres = [];
$types = '';
$params = [];

$wheres[] = 'u.owner_id = ?';
$types .= 'i';
$params[] = $owner_for_query;

$wheres[] = 'u.id <> ?';
$types .= 'i';
$params[] = $currentUser;

if ($q !== '') {
    $wheres[] = '(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR rm.role_name LIKE ?)';
    $types .= 'ssss';
    $qLike = '%' . $q . '%';
    $params[] = $qLike; $params[] = $qLike; $params[] = $qLike; $params[] = $qLike;
}
if ($role !== '') {
    $wheres[] = 'rm.role_name = ?';
    $types .= 's';
    $params[] = $role;
}
if ($status !== '') {
    $wheres[] = 'u.status = ?';
    $types .= 's';
    $params[] = $status;
}

$where_sql = implode(' AND ', $wheres);

// Count total
$count_sql = "SELECT COUNT(*) FROM users u LEFT JOIN (SELECT ur.user_id, r.name as role_name FROM user_roles ur JOIN roles r ON r.id = ur.role_id GROUP BY ur.user_id) rm ON rm.user_id = u.id WHERE $where_sql";
$countStmt = $conn->prepare($count_sql);
if ($countStmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare count query']);
    exit();
}
if (!empty($params)) {
    // bind params dynamically
    $bind_names = [];
    $bind_names[] = $types;
    foreach ($params as $i => $val) {
        // need references
        $bind_names[] = &$params[$i];
    }
    call_user_func_array([$countStmt, 'bind_param'], $bind_names);
}
$countStmt->execute();
$countStmt->bind_result($total_count);
$countStmt->fetch();
$countStmt->close();

$total_count = intval($total_count ?? 0);
$total_pages = max(1, (int)ceil($total_count / $per_page));

// Select rows with paging
$select_sql = "SELECT u.id, u.full_name, u.email, u.phone, u.pos_pin, u.status, rm.role_name FROM users u LEFT JOIN (SELECT ur.user_id, r.name as role_name FROM user_roles ur JOIN roles r ON r.id = ur.role_id GROUP BY ur.user_id) rm ON rm.user_id = u.id WHERE $where_sql ORDER BY u.full_name ASC LIMIT ? OFFSET ?";
$stmt = $conn->prepare($select_sql);
if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare select query']);
    exit();
}

// append limit/offset params
$exec_params = $params;
$exec_types = $types . 'ii';
$exec_params[] = $per_page;
$exec_params[] = $offset;

if (!empty($exec_params)) {
    $bind_names = [];
    $bind_names[] = $exec_types;
    foreach ($exec_params as $i => $val) {
        $bind_names[] = &$exec_params[$i];
    }
    call_user_func_array([$stmt, 'bind_param'], $bind_names);
}

$rows = [];
if ($stmt->execute()) {
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) {
        $rows[] = $r;
    }
    $res->free();
}
$stmt->close();

echo json_encode([
    'success' => true,
    'page' => $page,
    'per_page' => $per_page,
    'total' => $total_count,
    'total_pages' => $total_pages,
    'rows' => $rows
]);

exit();
