-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 17, 2025 at 02:10 AM
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
(19, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-20 10:00:05'),
(20, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-20 10:48:34'),
(21, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-20 10:48:40'),
(22, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-20 22:06:37'),
(23, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-21 09:06:01'),
(24, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-21 10:12:18'),
(25, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-21 16:56:23'),
(26, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 07:46:14'),
(27, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 08:32:45'),
(28, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 08:35:55'),
(29, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 08:36:05'),
(30, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 08:36:28'),
(31, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 08:36:32'),
(32, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 08:49:11'),
(33, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 08:49:17'),
(34, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 08:52:47'),
(35, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 08:52:56'),
(36, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 09:01:01'),
(37, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 16:29:46'),
(38, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 16:46:35'),
(39, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 16:58:00'),
(40, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 19:51:18'),
(41, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-22 23:41:09'),
(42, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-23 05:21:34'),
(43, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-23 05:21:52'),
(44, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 09:00:15'),
(45, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:40:33'),
(46, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:40:57'),
(47, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:41:03'),
(48, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:41:12'),
(49, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:41:17'),
(50, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:42:15'),
(51, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:42:18'),
(52, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:42:41'),
(53, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:42:46'),
(54, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:42:50'),
(55, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:42:53'),
(56, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:02'),
(57, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:07'),
(58, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:22'),
(59, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:24'),
(60, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:28'),
(61, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:31'),
(62, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:33'),
(63, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:35'),
(64, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:37'),
(65, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:38'),
(66, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:43:44'),
(67, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 13:46:27'),
(68, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-24 16:47:04'),
(69, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-25 17:35:34'),
(70, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-26 09:34:14'),
(71, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-28 09:46:11'),
(72, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-28 11:52:07'),
(73, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-28 11:53:18'),
(74, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-28 14:40:36'),
(75, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-28 14:41:04'),
(76, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-28 16:43:31'),
(77, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-28 20:12:01'),
(78, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-03 04:10:22'),
(79, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-03 17:28:17'),
(80, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-03 17:28:21'),
(81, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-03 17:28:32'),
(82, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-03 17:28:37'),
(83, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-03 17:28:43'),
(84, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-05 09:36:43'),
(85, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-06 07:56:24'),
(86, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-11 09:38:53'),
(87, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-11 09:39:12'),
(88, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-11 09:39:33'),
(89, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-11 10:53:19'),
(90, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-11 10:53:25'),
(91, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-11 11:04:09'),
(92, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-11 11:04:14'),
(93, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-11 13:55:00'),
(94, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-11 13:55:53'),
(95, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-28 04:10:52'),
(96, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-03 09:01:39'),
(97, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-04 14:35:19'),
(98, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-05 09:33:14'),
(99, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-05 09:33:21'),
(100, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-06 11:23:25'),
(101, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 10:00:46'),
(102, 5, 'Reduced Item', 'Waste', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:03:18'),
(103, 5, 'Reduced Item(10053)', 'Waste (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:09:45'),
(104, 5, 'Added Quantity ()', 'Added (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:26:55'),
(105, 5, 'Added Quantity ()', 'Added (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:27:10'),
(106, 5, 'Reduced Quantity (10053)', 'No reason provided (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:27:29'),
(107, 5, 'Reduced Quantity (10053)', 'Waste (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:34:56'),
(108, 5, 'Added Quantity (10053)', 'Added (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:35:00'),
(109, 5, 'Reduced Quantity (hereeheree)', 'Waste (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:35:34'),
(110, 5, 'Added Quantity (hereeheree)', 'Added (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:35:37'),
(111, 5, 'Reduced Quantity (hereeheree)', 'No reason provided (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:35:40'),
(112, 5, 'Reduced Quantity (10053)', 'Waste (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:36:06'),
(113, 5, 'Reduced Quantity (hereeheree)', 'Waste (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:36:27'),
(114, 5, 'Reduced Quantity (10053)', 'Waste (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:42:07'),
(115, 5, 'Added Quantity (10053)', 'Added (2)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:42:13'),
(116, 5, 'Reduced Quantity (10053)', 'Waste (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:42:31'),
(117, 5, 'Added Quantity (10053)', 'Added (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:42:43'),
(118, 5, 'Reduced Quantity (10053)', 'Waste (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:50:18'),
(119, 5, 'Reduced Quantity (10053)', 'Waste (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:56:39'),
(120, 5, 'Added Quantity (10053)', 'Added (1)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 16:56:45'),
(121, 5, 'Added an Item', 'neww (10066)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:08:56'),
(122, 5, 'Added an Item', 'afasfaf (10067)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:11:13'),
(123, 5, 'Variant Added', 'wow(10068) to Parent*(10068)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:23:30'),
(124, 5, 'Added an Item', 'asfasf (10068)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:23:30'),
(125, 5, 'Variant Added', 'wwww(100622) to Parent*(10069)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:25:46'),
(126, 5, 'Added an Item', 'asfasf (10069)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:25:46'),
(127, 5, 'Variant Added', 'son (100son70) to parentsssss (10070)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:27:27'),
(128, 5, 'Added an Item', 'parentsssss (10070)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:27:27'),
(129, 5, 'Created an Item', 'ASFFAS (10071)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:33:09'),
(130, 5, 'Added an Item', 'asffas (10072)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:38:58'),
(131, 5, 'Created an Item', 'asffasfas (10073)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:39:39'),
(132, 5, 'Item Deleted', 'afasfasfff ()', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:46:18'),
(133, 5, 'Item Deleted', 'afsafaf (10004)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:46:33'),
(134, 5, 'Item Deleted', 'afsasf (10058)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:46:33'),
(135, 5, 'Item Deleted', 'asfaf (10029)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:47:57'),
(136, 5, 'Item Deleted', 'afasfaf (10067)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:49:56'),
(137, 5, 'Variant Deleted', 'asffasaf (10067) from afasfaf (10067)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-07 17:49:56'),
(138, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 09:21:21'),
(139, 5, 'Added an Item', 'asffsafas (10004)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 09:54:14'),
(140, 5, 'Added an Item', 'asfasf (10058)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 09:54:29'),
(141, 5, 'Added an Item', 'asffas (10067)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 09:57:30'),
(142, 5, 'Added an Item', 'afasffasf (10074)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 09:58:00'),
(143, 5, 'Added an Item', 'TRIAL (10075)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 09:58:19'),
(144, 5, 'Added an Item', 'ASFAFSFAS (10076)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 09:58:51'),
(145, 5, 'Added an Item', 'FAFASAFA (10077)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 09:59:19'),
(146, 5, 'Added an Item', 'asfasffas (10078)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:02:47'),
(147, 5, 'Added an Item', 'asffasfa (10079)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:02:56'),
(148, 5, 'Added an Item', 'asfasff (10080)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:03:06'),
(149, 5, 'Added an Item', 'fasfasfassaf (10081)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:03:13'),
(150, 5, 'Added an Item', 'asfasfasfas (10082)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:03:23'),
(151, 5, 'Added an Item', 'afsafafasf (10083)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:04:00'),
(152, 5, 'Added an Item', 'fasfas (10084)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:05:02'),
(153, 5, 'Added an Item', 'fasasfasf (10085)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:12:30'),
(154, 5, 'Added an Item', 'asfasf (10086)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:12:40'),
(155, 5, 'Added an Item', 'asfasffas (10087)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:18:35'),
(156, 5, 'Added an Item', 'asfasffas (10088)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:18:50'),
(157, 5, 'Added an Item', 'asfsafasf (10089)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:19:14'),
(158, 5, 'Created an Item', 'asfsafasfas (10090)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:19:41'),
(159, 5, 'Variant Added', 'asfasasfas (10091) to safasfas (10091)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:20:24'),
(160, 5, 'Variant Added', 'asfsaf (10092) to safasfas (10091)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:20:24'),
(161, 5, 'Added an Item', 'safasfas (10091)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:20:24'),
(162, 5, 'Created an Item', 'asfasffass (10093)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:21:28'),
(163, 5, 'Created an Item', 'asfasffas (10094)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:21:49'),
(164, 5, 'Created an Item', 'afasfasfasfa (10095)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:24:43'),
(165, 5, 'Created an Item', 'asfasasf (10096)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:25:07'),
(166, 5, 'Created an Item', 'asfsa (10097)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:29:12'),
(167, 5, 'Created an Item', 'asfasffas (10098)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:29:32'),
(168, 5, 'Created an Item', 'asfasfasf (10099)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 10:29:44'),
(169, 5, 'Added an Item', 'TRACKSTOCK (10100)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 17:21:24'),
(170, 5, 'Added an Item', 'POSAVAILABLE (10101)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 17:29:40'),
(171, 5, 'Added an Item', 'uncheckPOS (10102)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-11 17:32:02'),
(172, 5, 'Variant Added', 'var223 (10103) to xariant (10103)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-12 14:24:27'),
(173, 5, 'Variant Added', 'vcar2 (10104) to xariant (10103)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-12 14:24:27'),
(174, 5, 'Added an Item', 'xariant (10103)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-12 14:24:27'),
(175, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-13 01:43:00'),
(176, 5, 'Variant Added', 'assa (10105) to xandr (10105)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-13 02:00:24'),
(177, 5, 'Variant Added', 'assa (10106) to xandr (10105)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-13 02:00:24'),
(178, 5, 'Added an Item', 'xandr (10105)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-13 02:00:24'),
(179, 5, 'Variant Added', 'assas (10107) to xaasdtr2w (10107)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-13 02:00:48'),
(180, 5, 'Added an Item', 'xaasdtr2w (10107)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-13 02:00:48'),
(181, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-14 10:20:28'),
(182, 5, 'Added an Item', 'ximage trial (10108)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-14 14:31:10'),
(183, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-15 10:25:54'),
(184, 5, 'Added an Item', 'asffs (10109)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-15 13:52:51'),
(185, 5, 'Variant Added', 'white/large (10110) to tshirt (10110)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-15 21:38:46'),
(186, 5, 'Variant Added', 'black (10111) to tshirt (10110)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-15 21:38:46'),
(187, 5, 'Added an Item', 'tshirt (10110)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-15 21:38:46'),
(188, 5, 'Created an Item', 'ZCOMPOSE (10112)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-16 09:37:36'),
(189, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 01:05:19'),
(190, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 01:05:28'),
(191, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 01:08:36'),
(192, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 01:09:28'),
(193, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 01:09:52'),
(194, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 01:12:37'),
(195, 5, 'logout', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 01:21:57'),
(196, NULL, 'failed_login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 01:23:09'),
(197, 5, 'login', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-17 01:23:18');

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
(1, 'another one', '2025-10-11 09:52:52', NULL),
(2, 'No Category', '2025-10-11 11:04:00', 5),
(3, 'fasafasf', '2025-10-12 09:02:53', NULL),
(4, 'afarqw2', '2025-10-29 14:37:52', NULL),
(5, 'saf21312', '2025-10-29 14:41:26', NULL),
(6, 'asfasf1234123', '2025-10-29 14:41:36', NULL),
(7, 'NEWWRA', '2025-11-11 17:21:23', NULL),
(8, 'Compose', '2025-11-16 09:37:36', NULL);

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

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `token`, `expires_at`) VALUES
(47, 5, '55fe5a6ead40b7c40fc83e49c72edad9be5eae46819e73327270bfc0e2afac10', '2025-11-16 19:10:57');

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
(1, 'new one', 1, 'variable', 0.00, '123123123', '12312321332', 1, '2332', '232', 1, 'color_shape', 0, 'gray', 'square', '', '2025-10-11 09:52:52', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(2, 'kenesadas', NULL, 'variable', 0.00, '', '', 1, '123123', '12312', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:00:43', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(3, 'new newww', NULL, 'variable', 0.00, '', '', 1, '213123 pcs', '12321 pcs', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:02:28', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(4, 'ken', NULL, 'variable', 0.00, '', '', 0, '0 - -', '0 - -', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:29:15', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(5, 'asfasfasffas', NULL, 'variable', 0.00, '', '', 1, '0 - -', '0 - -', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:32:03', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(6, 'aasffsa', NULL, 'variable', 0.00, '', '', 0, '0 - -', '0 - -', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:32:49', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(7, 'afasfasf', 4, 'variable', 0.00, '', '', 0, '0 - -', '0 - -', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:32:54', NULL, NULL, NULL, '2025-11-11 17:19:50'),
(8, 'kenmmnn', NULL, 'variable', 0.00, '', '', 0, '0', '', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:38:44', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(9, 'asfasffasa', NULL, 'variable', 0.00, '', '', 1, '13123', '123123', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:39:03', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(10, 'asfasfas', NULL, 'variable', 0.00, '', '', 0, '213123 kg', '1231231 kg', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:39:22', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(11, 'safasf', NULL, 'variable', 0.00, '', '', 1, '0', '', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:39:36', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(14, 'd21312312', NULL, 'variable', 0.00, '', '', 1, '213123', '123123', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:43:47', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(16, 'asfasffs', NULL, 'variable', 0.00, '', '', 1, '21312', '3121212', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:44:53', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(17, 'asfasfasf', NULL, 'variable', 0.00, '', '', 1, '123123', '123123', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:46:22', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(18, 'safasf', NULL, 'variable', 0.00, '', '', 0, '0', '', 0, 'color_shape', 0, '', '', '', '2025-10-11 10:51:28', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(19, 'ds', NULL, 'variable', 112321.00, '23412', '', 0, '0', '', 0, 'color_shape', 0, '', '', '', '2025-10-11 11:05:47', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(20, 'aasfasfa', 1, 'variable', 0.00, '', '', 0, '0', '', 0, 'color_shape', 0, '', '', '', '2025-10-11 11:06:35', NULL, NULL, NULL, '2025-11-07 11:01:24'),
(22, 'asdadas', 1, 'variable', 0.00, '', '', 0, '0', '', 0, 'color_shape', 0, '', '', '', '2025-10-11 11:15:37', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(23, 'asfasf', NULL, 'variable', 0.00, '', '', 0, '0', '', 0, 'color_shape', 0, 'blue', 'square', '', '2025-10-12 09:02:03', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(24, 'sarasfafs', 3, 'variable', 0.00, '', '', 0, '0', '', 0, 'color_shape', 0, '', '', '', '2025-10-12 09:02:53', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(25, 'asfasf', 4, 'variable', 0.00, '10000', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-10-29 14:37:52', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(26, 'asfafs', 5, 'variable', 0.00, '10001', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-10-29 14:41:26', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(27, 'asfasfaf', 6, 'variable', 0.00, '10002', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-10-29 14:41:36', NULL, NULL, NULL, '2025-11-03 14:02:09'),
(31, 'new onee', 2, 'variable', 0.00, '10003', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-03 14:07:11', NULL, NULL, NULL, '2025-11-03 14:07:11'),
(33, 'with image', 2, 'variable', 0.00, '10005', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-03 14:09:17', NULL, NULL, NULL, '2025-11-03 14:09:17'),
(34, 'owner id', 2, 'variable', 0.00, '10006', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-03 14:13:19', 5, NULL, NULL, '2025-11-03 14:13:19'),
(35, 'new image', 2, 'variable', 0.00, '10007', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-03 14:19:20', 5, NULL, NULL, '2025-11-03 14:19:20'),
(36, 'debug', 2, 'variable', 0.00, '10008', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-03 14:22:15', 5, NULL, NULL, '2025-11-03 14:22:15'),
(37, 'color', 2, 'variable', 0.00, '10009', '', 0, NULL, NULL, 1, 'color_shape', 0, 'purple', 'triangle', '', '2025-11-03 14:25:50', 5, NULL, NULL, '2025-11-03 14:25:50'),
(38, 'noww debug', 2, 'variable', 0.00, '10010', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-03 14:26:36', 5, NULL, NULL, '2025-11-03 14:26:36'),
(39, 'afasfas', 2, 'variable', 200.00, '10011', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-03 14:26:51', 5, NULL, NULL, '2025-11-06 15:33:54'),
(40, 'asfafafa', 2, 'variable', 0.00, '10012', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-03 14:27:32', 5, NULL, NULL, '2025-11-03 14:27:32'),
(41, 'asfasfafs', 2, 'variable', 0.00, '10013', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-03 14:27:48', 5, NULL, NULL, '2025-11-03 14:27:48'),
(42, 'sfasfasf', 2, 'variable', 0.00, '10014', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-03 14:27:57', 5, NULL, NULL, '2025-11-03 14:27:57'),
(43, 'asfasffas', 2, 'variable', 0.00, '10015', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-03 14:28:05', 5, NULL, NULL, '2025-11-03 14:28:05'),
(44, 'asfasfasf', 2, 'variable', 0.00, '10016', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-03 14:28:10', 5, NULL, NULL, '2025-11-03 14:28:10'),
(45, 'asfasfaf', 2, 'variable', 0.00, '10017', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-03 14:31:22', 5, NULL, NULL, '2025-11-03 14:31:22'),
(46, 'asfasfasf', 2, 'variable', 0.00, '10018', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-03 14:32:34', 5, NULL, NULL, '2025-11-03 14:32:34'),
(47, 'asfafaf', 2, 'variable', 0.00, '10019', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-03 14:36:15', 5, NULL, NULL, '2025-11-03 14:36:15'),
(48, 'asfafsfaf', 2, 'variable', 0.00, '10020', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-03 14:37:26', 5, NULL, NULL, '2025-11-03 14:37:26'),
(49, 'asfasfafs', 2, 'variable', 0.00, '10021', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-03 14:38:24', 5, NULL, NULL, '2025-11-03 14:38:24'),
(50, 'new item w/ variant', 2, 'variable', 0.00, '10022', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-03 14:43:20', 5, NULL, NULL, '2025-11-03 14:43:20'),
(51, 'asfasfasf', 2, 'variable', 200.00, '10023', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-04 19:44:15', 5, NULL, NULL, '2025-11-04 19:44:15'),
(54, 'sorry cosy', 2, 'variable', 30.00, '10026', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-04 19:45:46', 5, NULL, NULL, '2025-11-04 19:45:46'),
(55, 'variant', 2, 'variable', 0.00, '10027', '', 1, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 09:35:12', 5, NULL, NULL, '2025-11-07 11:27:26'),
(56, 'variant trial', 2, 'variable', 0.00, '10028', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 10:07:36', 5, NULL, NULL, '2025-11-05 10:07:37'),
(58, 'asfafs', 2, 'variable', 0.00, '10030', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 13:53:29', 5, NULL, NULL, '2025-11-05 13:53:29'),
(59, 'asffsa', 2, 'variable', 0.00, '10031', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 13:56:31', 5, NULL, NULL, '2025-11-05 13:56:31'),
(60, 'safas', 2, 'variable', 0.00, '10032', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 13:58:39', 5, NULL, NULL, '2025-11-05 13:58:39'),
(61, 'asf', 2, 'variable', 0.00, '10033', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 14:30:18', 5, NULL, NULL, '2025-11-05 14:30:19'),
(62, 'asffaf', 2, 'variable', 0.00, '10034', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 14:36:59', 5, NULL, NULL, '2025-11-05 14:36:59'),
(63, 'asfasf', 2, 'variable', 0.00, '10035', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 14:38:47', 5, NULL, NULL, '2025-11-05 14:38:47'),
(64, 'asfsaff', 2, 'variable', 0.00, '10036', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 14:39:44', 5, NULL, NULL, '2025-11-05 14:39:44'),
(65, 'fasfasf', 2, 'variable', 0.00, '10037', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 16:27:45', 5, NULL, NULL, '2025-11-05 16:27:46'),
(66, 'asfsaffassaf', 2, 'variable', 0.00, '10040', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 16:47:58', 5, NULL, NULL, '2025-11-05 16:47:58'),
(67, 'no barcode', 2, 'variable', 0.00, '10041', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 16:48:22', 5, NULL, NULL, '2025-11-05 16:48:22'),
(68, 'kenny variants', 2, 'variable', 0.00, '', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 17:03:49', 5, NULL, NULL, '2025-11-05 17:03:49'),
(69, 'asfasf', 2, 'variable', 0.00, '', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-05 17:05:50', 5, NULL, NULL, '2025-11-05 17:05:50'),
(113, 'first composite', 2, 'variable', 200.00, '10025', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-06 13:53:36', 5, NULL, NULL, '2025-11-06 13:53:36'),
(114, 'asfasffsaf', 2, 'variable', 200.00, '10044', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-06 13:56:28', 5, NULL, NULL, '2025-11-06 13:56:28'),
(115, 'TRIAL W/ VARIANT', 2, NULL, 0.00, '10045', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-06 14:14:30', 5, NULL, NULL, '2025-11-06 14:14:30'),
(116, 'NEWW TRIAL', 2, NULL, 0.00, '10046', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-06 14:15:08', 5, NULL, NULL, '2025-11-06 14:15:08'),
(117, 'NEWW TRIAL', 2, NULL, 0.00, 'SFAFAF', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-06 14:15:24', 5, NULL, NULL, '2025-11-06 14:15:24'),
(118, 'THIS ONE', 2, 'variable', 200.00, '10047', '', 0, NULL, NULL, 1, '', 1, 'gray', 'square', '', '2025-11-06 15:31:27', 5, NULL, NULL, '2025-11-06 15:31:27'),
(126, 'THISS W/ VARIANT', 2, 'variable', 200.00, '10048', '', 0, NULL, NULL, 1, '', 1, 'gray', 'square', '', '2025-11-06 16:30:11', 5, NULL, NULL, '2025-11-06 16:30:11'),
(127, 'asfasf', 2, 'variable', 0.00, '10049', '', 0, NULL, NULL, 1, '', 1, 'gray', 'square', '', '2025-11-06 17:53:38', 5, NULL, NULL, '2025-11-06 17:53:38'),
(128, 'TRYYY', 2, 'variable', 200.00, '10050', '', 1, NULL, NULL, 1, '', 1, 'gray', 'square', '', '2025-11-06 19:52:52', 5, NULL, NULL, '2025-11-07 10:11:06'),
(176, 'VARITAN', 2, 'variable', 0.00, '10051', 'KENNY', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 10:33:42', 5, NULL, NULL, '2025-11-07 13:12:00'),
(184, 'RINXEL', 2, 'variable', 0.00, '10053', 'RINXEL', 1, '96', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 10:34:29', 5, NULL, NULL, '2025-11-07 16:56:45'),
(196, 'TRIAL VARIANT', 2, 'variable', 0.00, '10054', 'Diff', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 13:13:29', 5, NULL, NULL, '2025-11-07 13:13:29'),
(197, 'different parent', 2, 'variable', 0.00, '10056', 'heree', 1, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 13:14:56', 5, NULL, NULL, '2025-11-07 16:35:40'),
(198, 'parent', 4, 'variable', 0.00, '10057', 'heree', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 13:21:54', 5, NULL, NULL, '2025-11-07 13:31:35'),
(200, 'ITEN NO 1', 2, 'variable', 20.00, '10059', 'ITEN NO 1', 1, '200', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 14:03:38', 5, NULL, NULL, '2025-11-07 14:03:38'),
(201, 'ITEN NO 2', 2, 'variable', 10.00, '10060', 'ITEN NO 2', 1, '100', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 14:04:13', 5, NULL, NULL, '2025-11-07 14:04:13'),
(202, 'ITEN NO 3', 2, 'variable', 5.00, '10061', '', 1, '100', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 14:04:37', 5, NULL, NULL, '2025-11-07 14:04:37'),
(203, 'ITEM', 2, 'variable', 1.00, '10062', '', 1, '100', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 14:05:42', 5, NULL, NULL, '2025-11-07 14:05:42'),
(204, 'COMPOSITEE', 2, 'variable', 36.00, '10063', '', 0, NULL, NULL, 1, '', 1, 'gray', 'square', '', '2025-11-07 14:07:14', 5, NULL, NULL, '2025-11-07 14:07:14'),
(205, 'COMPO 2', 2, 'variable', 40.00, '10064', '', 0, NULL, NULL, 1, '', 1, 'gray', 'square', '', '2025-11-07 14:08:26', 5, NULL, NULL, '2025-11-07 14:08:26'),
(206, 'MARGIN', 2, '200', 100.00, '10065', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 14:36:42', 5, NULL, NULL, '2025-11-07 14:36:42'),
(207, 'neww', 2, 'variable', 0.00, '10066', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 17:08:56', 5, NULL, NULL, '2025-11-07 17:08:56'),
(209, 'asfasf', 2, 'variable', 0.00, '10068', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 17:23:30', 5, NULL, NULL, '2025-11-07 17:23:30'),
(210, 'asfasf', 2, 'variable', 0.00, '10069', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 17:25:46', 5, NULL, NULL, '2025-11-07 17:25:46'),
(211, 'parentsssss', 2, 'variable', 0.00, '10070', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 17:27:27', 5, NULL, NULL, '2025-11-07 17:27:27'),
(212, 'ASFFAS', 2, 'variable', 0.00, '10071', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 17:33:09', 5, NULL, NULL, '2025-11-07 17:33:09'),
(213, 'asffas', 2, 'variable', 0.00, '10072', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-07 17:38:58', 5, NULL, NULL, '2025-11-07 17:38:58'),
(214, 'asffasfas', 2, 'variable', 200.00, '10073', '', 0, NULL, NULL, 1, '', 1, 'gray', 'square', '', '2025-11-07 17:39:39', 5, NULL, NULL, '2025-11-07 17:39:39'),
(215, 'asffsafas', 2, 'variable', 0.00, '10004', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-11 09:54:14', 5, NULL, NULL, '2025-11-11 09:54:14'),
(216, 'asfasf', 2, 'variable', 0.00, '10058', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-11 09:54:29', 5, NULL, NULL, '2025-11-11 09:54:29'),
(217, 'asffas', 2, NULL, 0.00, '10067', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', 'http://localhost/black_basket/upload/items/img_69129809c2c3c5.33623883.png', '2025-11-11 09:57:30', 5, NULL, NULL, '2025-11-11 09:57:30'),
(218, 'afasffasf', 2, NULL, 0.00, '10074', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-11 09:58:00', 5, NULL, NULL, '2025-11-11 09:58:00'),
(219, 'TRIAL', 2, NULL, 0.00, '10075', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-11 09:58:19', 5, NULL, NULL, '2025-11-11 09:58:19'),
(220, 'ASFAFSFAS', 2, 'variable', 0.00, '10076', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-11 09:58:51', 5, NULL, NULL, '2025-11-11 09:58:51'),
(221, 'FAFASAFA', 2, 'variable', 0.00, '10077', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-11 09:59:19', 5, NULL, NULL, '2025-11-11 09:59:19'),
(222, 'asfasffas', 2, NULL, 0.00, '10078', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-11 10:02:47', 5, NULL, NULL, '2025-11-11 10:02:47'),
(223, 'asffasfa', 2, NULL, 0.00, '10079', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-11 10:02:56', 5, NULL, NULL, '2025-11-11 10:02:56'),
(224, 'asfasff', 2, NULL, 0.00, '10080', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-11 10:03:06', 5, NULL, NULL, '2025-11-11 10:03:06'),
(225, 'fasfasfassaf', 2, NULL, 0.00, '10081', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-11 10:03:13', 5, NULL, NULL, '2025-11-11 10:03:13'),
(226, 'asfasfasfas', 2, 'variable', 0.00, '10082', '', 0, NULL, NULL, 1, 'image', 0, '', '', '', '2025-11-11 10:03:23', 5, NULL, NULL, '2025-11-11 10:03:23'),
(227, 'afsafafasf', 2, NULL, 0.00, '10083', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-11 10:04:00', 5, NULL, NULL, '2025-11-11 10:04:00'),
(228, 'fasfas', 2, NULL, 0.00, '10084', '', 0, NULL, NULL, 1, 'color_shape', 0, '', '', '', '2025-11-11 10:05:02', 5, NULL, NULL, '2025-11-11 10:05:02'),
(229, 'fasasfasf', 2, 'variable', 0.00, '10085', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-11 10:12:30', 5, NULL, NULL, '2025-11-11 10:12:30'),
(230, 'asfasf', 2, 'variable', 0.00, '10086', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-11 10:12:40', 5, NULL, NULL, '2025-11-11 10:12:40'),
(231, 'asfasffas', 2, 'variable', 0.00, '10087', '', 0, NULL, NULL, 1, 'image', 0, '', '', 'upload/items/1762827515_f8228fa75ddb.png', '2025-11-11 10:18:35', 5, NULL, NULL, '2025-11-11 10:18:35'),
(232, 'asfasffas', 2, 'variable', 0.00, '10088', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-11 10:18:50', 5, NULL, NULL, '2025-11-11 10:18:50'),
(233, 'asfsafasf', 2, 'variable', 0.00, '10089', '', 0, NULL, NULL, 1, 'color_shape', 0, 'green', 'triangle', '', '2025-11-11 10:19:14', 5, NULL, NULL, '2025-11-11 10:19:14'),
(234, 'asfsafasfas', 2, 'variable', 0.00, '10090', '', 0, NULL, NULL, 1, '', 1, '', '', 'upload/items/1762827581_56029106a900.png', '2025-11-11 10:19:41', 5, NULL, NULL, '2025-11-11 10:19:41'),
(235, 'safasfas', 2, 'variable', 0.00, '10091', '', 0, '0', NULL, 1, 'image', 0, '', '', 'upload/items/1762827624_7be323098ea7.png', '2025-11-11 10:20:24', 5, NULL, NULL, '2025-11-11 10:20:24'),
(236, 'asfasffass', 2, 'variable', 200.00, '10093', '', 0, NULL, NULL, 1, '', 1, 'gray', 'square', '', '2025-11-11 10:21:28', 5, NULL, NULL, '2025-11-11 10:21:28'),
(237, 'asfasffas', 2, 'variable', 200.00, '10094', '', 0, NULL, NULL, 1, '', 1, 'blue', 'circle', '', '2025-11-11 10:21:49', 5, NULL, NULL, '2025-11-11 10:21:49'),
(238, 'afasfasfasfa', 2, 'variable', 0.00, '10095', '', 0, NULL, NULL, 1, 'image', 1, '', '', 'upload/items/1762827883_c4fe4d17b459.png', '2025-11-11 10:24:43', 5, NULL, NULL, '2025-11-11 10:24:43'),
(239, 'asfasasf', 2, 'variable', 0.00, '10096', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-11 10:25:07', 5, NULL, NULL, '2025-11-11 10:25:07'),
(240, 'asfsa', 2, 'variable', 0.00, '10097', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-11 10:29:12', 5, NULL, NULL, '2025-11-11 10:29:12'),
(241, 'asfasffas', 2, 'variable', 0.00, '10098', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-11 10:29:32', 5, NULL, NULL, '2025-11-11 10:29:32'),
(242, 'asfasfasf', 2, 'variable', 0.00, '10099', '', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-11 10:29:44', 5, NULL, NULL, '2025-11-11 10:29:44'),
(243, 'TRACKSTOCK', 7, '23', 0.00, '10100', 'BARCODE', 1, '22', '2', 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-11 17:21:24', 5, NULL, NULL, '2025-11-11 17:21:24'),
(244, 'POSAVAILABLE', 2, '23', 2.00, '10101', 'POSSY', 1, '100 kg', '2 kg', 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-11 17:29:40', 5, NULL, NULL, '2025-11-11 17:29:40'),
(245, 'uncheckPOS', 4, 'variable', 0.00, '10102', 'uncheckPOS', 0, NULL, NULL, 0, 'color_shape', 0, '', '', '', '2025-11-11 17:32:02', 5, NULL, NULL, '2025-11-11 17:32:02'),
(246, 'xariant', 2, 'variable', 0.00, '10103', '', 1, '23 kg', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-12 14:24:27', 5, NULL, NULL, '2025-11-12 14:24:27'),
(247, 'xandr', 2, 'variable', 0.00, '10105', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-13 02:00:24', 5, NULL, NULL, '2025-11-13 02:00:24'),
(248, 'xaasdtr2w', 2, 'variable', 0.00, '10107', '', 0, '0', NULL, 0, 'color_shape', 0, '', '', '', '2025-11-13 02:00:48', 5, NULL, NULL, '2025-11-13 02:00:48'),
(249, 'ximage trial', 2, 'variable', 0.00, '10108', '', 0, NULL, NULL, 1, 'image', 0, '', '', 'upload/items/1763101870_3c34fcbd1f79.jpg', '2025-11-14 14:31:10', 5, NULL, NULL, '2025-11-14 14:31:10'),
(250, 'asffs', 2, 'variable', 0.00, '10109', '', 0, NULL, NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-15 13:52:51', 5, NULL, NULL, '2025-11-15 13:52:51'),
(251, 'tshirt', 2, 'variable', 0.00, '10110', '', 0, '0', NULL, 1, 'color_shape', 0, 'gray', 'square', '', '2025-11-15 21:38:45', 5, NULL, NULL, '2025-11-15 21:38:46'),
(252, 'ZCOMPOSE', 8, '1000', 600.00, '10112', 'Composites', 0, NULL, NULL, 1, 'color_shape', 1, 'gray', 'square', '', '2025-11-16 09:37:36', 5, NULL, NULL, '2025-11-16 09:37:36');

-- --------------------------------------------------------

--
-- Table structure for table `product_components`
--

CREATE TABLE `product_components` (
  `id` int(11) NOT NULL,
  `parent_product_id` int(11) NOT NULL,
  `component_variant_id` int(11) DEFAULT NULL,
  `component_product_id` int(11) DEFAULT NULL,
  `component_name` varchar(150) NOT NULL,
  `component_sku` varchar(64) DEFAULT NULL,
  `component_qty` decimal(10,2) DEFAULT NULL,
  `component_cost` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_components`
--

INSERT INTO `product_components` (`id`, `parent_product_id`, `component_variant_id`, `component_product_id`, `component_name`, `component_sku`, `component_qty`, `component_cost`, `created_at`) VALUES
(1, 126, NULL, NULL, 'afsafaf', '10004', 1.00, 0.00, '2025-11-06 16:30:11'),
(2, 126, 8, NULL, 'new item w/ variant (asfasfa)', '10022', 1.00, 0.00, '2025-11-06 16:30:11'),
(3, 126, NULL, 114, 'asfasffsaf', '10044', 1.00, 200.00, '2025-11-06 16:30:11'),
(4, 127, 32, NULL, 'kenny variants (kenny)', '10042', 1.00, 0.00, '2025-11-06 17:53:38'),
(5, 128, 8, NULL, 'new item w/ variant', '10022', 1.00, 0.00, '2025-11-06 19:52:52'),
(6, 128, NULL, NULL, 'aasffsa', '', 1.00, 0.00, '2025-11-06 19:52:52'),
(7, 128, NULL, 39, 'afasfas', '10011', 1.00, 200.00, '2025-11-06 19:52:52'),
(8, 128, 32, NULL, 'kenny variants (kenny)', '10042', 1.00, 0.00, '2025-11-06 19:52:52'),
(9, 204, NULL, 200, 'ITEN NO 1', '10059', 1.00, 20.00, '2025-11-07 14:07:14'),
(10, 204, NULL, 201, 'ITEN NO 2', '10060', 1.00, 10.00, '2025-11-07 14:07:14'),
(11, 204, NULL, 202, 'ITEN NO 3', '10061', 1.00, 5.00, '2025-11-07 14:07:14'),
(12, 204, NULL, 203, 'ITEM', '10062', 1.00, 1.00, '2025-11-07 14:07:14'),
(13, 205, NULL, 200, 'ITEN NO 1', '10059', 1.00, 20.00, '2025-11-07 14:08:26'),
(14, 205, NULL, 201, 'ITEN NO 2', '10060', 2.00, 10.00, '2025-11-07 14:08:26'),
(15, 214, NULL, NULL, 'afasfaf (asffasaf)', '10067', 1.00, 0.00, '2025-11-07 17:39:39'),
(16, 214, NULL, 39, 'afasfas', '10011', 1.00, 200.00, '2025-11-07 17:39:39'),
(17, 234, 20, NULL, 'asf', '10033', 1.00, 0.00, '2025-11-11 10:19:41'),
(18, 234, NULL, 47, 'asfafaf', '10019', 1.00, 0.00, '2025-11-11 10:19:41'),
(19, 234, NULL, NULL, 'asdadas', '', 1.00, 0.00, '2025-11-11 10:19:41'),
(20, 236, NULL, 39, 'afasfas', '10011', 1.00, 200.00, '2025-11-11 10:21:28'),
(21, 236, NULL, NULL, 'afasfasf', '', 1.00, 0.00, '2025-11-11 10:21:28'),
(22, 237, NULL, NULL, 'afasfasf', '', 1.00, 0.00, '2025-11-11 10:21:49'),
(23, 237, NULL, 39, 'afasfas', '10011', 1.00, 200.00, '2025-11-11 10:21:49'),
(24, 238, 20, NULL, 'asf', '10033', 1.00, 0.00, '2025-11-11 10:24:43'),
(25, 238, NULL, 47, 'asfafaf', '10019', 1.00, 0.00, '2025-11-11 10:24:43'),
(26, 239, NULL, 47, 'asfafaf', '10019', 1.00, 0.00, '2025-11-11 10:25:07'),
(27, 239, 20, NULL, 'asf', '10033', 1.00, 0.00, '2025-11-11 10:25:07'),
(28, 240, NULL, 227, 'afsafafasf', '10083', 1.00, 0.00, '2025-11-11 10:29:12'),
(29, 240, NULL, 47, 'asfafaf', '10019', 1.00, 0.00, '2025-11-11 10:29:12'),
(30, 241, NULL, 218, 'afasffasf', '10074', 1.00, 0.00, '2025-11-11 10:29:32'),
(31, 241, NULL, 227, 'afsafafasf', '10083', 1.00, 0.00, '2025-11-11 10:29:32'),
(32, 242, NULL, 227, 'afsafafasf', '10083', 1.00, 0.00, '2025-11-11 10:29:44'),
(33, 242, NULL, 47, 'asfafaf', '10019', 1.00, 0.00, '2025-11-11 10:29:44'),
(34, 252, NULL, 39, 'afasfas', '10011', 2.00, 200.00, '2025-11-16 09:37:36'),
(35, 252, NULL, 39, 'afasfas', '10011', 1.00, 200.00, '2025-11-16 09:37:36');

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
(1, 6, '', '', '', '0', 0.00, 0, '0', '0', 1, '2025-10-11 10:32:49'),
(2, 7, '', '', '', '0', 0.00, 0, '0', '0', 1, '2025-10-11 10:32:54'),
(3, 18, '', '', '', '0', 0.00, 0, '0', '', 1, '2025-10-11 10:51:28'),
(4, 19, '', '', '', '0', 0.00, 0, '0', '', 1, '2025-10-11 11:05:47'),
(5, 20, '', 'safsafasf', 'asfasff', '0', 0.00, 0, '3123 L', '123 L', 1, '2025-10-11 11:06:35'),
(7, 22, 'asdasd', '', '', 'variable', 0.00, 0, '0', '', 1, '2025-10-11 11:15:37'),
(8, 50, 'asfasfa', '10022', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-03 14:43:20'),
(9, 55, 'vara', '10027', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 09:35:12'),
(10, 55, 'var', '10027', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 09:35:12'),
(11, 56, 'var 1', '10028', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 10:07:36'),
(12, 56, 'var 2', '10029', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 10:07:36'),
(16, 58, 'fasf', '10024', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 13:53:29'),
(17, 58, 'asffsa', '10031', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 13:53:29'),
(18, 59, 'asfs', '10030', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 13:56:31'),
(19, 59, 'asffas', '10032', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 13:56:31'),
(20, 61, 'fasf', '10033', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 14:30:19'),
(21, 61, 'asfsfa', '10034', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 14:30:19'),
(22, 62, 'asfas', '10034', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 14:36:59'),
(23, 62, 'asffas', '10034', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 14:36:59'),
(24, 63, 'asfsa', '10035', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 14:38:47'),
(25, 63, 'asffa', '10035', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 14:38:47'),
(26, 64, 'asfsa', '10036', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 14:39:44'),
(27, 64, 'asffas', '10036', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 14:39:44'),
(28, 65, 'asfsa', '10038', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 16:27:45'),
(29, 65, 'asfas', '10039', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 16:27:46'),
(30, 66, 'asfsfa', '10040', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 16:47:58'),
(31, 67, 'asfafsa', '10041', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 16:48:22'),
(32, 68, 'kenny', '10042', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 17:03:49'),
(33, 69, 'asfasffas', '10043', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-05 17:05:50'),
(34, 176, 'TAHAS', '10051', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-07 10:33:42'),
(35, 176, 'ASFASF', '10052', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-07 10:33:42'),
(36, 196, 'variant one', '10054', 'different', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-07 13:13:29'),
(37, 196, 'variant two', '10055', 'different', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-07 13:13:29'),
(38, 197, 'different', 'heree', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-07 13:14:56'),
(39, 197, 'diff', 'hereeheree', '', 'variable', 0.00, 0, '0', NULL, 1, '2025-11-07 13:14:56'),
(40, 198, 'son', '10057', 'heree', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-07 13:21:54'),
(43, 209, 'wow', '10068', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-07 17:23:30'),
(44, 210, 'wwww', '100622', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-07 17:25:46'),
(45, 211, 'son', '100son70', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-07 17:27:27'),
(46, 235, 'asfasasfas', '10091', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-11 10:20:24'),
(47, 235, 'asfsaf', '10092', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-11 10:20:24'),
(48, 246, 'var223', '10103', '', 'variable', 0.00, 0, '12 kg', '2 kg', 1, '2025-11-12 14:24:27'),
(49, 246, 'vcar2', '10104', '', 'variable', 0.00, 0, '11 kg', '3 kg', 1, '2025-11-12 14:24:27'),
(50, 247, 'assa', '10105', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-13 02:00:24'),
(51, 247, 'assa', '10106', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-13 02:00:24'),
(52, 248, 'assas', '10107', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-13 02:00:48'),
(53, 251, 'white/large', '10110', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-15 21:38:46'),
(54, 251, 'black', '10111', '', 'variable', 0.00, 0, NULL, NULL, 1, '2025-11-15 21:38:46');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=198;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=253;

--
-- AUTO_INCREMENT for table `product_components`
--
ALTER TABLE `product_components`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

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
  ADD CONSTRAINT `fk_product_components_component` FOREIGN KEY (`component_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
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
