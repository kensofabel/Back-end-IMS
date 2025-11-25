-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 26, 2025 at 12:52 AM
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

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `details` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
(198, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 20:06:51'),
(199, 5, 'Added an Item', 'Blue T-Shirt (BT-001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 20:07:01'),
(200, 5, 'Added an Item', 'asffas (10000)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 20:10:38'),
(201, 5, 'Created an Item', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 20:10:50'),
(202, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 20:34:35'),
(203, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 00:57:21'),
(204, 5, 'Added an Item', 'asffasfas (10002)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 00:57:39'),
(205, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 00:57:48'),
(206, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 01:46:12'),
(207, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 01:46:24'),
(208, 5, 'Item Edited', 'asffasfas (10002)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 01:46:38'),
(209, 5, 'Item Edited', 'asffasfas (10002)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 01:46:38'),
(210, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 01:46:43'),
(211, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 01:46:55'),
(212, 5, 'Item Edited', 'Blue T-Shirt (BT-001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 09:56:48'),
(213, 5, 'Item Edited', 'Blue T-Shirt (BT-001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 09:57:11'),
(214, 5, 'Item Edited', 'Blue T-Shirt (BT-001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 09:57:11'),
(215, 5, 'Added an Item', 'circle (10003)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:07:09'),
(216, 5, 'Added an Item', 'sqaure (10004)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:07:23'),
(217, 5, 'Added an Item', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:07:39'),
(218, 5, 'Added an Item', 'dia (10006)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:07:53'),
(219, 5, 'Added an Item', 'star (10007)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:08:03'),
(220, 5, 'Added an Item', 'hexa (10008)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:08:13'),
(221, 5, 'Item Edited', 'circle (10003)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:09:53'),
(222, 5, 'Added an Item', 'image (10009)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:12:00'),
(223, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:23:15'),
(224, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:26:34'),
(225, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:27:02'),
(226, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:27:17'),
(227, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:27:17'),
(228, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:27:29'),
(229, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:31:33'),
(230, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:36:51'),
(231, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:37:24'),
(232, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:43:47'),
(233, 5, 'Variant Added', 'variant2 (10010) to variantss (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:47:37'),
(234, 5, 'Variant Added', 'varri23 (10011) to variantss (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:47:37'),
(235, 5, 'Added an Item', 'variantss (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 10:47:37'),
(236, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 12:40:32'),
(237, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 12:40:32'),
(238, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 12:40:32'),
(239, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 12:40:52'),
(240, 5, 'Quantity Added', 'Added (1) to (10003)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 12:45:46'),
(241, 5, 'Quantity Added', 'Added (1) to (10003)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 12:46:06'),
(242, 5, 'Quantity Reduced', 'Waste (1) from (10003)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 12:46:31'),
(243, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 14:33:12'),
(244, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:09:34'),
(245, 5, 'Item Edited', 'compose (10001)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:10:03'),
(246, 5, 'Variant Edited', 'variant2 (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:13:10'),
(247, 5, 'Variant Edited', 'varri23 (10011)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:13:10'),
(248, 5, 'Variant Added', '213123 (10012) to parent id 264', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:13:10'),
(249, 5, 'Variant Added', '123123 (10013) to parent id 264', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:13:10'),
(250, 5, 'Item Edited', 'variantss (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:13:10'),
(251, 5, 'Variant Added', '241242 (10014) to sfafa (10014)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:14:32'),
(252, 5, 'Added an Item', 'sfafa (10014)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:14:32'),
(253, 5, 'Item Edited', 'asffas (10000)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:49:19'),
(254, 5, 'Variant Deleted', 'Variant ID 58 from product 264', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:55:53'),
(255, 5, 'Variant Deleted', 'Variant ID 57 from product 264', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:55:53'),
(256, 5, 'Variant Deleted', 'Variant ID 58 from product 264', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:55:53'),
(257, 5, 'Variant Deleted', 'Variant ID 57 from product 264', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:55:53'),
(258, 5, 'Variant Edited', 'variant2 (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:55:53'),
(259, 5, 'Variant Edited', 'varri23 (10011)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:55:53'),
(260, 5, 'Item Edited', 'variantss (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:55:53'),
(261, 5, 'Variant Edited', 'variant2 (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:56:21'),
(262, 5, 'Variant Edited', 'varri23 (10011)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:56:21'),
(263, 5, 'Item Edited', 'variantss (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:56:21'),
(264, 5, 'Variant Edited', 'variant2 (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:56:47'),
(265, 5, 'Variant Edited', 'varri23 (10011)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:56:47'),
(266, 5, 'Item Edited', 'variantss (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:56:47'),
(267, 5, 'Variant Edited', 'variant2 (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:58:40'),
(268, 5, 'Variant Edited', 'varri23 (10011)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:58:40'),
(269, 5, 'Variant Added', 'safasf (10012) to parent id 264', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:58:40'),
(270, 5, 'Item Edited', 'variantss (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:58:40'),
(271, 5, 'Variant Deleted', 'Variant ID 60 from product 264', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:58:56'),
(272, 5, 'Variant Deleted', 'Variant ID 60 from product 264', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:58:56'),
(273, 5, 'Variant Edited', 'variant2 (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:58:56'),
(274, 5, 'Variant Edited', 'varri23 (10011)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:58:56'),
(275, 5, 'Item Edited', 'variantss (10010)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 16:58:56'),
(276, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 19:25:19'),
(277, 5, 'Item Edited', 'image (10009)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 19:25:42'),
(278, 5, 'Item Edited', 'image (10009)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 19:27:14'),
(279, 5, 'Item Edited', 'image (10009)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 19:27:24'),
(280, 5, 'Item Edited', 'image (10009)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 19:27:42'),
(281, 5, 'Item Edited', 'image (10009)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 19:28:02'),
(282, 5, 'Item Edited', 'image (10009)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 19:28:17'),
(283, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 20:09:34'),
(284, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 20:09:50'),
(285, 5, 'Item Edited', 'triangle (10005)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 20:14:33'),
(286, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 22:24:02'),
(287, 5, 'Item Edited', 'asffas (10000)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-18 22:34:45'),
(288, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-20 11:53:13'),
(289, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-22 18:13:40'),
(290, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-23 09:26:57'),
(291, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 06:36:43'),
(292, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 06:36:49'),
(293, 5, 'Added an Item', 'BUNS (10012)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:06:06'),
(294, 5, 'Added an Item', 'CLASSIC CHICKEN IN BOX (10013)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:14:49'),
(295, 5, 'Added an Item', 'Rice (10015)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:15:43'),
(296, 5, 'Added an Item', 'Chciken Clamshell (10016)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:16:54'),
(297, 5, 'Item Edited', 'Rice (10015)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:17:30'),
(298, 5, 'Added an Item', 'Gravy Pack (10017)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:18:40'),
(299, 5, 'Added an Item', 'Water (10018)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:19:19'),
(300, 5, 'Created an Item', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:21:39'),
(301, 5, 'Added an Item', 'Utensils (10020)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:22:50'),
(302, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:23:27'),
(303, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:23:27'),
(304, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:23:27'),
(305, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:23:27'),
(306, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:23:27'),
(307, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:23:27'),
(308, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:23:27'),
(309, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:23:35'),
(310, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:24:09'),
(311, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:24:18'),
(312, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:29:37'),
(313, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:29:37'),
(314, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:29:37'),
(315, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:29:37'),
(316, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 07:29:37'),
(317, 5, 'Created an Item', 'WHAHAHA (10021)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 08:02:55'),
(318, 5, 'Item Edited', 'WHAHAHA (10021)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 08:05:43'),
(319, 5, 'Item Edited', 'Gravy (10019)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 08:11:38'),
(320, 5, 'Created an Item', 'TRIALSAFAFSA (10022)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 10:35:31'),
(321, 5, 'Created an Item', 'FRACTION (10023)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 10:36:24'),
(322, 5, 'Item Edited', 'FRACTION (10023)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 10:37:22'),
(323, 5, 'Item Edited', 'FRACTION (10023)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 10:52:11'),
(324, 5, 'Created an Item', 'TRIALS (10024)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:01:24'),
(325, 5, 'Created an Item', 'freeze (10025)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:39:28'),
(326, 5, 'Item Edited', 'freeze (10025)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:40:30'),
(327, 5, 'Item Edited', 'freeze (10025)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:40:56'),
(328, 5, 'Item Edited', 'freeze (10025)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:40:56'),
(329, 5, 'Created an Item', 'another freeze (10026)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:47:42'),
(330, 5, 'Item Edited', 'freeze (10025)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:48:59'),
(331, 5, 'Item Edited', 'freeze (10025)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:49:00'),
(332, 5, 'Item Edited', 'freeze (10025)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:49:00'),
(333, 5, 'Item Edited', 'freeze (10025)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:49:19'),
(334, 5, 'Created an Item', 'fixed (10027)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:50:46'),
(335, 5, 'Created an Item', 'PAG ITO (10028)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 11:58:39'),
(336, 5, 'Item Edited', 'freeze (10025)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 12:41:09'),
(337, 5, 'Created an Item', 'composites (10029)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 13:03:02'),
(338, 5, 'Item Edited', 'composites (10029)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 13:29:26'),
(339, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 23:33:11'),
(340, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-25 23:33:15');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `owner_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_at`, `owner_id`) VALUES
(9, 'No Category', '2025-11-17 20:06:53', NULL),
(10, 'Apparel', '2025-11-17 20:07:01', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `discounts`
--

CREATE TABLE `discounts` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `type` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `apply_to` enum('product','category','all') NOT NULL DEFAULT 'product',
  `target_id` int(11) DEFAULT NULL,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favourites`
--

CREATE TABLE `favourites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favourites`
--

INSERT INTO `favourites` (`id`, `user_id`, `product_id`, `created_at`) VALUES
(5, 5, 254, '2025-11-18 19:20:04');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(32) DEFAULT NULL,
  `cart_mode` varchar(16) NOT NULL DEFAULT 'dinein',
  `employee_id` int(11) DEFAULT NULL,
  `status` varchar(24) NOT NULL DEFAULT 'open',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `reference`, `subtotal`, `tax`, `total_amount`, `payment_method`, `cart_mode`, `employee_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'save', 222.00, 26.64, 248.64, 'cash', 'dinein', NULL, 'open', '2025-11-22 19:35:29', '2025-11-23 14:04:25'),
(2, NULL, 222.00, 26.64, 248.64, 'cash', 'dinein', NULL, 'open', '2025-11-23 09:30:35', '2025-11-23 14:04:25'),
(3, NULL, 245.00, 29.40, 274.40, 'cash', 'dinein', 5, 'open', '2025-11-23 10:28:36', '2025-11-23 14:04:25'),
(4, NULL, 245.00, 29.40, 274.40, 'cash', 'dinein', NULL, 'open', '2025-11-23 11:17:59', '2025-11-23 14:04:25'),
(5, NULL, 245.00, 29.40, 274.40, 'cash', 'dinein', NULL, 'open', '2025-11-23 11:23:06', '2025-11-23 14:04:25'),
(7, 'asfsa', 222.00, 26.64, 248.64, 'cash', 'dinein', 5, 'open', '2025-11-23 11:36:40', '2025-11-23 14:04:25'),
(8, NULL, 222.00, 26.64, 248.64, 'cash', 'dinein', 5, 'open', '2025-11-23 11:55:39', '2025-11-23 14:04:25'),
(9, NULL, 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-23 13:36:07', '2025-11-23 14:04:25'),
(10, NULL, 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-23 13:51:35', '2025-11-23 14:04:25'),
(11, NULL, 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-23 13:52:43', '2025-11-23 14:04:25'),
(12, NULL, 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-23 13:52:52', '2025-11-23 14:04:25'),
(13, NULL, 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-23 13:53:07', '2025-11-23 14:04:25'),
(14, NULL, 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-23 13:53:11', '2025-11-23 14:04:25'),
(15, NULL, 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-23 13:56:10', '2025-11-23 14:04:25'),
(16, NULL, 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-23 13:56:16', '2025-11-23 14:04:25'),
(17, 'Orders #17', 199.00, 23.88, 222.88, 'card', 'dinein', 5, 'open', '2025-11-23 13:56:21', '2025-11-23 23:17:18'),
(18, 'this', 597.00, 71.64, 668.64, 'card', 'dinein', 5, 'open', '2025-11-23 23:18:34', '2025-11-23 23:18:34'),
(19, 'dine in', 995.00, 119.40, 1114.40, 'card', 'dinein', 5, 'open', '2025-11-23 23:19:07', '2025-11-24 21:17:49'),
(21, NULL, 398.00, 47.76, 445.76, 'online', 'dinein', 5, 'open', '2025-11-23 23:25:30', '2025-11-23 23:25:30'),
(22, NULL, 398.00, 47.76, 445.76, 'card', 'dinein', 5, 'open', '2025-11-23 23:25:30', '2025-11-23 23:27:58'),
(23, NULL, 398.00, 47.76, 445.76, 'card', 'dinein', 5, 'open', '2025-11-23 23:29:38', '2025-11-23 23:29:38'),
(24, NULL, 398.00, 47.76, 445.76, 'cash', 'dinein', 5, 'open', '2025-11-23 23:29:38', '2025-11-24 00:48:57'),
(26, 'del', 398.00, 47.76, 445.76, 'card', 'dinein', 5, 'open', '2025-11-24 00:56:14', '2025-11-24 02:14:41'),
(27, 'current', 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-24 02:28:31', '2025-11-24 02:28:41'),
(28, 'MERGEE', 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-24 02:35:48', '2025-11-24 04:01:24'),
(31, 'merging 2', 92.00, 11.04, 103.04, 'cash', 'dinein', 5, 'open', '2025-11-24 09:05:35', '2025-11-24 10:00:21'),
(32, NULL, 455.00, 54.60, 509.60, 'cash', 'dinein', 5, 'open', '2025-11-24 20:26:37', '2025-11-24 21:03:38'),
(33, 'This one', 677.00, 81.24, 758.24, 'cash', 'dinein', 5, 'open', '2025-11-24 20:37:10', '2025-11-24 20:56:50'),
(34, 'WHAHHAA', 222.00, 26.64, 248.64, 'cash', 'dinein', 5, 'open', '2025-11-24 20:40:55', '2025-11-24 20:40:55'),
(35, NULL, 222.00, 26.64, 248.64, 'cash', 'dinein', 5, 'open', '2025-11-24 20:42:53', '2025-11-24 20:42:53'),
(37, 'LOAD', 876.00, 105.12, 981.12, 'cash', 'dinein', 5, 'open', '2025-11-24 20:52:31', '2025-11-24 20:55:45'),
(39, 'MERGE 23', 455.00, 54.60, 509.60, 'cash', 'dinein', 5, 'open', '2025-11-24 20:57:01', '2025-11-24 20:57:35'),
(41, 'SPLITTS', 910.00, 109.20, 1019.20, 'cash', 'dinein', 5, 'open', '2025-11-24 20:58:24', '2025-11-24 21:57:14'),
(43, 'merge trial 1', 199.00, 23.88, 222.88, 'cash', 'dinein', 5, 'open', '2025-11-24 21:20:31', '2025-11-24 21:54:11'),
(45, NULL, 233.00, 27.96, 260.96, 'cash', 'dinein', 5, 'open', '2025-11-24 21:28:18', '2025-11-24 21:28:18'),
(46, NULL, 233.00, 27.96, 260.96, 'cash', 'dinein', 5, 'open', '2025-11-24 21:29:07', '2025-11-24 21:29:07'),
(47, NULL, 0.00, 0.00, 0.00, 'cash', 'dinein', 5, 'open', '2025-11-24 21:37:36', '2025-11-24 21:37:36'),
(48, 'merge trial 1 - 1', 0.00, 0.00, 0.00, 'cash', 'dinein', 5, 'open', '2025-11-24 21:54:11', '2025-11-24 21:54:11');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `variant` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `name`, `unit_price`, `quantity`, `variant`) VALUES
(1, 1, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(2, 1, 259, 'triangle', 23.00, 1, NULL),
(3, 2, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(4, 2, 259, 'triangle', 23.00, 1, NULL),
(5, 3, 254, 'asffas', 23.00, 2, NULL),
(6, 3, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(7, 3, 258, 'sqaure', 0.00, 1, NULL),
(8, 4, 254, 'asffas', 23.00, 2, NULL),
(9, 4, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(10, 4, 258, 'sqaure', 0.00, 1, NULL),
(11, 5, 254, 'asffas', 23.00, 2, NULL),
(12, 5, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(13, 5, 258, 'sqaure', 0.00, 1, NULL),
(16, 7, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(17, 7, 254, 'asffas', 23.00, 1, NULL),
(18, 7, 255, 'compose', 0.00, 1, NULL),
(19, 8, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(20, 8, 254, 'asffas', 23.00, 1, NULL),
(21, 8, 255, 'compose', 0.00, 1, NULL),
(22, 9, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(23, 10, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(24, 11, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(25, 12, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(26, 13, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(27, 14, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(28, 15, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(29, 16, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(39, 17, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(40, 17, 256, 'asffasfas', 0.00, 1, NULL),
(41, 18, 253, 'Blue T-Shirt', 199.00, 3, NULL),
(42, 18, 257, 'circle', 0.00, 1, NULL),
(43, 19, 253, 'Blue T-Shirt', 199.00, 5, NULL),
(49, 21, 253, 'Blue T-Shirt', 199.00, 2, NULL),
(50, 21, 258, 'sqaure', 0.00, 1, NULL),
(57, 22, 253, 'Blue T-Shirt', 199.00, 2, NULL),
(58, 22, 258, 'sqaure', 0.00, 1, NULL),
(59, 23, 253, 'Blue T-Shirt', 199.00, 2, NULL),
(92, 24, 253, 'Blue T-Shirt', 199.00, 2, NULL),
(96, 26, 253, 'Blue T-Shirt', 199.00, 2, NULL),
(97, 26, 258, 'sqaure', 0.00, 1, NULL),
(100, 26, 257, 'circle', 0.00, 1, ''),
(103, 27, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(104, 27, 258, 'sqaure', 0.00, 1, NULL),
(127, 28, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(128, 28, 258, 'sqaure', 0.00, 1, NULL),
(133, 31, 254, 'asffas', 23.00, 3, NULL),
(134, 31, 259, 'triangle', 23.00, 1, NULL),
(167, 34, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(168, 34, 254, 'asffas', 23.00, 1, NULL),
(169, 34, 255, 'compose', 0.00, 1, NULL),
(170, 34, 260, 'dia', 0.00, 1, NULL),
(174, 35, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(175, 35, 254, 'asffas', 23.00, 1, NULL),
(176, 35, 255, 'compose', 0.00, 1, NULL),
(177, 35, 256, 'asffasfas', 0.00, 1, NULL),
(232, 37, 253, 'Blue T-Shirt', 199.00, 3, NULL),
(233, 37, 254, 'asffas', 23.00, 2, NULL),
(234, 37, 255, 'compose', 0.00, 2, NULL),
(235, 37, 261, 'star', 0.00, 2, NULL),
(236, 37, 260, 'dia', 0.00, 1, NULL),
(237, 37, 59, 'sfafa', 0.00, 1, '241242'),
(238, 37, 261, 'star', 0.00, 1, NULL),
(239, 37, 263, 'image', 233.00, 1, NULL),
(240, 37, 257, 'circle', 0.00, 1, ''),
(255, 33, 253, 'Blue T-Shirt', 199.00, 2, NULL),
(256, 33, 254, 'asffas', 23.00, 1, NULL),
(257, 33, 255, 'compose', 0.00, 2, NULL),
(258, 33, 256, 'asffasfas', 0.00, 2, NULL),
(259, 33, 258, 'sqaure', 0.00, 1, NULL),
(260, 33, 259, 'triangle', 23.00, 1, NULL),
(261, 33, 263, 'image', 233.00, 1, NULL),
(262, 39, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(267, 39, 254, 'asffas', 23.00, 1, ''),
(268, 39, 263, 'image', 233.00, 1, ''),
(281, 32, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(282, 32, 254, 'asffas', 23.00, 1, NULL),
(283, 32, 255, 'compose', 0.00, 1, NULL),
(284, 32, 263, 'image', 233.00, 1, NULL),
(285, 32, 262, 'hexa', 0.00, 1, NULL),
(335, 45, 263, 'image', 233.00, 1, NULL),
(342, 46, 263, 'image', 233.00, 1, NULL),
(348, 47, 256, 'asffasfas', 0.00, 1, NULL),
(365, 43, 253, 'Blue T-Shirt', 199.00, 1, NULL),
(366, 48, 256, 'asffasfas', 0.00, 1, NULL),
(367, 41, 253, 'Blue T-Shirt', 199.00, 2, NULL),
(368, 41, 254, 'asffas', 23.00, 2, NULL),
(369, 41, 255, 'compose', 0.00, 1, NULL),
(370, 41, 59, 'sfafa', 0.00, 1, '241242'),
(371, 41, 263, 'image', 233.00, 2, NULL),
(372, 41, 256, 'asffasfas', 0.00, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(2, 'Inventory Management', 'View and manage inventory'),
(3, 'Add Products', 'Add new products to inventory'),
(4, 'Edit Products', 'Edit existing products'),
(5, 'Delete Products', 'Delete products from inventory'),
(6, 'POS', 'Process sales transactions'),
(7, 'View Sales Report', 'Access sales reports'),
(8, 'View Inventory Report', 'Access inventory reports'),
(9, 'Manage Roles', 'Create and manage user roles'),
(10, 'Set Permissions', 'Assign permissions to roles'),
(11, 'Employee Management', 'Manage employee accounts'),
(12, 'Audit Logs Access', 'View system audit logs'),
(13, 'Payment Report', 'Access payment reports');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `price` varchar(20) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `track_stock` tinyint(1) DEFAULT 0,
  `in_stock` varchar(20) DEFAULT NULL,
  `low_stock` varchar(20) DEFAULT NULL,
  `pos_available` tinyint(1) DEFAULT 1,
  `type` enum('color_shape','image') DEFAULT 'color_shape',
  `is_composite` tinyint(1) NOT NULL DEFAULT 0,
  `color` varchar(20) DEFAULT NULL,
  `shape` varchar(50) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `owner_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `category_id`, `price`, `cost`, `sku`, `barcode`, `track_stock`, `in_stock`, `low_stock`, `pos_available`, `type`, `is_composite`, `color`, `shape`, `image_url`, `created_at`, `owner_id`, `created_by`, `updated_by`, `updated_at`) VALUES
(253, 'Blue T-Shirt', 10, '199', 100.00, 'BT-001', '1234567890123', 1, '40', '2', 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-17 20:07:01', 5, NULL, NULL, '2025-11-26 06:03:44'),
(254, 'asffas', 9, '23', 0.00, '10000', '', 1, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-17 20:10:38', 5, NULL, NULL, '2025-11-18 22:34:45'),
(255, 'compose', 9, 'variable', 20.00, '10001', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-17 20:10:50', 5, NULL, NULL, '2025-11-18 16:09:34'),
(256, 'asffasfas', 9, 'variable', 20.00, '10002', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-18 00:57:39', 5, NULL, NULL, '2025-11-18 01:46:38'),
(257, 'circle', 9, 'variable', 0.00, '10003', '', 1, '1', '0', 1, 'color_shape', 0, 'red', 'circle', '', '2025-11-18 10:07:09', 5, NULL, NULL, '2025-11-18 12:46:31'),
(258, 'sqaure', 9, 'variable', 0.00, '10004', '', 0, NULL, NULL, 1, 'color_shape', 0, 'orange', 'square', '', '2025-11-18 10:07:23', 5, NULL, NULL, '2025-11-18 10:07:23'),
(259, 'triangle', 9, '23', 0.00, '10005', '', 1, NULL, NULL, 1, 'color_shape', 0, 'yellow', 'triangle', '', '2025-11-18 10:07:39', 5, NULL, NULL, '2025-11-18 20:14:33'),
(260, 'dia', 9, 'variable', 0.00, '10006', '', 0, NULL, NULL, 1, 'color_shape', 0, 'green', 'diamond', '', '2025-11-18 10:07:53', 5, NULL, NULL, '2025-11-18 10:07:53'),
(261, 'star', 9, 'variable', 0.00, '10007', '', 0, NULL, NULL, 1, 'color_shape', 0, 'blue', 'star', '', '2025-11-18 10:08:03', 5, NULL, NULL, '2025-11-18 10:08:03'),
(262, 'hexa', 9, 'variable', 0.00, '10008', '', 0, NULL, NULL, 1, 'color_shape', 0, 'purple', 'hexagon', '', '2025-11-18 10:08:13', 5, NULL, NULL, '2025-11-18 10:08:13'),
(263, 'image', 9, '233', 0.00, '10009', '', 1, NULL, NULL, 1, 'image', 0, '', '', 'upload/items/1763465297_960464204ac1.png', '2025-11-18 10:12:00', 5, NULL, NULL, '2025-11-18 19:28:17'),
(264, 'variantss', 9, 'variable', 0.00, '10010', '', 1, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-18 10:47:37', 5, NULL, NULL, '2025-11-18 16:13:10'),
(265, 'sfafa', 9, 'variable', 0.00, '10014', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-18 16:14:32', 5, NULL, NULL, '2025-11-18 16:14:32'),
(266, 'BUNS', 9, '10', 0.00, '10012', '', 1, '30', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-25 07:06:06', 5, NULL, NULL, '2025-11-25 07:06:06'),
(267, 'CLASSIC CHICKEN IN BOX', 9, 'variable', 600.00, '10013', '', 0, NULL, NULL, 0, 'color_shape', 0, '', '', '', '2025-11-25 07:14:49', 5, NULL, NULL, '2025-11-25 07:14:49'),
(268, 'Rice', 9, 'variable', 100.00, '10015', '', 1, '2 kg', NULL, 0, 'color_shape', 0, '', '', '', '2025-11-25 07:15:43', 5, NULL, NULL, '2025-11-25 07:17:30'),
(269, 'Chciken Clamshell', 9, 'variable', 50.00, '10016', '', 1, '120 pcs', NULL, 0, 'color_shape', 0, '', '', '', '2025-11-25 07:16:54', 5, NULL, NULL, '2025-11-25 07:16:54'),
(270, 'Gravy Pack', 9, 'variable', 25.00, '10017', '', 1, '1', NULL, 0, 'color_shape', 0, '', '', '', '2025-11-25 07:18:40', 5, NULL, NULL, '2025-11-25 07:18:40'),
(271, 'Water', 9, 'variable', 0.00, '10018', '', 0, NULL, NULL, 0, 'color_shape', 0, '', '', '', '2025-11-25 07:19:19', 5, NULL, NULL, '2025-11-25 07:19:19'),
(272, 'Gravy', 9, '2', 0.75, '10019', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 07:21:39', 5, NULL, NULL, '2025-11-25 08:11:38'),
(273, 'Utensils', 9, 'variable', 20.00, '10020', '', 1, '200 pcs', NULL, 0, 'color_shape', 0, '', '', '', '2025-11-25 07:22:50', 5, NULL, NULL, '2025-11-25 07:22:50'),
(274, 'WHAHAHA', 9, 'variable', 0.00, '10021', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 08:02:55', 5, NULL, NULL, '2025-11-25 08:05:43'),
(275, 'TRIALSAFAFSA', 9, 'variable', 60.00, '10022', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 10:35:31', 5, NULL, NULL, '2025-11-25 10:35:31'),
(276, 'FRACTION', 9, 'variable', 5.00, '10023', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 10:36:24', 5, NULL, NULL, '2025-11-25 10:52:11'),
(277, 'TRIALS', 9, 'variable', 120.00, '10024', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 11:01:24', 5, NULL, NULL, '2025-11-25 11:01:24'),
(278, 'freeze', 9, 'variable', 525.00, '10025', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 11:39:28', 5, NULL, NULL, '2025-11-25 12:41:09'),
(279, 'another freeze', 9, 'variable', 40.00, '10026', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 11:47:42', 5, NULL, NULL, '2025-11-25 11:47:42'),
(280, 'fixed', 9, 'variable', 60.00, '10027', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 11:50:46', 5, NULL, NULL, '2025-11-25 11:50:46'),
(281, 'PAG ITO', 9, 'variable', 3.33, '10028', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 11:58:39', 5, NULL, NULL, '2025-11-25 11:58:39'),
(282, 'composites', 9, '500', 100.00, '10029', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-25 13:02:53', 5, NULL, NULL, '2025-11-25 13:29:26');

-- --------------------------------------------------------

--
-- Table structure for table `product_components`
--

CREATE TABLE `product_components` (
  `id` int(11) NOT NULL,
  `parent_product_id` int(11) NOT NULL,
  `component_variant_id` int(11) DEFAULT NULL,
  `component_product_id` int(11) DEFAULT NULL,
  `component_qty` varchar(64) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_components`
--

INSERT INTO `product_components` (`id`, `parent_product_id`, `component_variant_id`, `component_product_id`, `component_qty`, `created_at`) VALUES
(2, 255, NULL, 254, '1.00', '2025-11-17 20:10:50'),
(4, 255, NULL, 256, '1.00', '2025-11-18 01:46:43'),
(5, 255, NULL, 259, '1.00', '2025-11-18 16:10:03'),
(6, 255, NULL, 262, '1.00', '2025-11-18 16:10:03'),
(7, 272, NULL, 270, '0.03', '2025-11-25 07:21:39'),
(8, 272, NULL, 271, '0.66', '2025-11-25 07:21:39'),
(10, 274, NULL, 256, '0.00', '2025-11-25 08:02:55'),
(11, 274, NULL, 254, '1.00', '2025-11-25 08:02:55'),
(12, 275, NULL, 256, '1.00', '2025-11-25 10:35:31'),
(13, 275, NULL, 256, '2.00', '2025-11-25 10:35:31'),
(15, 276, NULL, 256, '0.25', '2025-11-25 10:36:24'),
(16, 277, NULL, 256, '1.00', '2025-11-25 11:01:24'),
(17, 277, NULL, 253, '1.00', '2025-11-25 11:01:24'),
(18, 278, NULL, 266, '1/4', '2025-11-25 11:39:28'),
(19, 278, NULL, 269, '2 1/2', '2025-11-25 11:39:28'),
(20, 279, NULL, 256, '1', '2025-11-25 11:47:42'),
(21, 279, NULL, 256, '1', '2025-11-25 11:47:42'),
(24, 280, NULL, 256, '1', '2025-11-25 11:50:46'),
(25, 280, NULL, 279, '1', '2025-11-25 11:50:46'),
(26, 281, NULL, 254, '1/7', '2025-11-25 11:58:39'),
(27, 281, NULL, 255, '1/6', '2025-11-25 11:58:39'),
(28, 282, NULL, 269, '2', '2025-11-25 13:02:54'),
(29, 282, NULL, 266, '2', '2025-11-25 13:02:59');

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `price` varchar(20) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `is_composite` tinyint(1) NOT NULL DEFAULT 0,
  `in_stock` varchar(20) DEFAULT NULL,
  `low_stock` varchar(20) DEFAULT NULL,
  `pos_available` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `name`, `sku`, `barcode`, `price`, `cost`, `is_composite`, `in_stock`, `low_stock`, `pos_available`, `created_at`) VALUES
(55, 264, 'variant2', '10010', '', '23', 0.00, 0, '9', '1', 1, '2025-11-18 10:47:37'),
(56, 264, 'varri23', '10011', '', 'variable', 0.00, 0, '3', '4', 1, '2025-11-18 10:47:37'),
(59, 265, '241242', '10014', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-18 16:14:32');

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

INSERT INTO `roles` (`id`, `owner_id`, `name`, `description`, `status`) VALUES
(11, 5, 'Admin', 'Admin role with elevated permissions', 'active'),
(12, 5, 'Staff', 'Staff role with limited permissions', 'active'),
(38, 5, 'Owner', 'Full access to all features', 'active');

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

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(11, 1),
(11, 2),
(11, 3),
(11, 4),
(11, 5),
(11, 6),
(11, 7),
(11, 8),
(11, 11),
(12, 1),
(12, 2),
(12, 6),
(38, 1),
(38, 2),
(38, 3),
(38, 4),
(38, 5),
(38, 6),
(38, 7),
(38, 8),
(38, 9),
(38, 10),
(38, 11),
(38, 12),
(38, 13);

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` int(10) UNSIGNED NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(32) DEFAULT NULL,
  `cart_mode` varchar(16) NOT NULL DEFAULT 'dinein',
  `employee_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `reference`, `customer_name`, `subtotal`, `tax`, `total_amount`, `payment_method`, `cart_mode`, `employee_id`, `created_at`, `updated_at`) VALUES
(1, 'SPLITTS', NULL, 910.00, 109.20, 1019.20, 'online', 'delivery', 5, '2025-11-25 06:46:18', '2025-11-25 06:46:18'),
(2, NULL, NULL, 199.00, 23.88, 222.88, 'cash', 'delivery', 5, '2025-11-25 12:55:31', '2025-11-25 12:55:31'),
(3, NULL, NULL, 0.00, 0.00, 0.00, 'cash', 'delivery', 5, '2025-11-25 12:56:02', '2025-11-25 12:56:02'),
(4, NULL, NULL, 0.00, 0.00, 0.00, 'cash', 'delivery', 5, '2025-11-25 13:03:18', '2025-11-25 13:03:18'),
(5, NULL, NULL, 0.00, 0.00, 0.00, 'cash', 'delivery', 5, '2025-11-25 13:10:52', '2025-11-25 13:10:52'),
(6, NULL, NULL, 0.00, 0.00, 0.00, 'cash', 'delivery', 5, '2025-11-25 13:11:58', '2025-11-25 13:11:58'),
(7, NULL, NULL, 597.00, 71.64, 668.64, 'cash', 'delivery', 5, '2025-11-25 13:16:49', '2025-11-25 13:16:49'),
(8, NULL, NULL, 0.00, 0.00, 0.00, 'cash', 'delivery', 5, '2025-11-25 13:17:20', '2025-11-25 13:17:20'),
(9, NULL, NULL, 0.00, 0.00, 0.00, 'cash', 'delivery', 5, '2025-11-25 13:19:34', '2025-11-25 13:19:34'),
(10, NULL, NULL, 0.00, 0.00, 0.00, 'cash', 'delivery', 5, '2025-11-25 13:29:00', '2025-11-25 13:29:00'),
(11, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 13:29:36', '2025-11-25 13:29:36'),
(12, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 13:30:29', '2025-11-25 13:30:29'),
(13, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 13:37:40', '2025-11-25 13:37:40'),
(14, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 13:41:33', '2025-11-25 13:41:33'),
(15, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 13:51:13', '2025-11-25 13:51:13'),
(16, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 13:54:08', '2025-11-25 13:54:08'),
(17, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 13:57:16', '2025-11-25 13:57:16'),
(18, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 13:58:58', '2025-11-25 13:58:58'),
(19, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 14:22:12', '2025-11-25 14:22:12'),
(20, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-25 14:37:17', '2025-11-25 14:37:17'),
(21, NULL, NULL, 199.00, 23.88, 222.88, 'cash', 'delivery', 5, '2025-11-25 23:36:31', '2025-11-25 23:36:31'),
(22, NULL, NULL, 199.00, 23.88, 222.88, 'cash', 'delivery', 5, '2025-11-25 23:36:40', '2025-11-25 23:36:40'),
(23, NULL, NULL, 199.00, 23.88, 222.88, 'cash', 'delivery', 5, '2025-11-25 23:36:50', '2025-11-25 23:36:50'),
(24, NULL, NULL, 23.00, 2.76, 25.76, 'cash', 'delivery', 5, '2025-11-25 23:37:38', '2025-11-25 23:37:38'),
(25, NULL, NULL, 23.00, 2.76, 25.76, 'cash', 'delivery', 5, '2025-11-26 05:55:10', '2025-11-26 05:55:10'),
(26, NULL, NULL, 23.00, 2.76, 25.76, 'cash', 'delivery', 5, '2025-11-26 05:58:35', '2025-11-26 05:58:35'),
(27, NULL, NULL, 23.00, 2.76, 25.76, 'cash', 'delivery', 5, '2025-11-26 06:01:25', '2025-11-26 06:01:25'),
(28, NULL, NULL, 23.00, 2.76, 25.76, 'cash', 'delivery', 5, '2025-11-26 06:02:52', '2025-11-26 06:02:52'),
(29, NULL, NULL, 199.00, 23.88, 222.88, 'cash', 'delivery', 5, '2025-11-26 06:03:44', '2025-11-26 06:03:44'),
(30, NULL, NULL, 23.00, 2.76, 25.76, 'cash', 'delivery', 5, '2025-11-26 06:09:51', '2025-11-26 06:09:51'),
(31, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-26 06:22:51', '2025-11-26 06:22:51'),
(32, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-26 07:00:23', '2025-11-26 07:00:23'),
(33, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-26 07:09:09', '2025-11-26 07:09:09'),
(34, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-26 07:10:51', '2025-11-26 07:10:51'),
(35, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-26 07:11:26', '2025-11-26 07:11:26'),
(36, NULL, NULL, 500.00, 60.00, 560.00, 'cash', 'delivery', 5, '2025-11-26 07:11:40', '2025-11-26 07:11:40');

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `sale_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `total_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `variant` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `variant_id`, `name`, `unit_price`, `quantity`, `total_price`, `variant`, `created_at`) VALUES
(1, 1, 253, NULL, 'Blue T-Shirt', 199.00, 2, 398.00, NULL, '2025-11-25 06:46:18'),
(2, 1, 254, NULL, 'asffas', 23.00, 2, 46.00, NULL, '2025-11-25 06:46:18'),
(3, 1, 255, NULL, 'compose', 0.00, 1, 0.00, NULL, '2025-11-25 06:46:18'),
(4, 1, 59, NULL, 'sfafa', 0.00, 1, 0.00, '241242', '2025-11-25 06:46:18'),
(5, 1, 263, NULL, 'image', 233.00, 2, 466.00, NULL, '2025-11-25 06:46:18'),
(6, 1, 256, NULL, 'asffasfas', 0.00, 1, 0.00, NULL, '2025-11-25 06:46:18'),
(7, 2, 253, NULL, 'Blue T-Shirt', 199.00, 1, 199.00, NULL, '2025-11-25 12:55:31'),
(8, 3, 278, NULL, 'freeze', 0.00, 1, 0.00, NULL, '2025-11-25 12:56:02'),
(9, 4, 282, NULL, 'composites', 0.00, 1, 0.00, NULL, '2025-11-25 13:03:18'),
(10, 5, 282, NULL, '0', 0.00, 1, 0.00, NULL, '2025-11-25 13:10:52'),
(11, 6, 278, NULL, '0', 0.00, 1, 0.00, NULL, '2025-11-25 13:11:58'),
(12, 7, 253, NULL, '0', 199.00, 3, 597.00, NULL, '2025-11-25 13:16:49'),
(13, 8, 282, NULL, '0', 0.00, 1, 0.00, NULL, '2025-11-25 13:17:20'),
(14, 9, 282, NULL, '0', 0.00, 1, 0.00, NULL, '2025-11-25 13:19:34'),
(15, 10, 282, NULL, '0', 0.00, 1, 0.00, NULL, '2025-11-25 13:29:00'),
(16, 11, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 13:29:36'),
(17, 12, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 13:30:29'),
(18, 13, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 13:37:40'),
(19, 14, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 13:41:33'),
(20, 15, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 13:51:13'),
(21, 16, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 13:54:08'),
(22, 17, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 13:57:16'),
(23, 18, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 13:58:58'),
(24, 19, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 14:22:12'),
(25, 20, 282, NULL, '0', 500.00, 1, 500.00, NULL, '2025-11-25 14:37:17'),
(26, 21, 253, NULL, 'Blue T-Shirt', 199.00, 1, 199.00, NULL, '2025-11-25 23:36:31'),
(27, 22, 253, NULL, 'Blue T-Shirt', 199.00, 1, 199.00, NULL, '2025-11-25 23:36:40'),
(28, 23, 253, NULL, 'Blue T-Shirt', 199.00, 1, 199.00, NULL, '2025-11-25 23:36:50'),
(29, 24, 55, NULL, 'variantss', 23.00, 1, 23.00, 'variant2', '2025-11-25 23:37:38'),
(30, 25, 55, NULL, 'variantss', 23.00, 1, 23.00, 'variant2', '2025-11-26 05:55:10'),
(31, 26, 55, NULL, 'variantss', 23.00, 1, 23.00, 'variant2', '2025-11-26 05:58:35'),
(32, 27, 55, NULL, 'variantss', 23.00, 1, 23.00, 'variant2', '2025-11-26 06:01:25'),
(33, 28, 55, NULL, 'variantss', 23.00, 1, 23.00, 'variant2', '2025-11-26 06:02:52'),
(34, 29, 253, NULL, 'Blue T-Shirt', 199.00, 1, 199.00, NULL, '2025-11-26 06:03:44'),
(35, 30, 264, 55, 'variantss', 23.00, 1, 23.00, 'variant2', '2025-11-26 06:09:51'),
(36, 31, 282, NULL, 'composites', 500.00, 1, 500.00, NULL, '2025-11-26 06:22:51'),
(37, 32, 282, NULL, 'composites', 500.00, 1, 500.00, NULL, '2025-11-26 07:00:23'),
(38, 33, 282, NULL, 'composites', 500.00, 1, 500.00, NULL, '2025-11-26 07:09:09'),
(39, 34, 282, NULL, 'composites', 500.00, 1, 500.00, NULL, '2025-11-26 07:10:51'),
(40, 35, 282, NULL, 'composites', 500.00, 1, 500.00, NULL, '2025-11-26 07:11:26'),
(41, 36, 282, NULL, 'composites', 500.00, 1, 500.00, NULL, '2025-11-26 07:11:41');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `password` varchar(255) NOT NULL,
  `business_name` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `owner_id`, `username`, `full_name`, `email`, `password`, `business_name`, `status`, `created_at`, `updated_at`) VALUES
(5, NULL, 'owner', 'Owner Sample', 'owner@sample.com', '$2y$10$YcKt3Gh00Xo.L/EWVv9k0.A1trxcvpnIMaai6HqDNgBeTmpb/EghK', 'Sample Basket', 'active', '2025-09-20 08:41:37', '2025-09-20 08:41:37');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_active_discounts`
-- (See below for the actual view)
--
CREATE TABLE `v_active_discounts` (
`id` int(11)
,`name` varchar(120)
,`type` enum('percentage','fixed')
,`value` decimal(10,2)
,`apply_to` enum('product','category','all')
,`target_id` int(11)
,`starts_at` datetime
,`ends_at` datetime
,`active` tinyint(1)
,`created_at` datetime
);

-- --------------------------------------------------------

--
-- Structure for view `v_active_discounts`
--
DROP TABLE IF EXISTS `v_active_discounts`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_discounts`  AS SELECT `discounts`.`id` AS `id`, `discounts`.`name` AS `name`, `discounts`.`type` AS `type`, `discounts`.`value` AS `value`, `discounts`.`apply_to` AS `apply_to`, `discounts`.`target_id` AS `target_id`, `discounts`.`starts_at` AS `starts_at`, `discounts`.`ends_at` AS `ends_at`, `discounts`.`active` AS `active`, `discounts`.`created_at` AS `created_at` FROM `discounts` WHERE `discounts`.`active` = 1 AND (`discounts`.`starts_at` is null OR `discounts`.`starts_at` <= current_timestamp()) AND (`discounts`.`ends_at` is null OR `discounts`.`ends_at` >= current_timestamp()) ;

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
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `unique_category_per_user` (`name`,`owner_id`);

--
-- Indexes for table `discounts`
--
ALTER TABLE `discounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_discounts_active` (`active`),
  ADD KEY `idx_discounts_target` (`apply_to`,`target_id`);

--
-- Indexes for table `favourites`
--
ALTER TABLE `favourites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fav_user` (`user_id`),
  ADD KEY `idx_fav_product` (`product_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_orders_employee_id` (`employee_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_product_id` (`product_id`);

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
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_products_owner_id` (`owner_id`);

--
-- Indexes for table `product_components`
--
ALTER TABLE `product_components`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_parent_product` (`parent_product_id`),
  ADD KEY `idx_component_variant` (`component_variant_id`),
  ADD KEY `idx_component_product` (`component_product_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

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
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sales_created_at` (`created_at`),
  ADD KEY `idx_sales_employee_id` (`employee_id`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_items_sale_id` (`sale_id`),
  ADD KEY `idx_sale_items_product_id` (`product_id`),
  ADD KEY `idx_sale_items_variant_id` (`variant_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=341;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `discounts`
--
ALTER TABLE `discounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `favourites`
--
ALTER TABLE `favourites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=373;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=283;

--
-- AUTO_INCREMENT for table `product_components`
--
ALTER TABLE `product_components`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `favourites`
--
ALTER TABLE `favourites`
  ADD CONSTRAINT `fk_favourites_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_employee` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_components`
--
ALTER TABLE `product_components`
  ADD CONSTRAINT `fk_product_components_component` FOREIGN KEY (`component_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_components_parent` FOREIGN KEY (`parent_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_components_variant` FOREIGN KEY (`component_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `fk_sales_employee` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE;

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
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
