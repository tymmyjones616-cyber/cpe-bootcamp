CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`performedBy` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchangeTutorials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exchangeName` varchar(64) NOT NULL,
	`videoUrl` text,
	`textGuide` text,
	`stepByStepInstructions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exchangeTutorials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faqItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` varchar(512) NOT NULL,
	`answer` text NOT NULL,
	`category` varchar(64),
	`displayOrder` int DEFAULT 0,
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faqItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(32) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`serviceType` enum('virtual','onsite','custom') NOT NULL,
	`description` text,
	`amountUsd` decimal(10,2) NOT NULL,
	`dueDate` timestamp NOT NULL,
	`status` enum('pending','under_review','paid','expired','rejected') NOT NULL DEFAULT 'pending',
	`walletAddresses` json NOT NULL,
	`uniqueSlug` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`),
	CONSTRAINT `invoices_uniqueSlug_unique` UNIQUE(`uniqueSlug`)
);
--> statement-breakpoint
CREATE TABLE `paymentProofs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(255) NOT NULL,
	`transactionId` varchar(255) NOT NULL,
	`exchangeUsed` varchar(64) NOT NULL,
	`cryptoNetwork` varchar(64) NOT NULL,
	`clientNotes` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`status` enum('pending','approved','rejected','more_info_requested') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentProofs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `walletConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`network` varchar(64) NOT NULL,
	`address` varchar(255) NOT NULL,
	`networkLabel` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `walletConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `walletConfigs_network_unique` UNIQUE(`network`)
);
