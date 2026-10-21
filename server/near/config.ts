import type { NearPolicyConfig } from "./types";

function csvSet(value: string | undefined): ReadonlySet<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean),
  );
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

export function loadNearPolicyConfig(env: NodeJS.ProcessEnv = process.env): NearPolicyConfig {
  const referral = (env.NEAR_INTENTS_REFERRAL ?? "basepulse").toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(referral)) {
    throw new Error("NEAR_INTENTS_REFERRAL must contain only lowercase letters, numbers, underscores, or hyphens");
  }

  return {
    enabled: env.NEAR_INTENTS_ENABLED === "true",
    liveExecutionEnabled: env.NEAR_INTENTS_LIVE_EXECUTION === "true",
    maxPerActionUsd: positiveNumber(env.NEAR_INTENTS_MAX_ACTION_USD, 10),
    maxDailyUsd: positiveNumber(env.NEAR_INTENTS_MAX_DAILY_USD, 25),
    maxSlippageBps: boundedInteger(env.NEAR_INTENTS_MAX_SLIPPAGE_BPS, 100, 0, 5_000),
    minTrendConfidence: boundedInteger(env.NEAR_INTENTS_MIN_TREND_CONFIDENCE, 70, 0, 100),
    allowedOriginAssets: csvSet(env.NEAR_INTENTS_ALLOWED_ORIGIN_ASSETS),
    allowedDestinationAssets: csvSet(env.NEAR_INTENTS_ALLOWED_DESTINATION_ASSETS),
    allowedRecipients: csvSet(env.NEAR_INTENTS_ALLOWED_RECIPIENTS),
    referral,
    quoteWaitingTimeMs: boundedInteger(env.NEAR_INTENTS_QUOTE_WAIT_MS, 3_000, 0, 10_000),
  };
}

export function getNearConfigStatus(config = loadNearPolicyConfig()) {
  return {
    enabled: config.enabled,
    liveExecutionEnabled: config.liveExecutionEnabled,
    simulationOnly: !config.liveExecutionEnabled,
    hasJwt: Boolean(process.env.ONE_CLICK_JWT),
    configuredOriginAssets: config.allowedOriginAssets.size,
    configuredDestinationAssets: config.allowedDestinationAssets.size,
    configuredRecipients: config.allowedRecipients.size,
    maxPerActionUsd: config.maxPerActionUsd,
    maxDailyUsd: config.maxDailyUsd,
    maxSlippageBps: config.maxSlippageBps,
  };
}
