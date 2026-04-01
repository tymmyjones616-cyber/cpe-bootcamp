CREATE TABLE `invoiceQrCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`network` varchar(64) NOT NULL,
	`qrCodeUrl` text NOT NULL,
	`walletAddress` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceQrCodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoiceVideoTutorials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`exchange` varchar(64) NOT NULL,
	`videoUrl` text NOT NULL,
	`title` varchar(255),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceVideoTutorials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `selectedNetwork` varchar(64);--> statement-breakpoint
ALTER TABLE `invoices` ADD `qrCodeUrl` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `videoTutorialUrl` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `paymentInstructions` text;