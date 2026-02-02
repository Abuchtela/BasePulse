/**
 * Trend Monitor Skill for BasePulse Agent
 * Monitors X/Farcaster for Base ecosystem trends and validates against on-chain metrics
 */

import { invokeLLM } from "../_core/llm";
import { createTrendAnalysis } from "../db";

interface TrendData {
  theme: string;
  mentions: string[];
  sentimentScore: number;
  mentionCount: number;
}

interface OnChainMetrics {
  volume24h: number;
  volumeUSD24h: number;
  activeAddresses: number;
  transactionCount: number;
}

/**
 * Analyze social media posts using LLM to extract trends and sentiment
 */
export async function analyzeSocialTrends(posts: string[]): Promise<TrendData[]> {
  const postsText = posts.join("\n---\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a trend analysis expert for the Base blockchain ecosystem. Analyze the following social media posts and extract:
1. Main themes/topics being discussed
2. Sentiment score (0-100, where 100 is most positive)
3. Number of mentions for each theme

Return a JSON array with objects containing: theme, sentimentScore (0-100), mentionCount.
Focus on themes related to Base, DeFi, tokens, and blockchain innovation.`,
      },
      {
        role: "user",
        content: `Analyze these posts:\n\n${postsText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "trend_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  theme: { type: "string" },
                  sentimentScore: { type: "number", minimum: 0, maximum: 100 },
                  mentionCount: { type: "integer", minimum: 1 },
                },
                required: ["theme", "sentimentScore", "mentionCount"],
              },
            },
          },
          required: ["trends"],
        },
      },
    },
  });

  try {
    const content = response.choices[0]?.message.content;
    if (!content) return [];

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    return parsed.trends.map((trend: any) => ({
      theme: trend.theme,
      mentions: [],
      sentimentScore: trend.sentimentScore,
      mentionCount: trend.mentionCount,
    }));
  } catch (error) {
    console.error("Error parsing LLM response:", error);
    return [];
  }
}

/**
 * Validate trend against on-chain metrics
 * Returns true if trend meets deployment threshold
 */
export function validateTrendThreshold(
  trend: TrendData,
  onChainMetrics: OnChainMetrics,
  config: {
    minSentimentScore: number;
    minMentions: number;
    minVolume24hUSD: number;
  }
): boolean {
  const sentimentValid = trend.sentimentScore >= config.minSentimentScore;
  const mentionValid = trend.mentionCount >= config.minMentions;
  const volumeValid = onChainMetrics.volumeUSD24h >= config.minVolume24hUSD;

  return sentimentValid && mentionValid && volumeValid;
}

/**
 * Store trend analysis in database
 */
export async function storeTrendAnalysis(
  trend: TrendData,
  onChainMetrics: OnChainMetrics,
  deploymentTriggered: boolean,
  deployedTokenId?: number
): Promise<void> {
  await createTrendAnalysis({
    theme: trend.theme,
    sentimentScore: trend.sentimentScore as any,
    mentionCount: trend.mentionCount,
    onChainVolume: onChainMetrics.volume24h as any,
    onChainVolumeUSD: onChainMetrics.volumeUSD24h as any,
    deploymentTriggered,
    deployedTokenId,
    rawData: {
      mentions: trend.mentions,
    } as any,
  });
}

/**
 * Generate token metadata from trend
 */
export function generateTokenMetadata(theme: string, sentiment: number) {
  const timestamp = new Date().toISOString().split("T")[0];
  const trendName = theme
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  return {
    name: `${trendName} Pulse`,
    symbol: `${trendName.slice(0, 4).toUpperCase()}P`,
    description: `A token representing the Base ecosystem trend: "${theme}". Deployed by BasePulse on ${timestamp} with sentiment score ${sentiment.toFixed(1)}/100.`,
  };
}
