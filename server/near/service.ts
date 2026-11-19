import type { GetExecutionStatusResponse, QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { evaluateNearIntent } from "./policy";
import { createExecutionReceipt, sha256 } from "./receipt";
import type { ExecutionReceipt, NearPolicyConfig, PolicyContext, ReceiptStatus, TreasuryIntent } from "./types";
import type { NearIntentsClient } from "./nearIntentsClient";
import { InMemoryNearIntentStore, type NearIntentStore } from "./store";

export interface PreparedNearIntent {
  replayed: boolean;
  intent: TreasuryIntent;
  receipt: ExecutionReceipt;
  quote?: QuoteResponse;
}

function statusToReceiptStatus(status: GetExecutionStatusResponse["status"]): ReceiptStatus {
  switch (status) {
    case "SUCCESS": return "success";
    case "REFUNDED": return "refunded";
    case "FAILED": return "failed";
    default: return "processing";
  }
}

export class NearTreasuryService {
  constructor(
    private readonly config: NearPolicyConfig,
    private readonly client: NearIntentsClient,
    private readonly store: NearIntentStore = new InMemoryNearIntentStore(),
  ) {}

  async prepare(intent: TreasuryIntent, context: Omit<PolicyContext, "dailySpentUsd"> = {}): Promise<PreparedNearIntent> {
    const existing = await this.store.get(intent.idempotencyKey);
    if (existing) {
      if (existing.receipt.intentHash !== sha256(intent)) {
        throw new Error("idempotency key is already bound to a different intent");
      }
      return { ...existing, replayed: true };
    }

    const now = context.now ?? new Date();
    const startOfUtcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dailySpentUsd = await this.store.liveSpendSince(startOfUtcDay);
    const policy = evaluateNearIntent(intent, this.config, { dailySpentUsd, now });
    if (!policy.approved) {
      const rejected = { replayed: false, intent, receipt: createExecutionReceipt({ intent, policy, status: "rejected" }) };
      await this.store.save(intent, rejected);
      return rejected;
    }

    const dry = intent.executionMode === "simulation" || !this.config.liveExecutionEnabled;
    const quote = await this.client.quote(intent, dry);
    if (!dry && !quote.quote.depositAddress) {
      throw new Error("live NEAR Intents quote did not return a deposit address");
    }

    const prepared = {
      replayed: false,
      intent,
      quote,
      receipt: createExecutionReceipt({
        intent,
        policy,
        status: "quoted",
        correlationId: quote.correlationId,
        depositAddress: quote.quote.depositAddress,
        depositMemo: quote.quote.depositMemo,
      }),
    };
    await this.store.save(intent, prepared);
    return prepared;
  }

  async submitDeposit(idempotencyKey: string, txHash: string, depositAddress: string): Promise<ExecutionReceipt> {
    const prepared = await this.store.get(idempotencyKey);
    if (!prepared?.quote || !prepared.receipt.policy.approved) throw new Error("intent has not been approved and quoted");
    if (!this.config.liveExecutionEnabled || prepared.receipt.policy.mode !== "live") {
      throw new Error("deposit submission is unavailable in simulation mode");
    }
    if (prepared.receipt.depositAddress !== depositAddress) throw new Error("deposit address does not match the signed quote");

    if (prepared.receipt.depositTxHash) {
      if (prepared.receipt.depositTxHash !== txHash) throw new Error("idempotency key already has a different deposit transaction");
      return prepared.receipt;
    }

    await this.client.submitDepositTx(txHash, depositAddress);
    const now = new Date().toISOString();
    const receipt = {
      ...prepared.receipt,
      status: "deposit_submitted" as const,
      depositTxHash: txHash,
      updatedAt: now,
    };
    receipt.receiptHash = sha256({ ...receipt, receiptHash: undefined });
    await this.store.save(prepared.intent, { ...prepared, receipt });
    return receipt;
  }

  async status(idempotencyKey: string): Promise<{ receipt: ExecutionReceipt; provider: GetExecutionStatusResponse }> {
    const prepared = await this.store.get(idempotencyKey);
    const depositAddress = prepared?.receipt.depositAddress;
    if (!prepared || !depositAddress) throw new Error("intent does not have a live deposit address");

    const provider = await this.client.getStatus(depositAddress, prepared.receipt.depositMemo);
    const now = new Date().toISOString();
    const receipt = {
      ...prepared.receipt,
      status: statusToReceiptStatus(provider.status),
      nearTxHashes: provider.swapDetails.nearTxHashes,
      destinationTxHashes: provider.swapDetails.destinationChainTxHashes.map(tx => tx.hash),
      updatedAt: now,
    };
    receipt.receiptHash = sha256({ ...receipt, receiptHash: undefined });
    await this.store.save(prepared.intent, { ...prepared, receipt });
    return { receipt, provider };
  }
}
