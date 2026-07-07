-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 01, 2026 at 06:03 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_reservasi_futsal`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `roleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `name`, `email`, `password`, `roleId`, `createdAt`, `updatedAt`) VALUES
('ddc580d4-2d3b-4cba-a138-1fadd21f4e93', 'Administrator', 'admin@example.com', '$2b$10$2UY/9q6.rQDyTQASMBJMhuuBFCe56b/gt1Z/V7foGD2mmrYMNS/zy', '8d4b722c-b0a6-429d-8879-a6cbbdd32245', '2026-01-31 19:30:16.129', '2026-01-31 19:30:16.129');

-- --------------------------------------------------------

--
-- Table structure for table `adminrole`
--

CREATE TABLE `adminrole` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `adminrole`
--

INSERT INTO `adminrole` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES
('8d4b722c-b0a6-429d-8879-a6cbbdd32245', 'Administrator', 'Dev', '2026-01-31 19:29:39.654', '2026-01-31 19:29:39.654');

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

CREATE TABLE `booking` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fieldId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startTime` datetime(3) NOT NULL,
  `endTime` datetime(3) NOT NULL,
  `status` enum('PENDING','WAITING_PAYMENT','PAID','CANCELLED','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `totalPrice` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`id`, `name`, `email`, `phone`, `password`, `createdAt`, `updatedAt`) VALUES
('a32d84e6-d573-46e6-be60-e8ee526dbecb', 'mustaqim pratama', 'mustaqimpratama0@gmail.com', '083806190276', '$2b$10$WJ14IkbWCzB06Gojj3IkGem2n0EYRRgdemX8ej11PeAOfw9mezsIe', '2026-02-01 04:50:01.285', '2026-02-01 04:50:01.285');

-- --------------------------------------------------------

--
-- Table structure for table `field`
--

CREATE TABLE `field` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('SYNTHETIC','GRASS','INDOOR') COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `lengthMeter` double DEFAULT NULL,
  `widthMeter` double DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `field`
--

INSERT INTO `field` (`id`, `name`, `type`, `isActive`, `lengthMeter`, `widthMeter`, `createdAt`, `updatedAt`) VALUES
('bb7c3ca7-7f00-4307-bd5c-fa833a5eb6c2', 'Testing Lapangan 1', 'SYNTHETIC', 1, 48, 25, '2026-01-31 19:30:50.077', '2026-02-01 04:54:09.445');

-- --------------------------------------------------------

--
-- Table structure for table `fieldimage`
--

CREATE TABLE `fieldimage` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fieldId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imageUrl` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isPrimary` tinyint(1) NOT NULL DEFAULT '0',
  `order` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fieldimage`
--

INSERT INTO `fieldimage` (`id`, `fieldId`, `imageUrl`, `isPrimary`, `order`, `createdAt`) VALUES
('b85010cc-4a9c-4b5b-b89c-cf93f4bb5247', 'bb7c3ca7-7f00-4307-bd5c-fa833a5eb6c2', 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=60', 1, 0, '2026-02-01 04:54:09.445');

-- --------------------------------------------------------

--
-- Table structure for table `fieldprice`
--

CREATE TABLE `fieldprice` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fieldId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dayType` enum('WEEKDAY','WEEKEND') COLLATE utf8mb4_unicode_ci NOT NULL,
  `startHour` int NOT NULL,
  `endHour` int NOT NULL,
  `price` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fieldprice`
--

INSERT INTO `fieldprice` (`id`, `fieldId`, `dayType`, `startHour`, `endHour`, `price`, `createdAt`) VALUES
('538407bf-1fcd-4058-9b2c-673436485175', 'bb7c3ca7-7f00-4307-bd5c-fa833a5eb6c2', 'WEEKEND', 8, 17, 150000, '2026-02-01 04:54:09.445'),
('e9c20938-98ec-4d64-acd3-f145ba9c9e43', 'bb7c3ca7-7f00-4307-bd5c-fa833a5eb6c2', 'WEEKDAY', 8, 17, 150000, '2026-02-01 04:54:09.445');

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bookingId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proofUrl` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('WAITING_VERIFICATION','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WAITING_VERIFICATION',
  `verifiedById` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verifiedAt` datetime(3) DEFAULT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Admin_email_key` (`email`),
  ADD KEY `Admin_roleId_fkey` (`roleId`);

--
-- Indexes for table `adminrole`
--
ALTER TABLE `adminrole`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `AdminRole_name_key` (`name`);

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Booking_fieldId_startTime_endTime_idx` (`fieldId`,`startTime`,`endTime`),
  ADD KEY `Booking_customerId_fkey` (`customerId`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Customer_email_key` (`email`);

--
-- Indexes for table `field`
--
ALTER TABLE `field`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fieldimage`
--
ALTER TABLE `fieldimage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FieldImage_fieldId_idx` (`fieldId`);

--
-- Indexes for table `fieldprice`
--
ALTER TABLE `fieldprice`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FieldPrice_fieldId_fkey` (`fieldId`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Payment_bookingId_key` (`bookingId`),
  ADD KEY `Payment_verifiedById_fkey` (`verifiedById`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `Admin_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `adminrole` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `Booking_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `field` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `fieldimage`
--
ALTER TABLE `fieldimage`
  ADD CONSTRAINT `FieldImage_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `field` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `fieldprice`
--
ALTER TABLE `fieldprice`
  ADD CONSTRAINT `FieldPrice_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `field` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `Payment_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `admin` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
