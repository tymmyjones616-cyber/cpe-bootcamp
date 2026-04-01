CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`logoUrl` text,
	`siteName` varchar(255) DEFAULT 'CPE Bootcamp',
	`supportEmail` varchar(255),
	`supportWhatsapp` varchar(64),
	`supportPhone` varchar(64),
	`facebookUrl` text,
	`physicalAddress` text,
	`termsText` text,
	`privacyText` text,
	`globalTutorialUrl` text,
	`trustBadgesJson` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `selectedWalletAddress` varchar(255);--> statement-breakpoint
ALTER TABLE `invoices` ADD `selectedExchange` varchar(64);--> statement-breakpoint
ALTER TABLE `invoices` ADD `selectedVideoUrl` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `isDeleted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);