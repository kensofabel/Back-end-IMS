<?php
// This script creates a default category 'No Category' for every user upon signup
require_once __DIR__ . '/../config/db.php';

function createDefaultCategory($owner_id = null) {
    global $conn;
    $defaultName = 'No Category';
    // If owner_id provided, ensure default category is created per-owner.
    if ($owner_id !== null) {
        $stmt = $conn->prepare("SELECT id FROM categories WHERE name = ? AND owner_id = ? LIMIT 1");
        if ($stmt) {
            $stmt->bind_param('si', $defaultName, $owner_id);
            $stmt->execute();
            $stmt->store_result();
            if ($stmt->num_rows === 0) {
                $insert = $conn->prepare("INSERT INTO categories (name, owner_id) VALUES (?, ?)");
                if ($insert) {
                    $insert->bind_param('si', $defaultName, $owner_id);
                    $insert->execute();
                    $insert->close();
                }
            }
            $stmt->close();
        }
    } else {
        // Fallback: create a global default category if none exists
        $stmt = $conn->prepare("SELECT id FROM categories WHERE name = ? AND owner_id IS NULL LIMIT 1");
        if ($stmt) {
            $stmt->bind_param('s', $defaultName);
            $stmt->execute();
            $stmt->store_result();
            if ($stmt->num_rows === 0) {
                $insert = $conn->prepare("INSERT INTO categories (name) VALUES (?)");
                if ($insert) {
                    $insert->bind_param('s', $defaultName);
                    $insert->execute();
                    $insert->close();
                }
            }
            $stmt->close();
        }
    }
}

// Usage: Call this function after user signup
// createDefaultCategory($user_id);
