-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 17, 2025 at 08:07 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `black_basket_db`
--



CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

-- --------------------------------------------------------


CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



-- Before importing this SQL, run the following to remove invalid password_resets rows:

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `description`) VALUES
(1, 'Dashboard Access', 'Access to dashboard and statistics'),
(5, 'Delete Products', 'Delete products from inventory'),
(6, 'POS', 'Process sales transactions'),
(7, 'View Sales Report', 'Access sales reports'),
(11, 'Employee Management', 'Manage employee accounts'),
(12, 'Audit Logs Access', 'View system audit logs'),
(13, 'Payment Report', 'Access payment reports');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--


CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--



-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--



-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `pos_pin` varchar(10) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `business_name` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--



-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `user_roles`
--

-- --------------------------------------------------------
-- Application migrations (safe re-runnable)

-- Products table (used by POS and all reports)
CREATE TABLE IF NOT EXISTS `products` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Inventory table (supports locations; defaults to Main Warehouse)
CREATE TABLE IF NOT EXISTS `inventory` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `location` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
  `quantity` INT NOT NULL DEFAULT 0,
  `last_updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_product_location` (`product_id`,`location`),
  KEY `idx_inventory_product` (`product_id`),
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Sales header table
CREATE TABLE IF NOT EXISTS `sales` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Sales line items
CREATE TABLE IF NOT EXISTS `sale_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sale_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity_sold` INT NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `total_price` DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sale_items_sale` (`sale_id`),
  KEY `idx_sale_items_product` (`product_id`),
  CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Enhance user_roles with metadata (if not already present)
ALTER TABLE `user_roles`
  ADD COLUMN IF NOT EXISTS `is_primary` TINYINT(1) NOT NULL DEFAULT 0 AFTER `role_id`,
  ADD COLUMN IF NOT EXISTS `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `assigned_by` INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `expires_at` DATETIME DEFAULT NULL,
  ADD KEY `idx_user_roles_user_assigned` (`user_id`,`assigned_at`);

-- Optional FK for assigned_by (ignore if users table missing)
ALTER TABLE `user_roles`
  ADD CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`);

ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
-- ===============================================
-- Enhancements for user_roles and permissions UX
-- ===============================================

-- Normalize foreign key to ON DELETE SET NULL (was duplicate later)
ALTER TABLE `user_roles` DROP FOREIGN KEY `fk_user_roles_assigned_by`;
ALTER TABLE `user_roles`
  ADD CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- Enforce only one primary role per user via triggers
DROP TRIGGER IF EXISTS `trg_user_roles_bi_primary`;
DELIMITER //
CREATE TRIGGER `trg_user_roles_bi_primary` BEFORE INSERT ON `user_roles`
FOR EACH ROW
BEGIN
  IF NEW.is_primary = 1 THEN
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.user_id AND is_primary = 1) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already has a primary role';
    END IF;
  END IF;
END//
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_user_roles_bu_primary`;
DELIMITER //
CREATE TRIGGER `trg_user_roles_bu_primary` BEFORE UPDATE ON `user_roles`
FOR EACH ROW
BEGIN
  IF NEW.is_primary = 1 AND (OLD.is_primary <> 1) THEN
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.user_id AND is_primary = 1 AND role_id <> NEW.role_id) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already has a primary role';
    END IF;
  END IF;
END//
DELIMITER ;

-- Enforce tenant/owner consistency: user and role must belong to same owner_id
DROP TRIGGER IF EXISTS `trg_user_roles_bi_owner`;
DELIMITER //
CREATE TRIGGER `trg_user_roles_bi_owner` BEFORE INSERT ON `user_roles`
FOR EACH ROW
BEGIN
  DECLARE u_owner INT; DECLARE r_owner INT;
  SELECT owner_id INTO u_owner FROM users WHERE id = NEW.user_id;
  SELECT owner_id INTO r_owner FROM roles WHERE id = NEW.role_id;
  IF u_owner IS NOT NULL AND r_owner IS NOT NULL AND u_owner <> r_owner THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User and role belong to different owners';
  END IF;
END//
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_user_roles_bu_owner`;
DELIMITER //
CREATE TRIGGER `trg_user_roles_bu_owner` BEFORE UPDATE ON `user_roles`
FOR EACH ROW
BEGIN
  DECLARE u_owner INT; DECLARE r_owner INT;
  SELECT owner_id INTO u_owner FROM users WHERE id = NEW.user_id;
  SELECT owner_id INTO r_owner FROM roles WHERE id = NEW.role_id;
  IF u_owner IS NOT NULL AND r_owner IS NOT NULL AND u_owner <> r_owner THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User and role belong to different owners';
  END IF;
END//
DELIMITER ;

-- Convenience view: effective permissions per user (active roles only)
CREATE OR REPLACE VIEW `v_user_effective_permissions` AS
SELECT ur.user_id, rp.permission_id
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id AND r.status = 'active'
JOIN role_permissions rp ON rp.role_id = ur.role_id;

/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- Idempotent ensure phone / pos_pin columns (for older databases)
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `phone` VARCHAR(25) DEFAULT NULL AFTER `email`,
  ADD COLUMN IF NOT EXISTS `pos_pin` VARCHAR(10) DEFAULT NULL AFTER `phone`;
-- Recreate index for pos_pin (drop if exists to avoid duplicate error)
DROP INDEX IF EXISTS `idx_users_pos_pin` ON `users`;
ALTER TABLE `users` ADD INDEX `idx_users_pos_pin` (`pos_pin`);
