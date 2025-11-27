<?php
session_start();
include 'config/db.php';

// Log the logout if user is logged in
if(isset($_SESSION['user'])) {
    // Fetch user email for a clearer audit message (fall back to id if not found)
    $uid = intval($_SESSION['user']);
    $userEmail = null;
    $eStmt = $conn->prepare('SELECT email FROM users WHERE id = ? LIMIT 1');
    if ($eStmt) {
        $eStmt->bind_param('i', $uid);
        $eStmt->execute();
        $eRes = $eStmt->get_result();
        if ($eRes && $row = $eRes->fetch_assoc()) $userEmail = $row['email'] ?? null;
        $eStmt->close();
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $actionText = 'Logout (' . ($userEmail ?: $uid) . ')';
    $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)");
    if ($log_stmt) {
        $log_stmt->bind_param("isss", $uid, $actionText, $ip, $user_agent);
        $log_stmt->execute();
        $log_stmt->close();
    }
}

// Destroy session
session_destroy();

// Redirect to login page
header("Location: index.php");
exit();
?>