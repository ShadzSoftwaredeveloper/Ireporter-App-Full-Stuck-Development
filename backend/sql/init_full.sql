CREATE DATABASE IF NOT EXISTS `ireports_db`
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
USE `ireports_db`;

-- Users table
CREATE TABLE IF NOT EXISTS `Users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `profilePicture` VARCHAR(255),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Incidents table (location and media use JSON)
CREATE TABLE IF NOT EXISTS `Incidents` (
  `id` CHAR(36) NOT NULL,
  `type` ENUM('red-flag','intervention') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `location` JSON NOT NULL,
  `media` JSON NOT NULL,
  `status` ENUM('draft','under-investigation','resolved','rejected') NOT NULL DEFAULT 'under-investigation',
  `adminComment` TEXT,
  `userId` CHAR(36) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_incidents_user_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS `Notifications` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `incidentId` CHAR(36) NOT NULL,
  `incidentTitle` VARCHAR(255) NOT NULL,
  `type` ENUM('status-update','comment-added','new-incident') NOT NULL,
  `message` TEXT NOT NULL,
  `oldStatus` ENUM('draft','under-investigation','resolved','rejected'),
  `newStatus` ENUM('draft','under-investigation','resolved','rejected'),
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_notifications_user_idx` (`userId`),
  INDEX `fk_notifications_incident_idx` (`incidentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




DELETE FROM Users WHERE email = 'mugerwashadrach@gmail.com';

INSERT INTO `Users` (`id`, `email`, `password`, `name`, `role`)
VALUES (
  UUID(),
  'mugerwashadrach@gmail.com',
  '$2b$10$wqQG5QyJ0C8nB6p1BH5lVuhJ0IspA1EoBB5oAqTjsFdpFz9EFfRcm', -- password: Admin@123
  'System Administrator',
  'admin'
)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  name = VALUES(name),
  role = VALUES(role);

SELECT * FROM Users WHERE email = 'mugerwashadrach@gmail.com';
UPDATE Users
SET role = 'admin'
WHERE email = 'shadz@gmail.com';


DELETE FROM Users WHERE email ='shadz@gmail.com';

INSERT INTO `Users` (`id`, `email`, `password`, `name`, `role`)
VALUES (
  UUID(),
  'mugerwa@gmail.com',
  '$2b$10$wqQG5QyJ0C8nB6p1BH5lVuhJ0IspA1EoBB5oAqTjsFdpFz9EFfRcm',
  'System Administrator',
  'admin'
)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  name = VALUES(name),
  role = VALUES(role);


USE `ireports_db`;

SHOW TABLES;
-- Ensure media_files table exists (used by the app)
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` CHAR(36) NOT NULL,
  `incident_id` CHAR(36) NOT NULL,
  `url` LONGTEXT,
  `thumbnail` LONGTEXT,
  `media_type` ENUM('image','video') DEFAULT 'image',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_media_incident_idx` (`incident_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW CREATE TABLE media_files;

UPDATE Users
SET password = '$2a$10$jpQAoZdq7n/K3TuAgbciVeuymgQNTteYJG201Vcdzhj0DKDBzvt9.',
    role = 'admin',
    name = 'Site Administrator' -- optional, change if you want
WHERE email = 'mugerwashadrach@gmail.com';
SELECT * FROM incidents;
