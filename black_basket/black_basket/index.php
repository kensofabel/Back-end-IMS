<?php
session_start();
include 'config/db.php';

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// AJAX login handling
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ajax'])) {
    header('Content-Type: application/json');
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';


    $sql = "SELECT * FROM users WHERE username='$username' OR email='$username' LIMIT 1";

    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        // Check for inactive accounts
        if (isset($user['status']) && $user['status'] === 'inactive') {
            echo json_encode(['success' => false, 'reason' => 'Employee account is inactive']);
            exit();
        }
    if (password_verify($password, $user['password'])) {

            // Set user_id for consistency
            $_SESSION['user_id'] = $user['id'];
            // Set owner_id if user has one, otherwise set to their own id
            if (isset($user['owner_id']) && !is_null($user['owner_id'])) {
                $_SESSION['owner_id'] = $user['owner_id'];
            } else {
                $_SESSION['owner_id'] = $user['id'];
            }
            // For backward compatibility
            $_SESSION['user'] = $user['id'];

            // --- INSERT THIS BLOCK FOR AUDIT LOGGING ---
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            $stmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, 'login', ?, ?)");
            $stmt->bind_param("iss", $user['id'], $ip, $user_agent);
            $stmt->execute();
            $stmt->close();
            // --- END AUDIT LOGGING ---

            echo json_encode(['success' => true]);
            exit();
        } else {
            // --- OPTIONAL: LOG FAILED LOGIN ATTEMPT ---
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            $null = null;
            $stmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, 'failed_login', ?, ?)");
            $stmt->bind_param("iss", $null, $ip, $user_agent);
            $stmt->execute();
            $stmt->close();
            // --- END FAILED LOGIN LOGGING ---

            echo json_encode(['success' => false, 'reason' => 'Invalid credentials']);
            exit();
        }
    } else {
        echo json_encode(['success' => false, 'reason' => 'Employee record not found']);
        exit();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Management System</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="icon" type="image/x-icon" href="assets/images/icon.webp">
</head>
<body>
    <div class="login-container">
        <div class="background-animated"></div>
        <div class="login-card">
            <div class="login-header">
                <img class="logo" src="assets/images/indexlogo.webp" alt="Black Basket Logo">
            </div>
            <div id="errorMessage" class="error-message"></div>
            <form id="loginForm" class="login-form" method="POST">
                <div class="form-group">
                    <input type="text" id="username" name="username" required autocomplete="username">
                    <label for="username">Username or email</label>
                </div>
                <div class="form-group">
                    <input type="password" id="password" name="password" required autocomplete="current-password">
                    <label for="password">Password</label>
                    <span class="password-toggle slashed" onclick="togglePassword()">👁️</span>
                </div>
                <button type="submit" id="loginBtn" class="login-btn">Sign in</button>
                <div class="login-links">
                    <a href="forgot_password.php" class="forgot-password">Forgot password?</a>
                </div>
            </form>
            <div class="signup-section">
                <p>Create owner's account? <a href="signup.php" class="signup-link">Sign up</a></p>
            </div>
        </div>
    </div>
    <script src="assets/js/index.js"></script>
</body>
</html>