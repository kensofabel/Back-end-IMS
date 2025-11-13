-- POS features schema: favorites and discounts
-- Run this file against your `black_basket_db` database (for example via phpMyAdmin or mysql CLI).

-- Table: favourites
-- Stores per-user favorite products (optional user_id). If you don't need user-scoped favorites,
-- you can ignore the user_id column and mark favorites globally by product_id only.
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

-- Optional: if you have a users table and want FK for user_id, add constraint (safe to skip if users may not exist):
-- ALTER TABLE `favourites` ADD CONSTRAINT `fk_favourites_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;


-- Table: discounts
-- Define discounts that can be applied to products or categories. This is flexible — adjust fields to suit
-- whether you want percentage or fixed discounts, time windows, or per-product overrides.
CREATE TABLE IF NOT EXISTS `discounts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `type` ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `value` DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- if percentage, store 10.00 for 10%; if fixed, currency amount
  `apply_to` ENUM('product','category','all') NOT NULL DEFAULT 'product',
  `target_id` INT NULL DEFAULT NULL, -- product_id or category_id depending on apply_to; NULL = applies to all
  `starts_at` DATETIME NULL DEFAULT NULL,
  `ends_at` DATETIME NULL DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_discounts_active` (`active`),
  KEY `idx_discounts_target` (`apply_to`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Example: link a discount to a product via target_id
-- You can enforce a FK when using product targets if you want:
-- ALTER TABLE `discounts` ADD CONSTRAINT `fk_discounts_product` FOREIGN KEY (`target_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

-- Notes:
-- - For percentage discounts: use type='percentage' and value like 10.00 for 10%.
-- - For fixed discounts: use type='fixed' and value as currency (e.g., 25.00 to reduce price by 25.00).
-- - When apply_to='category', target_id should reference categories.id (you can add a FK similarly).
-- - If you want the POS to show "Discount" view, you can query active discounts and list products that match the discount rules.

-- Optional helper view: active discounts only
CREATE OR REPLACE VIEW `v_active_discounts` AS
SELECT * FROM discounts
WHERE active = 1
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (ends_at IS NULL OR ends_at >= NOW());

/* End of file */
