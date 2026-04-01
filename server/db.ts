import { eq, desc, and, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, invoices, paymentProofs, walletConfigs, faqItems, auditLogs, InsertInvoice, InsertPaymentProof, InsertWalletConfig, InsertFaqItem, InsertAuditLog, invoiceQrCodes, invoiceVideoTutorials, siteSettings, InsertSiteSettings } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Invoice queries
export async function createInvoice(data: InsertInvoice): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.insert(invoices).values(data);
}

export async function getInvoiceBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.uniqueSlug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvoiceByNumber(invoiceNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listInvoices(filters?: { status?: string; clientName?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  if (filters?.status) {
    conditions.push(eq(invoices.status, filters.status as any));
  }
  if (filters?.clientName) {
    conditions.push(like(invoices.clientName, `%${filters.clientName}%`));
  }
  
  // Filter out deleted invoices by default
  conditions.push(eq(invoices.isDeleted, false));
  
  if (conditions.length > 0) {
    return await db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.createdAt));
  }
  
  return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function updateInvoiceStatus(invoiceId: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(invoices).set({ status: status as any, updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
}

// Payment proof queries
export async function createPaymentProof(data: InsertPaymentProof): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(paymentProofs).values(data);
}

export async function getPaymentProofsByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(paymentProofs).where(eq(paymentProofs.invoiceId, invoiceId)).orderBy(desc(paymentProofs.submittedAt));
}

export async function getPaymentProofById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(paymentProofs).where(eq(paymentProofs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePaymentProofStatus(proofId: number, status: string, verifiedBy?: number, rejectionReason?: string, adminNotes?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status: status as any, updatedAt: new Date() };
  if (verifiedBy) updateData.verifiedBy = verifiedBy;
  if (verifiedBy) updateData.verifiedAt = new Date();
  if (rejectionReason) updateData.rejectionReason = rejectionReason;
  if (adminNotes) updateData.adminNotes = adminNotes;
  await db.update(paymentProofs).set(updateData).where(eq(paymentProofs.id, proofId));
}

export async function listPendingPaymentProofs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(paymentProofs).where(eq(paymentProofs.status, "pending")).orderBy(desc(paymentProofs.submittedAt));
}

// Wallet config queries
export async function getWalletConfig(network: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(walletConfigs).where(eq(walletConfigs.network, network)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listWalletConfigs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(walletConfigs);
}

export async function upsertWalletConfig(data: InsertWalletConfig): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(walletConfigs).values(data).onDuplicateKeyUpdate({ set: { address: data.address, updatedAt: new Date() } });
}

// FAQ queries
export async function listFaqItems() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(faqItems).where(eq(faqItems.active, true)).orderBy(faqItems.displayOrder);
}

export async function createFaqItem(data: InsertFaqItem): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(faqItems).values(data);
}

// Audit log queries
export async function getPaymentProofsWithInvoices() {
  const db = await getDb();
  if (!db) return [];
  // Return combined data with invoice details
  const proofs = await db.select().from(paymentProofs).orderBy(desc(paymentProofs.submittedAt));
  const result = [];
  for (const proof of proofs) {
    const invoice = await getInvoiceById(proof.invoiceId);
    result.push({ proof, invoice });
  }
  return result;
}

export async function createAuditLog(data: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(auditLogs).values(data);
}

export async function getAuditLogsByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditLogs).where(eq(auditLogs.invoiceId, invoiceId)).orderBy(desc(auditLogs.createdAt));
}

// Invoice QR code queries
export async function createInvoiceQrCode(data: any): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(invoiceQrCodes).values(data);
}

export async function getInvoiceQrCodes(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invoiceQrCodes).where(eq(invoiceQrCodes.invoiceId, invoiceId));
}

export async function deleteInvoiceQrCode(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(invoiceQrCodes).where(eq(invoiceQrCodes.id, id));
}

// Invoice video tutorial queries
export async function createInvoiceVideoTutorial(data: any): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(invoiceVideoTutorials).values(data);
}

export async function getInvoiceVideoTutorials(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invoiceVideoTutorials).where(eq(invoiceVideoTutorials.invoiceId, invoiceId));
}

export async function deleteInvoiceVideoTutorial(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(invoiceVideoTutorials).where(eq(invoiceVideoTutorials.id, id));
}

// Update invoice with main QR code and video URL
export async function updateInvoiceQrAndVideo(invoiceId: number, qrCodeUrl?: string, videoTutorialUrl?: string, paymentInstructions?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { updatedAt: new Date() };
  if (qrCodeUrl) updateData.qrCodeUrl = qrCodeUrl;
  if (videoTutorialUrl) updateData.videoTutorialUrl = videoTutorialUrl;
  if (paymentInstructions) updateData.paymentInstructions = paymentInstructions;
  await db.update(invoices).set(updateData).where(eq(invoices.id, invoiceId));
}

// Delete invoice and all related records
export async function deleteInvoice(invoiceId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete payment proofs
  await db.delete(paymentProofs).where(eq(paymentProofs.invoiceId, invoiceId));
  
  // Delete QR codes
  await db.delete(invoiceQrCodes).where(eq(invoiceQrCodes.invoiceId, invoiceId));
  
  // Delete video tutorials
  await db.delete(invoiceVideoTutorials).where(eq(invoiceVideoTutorials.invoiceId, invoiceId));
  
  // Delete invoice
  await db.delete(invoices).where(eq(invoices.id, invoiceId));
}


export async function updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {};
  if (data.clientName !== undefined) updateData.clientName = data.clientName;
  if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;
  if (data.amountUsd !== undefined) updateData.amountUsd = data.amountUsd;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.exchange !== undefined) updateData.exchange = data.exchange;
  if (data.walletAddresses !== undefined) updateData.walletAddresses = data.walletAddresses;
  if (data.description !== undefined) updateData.description = data.description;
  
  updateData.updatedAt = new Date();
  
  await db.update(invoices).set(updateData).where(eq(invoices.id, id));
}

// CMS Settings queries
export async function getSiteSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSiteSettings(data: Partial<InsertSiteSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getSiteSettings();
  if (existing) {
    await db.update(siteSettings).set({ ...data, updatedAt: new Date() }).where(eq(siteSettings.id, existing.id));
  } else {
    await db.insert(siteSettings).values(data as any);
  }
}

// Admin seeding logic
export async function seedAdmin(email: string, rawPassword: string) {
  const db = await getDb();
  if (!db) return;

  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  
  await db.insert(users).values({
    openId: `admin-${email}`,
    email,
    password: hashedPassword,
    role: "admin",
    name: "Admin",
    loginMethod: "credentials"
  }).onDuplicateKeyUpdate({
    set: {
      password: hashedPassword,
      role: "admin"
    }
  });

  // Seed default site settings if null
  const settings = await getSiteSettings();
  if (!settings) {
    await updateSiteSettings({
      siteName: "CPE Bootcamp",
      supportEmail: "support@cpe-bootcamp.online",
      physicalAddress: "5909 State Highway 142 W, Doniphan, MO, United States, 63935",
      trustBadgesJson: [
        { icon: "ShieldCheck", label: "Verified Merchant" },
        { icon: "Lock", label: "SSL Secure Payment" }
      ]
    });
  }
}
