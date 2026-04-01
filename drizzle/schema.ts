import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  password: varchar("password", { length: 255 }), // Hashed password for credentials-based login
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Invoice table for storing invoice records
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 32 }).notNull().unique(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  serviceType: mysqlEnum("serviceType", ["virtual", "onsite", "custom"]).notNull(),
  description: text("description"),
  amountUsd: decimal("amountUsd", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: mysqlEnum("status", ["pending", "under_review", "paid", "expired", "rejected"]).default("pending").notNull(),
  walletAddresses: json("walletAddresses").notNull(), // { btc: "", usdt_trc20: "", etc }
  exchange: varchar("exchange", { length: 64 }), // binance, coinbase, bybit, ndax, bitget, or custom
  selectedNetwork: varchar("selectedNetwork", { length: 64 }), // btc, usdt_trc20, usdt_erc20, eth, usdc, etc
  selectedWalletAddress: varchar("selectedWalletAddress", { length: 255 }), // Specific address for the invoice
  selectedExchange: varchar("selectedExchange", { length: 64 }), // Specific exchange for the invoice
  selectedVideoUrl: text("selectedVideoUrl"), // Specific video tutorial link
  qrCodeUrl: text("qrCodeUrl"), // S3 URL to QR code image
  videoTutorialUrl: text("videoTutorialUrl"), // Legacy link to tutorial video
  paymentInstructions: text("paymentInstructions"), // Custom payment instructions
  uniqueSlug: varchar("uniqueSlug", { length: 64 }).notNull().unique(),
  isDeleted: boolean("isDeleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// Invoice QR codes table - store multiple QR codes per invoice for different networks
export const invoiceQrCodes = mysqlTable("invoiceQrCodes", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  network: varchar("network", { length: 64 }).notNull(), // btc, usdt_trc20, usdt_erc20, eth, usdc, etc
  qrCodeUrl: text("qrCodeUrl"), // S3 URL to QR code image (nullable if no image uploaded)
  walletAddress: text("walletAddress").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceQrCode = typeof invoiceQrCodes.$inferSelect;
export type InsertInvoiceQrCode = typeof invoiceQrCodes.$inferInsert;

// Invoice video tutorials table - store video links per invoice
export const invoiceVideoTutorials = mysqlTable("invoiceVideoTutorials", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  exchange: varchar("exchange", { length: 64 }).notNull(), // binance, coinbase, bybit, ndax, bitget
  videoUrl: text("videoUrl").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceVideoTutorial = typeof invoiceVideoTutorials.$inferSelect;
export type InsertInvoiceVideoTutorial = typeof invoiceVideoTutorials.$inferInsert;

// Payment proof table for storing uploaded payment evidence
export const paymentProofs = mysqlTable("paymentProofs", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  imageUrl: text("imageUrl").notNull(), // S3 URL
  imageKey: varchar("imageKey", { length: 255 }).notNull(), // S3 key for reference
  transactionId: varchar("transactionId", { length: 255 }).notNull(),
  exchangeUsed: varchar("exchangeUsed", { length: 64 }).notNull(), // Binance, Coinbase, etc
  cryptoNetwork: varchar("cryptoNetwork", { length: 64 }).notNull(), // BTC, USDT-TRC20, etc
  clientNotes: text("clientNotes"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"), // User ID of admin who verified
  status: mysqlEnum("status", ["pending", "approved", "rejected", "more_info_requested"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentProof = typeof paymentProofs.$inferSelect;
export type InsertPaymentProof = typeof paymentProofs.$inferInsert;

// Wallet configuration table
export const walletConfigs = mysqlTable("walletConfigs", {
  id: int("id").autoincrement().primaryKey(),
  network: varchar("network", { length: 64 }).notNull().unique(), // btc, usdt_trc20, usdt_erc20, eth_erc20, eth_base, eth_arbitrum, usdc_trc20, usdc_erc20
  address: varchar("address", { length: 255 }).notNull(),
  networkLabel: varchar("networkLabel", { length: 128 }).notNull(), // Display name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WalletConfig = typeof walletConfigs.$inferSelect;
export type InsertWalletConfig = typeof walletConfigs.$inferInsert;

// Exchange tutorials table
export const exchangeTutorials = mysqlTable("exchangeTutorials", {
  id: int("id").autoincrement().primaryKey(),
  exchangeName: varchar("exchangeName", { length: 64 }).notNull(), // Binance, Coinbase, Bybit, NDAX, Bitget
  videoUrl: text("videoUrl"),
  textGuide: text("textGuide"),
  stepByStepInstructions: json("stepByStepInstructions"), // Array of steps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExchangeTutorial = typeof exchangeTutorials.$inferSelect;
export type InsertExchangeTutorial = typeof exchangeTutorials.$inferInsert;

// FAQ items table
export const faqItems = mysqlTable("faqItems", {
  id: int("id").autoincrement().primaryKey(),
  question: varchar("question", { length: 512 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 64 }), // payment, verification, network, etc
  displayOrder: int("displayOrder").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = typeof faqItems.$inferInsert;

// Audit logs table for tracking payment verification actions
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // created, payment_submitted, approved, rejected, more_info_requested
  performedBy: int("performedBy"), // User ID, null for system actions
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
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
  trustBadgesJson: json("trustBadgesJson"), // Array of { icon: string, label: string }
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;