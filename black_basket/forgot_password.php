<?php
require 'config/db.php';
session_start();
$timerDuration = 60; // seconds
$timerStart = $_SESSION['forgot_timer_start'] ?? null;
$remaining = 0;
if ($timerStart) {
    $elapsed = time() - $timerStart;
    $remaining = max(0, $timerDuration - $elapsed);
    if ($remaining === 0) {
        unset($_SESSION['forgot_timer_start']);
        unset($_SESSION['forgot_message']);
        unset($_SESSION['forgot_email']);
    }
}
$message = $_SESSION['forgot_message'] ?? '';
$showForm = (empty($message) || strpos($message, 'error-message') !== false) && !$remaining;
unset($_SESSION['forgot_message']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    if ($email) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $stmt->bind_result($user_id);
        if ($stmt->fetch()) {
            $stmt->close();
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour
            $conn->query("DELETE FROM password_resets WHERE user_id = $user_id");
            $insert = $conn->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
            $insert->bind_param('iss', $user_id, $token, $expires);
            $insert->execute();
            $resetLink = "http://localhost/black_basket/reset_password.php?token=$token";
            $_SESSION['forgot_message'] = "<div class='success-message'>A reset link has been sent to your email.<br><small>(For testing: <a href='$resetLink'>$resetLink</a>)</small></div>";
            $_SESSION['forgot_timer_start'] = time(); // Store timer start
    $_SESSION['forgot_email'] = $email; // Store email for resend
            $insert->close();
        } else {
            $stmt->close();
            $_SESSION['forgot_message'] = "<div class='error-message'>Email not found.</div>";
        }
    } else {
        $_SESSION['forgot_message'] = "<div class='error-message'>Please enter your email address.</div>";
    }
    header("Location: forgot_password.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Forgot Password - Black Basket</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="login-container signup-centered">
        <div class="background-animated"></div>
        <div class="login-card">
            <div class="login-header">
                <img class="logo" src="assets/images/indexlogo.webp" alt="Black Basket Logo">
                <h2>Forgot Password</h2>
            </div>
            <?= $message ?>
            <?php if ($showForm): ?>
            <form method="POST" class="login-form" id="forgotForm">
                <div class="form-group">
                    <input type="email" id="resetEmail" name="email" required autocomplete="email">
                    <label for="resetEmail">Enter your email address</label>
                </div>
                <button type="submit" class="login-btn">Send Reset Link</button>
            </form>
            <?php else: ?>
            <div id="resendSection" style="text-align:center; margin-top:20px;">
    <form method="POST" style="display:inline;">
        <input type="hidden" name="email" value="<?= htmlspecialchars($_SESSION['forgot_email'] ?? '') ?>">
        <button type="submit" id="resendBtn" class="login-btn" style="margin-left:10px;" <?= $remaining ? 'disabled' : '' ?>>Resend Link</button>
    </form>
    <span id="countdown" style="color:#aaa; font-size:13px;">
        <?php if ($remaining): ?>
            You can resend the link in <span id="timer"><?= $remaining ?></span> seconds.
        <?php else: ?>
            Didn't receive the email?
        <?php endif; ?>
    </span>
</div>
            <?php endif; ?>
            <div class="signup-section">
                <p>Remembered your password? <a href="index.php" class="signup-link">Sign in</a></p>
            </div>
        </div>
    </div>
    <style>
        #countdown {
            animation: fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 1.5s both; /* 0.4s delay */
        }
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(40px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
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
        .login-header h2 {
            color: #ff9100ff;
            font-size: 14px;
        }
    </style>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        <?php if (!$showForm && $remaining): ?>
        // Countdown for resend button
        let seconds = <?= $remaining ?>;
        const timerSpan = document.getElementById('timer');
        const resendBtn = document.getElementById('resendBtn');
        const countdown = setInterval(function() {
            seconds--;
            timerSpan.textContent = seconds;
            if (seconds <= 0) {
                clearInterval(countdown);
                resendBtn.disabled = false;
                document.getElementById('countdown').textContent = "Didn't receive the email?";
            }
        }, 1000);
        <?php endif; ?>
    });
    </script>
</body>
</html>