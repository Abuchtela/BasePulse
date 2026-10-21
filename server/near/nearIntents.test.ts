import { describe, expect, it, vi } from "vitest";
import type { GetExecutionStatusResponse, QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { evaluateNearIntent } from "./policy";
import { hashIntent } from "./receipt";
import { NearTreasuryService } from "./service";
import type { NearIntentsClient } from "./nearIntentsClient";
import { InMemoryNearIntentStore } from "./store";
import type { NearPolicyConfig, TreasuryIntent } from "./types";

const now = new Date("2026-10-21T00:00:00.000Z");
const config: NearPolicyConfig = {
  enabled: true,
  liveExecutionEnabled: false,
  maxPerActionUsd: 10,
  maxDailyUsd: 25,
  maxSlippageBps: 100,
  minTrendConfidence: 70,
  allowedOriginAssets: new Set(["nep141:base-usdc.omft.near"]),
  allowedDestinationAssets: new Set(["nep141:wrap.near"]),
  allowedRecipients: new Set(["amber.testnet"]),
  referral: "basepulse",
  quoteWaitingTimeMs: 3_000,
};
const intent: TreasuryIntent = {
  idempotencyKey: "trend:base:001",
  originAsset: "nep141:base-usdc.omft.near",
  destinationAsset: "nep141:wrap.near",
  amount: "1000000",
  estimatedAmountUsd: 1,
  recipient: "amber.testnet",
  refundTo: "amber.testnet",
  slippageBps: 50,
  expiresAt: "2026-10-21T00:05:00.000Z",
  executionMode: "simulation",
  sourceTrend: { theme: "agent payments", confidence: 91 },
};

function fakeQuote(depositAddress?: string): QuoteResponse {
  return {
    correlationId: "quote-1",
    timestamp: now.toISOString(),
    signature: "provider-signature",
    quoteRequest: {} as QuoteResponse["quoteRequest"],
    quote: {
      depositAddress,
      amountIn: "1000000",
      amountInFormatted: "1",
      amountInUsd: "1",
      minAmountIn: "1000000",
      amountOut: "1",
      amountOutFormatted: "1",
      amountOutUsd: "1",
      minAmountOut: "1",
      timeEstimate: 30,
    },
  };
}

describe("NEAR treasury policy", () => {
  it("approves an allowlisted simulation inside every limit", () => {
    expect(evaluateNearIntent(intent, config, { dailySpentUsd: 0, now })).toMatchObject({ approved: true, reasons: [] });
  });

  it("fails closed for excessive spend, slippage, and low-confidence trends", () => {
    const decision = evaluateNearIntent({
      ...intent,
      estimatedAmountUsd: 11,
      slippageBps: 101,
      sourceTrend: { theme: "weak", confidence: 69 },
    }, config, { dailySpentUsd: 20, now });
    expect(decision.approved).toBe(false);
    expect(decision.reasons).toEqual(expect.arrayContaining([
      "per-action spending limit exceeded",
      "daily spending limit exceeded",
      "slippage limit exceeded",
      "trend confidence is below policy threshold",
    ]));
  });

  it("does not allow live execution without the explicit live switch", () => {
    const decision = evaluateNearIntent({ ...intent, executionMode: "live" }, config, { dailySpentUsd: 0, now });
    expect(decision.reasons).toContain("live execution is disabled");
  });
});

describe("NEAR treasury service", () => {
  it("requests a dry quote and safely replays the same idempotency key", async () => {
    const client: NearIntentsClient = {
      tokens: vi.fn(async () => []),
      quote: vi.fn(async () => fakeQuote()),
      submitDepositTx: vi.fn(async () => undefined),
      getStatus: vi.fn(async () => ({} as GetExecutionStatusResponse)),
    };
    const service = new NearTreasuryService(config, client);
    const first = await service.prepare(intent, { now });
    const replay = await service.prepare(intent, { now });
    expect(client.quote).toHaveBeenCalledOnce();
    expect(client.quote).toHaveBeenCalledWith(intent, true);
    expect(first.receipt.status).toBe("quoted");
    expect(replay.replayed).toBe(true);
    expect(replay.receipt.receiptHash).toBe(first.receipt.receiptHash);
  });

  it("binds each idempotency key to exactly one intent", async () => {
    const client: NearIntentsClient = {
      tokens: vi.fn(async () => []),
      quote: vi.fn(async () => fakeQuote()),
      submitDepositTx: vi.fn(async () => undefined),
      getStatus: vi.fn(async () => ({} as GetExecutionStatusResponse)),
    };
    const service = new NearTreasuryService(config, client);
    await service.prepare(intent, { now });
    await expect(service.prepare({ ...intent, amount: "2000000" }, { now }))
      .rejects.toThrow("idempotency key is already bound to a different intent");
  });

  it("creates a deterministic intent hash", () => {
    expect(hashIntent(intent)).toBe(hashIntent({ ...intent }));
    expect(hashIntent(intent)).not.toBe(hashIntent({ ...intent, amount: "2" }));
  });

  it("preserves idempotency across service instances sharing a durable store", async () => {
    const store = new InMemoryNearIntentStore();
    const client: NearIntentsClient = {
      tokens: vi.fn(async () => []),
      quote: vi.fn(async () => fakeQuote()),
      submitDepositTx: vi.fn(async () => undefined),
      getStatus: vi.fn(async () => ({} as GetExecutionStatusResponse)),
    };
    await new NearTreasuryService(config, client, store).prepare(intent, { now });
    const replay = await new NearTreasuryService(config, client, store).prepare(intent, { now });
    expect(replay.replayed).toBe(true);
    expect(client.quote).toHaveBeenCalledOnce();
  });

  it("counts submitted live deposits toward the daily budget", async () => {
    const liveConfig = { ...config, liveExecutionEnabled: true, maxPerActionUsd: 20 };
    const store = new InMemoryNearIntentStore();
    const client: NearIntentsClient = {
      tokens: vi.fn(async () => []),
      quote: vi.fn(async () => fakeQuote("0xdeposit")),
      submitDepositTx: vi.fn(async () => undefined),
      getStatus: vi.fn(async () => ({} as GetExecutionStatusResponse)),
    };
    const service = new NearTreasuryService(liveConfig, client, store);
    const liveIntent = { ...intent, executionMode: "live" as const, estimatedAmountUsd: 10 };
    await service.prepare(liveIntent, { now });
    await service.submitDeposit(liveIntent.idempotencyKey, "0xtxhash", "0xdeposit");

    const second = await new NearTreasuryService(liveConfig, client, store).prepare({
      ...liveIntent,
      idempotencyKey: "trend:base:002",
      estimatedAmountUsd: 16,
    }, { now });
    expect(second.receipt.status).toBe("rejected");
    expect(second.receipt.policy.reasons).toContain("daily spending limit exceeded");
  });
});
