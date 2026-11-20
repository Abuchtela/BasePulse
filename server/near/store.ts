import { and, eq, gte, inArray } from "drizzle-orm";
import { nearIntentExecutions } from "../../drizzle/schema";
import { getDb } from "../db";
import type { PreparedNearIntent } from "./service";
import type { TreasuryIntent } from "./types";

export interface NearIntentStore {
  get(idempotencyKey: string): Promise<PreparedNearIntent | undefined>;
  save(intent: TreasuryIntent, prepared: PreparedNearIntent): Promise<void>;
  liveSpendSince(since: Date): Promise<number>;
}

export class InMemoryNearIntentStore implements NearIntentStore {
  private readonly records = new Map<string, { intent: TreasuryIntent; prepared: PreparedNearIntent }>();

  async get(idempotencyKey: string): Promise<PreparedNearIntent | undefined> {
    return this.records.get(idempotencyKey)?.prepared;
  }

  async save(intent: TreasuryIntent, prepared: PreparedNearIntent): Promise<void> {
    this.records.set(intent.idempotencyKey, { intent, prepared });
  }

  async liveSpendSince(since: Date): Promise<number> {
    let total = 0;
    for (const { intent, prepared } of this.records.values()) {
      if (intent.executionMode !== "live") continue;
      if (new Date(prepared.receipt.createdAt) < since) continue;
      if (["deposit_submitted", "processing", "success"].includes(prepared.receipt.status)) {
        total += intent.estimatedAmountUsd;
      }
    }
    return total;
  }
}

export class DbNearIntentStore implements NearIntentStore {
  async get(idempotencyKey: string): Promise<PreparedNearIntent | undefined> {
    const db = await getDb();
    if (!db) throw new Error("database is required for durable NEAR intent idempotency");
    const [record] = await db.select().from(nearIntentExecutions)
      .where(eq(nearIntentExecutions.idempotencyKey, idempotencyKey)).limit(1);
    if (!record) return undefined;
    return {
      replayed: false,
      intent: record.intent as TreasuryIntent,
      quote: record.quote as PreparedNearIntent["quote"],
      receipt: record.receipt as PreparedNearIntent["receipt"],
    };
  }

  async save(intent: TreasuryIntent, prepared: PreparedNearIntent): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("database is required for durable NEAR intent idempotency");
    const values = {
      idempotencyKey: intent.idempotencyKey,
      intentHash: prepared.receipt.intentHash,
      status: prepared.receipt.status,
      executionMode: intent.executionMode,
      estimatedAmountUSD: intent.estimatedAmountUsd.toFixed(2),
      intent,
      quote: prepared.quote ?? null,
      receipt: prepared.receipt,
    };
    await db.insert(nearIntentExecutions).values(values).onDuplicateKeyUpdate({
      set: {
        status: values.status,
        quote: values.quote,
        receipt: values.receipt,
      },
    });
  }

  async liveSpendSince(since: Date): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("database is required for durable NEAR intent budget tracking");
    const rows = await db.select({ amount: nearIntentExecutions.estimatedAmountUSD })
      .from(nearIntentExecutions)
      .where(and(
        eq(nearIntentExecutions.executionMode, "live"),
        inArray(nearIntentExecutions.status, ["deposit_submitted", "processing", "success"]),
        gte(nearIntentExecutions.createdAt, since),
      ));
    return rows.reduce((total, row) => total + Number(row.amount), 0);
  }
}
