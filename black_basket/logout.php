<?php
session_start();
include 'config/db.php';

// Log the logout if user is logged in
if(isset($_SESSION['user'])) {
    $log_stmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, 'logout', ?, ?)");
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $log_stmt->bind_param("iss", $_SESSION['user'], $ip, $user_agent);
    $log_stmt->execute();
    $log_stmt->close();
}

// Destroy session
session_destroy();

// Redirect to login page
header("Location: index.php");
exit();
?>