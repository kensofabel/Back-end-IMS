<?php
file_put_contents('signup_debug.log', print_r($_POST, true), FILE_APPEND);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
require_once 'config/db.php';
require_once 'scripts/create_default_category.php'; // Include the default category creation
$signupSuccess = false;
$signupError = '';

// Handle AJAX or normal POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	$username = trim($_POST['username'] ?? '');
	$email = trim($_POST['email'] ?? '');
	$password = $_POST['password'] ?? '';
	$business_name = trim($_POST['business_name'] ?? '');
	$full_name = trim($_POST['full_name'] ?? '');
	// Basic validation
	if (!$full_name || !$username || !$email || !$password || !$business_name) {
		$signupError = 'All fields are required.';
		if (isset($_POST['ajax'])) {
			header('Content-Type: application/json');
			echo json_encode(['success' => false, 'reason' => $signupError]);
			exit;
		}
	} else {
		// Check if username or email already exists
		$stmt = $conn->prepare('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1');
		$stmt->bind_param('ss', $username, $email);
		$stmt->execute();
		$stmt->store_result();
		if ($stmt->num_rows > 0) {
			$signupError = 'Username or email already exists.';
			if (isset($_POST['ajax'])) {
				header('Content-Type: application/json');
				echo json_encode(['success' => false, 'reason' => $signupError]);
				exit;
			}
		} else {
			// Hash password
			$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
			$stmt = $conn->prepare('INSERT INTO users (owner_id, username, full_name, email, password, business_name, status) VALUES (NULL, ?, ?, ?, ?, ?, "active")');
			$stmt->bind_param('sssss', $username, $full_name, $email, $hashedPassword, $business_name);
			if ($stmt->execute()) {
				// Auto-login: fetch the new user and set session
				$user_id = $stmt->insert_id;
				// Create default category for this user
				createDefaultCategory($user_id);
				// Create Owner role for this owner if not exists
				$role_name = 'Owner';
				$role_desc = 'Full access to all features';
				$role_stmt = $conn->prepare('SELECT id FROM roles WHERE owner_id = ? AND name = ? LIMIT 1');
				$role_stmt->bind_param('is', $user_id, $role_name);
				$role_stmt->execute();
				$role_stmt->store_result();
				if ($role_stmt->num_rows > 0) {
					$role_stmt->bind_result($role_id);
					$role_stmt->fetch();
				} else {
					// Create the Owner role for this owner
					$insert_role = $conn->prepare('INSERT INTO roles (owner_id, name, description) VALUES (?, ?, ?)');
					$insert_role->bind_param('iss', $user_id, $role_name, $role_desc);
					$insert_role->execute();
					$role_id = $insert_role->insert_id;
					$insert_role->close();
					// Assign all permissions to Owner role
					$perm_result = $conn->query('SELECT id FROM permissions');
					if ($perm_result) {
						$assign_perm = $conn->prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
						while ($perm_row = $perm_result->fetch_assoc()) {
							$perm_id = $perm_row['id'];
							$assign_perm->bind_param('ii', $role_id, $perm_id);
							$assign_perm->execute();
						}
						$assign_perm->close();
						$perm_result->free();
					}
				}
				$role_stmt->close();

				// Assign Owner role to this user
				$user_role_stmt = $conn->prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
				$user_role_stmt->bind_param('ii', $user_id, $role_id);
				$user_role_stmt->execute();
				$user_role_stmt->close();

				// --- Create Admin and Staff roles for this owner and assign default permissions ---
				$admin_permissions = [1,2,3,4,5,6,7,8,11]; // All except roles/permissions/audit
				$staff_permissions = [1,2,3,6,7,8]; // Basic access

				foreach ([
					'Admin' => ['desc' => 'Admin role with elevated permissions', 'perms' => $admin_permissions],
					'Staff' => ['desc' => 'Staff role with limited permissions', 'perms' => $staff_permissions]
				] as $role_name => $role_info) {
					// Check if role exists for this owner
					$stmt = $conn->prepare("SELECT id FROM roles WHERE owner_id = ? AND name = ? LIMIT 1");
					$stmt->bind_param('is', $user_id, $role_name);
					$stmt->execute();
					$stmt->store_result();
					if ($stmt->num_rows == 0) {
						// Create the role
						$insert = $conn->prepare("INSERT INTO roles (owner_id, name, description) VALUES (?, ?, ?)");
						$insert->bind_param('iss', $user_id, $role_name, $role_info['desc']);
						$insert->execute();
						$role_id = $insert->insert_id;
						$insert->close();
					} else {
						$stmt->bind_result($role_id);
						$stmt->fetch();
					}
					$stmt->close();

					// Assign default permissions to the role
					foreach ($role_info['perms'] as $perm_id) {
						// Check if already assigned
						$check = $conn->prepare("SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ? LIMIT 1");
						$check->bind_param('ii', $role_id, $perm_id);
						$check->execute();
						$check->store_result();
						if ($check->num_rows == 0) {
							$assign = $conn->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
							$assign->bind_param('ii', $role_id, $perm_id);
							$assign->execute();
							$assign->close();
						}
						$check->close();
					}
				}

				$_SESSION['user'] = $user_id;
				$_SESSION['username'] = $username;
				$_SESSION['role'] = 'owner';
				$_SESSION['business_name'] = $business_name;
				$_SESSION['status'] = 'active';
				if (isset($_POST['ajax'])) {
					header('Content-Type: application/json');
					echo json_encode(['success' => true]);
					exit;
				} else {
					header('Location: pages/dashboard/index.php');
					exit;
				}
			} else {
				$signupError = 'Registration failed. Please try again.';
				if (isset($_POST['ajax'])) {
					header('Content-Type: application/json');
					echo json_encode(['success' => false, 'reason' => $signupError]);
					exit;
				}
			}
		}
		$stmt->close();
	}
}
?>
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
					<input type="text" id="signupFullName" name="full_name" required autocomplete="name">
					<label for="signupFullName">Full Name</label>
				</div>
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
                    <span class="password-toggle slashed" onclick="togglePassword()">👁️</span>
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
		</div>
	</div>
	<script src="assets/js/signup.js"></script>
</body>
</html>
