ALTER TABLE "invoiceQrCodes" ADD COLUMN "coin" varchar(64);--> statement-breakpoint
ALTER TABLE "siteSettings" ADD COLUMN "themeConfig" jsonb;