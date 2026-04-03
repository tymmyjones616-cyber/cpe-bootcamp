var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  githubToken: process.env.GITHUB_TOKEN ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  vercelToken: process.env.VERCEL_TOKEN ?? ""
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  exchangeTutorials: () => exchangeTutorials,
  faqItems: () => faqItems,
  invoiceQrCodes: () => invoiceQrCodes,
  invoiceStatusEnum: () => invoiceStatusEnum,
  invoiceVideoTutorials: () => invoiceVideoTutorials,
  invoices: () => invoices,
  paymentProofs: () => paymentProofs,
  proofStatusEnum: () => proofStatusEnum,
  roleEnum: () => roleEnum,
  serviceTypeEnum: () => serviceTypeEnum,
  siteSettings: () => siteSettings,
  users: () => users,
  walletConfigs: () => walletConfigs
});
import { pgTable, serial, text, timestamp, varchar, decimal, boolean, jsonb, pgEnum, integer } from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["user", "admin"]);
var serviceTypeEnum = pgEnum("serviceType", ["virtual", "onsite", "custom"]);
var invoiceStatusEnum = pgEnum("status", ["pending", "under_review", "paid", "expired", "rejected"]);
var proofStatusEnum = pgEnum("proof_status", ["pending", "approved", "rejected", "more_info_requested"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** OAuth identifier (e.g. from GitHub or custom) */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  password: varchar("password", { length: 255 }),
  // Hashed password for credentials-based login
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 32 }).notNull().unique(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  serviceType: serviceTypeEnum("serviceType").notNull(),
  description: text("description"),
  amountUsd: decimal("amountUsd", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: invoiceStatusEnum("status").default("pending").notNull(),
  walletAddresses: jsonb("walletAddresses").notNull(),
  // { btc: "", usdt_trc20: "", etc }
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var invoiceQrCodes = pgTable("invoiceQrCodes", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoiceId").notNull(),
  coin: varchar("coin", { length: 64 }),
  network: varchar("network", { length: 64 }).notNull(),
  qrCodeUrl: text("qrCodeUrl"),
  walletAddress: text("walletAddress").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var invoiceVideoTutorials = pgTable("invoiceVideoTutorials", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoiceId").notNull(),
  exchange: varchar("exchange", { length: 64 }).notNull(),
  videoUrl: text("videoUrl").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var paymentProofs = pgTable("paymentProofs", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var walletConfigs = pgTable("walletConfigs", {
  id: serial("id").primaryKey(),
  network: varchar("network", { length: 64 }).notNull().unique(),
  address: varchar("address", { length: 255 }).notNull(),
  networkLabel: varchar("networkLabel", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var exchangeTutorials = pgTable("exchangeTutorials", {
  id: serial("id").primaryKey(),
  exchangeName: varchar("exchangeName", { length: 64 }).notNull(),
  videoUrl: text("videoUrl"),
  textGuide: text("textGuide"),
  stepByStepInstructions: jsonb("stepByStepInstructions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var faqItems = pgTable("faqItems", {
  id: serial("id").primaryKey(),
  question: varchar("question", { length: 512 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 64 }),
  displayOrder: integer("displayOrder").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoiceId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  performedBy: integer("performedBy"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var siteSettings = pgTable("siteSettings", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

// server/db.ts
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
var supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceKey);
var db;
try {
  if (ENV.databaseUrl) {
    const client = postgres(ENV.databaseUrl, {
      ssl: "require",
      max: 1
      // For serverless environments, keep pool size small
    });
    db = drizzle(client, { schema: schema_exports });
    console.log("Database connection initialized successfully");
  } else {
    console.warn("DATABASE_URL is not set. Database features will be unavailable.");
  }
} catch (err) {
  console.error("Failed to initialize database connection:", err.message);
}
async function getUserByOpenId(openId) {
  if (openId === "tymmyjones616@gmail.com") {
    console.log("Using emergency admin fallback for:", openId);
    return {
      id: 999,
      openId: "tymmyjones616@gmail.com",
      email: "tymmyjones616@gmail.com",
      name: "Super Admin",
      role: "admin",
      password: "$2b$10$kFgm.IxGamLYiSvzr6zMjuVBx5cys1I5Vd5.Grw6d3KYHH1wSCNsS",
      // Hash for 'Dracco237?'
      loginMethod: "credentials"
    };
  }
  if (ENV.supabaseUrl && ENV.supabaseServiceKey) {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("openId", openId).single();
      if (!error && data) return data;
      if (error && error.code !== "PGRST116") console.error("Supabase REST error:", error);
    } catch (err) {
      console.error("Supabase client crash:", err);
    }
  }
  if (db) {
    try {
      const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      return result[0];
    } catch (err) {
      console.error("Drizzle select failed:", err);
    }
  }
  return null;
}
async function createUser(data) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}
async function updateUser(id, data) {
  const result = await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
  return result[0];
}
async function upsertUser(data) {
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    return await updateUser(existing.id, data);
  }
  return await createUser(data);
}
async function seedAdmin(email, passwordRaw) {
  const existing = await getUserByOpenId(email);
  const hashedPassword = await bcrypt.hash(passwordRaw, 10);
  if (existing) {
    return await updateUser(existing.id, {
      password: hashedPassword,
      role: "admin"
    });
  }
  const { data, error } = await supabase.from("users").upsert({
    openId: email,
    email,
    name: "Admin",
    password: hashedPassword,
    role: "admin",
    loginMethod: "credentials",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "openId" }).select().single();
  if (error) {
    console.error("Supabase Upsert error:", error);
  }
  return data;
}
var DEFAULT_SITE_SETTINGS = {
  siteName: "CPE Bootcamp",
  supportEmail: "support@cpe-bootcamp.online",
  supportWhatsapp: "+1234567890",
  termsText: "Standard Terms and Conditions apply.",
  privacyText: "Your privacy is important to us.",
  themeConfig: {
    primary: "#0ea5e9",
    radius: "0.5rem"
  }
};
async function listInvoices(isDeleted = false) {
  try {
    return await db.select().from(invoices).where(eq(invoices.isDeleted, isDeleted)).orderBy(desc(invoices.createdAt));
  } catch (err) {
    console.warn("DB listInvoices failed, using simulation data:", err.message);
    return [
      {
        id: 1,
        invoiceNumber: "INV-2024-001",
        uniqueSlug: "sim-123",
        amountUsd: "250.00",
        status: "pending",
        isDeleted: false,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
  }
}
async function getInvoiceBySlug(slug) {
  const result = await db.select().from(invoices).where(eq(invoices.uniqueSlug, slug)).limit(1);
  return result[0];
}
async function getInvoiceById(id) {
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}
async function getInvoiceByNumber(invoiceNumber) {
  const result = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
  return result[0];
}
async function createInvoice(data) {
  const result = await db.insert(invoices).values(data).returning();
  return result[0];
}
async function updateInvoice(id, data) {
  const result = await db.update(invoices).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(invoices.id, id)).returning();
  return result[0];
}
async function updateInvoiceStatus(id, status) {
  return await updateInvoice(id, { status });
}
async function createInvoiceQrCode(data) {
  const result = await db.insert(invoiceQrCodes).values(data).returning();
  return result[0];
}
async function getInvoiceQrCodes(invoiceId) {
  return await db.select().from(invoiceQrCodes).where(eq(invoiceQrCodes.invoiceId, invoiceId));
}
async function deleteInvoiceQrCode(id) {
  return await db.delete(invoiceQrCodes).where(eq(invoiceQrCodes.id, id)).returning();
}
async function createInvoiceVideoTutorial(data) {
  const result = await db.insert(invoiceVideoTutorials).values(data).returning();
  return result[0];
}
async function getInvoiceVideoTutorials(invoiceId) {
  return await db.select().from(invoiceVideoTutorials).where(eq(invoiceVideoTutorials.invoiceId, invoiceId));
}
async function deleteInvoiceVideoTutorial(id) {
  return await db.delete(invoiceVideoTutorials).where(eq(invoiceVideoTutorials.id, id)).returning();
}
async function createPaymentProof(data) {
  const result = await db.insert(paymentProofs).values(data).returning();
  return result[0];
}
async function getPaymentProofById(id) {
  const result = await db.select().from(paymentProofs).where(eq(paymentProofs.id, id)).limit(1);
  return result[0];
}
async function getPaymentProofsByInvoiceId(invoiceId) {
  return await db.select().from(paymentProofs).where(eq(paymentProofs.invoiceId, invoiceId)).orderBy(desc(paymentProofs.createdAt));
}
async function getPaymentProofsWithInvoices() {
  return await db.select({
    proof: paymentProofs,
    invoice: invoices
  }).from(paymentProofs).innerJoin(invoices, eq(paymentProofs.invoiceId, invoices.id)).orderBy(desc(paymentProofs.createdAt));
}
async function listPendingPaymentProofs() {
  const result = await db.select({
    proof: paymentProofs,
    invoice: invoices
  }).from(paymentProofs).innerJoin(invoices, eq(paymentProofs.invoiceId, invoices.id)).where(eq(paymentProofs.status, "pending")).orderBy(desc(paymentProofs.createdAt));
  return result.map((r) => r.proof);
}
async function updatePaymentProofStatus(proofId, status, adminId, rejectionReason, notes) {
  const result = await db.update(paymentProofs).set({
    status,
    adminNotes: notes,
    rejectionReason,
    verifiedBy: adminId,
    verifiedAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(paymentProofs.id, proofId)).returning();
  return result[0];
}
async function createAuditLog(data) {
  const result = await db.insert(auditLogs).values(data).returning();
  return result[0];
}
async function getSiteSettings() {
  try {
    const result = await db.select().from(siteSettings).limit(1);
    if (result[0]) return result[0];
    console.log("Initializing default site settings...");
    const initialized = await db.insert(siteSettings).values(DEFAULT_SITE_SETTINGS).returning();
    return initialized[0];
  } catch (err) {
    console.error("Failed to get site settings, using defaults:", err.message);
    return { ...DEFAULT_SITE_SETTINGS, id: 0 };
  }
}
async function updateSiteSettings(data) {
  const settings = await getSiteSettings();
  if (settings) {
    const result2 = await db.update(siteSettings).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(siteSettings.id, settings.id)).returning();
    return result2[0];
  }
  const result = await db.insert(siteSettings).values(data).returning();
  return result[0];
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: isSecureRequest(req) ? "none" : "lax",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var SDKServer = class {
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a user openId (email or unique ID)
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  /**
   * Authentication method for tRPC context
   */
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const user = await getUserByOpenId(session.openId);
    if (!user) {
      throw ForbiddenError("User not found");
    }
    try {
      await updateUser(user.id, { lastSignedIn: /* @__PURE__ */ new Date() });
    } catch (err) {
      console.warn("[Auth] Failed to update lastSignedIn", String(err));
    }
    return user;
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) return /* @__PURE__ */ new Map();
    const items = cookieHeader.split(";").map((c) => c.trim().split("="));
    return new Map(items);
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/storage.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var supabase2 = createClient2(ENV.supabaseUrl, ENV.supabaseServiceKey);
var BUCKET_NAME = "payment-proofs";
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const key = relKey.replace(/^\/+/, "");
  const { data: uploadData, error } = await supabase2.storage.from(BUCKET_NAME).upload(key, data, {
    contentType,
    upsert: true
  });
  if (error) {
    console.error(`Supabase Storage upload error for bucket '${BUCKET_NAME}':`, error);
    throw new Error(`Supabase Storage upload failed: ${error.message}. Please ensure the '${BUCKET_NAME}' bucket exists and is public.`);
  }
  const { data: { publicUrl } } = supabase2.storage.from(BUCKET_NAME).getPublicUrl(key);
  return { key, url: publicUrl };
}

// server/routers.ts
import { nanoid } from "nanoid";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/services/exchange.ts
import axios from "axios";
var CACHE_TTL = 60 * 1e3;
var lastFetch = 0;
var cachedRates = {};
var COIN_MAP = {
  "usdt": "tether",
  "btc": "bitcoin",
  "eth": "ethereum",
  "bnb": "binancecoin"
};
async function fetchCryptoRates() {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL && Object.keys(cachedRates).length > 0) {
    return cachedRates;
  }
  try {
    const ids = Object.values(COIN_MAP).join(",");
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const data = response.data;
    const rates = {};
    for (const [key, id] of Object.entries(COIN_MAP)) {
      if (data[id]) {
        rates[key] = data[id].usd;
      }
    }
    cachedRates = rates;
    lastFetch = now;
    return rates;
  } catch (error) {
    console.error("[Exchange] Failed to fetch rates:", error);
    return cachedRates;
  }
}

// server/services/email.ts
import { Resend } from "resend";
var resend = new Resend(process.env.RESEND_API_KEY || "re_9wNW3wcj_H8GN5YKgjv3iCYMTEv24JddY");
async function sendInvoiceEmail(to, clientName, invoiceNumber, amountUsd, invoiceUrl) {
  try {
    await resend.emails.send({
      from: "CPE Bootcamp <billing@cpe-bootcamp.online>",
      to: [to],
      subject: `New Invoice ${invoiceNumber} - CPE Bootcamp`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>New Invoice Created</h1>
          <p>Hello ${clientName},</p>
          <p>A new invoice has been generated for your recent bootcamp services.</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
            <p><strong>Amount:</strong> $${amountUsd} USD</p>
          </div>
          <p>You can view and pay your invoice online at the following link:</p>
          <a href="${invoiceUrl}" style="display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px;">View Invoice</a>
          <p>If you have any questions, please contact our support.</p>
          <p>Best regards,<br/>CPE Bootcamp Team</p>
        </div>
      `
    });
  } catch (error) {
    console.error("[Email] Failed to send invoice email:", error);
  }
}
async function sendPaymentProofNotification(adminEmail, clientName, invoiceNumber) {
  try {
    await resend.emails.send({
      from: "CPE Billing System <billing@cpe-bootcamp.online>",
      to: [adminEmail],
      subject: `Payment Proof Submitted: ${invoiceNumber}`,
      html: `
        <div style="font-family: sans-serif;">
          <h1>New Payment Proof Submitted</h1>
          <p>Client ${clientName} has submitted a payment proof for invoice <strong>${invoiceNumber}</strong>.</p>
          <p>Please log in to the admin panel to review and verify the transaction.</p>
        </div>
      `
    });
  } catch (error) {
    console.error("[Email] Failed to send admin notification:", error);
  }
}
async function sendPaymentStatusUpdate(to, clientName, invoiceNumber, status, reason) {
  const isApproved = status === "approved";
  const statusLabel = isApproved ? "Approved" : "Rejected";
  const color = isApproved ? "#10b981" : "#ef4444";
  try {
    await resend.emails.send({
      from: "CPE Bootcamp <billing@cpe-bootcamp.online>",
      to: [to],
      subject: `Invoice ${invoiceNumber} Payment ${statusLabel}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${color};">Payment ${statusLabel}</h1>
          <p>Hello ${clientName},</p>
          <p>Your payment for invoice <strong>${invoiceNumber}</strong> has been ${statusLabel.toLowerCase()}.</p>
          ${!isApproved && reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>You can view the latest status here:</p>
          <a href="${process.env.APP_URL || ""}/invoice/${invoiceNumber}" style="display: inline-block; padding: 10px 20px; background: ${color}; color: white; text-decoration: none; border-radius: 5px;">View Latest Status</a>
          <p>Thank you for your business!</p>
        </div>
      `
    });
  } catch (error) {
    console.error("[Email] Failed to send status update email:", error);
  }
}

// server/routers.ts
import bcrypt2 from "bcryptjs";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(z2.object({ email: z2.string().email(), password: z2.string() })).mutation(async ({ input, ctx }) => {
      console.log(`[AUTH] Login attempt for: ${input.email}`);
      try {
        const user = await getUserByOpenId(input.email);
        if (!user || user.role !== "admin") {
          console.warn(`[AUTH] User not found or not admin: ${input.email}`);
          throw new TRPCError3({
            code: "UNAUTHORIZED",
            message: "Invalid credentials or unauthorized"
          });
        }
        if (!user.password) {
          console.warn(`[AUTH] User has no password set: ${input.email}`);
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "Account not configured for password login"
          });
        }
        console.log(`[AUTH] User found, comparing password...`);
        const isValid = await bcrypt2.compare(input.password, user.password);
        if (!isValid) {
          console.warn(`[AUTH] Password mismatch for: ${input.email}`);
          throw new TRPCError3({
            code: "UNAUTHORIZED",
            message: "Invalid credentials"
          });
        }
        console.log(`[AUTH] Login successful for: ${input.email}. Generating token...`);
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email || ""
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS
        });
        console.log(`[AUTH] Session cookie set for: ${input.email}`);
        return { success: true };
      } catch (err) {
        console.error(`[AUTH] Login error for ${input.email}:`, err);
        if (err instanceof TRPCError3) throw err;
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Authentication failed"
        });
      }
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions });
      return {
        success: true
      };
    })
  }),
  invoices: router({
    create: protectedProcedure.input(z2.object({
      clientName: z2.string().min(1),
      clientEmail: z2.string().email(),
      serviceType: z2.enum(["virtual", "onsite", "custom"]),
      description: z2.string(),
      amountUsd: z2.string(),
      dueDate: z2.date(),
      walletAddresses: z2.record(z2.string(), z2.string()),
      exchange: z2.string().optional(),
      qrCodes: z2.array(z2.object({
        coin: z2.string().optional().default("USDT"),
        network: z2.string(),
        walletAddress: z2.string(),
        qrCodeUrl: z2.string().optional()
      })).optional(),
      videoTutorials: z2.array(z2.object({
        exchange: z2.string(),
        videoUrl: z2.string(),
        title: z2.string().optional(),
        description: z2.string().optional()
      })).optional()
    })).mutation(async ({ input }) => {
      const invoiceNumber = `CPE-INV-${String(Date.now()).slice(-5)}`;
      const slugBase = input.clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const uniqueSlug = `${slugBase || "invoice"}-${nanoid(6)}`;
      const invoiceResult = await createInvoice({
        invoiceNumber,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        serviceType: input.serviceType,
        description: input.description,
        amountUsd: input.amountUsd,
        dueDate: input.dueDate,
        walletAddresses: input.walletAddresses,
        exchange: input.exchange,
        selectedNetwork: input.qrCodes?.[0]?.network,
        // Default to first selected network
        selectedWalletAddress: input.qrCodes?.[0]?.walletAddress,
        selectedExchange: input.exchange,
        selectedVideoUrl: input.videoTutorials?.[0]?.videoUrl,
        uniqueSlug,
        status: "pending"
      });
      const invoice = await getInvoiceByNumber(invoiceNumber);
      if (invoice && input.qrCodes && input.qrCodes.length > 0) {
        for (const qr of input.qrCodes) {
          let finalQrCodeUrl = qr.qrCodeUrl;
          if (finalQrCodeUrl && finalQrCodeUrl.startsWith("data:")) {
            try {
              const base64Data = finalQrCodeUrl.split(",")[1];
              const buffer = Buffer.from(base64Data, "base64");
              const uploadResult = await storagePut(
                `qr-codes/${invoice.id}/${qr.network}-${Date.now()}.png`,
                buffer,
                "image/png"
              );
              finalQrCodeUrl = uploadResult.url;
            } catch (error) {
              console.error("Failed to upload QR code to S3:", error);
            }
          }
          await createInvoiceQrCode({
            invoiceId: invoice.id,
            coin: qr.coin,
            network: qr.network,
            walletAddress: qr.walletAddress,
            qrCodeUrl: finalQrCodeUrl
          });
        }
      }
      if (invoice && input.videoTutorials && input.videoTutorials.length > 0) {
        for (const video of input.videoTutorials) {
          await createInvoiceVideoTutorial({
            invoiceId: invoice.id,
            exchange: video.exchange,
            videoUrl: video.videoUrl,
            title: video.title,
            description: video.description
          });
        }
      }
      try {
        await sendInvoiceEmail(
          input.clientEmail,
          input.clientName,
          invoiceNumber,
          input.amountUsd,
          `${process.env.APP_URL || ""}/invoice/${uniqueSlug}`
        );
      } catch (error) {
        console.warn("Failed to send invoice email:", error);
      }
      try {
        await notifyOwner({
          title: "New Invoice Created",
          content: `Invoice ${invoiceNumber} created for ${input.clientName} - $${input.amountUsd}`
        });
      } catch (error) {
        console.warn("Failed to notify owner:", error);
      }
      return { invoiceNumber, uniqueSlug };
    }),
    list: protectedProcedure.query(async () => {
      return await listInvoices();
    }),
    getBySlug: publicProcedure.input(z2.string()).query(async ({ input }) => {
      return await getInvoiceBySlug(input);
    }),
    getById: protectedProcedure.input(z2.number()).query(async ({ input }) => {
      return await getInvoiceById(input);
    }),
    getQrCodes: publicProcedure.input(z2.number()).query(async ({ input }) => {
      return await getInvoiceQrCodes(input);
    }),
    getVideoTutorials: publicProcedure.input(z2.number()).query(async ({ input }) => {
      return await getInvoiceVideoTutorials(input);
    }),
    edit: protectedProcedure.input(z2.object({
      id: z2.number(),
      clientName: z2.string().optional(),
      clientEmail: z2.string().email().optional(),
      amountUsd: z2.string().optional(),
      dueDate: z2.date().optional(),
      description: z2.string().optional(),
      exchange: z2.string().optional(),
      walletAddresses: z2.record(z2.string(), z2.string()).optional(),
      qrCodes: z2.array(z2.object({
        coin: z2.string().optional().default("USDT"),
        network: z2.string(),
        walletAddress: z2.string(),
        qrCodeUrl: z2.string().optional()
      })).optional(),
      videoTutorials: z2.array(z2.object({
        exchange: z2.string(),
        videoUrl: z2.string(),
        title: z2.string().optional(),
        description: z2.string().optional()
      })).optional()
    })).mutation(async ({ input }) => {
      const invoice = await getInvoiceById(input.id);
      if (!invoice) throw new Error("Invoice not found");
      const updateData = {};
      if (input.clientName) updateData.clientName = input.clientName;
      if (input.clientEmail) updateData.clientEmail = input.clientEmail;
      if (input.amountUsd) updateData.amountUsd = input.amountUsd;
      if (input.dueDate) updateData.dueDate = input.dueDate;
      if (input.description) updateData.description = input.description;
      if (input.exchange) updateData.exchange = input.exchange;
      if (input.walletAddresses) updateData.walletAddresses = input.walletAddresses;
      await updateInvoice(input.id, updateData);
      if (input.qrCodes) {
        const existingQrCodes = await getInvoiceQrCodes(input.id);
        for (const existing of existingQrCodes) {
          await deleteInvoiceQrCode(existing.id);
        }
        for (const qr of input.qrCodes) {
          await createInvoiceQrCode({
            invoiceId: input.id,
            coin: qr.coin,
            network: qr.network,
            walletAddress: qr.walletAddress,
            qrCodeUrl: qr.qrCodeUrl
          });
        }
      }
      if (input.videoTutorials) {
        const existingVideos = await getInvoiceVideoTutorials(input.id);
        for (const existing of existingVideos) {
          await deleteInvoiceVideoTutorial(existing.id);
        }
        for (const video of input.videoTutorials) {
          await createInvoiceVideoTutorial({
            invoiceId: input.id,
            exchange: video.exchange,
            videoUrl: video.videoUrl,
            title: video.title,
            description: video.description
          });
        }
      }
      await createAuditLog({
        invoiceId: input.id,
        action: "invoice_edited",
        details: JSON.stringify({ updated: Object.keys(updateData) })
      });
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.number()).mutation(async ({ input, ctx }) => {
      const invoice = await getInvoiceById(input);
      if (!invoice) throw new Error("Invoice not found");
      await updateInvoice(input, { isDeleted: true });
      await createAuditLog({
        invoiceId: input,
        action: "deleted",
        performedBy: ctx.user?.id,
        details: "Invoice marked as deleted by admin"
      });
      return { success: true };
    })
  }),
  paymentProofs: router({
    listPending: protectedProcedure.query(async () => {
      const proofs = await listPendingPaymentProofs();
      const result = [];
      for (const proof of proofs) {
        const invoice = await getInvoiceById(proof.invoiceId);
        result.push({ proof, invoice });
      }
      return result;
    }),
    getWithInvoices: protectedProcedure.query(async () => {
      return await getPaymentProofsWithInvoices();
    }),
    getByInvoiceId: protectedProcedure.input(z2.number()).query(async ({ input }) => {
      return await getPaymentProofsByInvoiceId(input);
    }),
    approve: protectedProcedure.input(z2.object({
      proofId: z2.number(),
      adminNotes: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const proof = await getPaymentProofById(input.proofId);
      if (!proof) throw new Error("Payment proof not found");
      const invoice = await getInvoiceById(proof.invoiceId);
      if (!invoice) throw new Error("Invoice not found");
      await updatePaymentProofStatus(input.proofId, "approved", ctx.user?.id, void 0, input.adminNotes);
      await updateInvoiceStatus(invoice.id, "paid");
      await createAuditLog({
        invoiceId: invoice.id,
        action: "approved",
        performedBy: ctx.user?.id,
        details: `Payment proof approved. ${input.adminNotes || ""}`
      });
      const appUrl = process.env.APP_URL || "";
      try {
        await sendPaymentStatusUpdate(
          invoice.clientEmail,
          invoice.clientName,
          invoice.invoiceNumber,
          "approved"
        );
      } catch (error) {
        console.warn("Failed to send payment status update email:", error);
      }
      try {
        await notifyOwner({
          title: "Payment Approved",
          content: `Invoice ${invoice.invoiceNumber} payment has been approved. Client: ${invoice.clientName}`
        });
      } catch (error) {
        console.warn("Failed to notify owner:", error);
      }
      return { success: true };
    }),
    reject: protectedProcedure.input(z2.object({
      proofId: z2.number(),
      reason: z2.string(),
      adminNotes: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const proof = await getPaymentProofById(input.proofId);
      if (!proof) throw new Error("Payment proof not found");
      const invoice = await getInvoiceById(proof.invoiceId);
      if (!invoice) throw new Error("Invoice not found");
      await updatePaymentProofStatus(input.proofId, "rejected", ctx.user?.id, input.reason, input.adminNotes);
      await createAuditLog({
        invoiceId: invoice.id,
        action: "rejected",
        performedBy: ctx.user?.id,
        details: `Payment proof rejected. Reason: ${input.reason}. ${input.adminNotes || ""}`
      });
      try {
        await sendPaymentStatusUpdate(
          invoice.clientEmail,
          invoice.clientName,
          invoice.invoiceNumber,
          "rejected",
          input.reason
        );
      } catch (error) {
        console.warn("Failed to send payment status update email (rejected):", error);
      }
      try {
        await notifyOwner({
          title: "Payment Rejected",
          content: `Invoice ${invoice.invoiceNumber} payment has been rejected. Reason: ${input.reason}`
        });
      } catch (error) {
        console.warn("Failed to notify owner:", error);
      }
      return { success: true };
    }),
    submit: publicProcedure.input(z2.object({
      invoiceSlug: z2.string(),
      imageBase64: z2.string(),
      transactionId: z2.string(),
      exchangeUsed: z2.string(),
      cryptoNetwork: z2.string(),
      clientNotes: z2.string().optional()
    })).mutation(async ({ input }) => {
      const invoice = await getInvoiceBySlug(input.invoiceSlug);
      if (!invoice) throw new Error("Invoice not found");
      const buffer = Buffer.from(input.imageBase64, "base64");
      const fileKey = `payment-proofs/${invoice.id}-${nanoid()}.jpg`;
      const { url } = await storagePut(fileKey, buffer, "image/jpeg");
      await createPaymentProof({
        invoiceId: invoice.id,
        imageUrl: url,
        imageKey: fileKey,
        transactionId: input.transactionId,
        exchangeUsed: input.exchangeUsed,
        cryptoNetwork: input.cryptoNetwork,
        clientNotes: input.clientNotes,
        status: "pending"
      });
      await updateInvoiceStatus(invoice.id, "under_review");
      await createAuditLog({
        invoiceId: invoice.id,
        action: "payment_submitted",
        details: `Payment proof submitted via ${input.exchangeUsed}`
      });
      try {
        await sendPaymentProofNotification(
          process.env.ADMIN_EMAIL || "admin@cpe-bootcamp.online",
          invoice.clientName,
          invoice.invoiceNumber
        );
      } catch (error) {
        console.warn("Failed to send payment proof notification email:", error);
      }
      try {
        await notifyOwner({
          title: "Payment Proof Received",
          content: `Payment proof received for invoice ${invoice.invoiceNumber}. Awaiting verification.`
        });
      } catch (error) {
        console.warn("Failed to notify owner:", error);
      }
      return { success: true };
    })
  }),
  ai: router({
    generateInvoiceDescription: protectedProcedure.input(z2.object({
      clientName: z2.string(),
      serviceType: z2.enum(["virtual", "onsite", "custom"]),
      amountUsd: z2.string()
    })).mutation(async ({ input }) => {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("AI services are currently unavailable (Missing API Key). Please enter the description manually.");
      }
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a professional invoice description writer for CPE Bootcamp. Generate concise, professional invoice descriptions."
            },
            {
              role: "user",
              content: `Generate a professional invoice description for a CPE Bootcamp ${input.serviceType} bootcamp for client ${input.clientName}. Amount: $${input.amountUsd}. Keep it to 2-3 sentences.`
            }
          ]
        });
        const description = response.choices[0]?.message.content || "";
        return { description };
      } catch (error) {
        console.error("AI service error:", error);
        throw new Error("Failed to generate description with AI. Please try again or enter manually.");
      }
    }),
    generatePaymentInstructions: protectedProcedure.input(z2.object({
      exchange: z2.string(),
      network: z2.string(),
      amountUsd: z2.string()
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant for cryptocurrency payment instructions. Generate clear, step-by-step payment instructions."
          },
          {
            role: "user",
            content: `Generate payment instructions for sending $${input.amountUsd} USD worth of crypto via ${input.exchange} on the ${input.network} network. Keep it concise (3-4 sentences) and beginner-friendly.`
          }
        ]
      });
      const instructions = response.choices[0]?.message.content || "";
      return { instructions };
    })
  }),
  exchange: router({
    getRates: publicProcedure.query(async () => {
      return await fetchCryptoRates();
    })
  }),
  analytics: router({
    getMetrics: protectedProcedure.query(async () => {
      const invoicesList = await listInvoices();
      const proofs = await getPaymentProofsWithInvoices();
      const totalRevenue = invoicesList.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.amountUsd), 0);
      const pendingCount = proofs.filter((p) => p.proof.status === "pending").length;
      const successRate = invoicesList.length > 0 ? invoicesList.filter((inv) => inv.status === "paid").length / invoicesList.length * 100 : 0;
      return {
        totalRevenue,
        pendingCount,
        successRate: Math.round(successRate),
        totalInvoices: invoicesList.length
      };
    })
  }),
  cms: router({
    getSettings: publicProcedure.query(async () => {
      return await getSiteSettings();
    }),
    updateSettings: protectedProcedure.input(z2.object({
      logoUrl: z2.string().optional(),
      siteName: z2.string().optional(),
      supportEmail: z2.string().optional(),
      supportWhatsapp: z2.string().optional(),
      supportPhone: z2.string().optional(),
      facebookUrl: z2.string().optional(),
      physicalAddress: z2.string().optional(),
      termsText: z2.string().optional(),
      privacyText: z2.string().optional(),
      globalTutorialUrl: z2.string().optional(),
      themeConfig: z2.record(z2.string(), z2.string()).optional()
    })).mutation(async ({ input }) => {
      await updateSiteSettings(input);
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path from "path";
async function setupVite(app, server) {
  const viteModule = await Function('return import("vite")')();
  const createViteServer = viteModule.createServer;
  const viteConfigModule = await Function('return import("../../vite.config.js")')();
  const viteConfig = viteConfigModule.default || viteConfigModule;
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path.resolve(import.meta.dirname, "../..", "dist", "public") : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
import dns from "dns";
dns.setDefaultResultOrder("verbatim");
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function createServerApp(skipStatic = false) {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (!skipStatic) {
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  }
  return { app, server };
}
async function startServer() {
  const { app, server } = await createServerApp();
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    try {
      await seedAdmin("tymmyjones616@gmail.com", "Dracco237?");
      console.log("Admin seeded/verified: tymmyjones616@gmail.com");
    } catch (err) {
      console.error("Failed to seed admin:", err);
    }
  });
}
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer().catch(console.error);
}

// api/index.ts
var index_default = async (req, res) => {
  const { app } = await createServerApp(true);
  return app(req, res);
};
export {
  index_default as default
};
