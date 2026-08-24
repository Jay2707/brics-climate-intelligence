CREATE TABLE `climate_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceReportId` int,
	`createdBy` int NOT NULL,
	`city` varchar(120) NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`severity` enum('watch','elevated','high','critical') NOT NULL,
	`status` enum('draft','awaiting_approval','dispatched','closed') NOT NULL DEFAULT 'draft',
	`recipients` text NOT NULL,
	`deliveryChannel` enum('owner_notification','webhook_pending','manual') NOT NULL DEFAULT 'owner_notification',
	`approvedBy` int,
	`approvedAt` timestamp,
	`dispatchedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `climate_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`city` varchar(120) NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`incidentType` enum('smoke_haze','industrial_emissions','agricultural_burning','sensor_reading') NOT NULL,
	`description` text NOT NULL,
	`observedAt` timestamp NOT NULL,
	`consentProvided` int NOT NULL DEFAULT 0,
	`attachmentKey` text,
	`attachmentUrl` text,
	`attachmentMimeType` varchar(100),
	`verificationStatus` enum('submitted','under_review','corroborated','rejected','escalated') NOT NULL DEFAULT 'submitted',
	`reviewNote` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','reporter','verifier','city_desk','national_desk','admin') NOT NULL DEFAULT 'reporter',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `climate_alerts` ADD CONSTRAINT `climate_alerts_evidenceReportId_evidence_reports_id_fk` FOREIGN KEY (`evidenceReportId`) REFERENCES `evidence_reports`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `climate_alerts` ADD CONSTRAINT `climate_alerts_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `climate_alerts` ADD CONSTRAINT `climate_alerts_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence_reports` ADD CONSTRAINT `evidence_reports_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence_reports` ADD CONSTRAINT `evidence_reports_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `alert_status_idx` ON `climate_alerts` (`status`);--> statement-breakpoint
CREATE INDEX `alert_city_idx` ON `climate_alerts` (`city`);--> statement-breakpoint
CREATE INDEX `evidence_reporter_idx` ON `evidence_reports` (`reporterId`);--> statement-breakpoint
CREATE INDEX `evidence_status_idx` ON `evidence_reports` (`verificationStatus`);--> statement-breakpoint
CREATE INDEX `evidence_city_idx` ON `evidence_reports` (`city`);