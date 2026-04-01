import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
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

describe("AI Generation", () => {
  it("generates invoice description with client name and service type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generateInvoiceDescription({
      clientName: "John Doe",
      serviceType: "virtual",
      amountUsd: "700",
    });

    expect(result.description).toBeDefined();
    expect(typeof result.description).toBe("string");
    expect(result.description.length).toBeGreaterThan(0);
    // Check if description contains any of the expected keywords
    const lowerDesc = result.description.toLowerCase();
    expect(lowerDesc.includes("bootcamp") || lowerDesc.includes("cpe") || lowerDesc.includes("john")).toBe(true);
  }, { timeout: 10000 });

  it("generates payment instructions for exchange and network", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.generatePaymentInstructions({
      exchange: "binance",
      network: "btc",
      amountUsd: "700",
    });

    expect(result.instructions).toBeDefined();
    expect(typeof result.instructions).toBe("string");
    expect(result.instructions.length).toBeGreaterThan(0);
    expect(result.instructions.toLowerCase()).toContain("binance" || "payment" || "crypto");
  });

  it("generates different descriptions for different service types", async () => {
    // Note: LLM calls may take longer than default timeout
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const virtualDesc = await caller.ai.generateInvoiceDescription({
      clientName: "Jane Smith",
      serviceType: "virtual",
      amountUsd: "700",
    });

    const onsiteDesc = await caller.ai.generateInvoiceDescription({
      clientName: "Jane Smith",
      serviceType: "onsite",
      amountUsd: "2500",
    });

    expect(virtualDesc.description).toBeDefined();
    expect(onsiteDesc.description).toBeDefined();
    expect(virtualDesc.description).not.toBe(onsiteDesc.description);
  }, { timeout: 15000 });

  it("generates instructions for different exchanges", async () => {
    // Note: LLM calls may take longer than default timeout
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const binanceInstructions = await caller.ai.generatePaymentInstructions({
      exchange: "binance",
      network: "usdt_trc20",
      amountUsd: "700",
    });

    const coinbaseInstructions = await caller.ai.generatePaymentInstructions({
      exchange: "coinbase",
      network: "eth",
      amountUsd: "700",
    });

    expect(binanceInstructions.instructions).toBeDefined();
    expect(coinbaseInstructions.instructions).toBeDefined();
    expect(binanceInstructions.instructions).not.toBe(coinbaseInstructions.instructions);
  }, { timeout: 15000 });
});
