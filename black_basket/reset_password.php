<?php
require 'config/db.php';
$token = $_GET['token'] ?? '';
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['token'];
    $newPassword = $_POST['password'];
    $stmt = $conn->prepare("SELECT user_id, expires_at FROM password_resets WHERE token = ?");
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $stmt->bind_result($user_id, $expires_at);
    if ($stmt->fetch() && strtotime($expires_at) > time()) {
        $stmt->close();
        // Backend password validation
        $weakPasswords = ['password', '123456', 'admin', '123456789'];
        if (strlen($newPassword) < 4) {
            $message = "<div class='error-message'>Password must be at least 4 characters long.</div>";
        } elseif (in_array(strtolower($newPassword), $weakPasswords)) {
            $message = "<div class='error-message'>This password is too common. Please choose a stronger password.</div>";
        } else {
            // Fetch current password hash
            $userStmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
            $userStmt->bind_param('i', $user_id);
            $userStmt->execute();
            $userStmt->bind_result($current_hash);
            if ($userStmt->fetch()) {
                if (password_verify($newPassword, $current_hash)) {
                    $message = "<div class='error-message'>New password must be different from old password.</div>";
                } else {
                    $userStmt->close();
                    $hashed = password_hash($newPassword, PASSWORD_DEFAULT);
                    $update = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
                    $update->bind_param('si', $hashed, $user_id);
                    $update->execute();
                    $update->close();
                    $conn->query("DELETE FROM password_resets WHERE user_id = $user_id");
                    // Redirect after success
                    header("Location: reset_password.php?success=1");
                    exit;
                }
            } else {
                $message = "<div class='error-message'>User not found.</div>";
            }
            $userStmt->close();
        }
    } else {
        $stmt->close();
        $message = "<div class='error-message'>Invalid or expired token.</div>";
    }
}

if (isset($_GET['success'])) {
    $message = "<div class='success-message'>Password reset successful.</div>";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reset Password - Black Basket</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .login-header h2 {
            color: #ff9100ff;
            font-size: 14px;
        }
        .success-message {
            font-size: 14px;
            transition: opacity 0.3s, transform 0.3s;
            animation: slideUpFadeIn 0.6s ease-out 0.1s both;
            color: #dbdbdb;
        }
        @keyframes slideUpFadeIn {
            from { opacity: 0; transform: translateY(50px) scale(0.95);}
            to { opacity: 1; transform: translateY(0) scale(1);}
        }
        .signup-centered .login-card {
            max-width: 350px;
            min-width: 350px;
        }
    </style>
</head>
<body>
    <div class="login-container signup-centered">
        <div class="background-animated"></div>
        <div class="login-card">
            <div class="login-header">
                <img class="logo" src="assets/images/indexlogo.webp" alt="Black Basket Logo">
                <h2>Reset Password</h2>
            </div>
            <?= $message ?>
            <?php if (!$message || strpos($message, 'Invalid') !== false): ?>
            <form method="POST" class="login-form" onsubmit="return validatePasswordInput();">
                <input type="hidden" name="token" value="<?=htmlspecialchars($token)?>">
                <div class="form-group">
                    <input type="password" name="password" id="password" required autocomplete="new-password">
                    <label for="password">New Password</label>
                    <span class="password-toggle slashed" onclick="togglePassword()" title="Show/Hide Password">👁️</span>
                </div>
                <div id="resetError" class="error-message" style="display:none;"></div>
                <button type="submit" class="login-btn">Reset Password</button>
            </form>
            <?php endif; ?>
            <div class="signup-section">
                <p>Return to <a href="index.php" class="signup-link">Sign in</a></p>
            </div>
        </div>
    </div>
    <script>
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.querySelector('.password-toggle');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('slashed');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.add('slashed');
            }
        }
        function validatePasswordInput() {
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('resetError');
            let error = null;
            if (!password) error = 'Password is required';
            else if (password.length < 4) error = 'Password must be at least 4 characters long';
            else {
                const weakPasswords = ['password', '123456', 'admin', '123456789'];
                if (weakPasswords.includes(password.toLowerCase())) {
                    error = 'This password is too common. Please choose a stronger password.';
                }
            }
            if (error) {
                errorDiv.textContent = error;
                errorDiv.style.display = 'block';
                return false;
            } else {
                errorDiv.textContent = '';
                errorDiv.style.display = 'none';
                return true;
            }
        }
    </script>
</body>
</html>