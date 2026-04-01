CREATE TYPE "public"."status" AS ENUM('pending', 'under_review', 'paid', 'expired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."proof_status" AS ENUM('pending', 'approved', 'rejected', 'more_info_requested');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."serviceType" AS ENUM('virtual', 'onsite', 'custom');--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoiceId" integer NOT NULL,
	"action" varchar(64) NOT NULL,
	"performedBy" integer,
	"details" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchangeTutorials" (
	"id" serial PRIMARY KEY NOT NULL,
	"exchangeName" varchar(64) NOT NULL,
	"videoUrl" text,
	"textGuide" text,
	"stepByStepInstructions" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" varchar(512) NOT NULL,
	"answer" text NOT NULL,
	"category" varchar(64),
	"displayOrder" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoiceQrCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoiceId" integer NOT NULL,
	"network" varchar(64) NOT NULL,
	"qrCodeUrl" text,
	"walletAddress" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoiceVideoTutorials" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoiceId" integer NOT NULL,
	"exchange" varchar(64) NOT NULL,
	"videoUrl" text NOT NULL,
	"title" varchar(255),
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoiceNumber" varchar(32) NOT NULL,
	"clientName" varchar(255) NOT NULL,
	"clientEmail" varchar(320) NOT NULL,
	"serviceType" "serviceType" NOT NULL,
	"description" text,
	"amountUsd" numeric(10, 2) NOT NULL,
	"dueDate" timestamp NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"walletAddresses" jsonb NOT NULL,
	"exchange" varchar(64),
	"selectedNetwork" varchar(64),
	"selectedWalletAddress" varchar(255),
	"selectedExchange" varchar(64),
	"selectedVideoUrl" text,
	"qrCodeUrl" text,
	"videoTutorialUrl" text,
	"paymentInstructions" text,
	"uniqueSlug" varchar(64) NOT NULL,
	"isDeleted" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoiceNumber_unique" UNIQUE("invoiceNumber"),
	CONSTRAINT "invoices_uniqueSlug_unique" UNIQUE("uniqueSlug")
);
--> statement-breakpoint
CREATE TABLE "paymentProofs" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoiceId" integer NOT NULL,
	"imageUrl" text NOT NULL,
	"imageKey" varchar(255) NOT NULL,
	"transactionId" varchar(255) NOT NULL,
	"exchangeUsed" varchar(64) NOT NULL,
	"cryptoNetwork" varchar(64) NOT NULL,
	"clientNotes" text,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"verifiedAt" timestamp,
	"verifiedBy" integer,
	"status" "proof_status" DEFAULT 'pending' NOT NULL,
	"rejectionReason" text,
	"adminNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siteSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"logoUrl" text,
	"siteName" varchar(255) DEFAULT 'CPE Bootcamp',
	"supportEmail" varchar(255),
	"supportWhatsapp" varchar(64),
	"supportPhone" varchar(64),
	"facebookUrl" text,
	"physicalAddress" text,
	"termsText" text,
	"privacyText" text,
	"globalTutorialUrl" text,
	"trustBadgesJson" jsonb,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"password" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "walletConfigs" (
	"id" serial PRIMARY KEY NOT NULL,
	"network" varchar(64) NOT NULL,
	"address" varchar(255) NOT NULL,
	"networkLabel" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "walletConfigs_network_unique" UNIQUE("network")
);
