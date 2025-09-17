<?php
// Update this with your actual password and username
$newPassword = '@wner321';
$username = 'owner';

require '../config/db.php';

// Generate a secure hash
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// Update the password in the database
$stmt = $conn->prepare("UPDATE users SET password = ? WHERE username = ?");
$stmt->bind_param("ss", $hashedPassword, $username);
if ($stmt->execute()) {
    echo "Password updated successfully!";
} else {
    echo "Error updating password: " . $stmt->error;
}
$stmt->close();
$conn->close();
?>