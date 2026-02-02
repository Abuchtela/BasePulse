/**
 * Autonomous Loop Orchestrator for BasePulse Agent
 * Coordinates trend monitoring, analysis, and token deployment
 */

import { analyzeSocialTrends, validateTrendThreshold, storeTrendAnalysis, generateTokenMetadata } from "./trendMonitor";
import { deployToken, collectTradingFees, reinvestTreasuryFunds } from "./tokenDeployer";
import { getTreasuryBalance, createAgentMetric } from "../db";

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
export async function runAutonomousLoop(config: AutonomousLoopConfig): Promise<void> {
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

    // Step 1: Fetch recent social posts (mock - in production, integrate with X/Farcaster APIs)
    const mockPosts = generateMockPosts();

    // Step 2: Analyze trends using LLM
    console.log("[AutonomousLoop] Analyzing social trends...");
    const trends = await analyzeSocialTrends(mockPosts);
    console.log(`[AutonomousLoop] Found ${trends.length} potential trends`);

    // Step 3: For each trend, validate against on-chain metrics and potentially deploy
    for (const trend of trends) {
      // Mock on-chain metrics (in production, query DexScreener API)
      const onChainMetrics = {
        volume24h: Math.random() * 1000,
        volumeUSD24h: Math.random() * 2500000,
        activeAddresses: Math.floor(Math.random() * 10000),
        transactionCount: Math.floor(Math.random() * 50000),
      };

      const isValid = validateTrendThreshold(trend, onChainMetrics, {
        minSentimentScore: config.minSentimentScore,
        minMentions: config.minMentions,
        minVolume24hUSD: config.minVolume24hUSD,
      });

      if (isValid && deploymentCountToday < config.maxDeploymentsPerDay) {
        console.log(`[AutonomousLoop] Trend "${trend.theme}" passed validation, deploying token...`);

        // Generate token metadata
        const tokenMetadata = generateTokenMetadata(trend.theme, trend.sentimentScore);

        // Deploy token
        const deploymentResult = await deployToken({
          ...tokenMetadata,
          description: tokenMetadata.description,
          initialLiquidity: 0.5, // 0.5 ETH initial liquidity
          trendTheme: trend.theme,
          sentimentScore: trend.sentimentScore,
        });

        if (deploymentResult.success) {
          console.log(`[AutonomousLoop] Token deployed successfully: ${deploymentResult.tokenAddress}`);
          deploymentCountToday++;

          // Store trend analysis with deployment info
          await storeTrendAnalysis(trend, onChainMetrics, true);
        } else {
          console.error(`[AutonomousLoop] Deployment failed: ${deploymentResult.error}`);
          await storeTrendAnalysis(trend, onChainMetrics, false);
        }
      } else {
        // Store trend analysis without deployment
        await storeTrendAnalysis(trend, onChainMetrics, false);
      }
    }

    // Step 4: Collect trading fees from deployed tokens (periodic task)
    console.log("[AutonomousLoop] Collecting trading fees...");
    // In production, iterate through all deployed tokens and collect fees
    // const tokens = await getDeployedTokens();
    // for (const token of tokens) {
    //   await collectTradingFees(token.tokenAddress);
    // }

    // Step 5: Check treasury balance and potentially reinvest
    const treasuryBalance = await getTreasuryBalance();
    const balanceNum = parseFloat(treasuryBalance);

    if (balanceNum > 1.0) {
      // Reinvest if balance exceeds 1 ETH
      console.log("[AutonomousLoop] Treasury balance sufficient, reinvesting...");
      const reinvestAmount = balanceNum * 0.1; // Reinvest 10% of balance
      await reinvestTreasuryFunds(reinvestAmount);
    }

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
 * Generate mock social posts for testing
 * In production, fetch from X/Farcaster APIs
 */
function generateMockPosts(): string[] {
  const themes = [
    "Base ecosystem growth",
    "DeFi innovation on Layer 2",
    "Coinbase integration",
    "Ethereum scaling solutions",
    "Smart contract security",
  ];

  return themes.map((theme) => `Just saw amazing activity in ${theme}! #Base #Crypto`);
}

/**
 * Schedule autonomous loop to run at regular intervals
 */
export function scheduleAutonomousLoop(config: AutonomousLoopConfig): NodeJS.Timer {
  const intervalMs = config.intervalMinutes * 60 * 1000;

  // Run immediately on first start
  runAutonomousLoop(config).catch(console.error);

  // Then run at regular intervals
  return setInterval(() => {
    runAutonomousLoop(config).catch(console.error);
  }, intervalMs);
}
