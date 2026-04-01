import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("invoices.getQrCodes", () => {
  it("should return empty array for non-existent invoice", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invoices.getQrCodes(999999);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("should be accessible without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw an error
    const result = await caller.invoices.getQrCodes(1);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("invoices.getVideoTutorials", () => {
  it("should return empty array for non-existent invoice", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invoices.getVideoTutorials(999999);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("should be accessible without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw an error
    const result = await caller.invoices.getVideoTutorials(1);
    expect(Array.isArray(result)).toBe(true);
  });
});


function createAuthContext(): { ctx: TrpcContext } {
  const user: any = {
    id: 1,
    openId: "test-admin",
    email: "admin@example.com",
    name: "Test Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("invoices.create with QR codes", () => {
  it("should create invoice with QR codes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invoices.create({
      clientName: "Test Client",
      clientEmail: "test@example.com",
      serviceType: "virtual",
      description: "Test invoice",
      amountUsd: "700",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      walletAddresses: { btc: "1A1z7agoat2LWQLZLQ5qhLFUVqKzaGVEZt" },
      exchange: "binance",
      qrCodes: [
        {
          network: "btc",
          walletAddress: "1A1z7agoat2LWQLZLQ5qhLFUVqKzaGVEZt",
          qrCodeUrl: undefined,
        },
      ],
    });

    expect(result.invoiceNumber).toBeDefined();
    expect(result.uniqueSlug).toBeDefined();
  });
});
