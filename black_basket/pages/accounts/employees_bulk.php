<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit();
}
require_once __DIR__ . '/../../partials/check_permission.php';
// Require permission id 11 (Employee Management)
require_permission(11);
require_once __DIR__ . '/../../config/db.php';
$currentUser = intval($_SESSION['user_id']);
// determine owner_for_query similar to employee.php logic
$owner_for_query = $currentUser;
$oStmt = $conn->prepare('SELECT owner_id FROM users WHERE id = ? LIMIT 1');
if ($oStmt) {
    $oStmt->bind_param('i', $currentUser);
    $oStmt->execute();
    $oStmt->bind_result($owner_id_val);
    $oStmt->fetch();
    $oStmt->close();
    if ($owner_id_val !== null) $owner_for_query = intval($owner_id_val);
}
// Accept JSON body or form data
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$ids = [];
if (is_array($body) && isset($body['employee_ids']) && is_array($body['employee_ids'])) {
    $ids = $body['employee_ids'];
} elseif (isset($_POST['selected_employees']) && is_array($_POST['selected_employees'])) {
    $ids = $_POST['selected_employees'];
} elseif (isset($_POST['employee_ids']) && is_array($_POST['employee_ids'])) {
    $ids = $_POST['employee_ids'];
}
// normalize and filter numeric ids
$ids = array_values(array_filter(array_map(function($v){ return is_numeric($v) ? intval($v) : null; }, $ids)));
if (count($ids) === 0) {
    echo json_encode(['success' => false, 'message' => 'No employee IDs provided']);
    exit();
}
$deleted = [];
$failed = [];
// prepare delete statement (ensure owner match)
$delStmt = $conn->prepare('DELETE FROM users WHERE id = ? AND (owner_id = ? OR owner_id IS NULL) LIMIT 1');
if (!$delStmt) {
    echo json_encode(['success' => false, 'message' => 'DB error (prepare)']);
    exit();
}
foreach ($ids as $id) {
    // don't allow deleting current user
    if ($id === $currentUser) {
        $failed[] = ['id'=>$id, 'reason'=>'cannot delete current user'];
        continue;
    }
    $delStmt->bind_param('ii', $id, $owner_for_query);
    if ($delStmt->execute()) {
        if ($delStmt->affected_rows > 0) {
            $deleted[] = $id;
        } else {
            $failed[] = ['id'=>$id, 'reason'=>'not found or permission denied'];
        }
    } else {
        $failed[] = ['id'=>$id, 'reason'=>'db_error'];
    }
}
$delStmt->close();
echo json_encode(['success' => true, 'deleted' => $deleted, 'failed' => $failed]);
exit();
