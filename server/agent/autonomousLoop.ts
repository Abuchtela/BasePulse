/**
 * Autonomous Loop Orchestrator for BasePulse Agent
 * Coordinates trend monitoring, analysis, and token deployment
 */

import {
  analyzeSocialTrends,
  validateTrendThreshold,
  storeTrendAnalysis,
  generateTokenMetadata,
} from "./trendMonitor";
import { deployToken } from "./tokenDeployer";
import { getTreasuryBalance, createAgentMetric } from "../db";
import {
  fetchVerifiedOnChainMetrics,
  fetchVerifiedSocialPosts,
} from "./verifiedSources";

interface AutonomousLoopConfig {
  enabled: boolean;
  intervalMinutes: number;
  minSentimentScore: number;
  minMentions: number;
  minVolume24hUSD: number;
  maxDeploymentsPerDay: number;
}

let deploymentCountToday = 0;
let lastResetDate = new Date().toDateString();

/**
 * Main autonomous loop - runs periodically to monitor trends and deploy tokens
 */
export async function runAutonomousLoop(
  config: AutonomousLoopConfig
): Promise<void> {
  if (!config.enabled) {
    console.log("[AutonomousLoop] Loop is disabled");
    return;
  }

  try {
    console.log("[AutonomousLoop] Starting autonomous loop iteration");

    // Reset daily deployment counter
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
      deploymentCountToday = 0;
      lastResetDate = today;
    }

    // Step 1: Fetch externally sourced posts with HTTPS evidence and timestamps.
    // Missing, stale, or malformed evidence aborts this iteration.
    const posts = await fetchVerifiedSocialPosts();

    // Step 2: Analyze trends using LLM
    console.log("[AutonomousLoop] Analyzing social trends...");
    const trends = await analyzeSocialTrends(posts);
    console.log(`[AutonomousLoop] Found ${trends.length} potential trends`);
    const onChainMetrics = await fetchVerifiedOnChainMetrics();

    // Step 3: For each trend, validate against on-chain metrics and potentially deploy
    for (const trend of trends) {
      const isValid = validateTrendThreshold(trend, onChainMetrics, {
        minSentimentScore: config.minSentimentScore,
        minMentions: config.minMentions,
        minVolume24hUSD: config.minVolume24hUSD,
      });

      if (isValid && deploymentCountToday < config.maxDeploymentsPerDay) {
        console.log(
          `[AutonomousLoop] Trend "${trend.theme}" passed validation, deploying token...`
        );

        // Generate token metadata
        const tokenMetadata = generateTokenMetadata(
          trend.theme,
          trend.sentimentScore
        );

        // Deploy token
        const deploymentResult = await deployToken({
          ...tokenMetadata,
          description: tokenMetadata.description,
          trendTheme: trend.theme,
          sentimentScore: trend.sentimentScore,
        });

        if (deploymentResult.success) {
          console.log(
            `[AutonomousLoop] Token deployed successfully: ${deploymentResult.tokenAddress}`
          );
          deploymentCountToday++;

          // Store trend analysis with deployment info
          await storeTrendAnalysis(trend, onChainMetrics, true);
        } else {
          console.error(
            `[AutonomousLoop] Deployment failed: ${deploymentResult.error}`
          );
          await storeTrendAnalysis(trend, onChainMetrics, false);
        }
      } else {
        // Store trend analysis without deployment
        await storeTrendAnalysis(trend, onChainMetrics, false);
      }
    }

    // Read the recorded ledger balance for observability only. No fee collection
    // or reinvestment is claimed because those transaction paths are not implemented.
    const treasuryBalance = await getTreasuryBalance();

    // Step 6: Record metrics
    await createAgentMetric({
      metricType: "loop_iteration",
      value: 1 as any,
      metadata: {
        trendsAnalyzed: trends.length,
        deploymentsToday: deploymentCountToday,
        treasuryBalance: treasuryBalance,
      } as any,
    });

    console.log("[AutonomousLoop] Loop iteration completed successfully");
  } catch (error) {
    console.error("[AutonomousLoop] Error during loop execution:", error);

    await createAgentMetric({
      metricType: "loop_error",
      value: 1 as any,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      } as any,
    });
  }
}

/**
 * Schedule autonomous loop to run at regular intervals
 */
export function scheduleAutonomousLoop(
  config: AutonomousLoopConfig
): NodeJS.Timer {
  const intervalMs = config.intervalMinutes * 60 * 1000;

  // Run immediately on first start
  runAutonomousLoop(config).catch(console.error);

  // Then run at regular intervals
  return setInterval(() => {
    runAutonomousLoop(config).catch(console.error);
  }, intervalMs);
}
