
<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../config/db.php';
$user = [
    'avatar' => '../../assets/images/dboardlogo.webp',
    'name' => 'Guest',
    'email' => 'Not set',
    'role' => 'User'
];
if (isset($_SESSION['user_id'])) {
    $user_id = intval($_SESSION['user_id']);
    $stmt = $conn->prepare('SELECT full_name, email FROM users WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $user_id);
    if ($stmt->execute()) {
        $stmt->bind_result($full_name, $email);
        if ($stmt->fetch()) {
            $user['name'] = $full_name;
            $user['email'] = $email;
        }
    }
    $stmt->close();
    // Get role (first role if multiple)
    $role = null;
    $role_stmt = $conn->prepare('SELECT r.name FROM roles r INNER JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? LIMIT 1');
    $role_stmt->bind_param('i', $user_id);
    if ($role_stmt->execute()) {
        $role_stmt->bind_result($role_name);
        if ($role_stmt->fetch()) {
            $role = ucfirst($role_name);
        }
    }
    $role_stmt->close();
    // If no role found, check if user is owner (session or DB fallback)
    if (!$role) {
        if (isset($_SESSION['owner_id']) && $_SESSION['owner_id'] == $user_id) {
            $role = 'Owner';
        } else {
            // Fallback: check DB if user has owner_id IS NULL
            $owner_stmt = $conn->prepare('SELECT id FROM users WHERE id = ? AND owner_id IS NULL LIMIT 1');
            $owner_stmt->bind_param('i', $user_id);
            if ($owner_stmt->execute()) {
                $owner_stmt->store_result();
                if ($owner_stmt->num_rows > 0) {
                    $role = 'Owner';
                } else {
                    $role = 'User';
                }
            } else {
                $role = 'User';
            }
            $owner_stmt->close();
        }
    }
    $user['role'] = $role;
}
?>
<div class="profile-popup" id="profilePopup">
    <div class="profile-popup-content">
        <span class="profile-popup-close" id="closeProfilePopup">&times;</span>
            <img src="../../assets/images/icon.webp" alt="Black Basket" class="profile-popup-avatar" style="border-radius:0;">
        <h2><?php echo $user['name']; ?></h2>
        <p class="profile-popup-email"><?php echo $user['email']; ?></p>
        <p class="profile-popup-role">Role: <?php echo $user['role']; ?></p>
    <button class="profile-popup-btn" id="openChangePasswordPopup">Change Password</button>
        <button class="profile-popup-btn logout" onclick="window.location.href='/black_basket/logout.php'">Logout</button>
    </div>
<?php include __DIR__ . '/change_password_popup.php'; ?>
<script>
document.addEventListener('DOMContentLoaded', function() {
    var openBtn = document.getElementById('openChangePasswordPopup');
    var popup = document.getElementById('changePasswordPopup');
    if (openBtn && popup) {
        openBtn.addEventListener('click', function() {
            popup.style.display = 'flex';
        });
    }
});
</script>
</div>
