import { z } from "zod";

const positiveIntegerString = z
  .string()
  .regex(/^[1-9]\d*$/, "amount must be a positive integer in the asset's smallest unit");

export const treasuryIntentSchema = z.object({
  idempotencyKey: z.string().min(8).max(128).regex(/^[a-zA-Z0-9:_-]+$/),
  originAsset: z.string().min(3).max(255),
  destinationAsset: z.string().min(3).max(255),
  amount: positiveIntegerString,
  estimatedAmountUsd: z.number().positive().finite(),
  recipient: z.string().min(2).max(255),
  refundTo: z.string().min(2).max(255),
  slippageBps: z.number().int().min(0).max(5_000),
  expiresAt: z.string().datetime({ offset: true }),
  executionMode: z.enum(["simulation", "live"]).default("simulation"),
  sourceTrend: z
    .object({
      theme: z.string().min(1).max(160),
      confidence: z.number().min(0).max(100),
    })
    .optional(),
});

export type TreasuryIntent = z.infer<typeof treasuryIntentSchema>;

export interface NearPolicyConfig {
  enabled: boolean;
  liveExecutionEnabled: boolean;
  maxPerActionUsd: number;
  maxDailyUsd: number;
  maxSlippageBps: number;
  minTrendConfidence: number;
  allowedOriginAssets: ReadonlySet<string>;
  allowedDestinationAssets: ReadonlySet<string>;
  allowedRecipients: ReadonlySet<string>;
  referral: string;
  quoteWaitingTimeMs: number;
}

export interface PolicyContext {
  dailySpentUsd: number;
  now?: Date;
}

export interface PolicyDecision {
  approved: boolean;
  mode: "simulation" | "live";
  reasons: string[];
  checkedAt: string;
}

export type ReceiptStatus =
  | "rejected"
  | "quoted"
  | "deposit_submitted"
  | "processing"
  | "success"
  | "refunded"
  | "failed";

export interface ExecutionReceipt {
  receiptVersion: 1;
  receiptHash: string;
  intentHash: string;
  idempotencyKey: string;
  policy: PolicyDecision;
  status: ReceiptStatus;
  correlationId?: string;
  depositAddress?: string;
  depositMemo?: string;
  depositTxHash?: string;
  nearTxHashes?: string[];
  destinationTxHashes?: string[];
  createdAt: string;
  updatedAt: string;
}
