<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Sign Up - Inventory Management System</title>
	<link rel="stylesheet" href="assets/css/style.css">
	<link rel="icon" type="image/x-icon" href="assets/images/icon.webp">
</head>
<body>
<?php session_start(); ?>
<?php
require_once 'config/db.php';
$signupSuccess = false;
$signupError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	$username = trim($_POST['username'] ?? '');
	$email = trim($_POST['email'] ?? '');
	$password = $_POST['password'] ?? '';
	$business_name = trim($_POST['business_name'] ?? '');
	$country = trim($_POST['country'] ?? '');
	// Basic validation
	if (!$username || !$email || !$password || !$business_name || !$country) {
		$signupError = 'All fields are required.';
	} else {
		// Check if username or email already exists
		$stmt = $conn->prepare('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1');
		$stmt->bind_param('ss', $username, $email);
		$stmt->execute();
		$stmt->store_result();
		if ($stmt->num_rows > 0) {
			$signupError = 'Username or email already exists.';
		} else {
			// Hash password
			$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
			$stmt = $conn->prepare('INSERT INTO users (owner_id, username, email, password, business_name, status) VALUES (NULL, ?, ?, ?, ?, "active")');
			$stmt->bind_param('ssss', $username, $email, $hashedPassword, $business_name);
			if ($stmt->execute()) {
				// Auto-login: fetch the new user and set session
				$user_id = $stmt->insert_id;
				$_SESSION['user_id'] = $user_id;
				$_SESSION['username'] = $username;
				$_SESSION['role'] = 'owner';
				$_SESSION['business_name'] = $business_name;
				$_SESSION['status'] = 'active';
				header('Location: pages/dashboard/index.php');
				exit;
			} else {
				$signupError = 'Registration failed. Please try again.';
			}
		}
		$stmt->close();
	}
}
?>
	<div class="login-container signup-centered">
		<div class="background-animated"></div>
		<div class="login-card">
			<div class="login-header">
				<img class="logo" src="assets/images/indexlogo.webp" alt="Black Basket Logo">
			</div>
			<?php if ($signupSuccess): ?>
				<div class="success-message" style="color: #27ae60; text-align: center; margin-bottom: 15px;">Registration successful! You can now <a href="index.php">sign in</a>.</div>
			<?php elseif ($signupError): ?>
				<div class="error-message" style="color: #e74c3c; text-align: center; margin-bottom: 15px;"> <?= htmlspecialchars($signupError) ?> </div>
			<?php endif; ?>
			<form id="signupForm" class="login-form" method="POST">
				<div class="form-group">
					<input type="text" id="signupUsername" name="username" required autocomplete="username">
					<label for="signupUsername">Username</label>
				</div>
				<div class="form-group">
					<input type="email" id="signupEmail" name="email" required autocomplete="email">
					<label for="signupEmail">Email</label>
				</div>
				<div class="form-group">
					<input type="password" id="signupPassword" name="password" required autocomplete="new-password">
					<label for="signupPassword">Password</label>
				</div>
				<div class="form-group">
					<input type="text" id="signupBusiness" name="business_name" required autocomplete="organization">
					<label for="signupBusiness">Business Name</label>
				</div>
				<div class="form-group" style="margin-bottom: 10px;">
					<label style="display:inline;text-align:center;position:static;font-size:12px;">By signing up, you agree to our <a href="#" target="_blank" style="color:orange;">Terms</a>, <a href="#" target="_blank" style="color:orange;">Privacy Policy</a> and <a href="#" target="_blank" style="color:orange;">Cookies Policy</a>.</label>
				</div>
				<button type="submit" id="signupBtn" class="login-btn">Sign up</button>
			</form>
			<div class="signup-section">
				<p>Already have an account? <a href="index.php" class="signup-link">Sign in</a></p>
			</div>
		</div>
	</div>
	<script src="assets/js/signup.js"></script>
</body>
</html>
