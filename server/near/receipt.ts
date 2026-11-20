import { createHash } from "node:crypto";
import type { ExecutionReceipt, PolicyDecision, ReceiptStatus, TreasuryIntent } from "./types";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

export function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex")}`;
}

export function hashIntent(intent: TreasuryIntent): string {
  return sha256(intent);
}

export function createExecutionReceipt(input: {
  intent: TreasuryIntent;
  policy: PolicyDecision;
  status: ReceiptStatus;
  correlationId?: string;
  depositAddress?: string;
  depositMemo?: string;
  depositTxHash?: string;
  nearTxHashes?: string[];
  destinationTxHashes?: string[];
  now?: Date;
}): ExecutionReceipt {
  const timestamp = (input.now ?? new Date()).toISOString();
  const unsigned = {
    receiptVersion: 1 as const,
    intentHash: hashIntent(input.intent),
    idempotencyKey: input.intent.idempotencyKey,
    policy: input.policy,
    status: input.status,
    correlationId: input.correlationId,
    depositAddress: input.depositAddress,
    depositMemo: input.depositMemo,
    depositTxHash: input.depositTxHash,
    nearTxHashes: input.nearTxHashes,
    destinationTxHashes: input.destinationTxHashes,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return { ...unsigned, receiptHash: sha256(unsigned) };
}
