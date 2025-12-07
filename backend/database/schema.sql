CREATE TABLE IF NOT EXISTS `Users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `profilePicture` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Incidents` (
  `id` CHAR(36) NOT NULL,
  `type` ENUM('red-flag','intervention') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `location` JSON NOT NULL,
  `media` JSON NOT NULL,
  `status` ENUM('draft', 'under-investigation', 'resolved', 'rejected') NOT NULL DEFAULT 'under-investigation',
  `adminComment` TEXT,
  `userId` CHAR(36) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_incidents_user_idx` (`userId`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Notifications` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `incidentId` CHAR(36) NOT NULL,
  `incidentTitle` VARCHAR(255) NOT NULL,
  `type` ENUM('status-update','comment-added','new-incident') NOT NULL,
  `message` TEXT NOT NULL,
  `oldStatus` ENUM('draft', 'under-investigation', 'resolved', 'rejected'),
  `newStatus` ENUM('draft', 'under-investigation', 'resolved', 'rejected'),
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_notifications_user_idx` (`userId`),
  INDEX `fk_notifications_incident_idx` (`incidentId`)
) ENGINE=InnoDB;

