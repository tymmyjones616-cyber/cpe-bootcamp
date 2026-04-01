import { pgTable, serial, text, timestamp, varchar, decimal, boolean, jsonb, pgEnum, integer } from "drizzle-orm/pg-core";

/**
 * Enums
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const serviceTypeEnum = pgEnum("serviceType", ["virtual", "onsite", "custom"]);
export const invoiceStatusEnum = pgEnum("status", ["pending", "under_review", "paid", "expired", "rejected"]);
export const proofStatusEnum = pgEnum("proof_status", ["pending", "approved", "rejected", "more_info_requested"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** OAuth identifier (e.g. from GitHub or custom) */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  password: varchar("password", { length: 255 }), // Hashed password for credentials-based login
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Invoice table for storing invoice records
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 32 }).notNull().unique(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  serviceType: serviceTypeEnum("serviceType").notNull(),
  description: text("description"),
  amountUsd: decimal("amountUsd", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: invoiceStatusEnum("status").default("pending").notNull(),
  walletAddresses: jsonb("walletAddresses").notNull(), // { btc: "", usdt_trc20: "", etc }
  exchange: varchar("exchange", { length: 64 }), 
  selectedNetwork: varchar("selectedNetwork", { length: 64 }), 
  selectedWalletAddress: varchar("selectedWalletAddress", { length: 255 }), 
  selectedExchange: varchar("selectedExchange", { length: 64 }), 
  selectedVideoUrl: text("selectedVideoUrl"), 
  qrCodeUrl: text("qrCodeUrl"), 
  videoTutorialUrl: text("videoTutorialUrl"), 
  paymentInstructions: text("paymentInstructions"), 
  uniqueSlug: varchar("uniqueSlug", { length: 64 }).notNull().unique(),
  isDeleted: boolean("isDeleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// Invoice QR codes table
export const invoiceQrCodes = pgTable("invoiceQrCodes", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoiceId").notNull(),
  coin: varchar("coin", { length: 64 }), 
  network: varchar("network", { length: 64 }).notNull(), 
  qrCodeUrl: text("qrCodeUrl"), 
  walletAddress: text("walletAddress").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceQrCode = typeof invoiceQrCodes.$inferSelect;
export type InsertInvoiceQrCode = typeof invoiceQrCodes.$inferInsert;

// Invoice video tutorials table
export const invoiceVideoTutorials = pgTable("invoiceVideoTutorials", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoiceId").notNull(),
  exchange: varchar("exchange", { length: 64 }).notNull(), 
  videoUrl: text("videoUrl").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceVideoTutorial = typeof invoiceVideoTutorials.$inferSelect;
export type InsertInvoiceVideoTutorial = typeof invoiceVideoTutorials.$inferInsert;

// Payment proof table
export const paymentProofs = pgTable("paymentProofs", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoiceId").notNull(),
  imageUrl: text("imageUrl").notNull(), 
  imageKey: varchar("imageKey", { length: 255 }).notNull(), 
  transactionId: varchar("transactionId", { length: 255 }).notNull(),
  exchangeUsed: varchar("exchangeUsed", { length: 64 }).notNull(), 
  cryptoNetwork: varchar("cryptoNetwork", { length: 64 }).notNull(), 
  clientNotes: text("clientNotes"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: integer("verifiedBy"), 
  status: proofStatusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PaymentProof = typeof paymentProofs.$inferSelect;
export type InsertPaymentProof = typeof paymentProofs.$inferInsert;

// Wallet configuration table
export const walletConfigs = pgTable("walletConfigs", {
  id: serial("id").primaryKey(),
  network: varchar("network", { length: 64 }).notNull().unique(), 
  address: varchar("address", { length: 255 }).notNull(),
  networkLabel: varchar("networkLabel", { length: 128 }).notNull(), 
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WalletConfig = typeof walletConfigs.$inferSelect;
export type InsertWalletConfig = typeof walletConfigs.$inferInsert;

// Exchange tutorials table
export const exchangeTutorials = pgTable("exchangeTutorials", {
  id: serial("id").primaryKey(),
  exchangeName: varchar("exchangeName", { length: 64 }).notNull(), 
  videoUrl: text("videoUrl"),
  textGuide: text("textGuide"),
  stepByStepInstructions: jsonb("stepByStepInstructions"), 
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ExchangeTutorial = typeof exchangeTutorials.$inferSelect;
export type InsertExchangeTutorial = typeof exchangeTutorials.$inferInsert;

// FAQ items table
export const faqItems = pgTable("faqItems", {
  id: serial("id").primaryKey(),
  question: varchar("question", { length: 512 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 64 }), 
  displayOrder: integer("displayOrder").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = typeof faqItems.$inferInsert;

// Audit logs table
export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoiceId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), 
  performedBy: integer("performedBy"), 
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const siteSettings = pgTable("siteSettings", {
  id: serial("id").primaryKey(),
  logoUrl: text("logoUrl"),
  siteName: varchar("siteName", { length: 255 }).default("CPE Bootcamp"),
  supportEmail: varchar("supportEmail", { length: 255 }),
  supportWhatsapp: varchar("supportWhatsapp", { length: 64 }),
  supportPhone: varchar("supportPhone", { length: 64 }),
  facebookUrl: text("facebookUrl"),
  physicalAddress: text("physicalAddress"),
  termsText: text("termsText"),
  privacyText: text("privacyText"),
  globalTutorialUrl: text("globalTutorialUrl"),
  trustBadgesJson: jsonb("trustBadgesJson"), 
  themeConfig: jsonb("themeConfig"), 
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;