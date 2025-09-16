<?php
session_start();
include 'config/db.php'; // database connection

// Login handling
if(isset($_POST['username']) && isset($_POST['password'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];

    $sql = "SELECT * FROM users WHERE username='$username' OR email='$username' LIMIT 1";
    $result = $conn->query($sql);

    if($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if($password === $user['password']) { // plain text for now
            $_SESSION['user'] = $user['id']; // store user id
            header("Location: pages/dashboard/index.php"); // redirect after login
            exit();
        } else {
            $_SESSION['error'] = "Wrong password!";
            header("Location: index.php");
            exit();
        }
    } else {
        $_SESSION['error'] = "User not found!";
        header("Location: index.php");
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
        <link rel="icon" type="image/x-icon" href="assets\images\icon.webp">
    </head>
    <body>
        <div class="login-container">
            <div class="background-animated"></div>
            <div class="login-card">
                <div class="login-header">
                    <img class="logo" src="assets\images\indexlogo.webp" alt="Black Basket Logo">
                </div>
                <div id="errorMessage" class="error-message">
                    <?php
                    if(isset($_SESSION['error'])) {
                        echo $_SESSION['error'];
                        unset($_SESSION['error']);
                    }
                    ?>
                </div>
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
                    <button type="submit" class="login-btn">Log in</button>
                    
                    <div class="login-links">
                        <a href="#" class="forgot-password">Forgot password?</a>
                    </div>
                </form>
                
                <div class="signup-section">
                    <p>Don't have an account? <a href="#" class="signup-link">Sign up</a></p>
                </div>
            </div>
        </div>
    </body>
</html>