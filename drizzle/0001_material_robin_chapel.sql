ALTER TABLE `evidence_reports` ADD `latitude` decimal(10,6);--> statement-breakpoint
ALTER TABLE `evidence_reports` ADD `longitude` decimal(10,6);--> statement-breakpoint
ALTER TABLE `evidence_reports` ADD `municipality` varchar(160);--> statement-breakpoint
ALTER TABLE `evidence_reports` ADD `aiClassification` text;--> statement-breakpoint
ALTER TABLE `evidence_reports` ADD `aiSeverity` enum('watch','elevated','high','critical');--> statement-breakpoint
ALTER TABLE `evidence_reports` ADD `aiConfidence` int;