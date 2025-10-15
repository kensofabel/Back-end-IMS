<?php
// scripts/install_schema.php — Create missing tables/columns required by POS and Reports
// Visit: http://localhost/black_basket/scripts/install_schema.php

@ini_set('display_errors', '0');
@error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

require_once __DIR__ . '/../config/db.php'; // $conn

header('Content-Type: text/html; charset=UTF-8');

function dbname(mysqli $c): string {
    $res = $c->query('SELECT DATABASE()');
    if ($res === false) { return 'unknown'; }
    $row = $res->fetch_row();
    return ($row && isset($row[0]) && $row[0] !== null && $row[0] !== '') ? (string)$row[0] : 'unknown';
}
function q(mysqli $c, string $sql): array {
    $ok = $c->query($sql);
    return [$ok === true, $ok === true ? null : $c->error];
}
function table_exists(mysqli $c, string $t): bool {
    $db = $c->real_escape_string(dbname($c));
    $t  = $c->real_escape_string($t);
    $sql = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='$t' LIMIT 1";
    $r = $c->query($sql);
    return $r && $r->num_rows > 0;
}
function col_exists(mysqli $c, string $t, string $col): bool {
    $db = $c->real_escape_string(dbname($c));
    $t  = $c->real_escape_string($t);
    $col= $c->real_escape_string($col);
    $sql = "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='$t' AND COLUMN_NAME='$col' LIMIT 1";
    $r = $c->query($sql);
    return $r && $r->num_rows > 0;
}
function idx_exists(mysqli $c, string $t, string $idx): bool {
    $db = $c->real_escape_string(dbname($c));
    $t  = $c->real_escape_string($t);
    $idx= $c->real_escape_string($idx);
    $sql = "SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='$t' AND INDEX_NAME='$idx' LIMIT 1";
    $r = $c->query($sql);
    return $r && $r->num_rows > 0;
}
function fk_exists(mysqli $c, string $constraint): bool {
    $db = $c->real_escape_string(dbname($c));
    $constraint = $c->real_escape_string($constraint);
    $sql = "SELECT 1 FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='$db' AND CONSTRAINT_NAME='$constraint' LIMIT 1";
    $r = $c->query($sql);
    return $r && $r->num_rows > 0;
}

$log = [];
$db = ($conn instanceof mysqli) ? dbname($conn) : 'unknown';

// 1) products
if (!table_exists($conn, 'products')) {
    [$ok,$err] = q($conn, "CREATE TABLE `products` (
      `id` INT NOT NULL AUTO_INCREMENT,
      `name` VARCHAR(150) NOT NULL,
      `sku` VARCHAR(64) DEFAULT NULL,
      `barcode` VARCHAR(64) DEFAULT NULL,
      `category` VARCHAR(100) DEFAULT NULL,
      `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      `description` TEXT DEFAULT NULL,
      `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uq_products_sku` (`sku`),
      UNIQUE KEY `uq_products_barcode` (`barcode`),
      KEY `idx_products_name` (`name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    $log[] = ['products', $ok, $err];
} else { $log[] = ['products', true, 'exists']; }

// 2) inventory
if (!table_exists($conn, 'inventory')) {
    [$ok,$err] = q($conn, "CREATE TABLE `inventory` (
      `id` INT NOT NULL AUTO_INCREMENT,
      `product_id` INT NOT NULL,
      `location` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
      `quantity` INT NOT NULL DEFAULT 0,
      `last_updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uq_inventory_product_location` (`product_id`,`location`),
      KEY `idx_inventory_product` (`product_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    $log[] = ['inventory', $ok, $err];
} else { $log[] = ['inventory', true, 'exists']; }
if (table_exists($conn, 'inventory') && !fk_exists($conn, 'fk_inventory_product')) {
    [$ok,$err] = q($conn, "ALTER TABLE `inventory` ADD CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE");
    $log[] = ['fk_inventory_product', $ok, $err];
}

// 3) sales
if (!table_exists($conn, 'sales')) {
    [$ok,$err] = q($conn, "CREATE TABLE `sales` (
      `id` INT NOT NULL AUTO_INCREMENT,
      `customer_name` VARCHAR(150) DEFAULT NULL,
      `sale_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      `payment_method` VARCHAR(32) NOT NULL DEFAULT 'cash',
      `channel` VARCHAR(50) NOT NULL DEFAULT 'in-store',
      `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
      `created_by` INT DEFAULT NULL,
      PRIMARY KEY (`id`),
      KEY `idx_sales_sale_date` (`sale_date`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    $log[] = ['sales', $ok, $err];
} else { $log[] = ['sales', true, 'exists']; }

// 4) sale_items
if (!table_exists($conn, 'sale_items')) {
    [$ok,$err] = q($conn, "CREATE TABLE `sale_items` (
      `id` INT NOT NULL AUTO_INCREMENT,
      `sale_id` INT NOT NULL,
      `product_id` INT NOT NULL,
      `quantity_sold` INT NOT NULL,
      `unit_price` DECIMAL(12,2) NOT NULL,
      `total_price` DECIMAL(12,2) NOT NULL,
      PRIMARY KEY (`id`),
      KEY `idx_sale_items_sale` (`sale_id`),
      KEY `idx_sale_items_product` (`product_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    $log[] = ['sale_items', $ok, $err];
} else { $log[] = ['sale_items', true, 'exists']; }
if (table_exists($conn, 'sale_items') && !fk_exists($conn, 'fk_sale_items_sale')) {
    [$ok,$err] = q($conn, "ALTER TABLE `sale_items` ADD CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE");
    $log[] = ['fk_sale_items_sale', $ok, $err];
}
if (table_exists($conn, 'sale_items') && !fk_exists($conn, 'fk_sale_items_product')) {
    [$ok,$err] = q($conn, "ALTER TABLE `sale_items` ADD CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT");
    $log[] = ['fk_sale_items_product', $ok, $err];
}

// 5) Enhance user_roles columns
if (table_exists($conn, 'user_roles')) {
    if (!col_exists($conn, 'user_roles', 'is_primary')) {
        [$ok,$err] = q($conn, "ALTER TABLE `user_roles` ADD COLUMN `is_primary` TINYINT(1) NOT NULL DEFAULT 0 AFTER `role_id`");
        $log[] = ['user_roles.is_primary', $ok, $err];
    }
    if (!col_exists($conn, 'user_roles', 'assigned_at')) {
        [$ok,$err] = q($conn, "ALTER TABLE `user_roles` ADD COLUMN `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP");
        $log[] = ['user_roles.assigned_at', $ok, $err];
    }
    if (!col_exists($conn, 'user_roles', 'assigned_by')) {
        [$ok,$err] = q($conn, "ALTER TABLE `user_roles` ADD COLUMN `assigned_by` INT DEFAULT NULL");
        $log[] = ['user_roles.assigned_by', $ok, $err];
    }
    if (!col_exists($conn, 'user_roles', 'expires_at')) {
        [$ok,$err] = q($conn, "ALTER TABLE `user_roles` ADD COLUMN `expires_at` DATETIME DEFAULT NULL");
        $log[] = ['user_roles.expires_at', $ok, $err];
    }
    if (!idx_exists($conn, 'user_roles', 'idx_user_roles_user_assigned')) {
        [$ok,$err] = q($conn, "ALTER TABLE `user_roles` ADD KEY `idx_user_roles_user_assigned` (`user_id`,`assigned_at`)");
        $log[] = ['idx_user_roles_user_assigned', $ok, $err];
    }
    if (!fk_exists($conn, 'fk_user_roles_assigned_by')) {
        [$ok,$err] = q($conn, "ALTER TABLE `user_roles` ADD CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`)");
        $log[] = ['fk_user_roles_assigned_by', $ok, $err];
    }
}

echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Install Schema</title><style>body{background:#111;color:#eee;font-family:Segoe UI,Arial,sans-serif;padding:20px}h1{color:#ff9800} .ok{color:#93e093} .bad{color:#ff8a80} table{border-collapse:collapse;width:100%;margin-top:16px}td,th{padding:8px;border-bottom:1px solid rgba(255,255,255,.1)} th{text-align:left;color:#ffb74d}</style></head><body>';
echo '<h1>Black Basket — Install Schema</h1>';
echo '<div>Database: <strong>'.htmlspecialchars($db).'</strong></div>';
echo '<table><tr><th>Step</th><th>Status</th><th>Error</th></tr>';
foreach ($log as [$step,$ok,$err]) {
    echo '<tr><td>'.htmlspecialchars($step).'</td><td>'.($ok?'<span class="ok">OK</span>':'<span class="bad">FAIL</span>').'</td><td>'.htmlspecialchars($err ?? '').'</td></tr>';
}
echo '</table>';
echo '<p>Next: <a style="color:#ffb74d" href="/black_basket/scripts/seed_demo_data.php">Seed demo data</a>, then open your reports.</p>';
echo '</body></html>';
?>