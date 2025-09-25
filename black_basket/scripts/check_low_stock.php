<?php
require_once '../config/db.php';

// Function to check low stock and generate alerts
function checkLowStock() {
    global $conn;

    // Get products where quantity <= min_stock_level
    $sql = "SELECT p.id, p.name, i.location, i.quantity, i.min_stock_level
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            WHERE i.quantity <= i.min_stock_level AND i.min_stock_level > 0";

    $result = $conn->query($sql);
    if (!$result) {
        echo "Error: " . $conn->error . "\n";
        return;
    }

    while ($row = $result->fetch_assoc()) {
        $product_id = $row['id'];
        $product_name = $row['name'];
        $location = $row['location'];
        $quantity = $row['quantity'];
        $min_level = $row['min_stock_level'];

        $message = "Low stock alert: $product_name at $location has $quantity units (min: $min_level)";

        // Check if alert already exists and is active
        $check_sql = "SELECT id FROM alerts WHERE product_id = $product_id AND type = 'low_stock' AND is_active = 1";
        $check_result = $conn->query($check_sql);
        if ($check_result && $check_result->num_rows == 0) {
            // Insert new alert
            $insert_sql = "INSERT INTO alerts (type, message, product_id, threshold, created_at) VALUES ('low_stock', '$message', $product_id, $min_level, NOW())";
            if (!$conn->query($insert_sql)) {
                echo "Error inserting alert: " . $conn->error . "\n";
            } else {
                echo "Alert created: $message\n";
            }
        } else {
            echo "Alert already exists for $product_name\n";
        }
    }
}

// Run the check
checkLowStock();
?>
