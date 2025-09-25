<?php
require '../config/db.php';

$sql = "CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";

if ($conn->query($sql) === TRUE) {
    echo "Table audit_logs created successfully.";
} else {
    echo "Error creating table: " . $conn->error;
}

// Update password hash for user 'owner'
$hashedPassword = '$2y$10$.jGxmc/Z/A3LsD77/Z29heuldoYQUeNbjj0TaTU.yr.vxUhPVd6f2';
$username = 'owner';

$updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE username = ?");
$updateStmt->bind_param("ss", $hashedPassword, $username);
if ($updateStmt->execute()) {
    echo "\nPassword hash updated successfully for user 'owner'.";
} else {
    echo "\nError updating password hash: " . $updateStmt->error;
}

$updateStmt->close();
$conn->close();
?>
