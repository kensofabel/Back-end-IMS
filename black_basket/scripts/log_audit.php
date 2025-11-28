<?php
/**
 * Simple audit logging helper.
 * Usage: require_once __DIR__ . '/log_audit.php';
 * then call log_audit($conn, $userId, $actionStr);
 */
function log_audit($conn, $userId, $action)
{
    if (!is_string($action)) $action = json_encode($action);
    // Truncate to match schema limits
    $action = mb_substr($action, 0, 50);
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;

    $stmt = $conn->prepare('INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)');
    if (!$stmt) return false;
    $stmt->bind_param('isss', $userId, $action, $ip, $ua);
    $res = $stmt->execute();
    $stmt->close();
    return $res;
}

?>
