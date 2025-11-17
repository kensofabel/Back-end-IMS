-- POS features schema (cleaned copy)
-- Source: pos_features_schema.sql

-- Table: favourites
CREATE TABLE IF NOT EXISTS `favourites` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `product_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fav_user` (`user_id`),
  KEY `idx_fav_product` (`product_id`),
  CONSTRAINT `fk_favourites_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: discounts
CREATE TABLE IF NOT EXISTS `discounts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `type` ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `apply_to` ENUM('product','category','all') NOT NULL DEFAULT 'product',
  `target_id` INT NULL DEFAULT NULL,
  `starts_at` DATETIME NULL DEFAULT NULL,
  `ends_at` DATETIME NULL DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_discounts_active` (`active`),
  KEY `idx_discounts_target` (`apply_to`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- View: active discounts
CREATE OR REPLACE VIEW `v_active_discounts` AS
SELECT * FROM discounts
WHERE active = 1
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (ends_at IS NULL OR ends_at >= NOW());
