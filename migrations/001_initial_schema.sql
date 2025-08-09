-- Create the new database for v4 if it doesn't already exist
CREATE DATABASE IF NOT EXISTS `mydayhub_v4` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mydayhub_v4`;

--
-- Table structure for table `users`
-- This table holds user credentials and all their personalized settings in a single JSON field.
--
CREATE TABLE `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` TEXT NOT NULL,
  `public_key` TEXT,
  `encrypted_private_key` TEXT,
  -- For future subscription plans
  `plan` ENUM('free', 'pro') NOT NULL DEFAULT 'free',
  -- Centralized preferences for flexibility
  `preferences` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `columns`
-- This table stores the user-created columns for the Tasks board.
--
CREATE TABLE `columns` (
  `column_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `column_name` VARCHAR(255) NOT NULL,
  `position` INT NOT NULL DEFAULT 0,
  `is_private` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `tasks`
-- This holds the individual tasks. Each task is now directly associated with a user.
--
CREATE TABLE `tasks` (
  `task_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `column_id` INT NOT NULL,
  `encrypted_data` TEXT NOT NULL,
  `position` INT NOT NULL DEFAULT 0,
  -- Using ENUM for readable status, preventing data type mismatches
  `status` ENUM('normal', 'priority', 'completed') NOT NULL DEFAULT 'normal',
  `due_date` DATE DEFAULT NULL,
  `is_private` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`column_id`) REFERENCES `columns`(`column_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;