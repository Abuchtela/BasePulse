import type { NearPolicyConfig, PolicyContext, PolicyDecision, TreasuryIntent } from "./types";

const MIN_QUOTE_LIFETIME_MS = 60_000;
const MAX_QUOTE_LIFETIME_MS = 15 * 60_000;

export function evaluateNearIntent(
  intent: TreasuryIntent,
  config: NearPolicyConfig,
  context: PolicyContext,
): PolicyDecision {
  const now = context.now ?? new Date();
  const expiryMs = new Date(intent.expiresAt).getTime();
  const remainingMs = expiryMs - now.getTime();
  const reasons: string[] = [];

  if (!config.enabled) reasons.push("NEAR Intents integration is disabled");
  if (!config.allowedOriginAssets.has(intent.originAsset)) reasons.push("origin asset is not allowlisted");
  if (!config.allowedDestinationAssets.has(intent.destinationAsset)) reasons.push("destination asset is not allowlisted");
  if (intent.originAsset === intent.destinationAsset) reasons.push("origin and destination assets must differ");
  if (intent.estimatedAmountUsd > config.maxPerActionUsd) reasons.push("per-action spending limit exceeded");
  if (context.dailySpentUsd + intent.estimatedAmountUsd > config.maxDailyUsd) reasons.push("daily spending limit exceeded");
  if (intent.slippageBps > config.maxSlippageBps) reasons.push("slippage limit exceeded");
  if (remainingMs < MIN_QUOTE_LIFETIME_MS) reasons.push("intent expires too soon or is already expired");
  if (remainingMs > MAX_QUOTE_LIFETIME_MS) reasons.push("intent expiry exceeds the 15-minute safety window");
  if (intent.sourceTrend && intent.sourceTrend.confidence < config.minTrendConfidence) {
    reasons.push("trend confidence is below policy threshold");
  }

  if (intent.executionMode === "live") {
    if (!config.liveExecutionEnabled) reasons.push("live execution is disabled");
    if (!config.allowedRecipients.has(intent.recipient)) reasons.push("recipient is not allowlisted");
    if (!config.allowedRecipients.has(intent.refundTo)) reasons.push("refund address is not allowlisted");
  }

  return {
    approved: reasons.length === 0,
    mode: intent.executionMode,
    reasons,
    checkedAt: now.toISOString(),
  };
}
