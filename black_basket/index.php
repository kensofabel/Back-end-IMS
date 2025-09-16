<?php
session_start();
include 'config/db.php';

// AJAX login handling
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ajax'])) {
    header('Content-Type: application/json');
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    $sql = "SELECT * FROM users WHERE username='$username' OR email='$username' LIMIT 1";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        // Check for inactive accounts
        if (isset($user['status']) && $user['status'] === 'inactive') {
            echo json_encode(['success' => false, 'reason' => 'Employee account is inactive']);
            exit();
        }
        if ($password === $user['password']) {
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
                    <input type="text" id="username" name="username" required>
                    <label for="username">Username or email</label>
                </div>
                <div class="form-group">
                    <input type="password" id="password" name="password" required>
                    <label for="password">Password</label>
                    <span class="password-toggle slashed" onclick="togglePassword()">👁️</span>
                </div>
                <button type="submit" id="loginBtn" class="login-btn">Log in</button>
                <div class="login-links">
                    <a href="#" class="forgot-password">Forgot password?</a>
                </div>
            </form>
            <div class="signup-section">
                <p>Don't have an account? <a href="#" class="signup-link">Sign up</a></p>
            </div>
        </div>
    </div>
    <script>
    // 1. checkAuthentication
    function checkAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentPage = window.location.pathname.split('/').pop();

        if (currentPage === 'pages/dashboard/index.php' && !isLoggedIn) {
            window.location.href = 'index.php';
        } else if (currentPage === 'index.php' && isLoggedIn) {
            window.location.href = 'pages/dashboard/index.php';
        }
    }

    // 2. handleLogin
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        setLoginLoading(true);

        // Clear previous error messages
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Client-side validation
        const validationError = validateLoginInput(username, password);
        if (validationError) {
            showLoginError(validationError);
            setLoginLoading(false);
            return;
        }

        const formData = new FormData(this);
        formData.append('ajax', '1');
        try {
            const response = await fetch('index.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('lastLoginTime', new Date().toISOString());
                window.location.href = 'pages/dashboard/index.php';
            } else {
                handleAuthFailure(result.reason);
            }
        } catch (error) {
            handleAuthError(error);
        } finally {
            setLoginLoading(false);
        }
    });

    // 4. handleAuthFailure
    function handleAuthFailure(reason) {
        let errorMessage = 'Login failed';
        let toastType = 'error';

        switch (reason) {
            case 'Invalid credentials':
                errorMessage = 'Invalid username or password. Please check your credentials and try again.';
                break;
            case 'Employee account is inactive':
                errorMessage = 'Your account is currently inactive. Please contact your administrator.';
                break;
            case 'Employee record not found':
                errorMessage = 'Account not found. Please verify your username or contact support.';
                break;
            case 'Password expired':
                errorMessage = 'Your password has expired. Please reset your password.';
                break;
            default:
                errorMessage = reason || 'Authentication failed. Please try again.';
        }

        showLoginError(errorMessage);
    }

    // 5. handleAuthError
    function handleAuthError(error) {
        let errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';

        if (error.name === 'NetworkError') {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.name === 'TimeoutError') {
            errorMessage = 'Connection timeout. Please try again.';
        } else if (error.message && error.message.includes('fetch')) {
            errorMessage = 'Server is currently unavailable. Please try again later.';
        }

        showLoginError(errorMessage);
    }

    // 6. showLoginError
    function showLoginError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.classList.add('shake');
        setTimeout(() => {
            errorDiv.classList.remove('shake');
        }, 500);
    }

    // 7. setLoginLoading
    function setLoginLoading(isLoading) {
        const loginBtn = document.getElementById('loginBtn');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (isLoading) {
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            }
            if (usernameInput) usernameInput.disabled = true;
            if (passwordInput) passwordInput.disabled = true;
        } else {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'Log in';
            }
            if (usernameInput) usernameInput.disabled = false;
            if (passwordInput) passwordInput.disabled = false;
        }
    }

    // 8. validateLoginInput
    function validateLoginInput(username, password) {
        if (!username) {
            return 'Username is required';
        }
        if (username.length < 3) {
            return 'Username must be at least 3 characters long';
        }
        if (!password) {
            return 'Password is required';
        }
        if (password.length < 4) {
            return 'Password must be at least 4 characters long';
        }
        const weakPasswords = ['password', '123456', 'admin', '123456789'];
        if (weakPasswords.includes(password.toLowerCase())) {
            return 'This password is too common. Please choose a stronger password.';
        }
        return null;
    }

    // Optionally, call checkAuthentication() on page load
    checkAuthentication();
    </script>
</body>
</html>