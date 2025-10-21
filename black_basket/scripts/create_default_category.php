<?php
// This script creates a default category 'No Category' for every user upon signup
require_once __DIR__ . '/../config/db.php';

function createDefaultCategory() {
    global $conn;
    // Check if 'No Category' already exists
    $stmt = $conn->prepare("SELECT id FROM categories WHERE name = ?");
    $defaultName = 'No Category';
    $stmt->bind_param('s', $defaultName);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 0) {
        // Insert default category
        $insert = $conn->prepare("INSERT INTO categories (name) VALUES (?)");
        $insert->bind_param('s', $defaultName);
        $insert->execute();
        $insert->close();
    }
    $stmt->close();
}

// Usage: Call this function after user signup
// createDefaultCategory();
