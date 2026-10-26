/**
 * Trend Monitor Skill for BasePulse Agent
 * Monitors X/Farcaster for Base ecosystem trends and validates against on-chain metrics
 */

import { invokeLLM } from "../_core/llm";
import { createTrendAnalysis } from "../db";
import type {
  VerifiedOnChainMetrics,
  VerifiedSocialPost,
} from "./verifiedSources";

interface TrendData {
  theme: string;
  mentions: string[];
  sentimentScore: number;
  mentionCount: number;
}

/**
 * Analyze social media posts using LLM to extract trends and sentiment
 */
export async function analyzeSocialTrends(
  posts: VerifiedSocialPost[]
): Promise<TrendData[]> {
  if (posts.length === 0) throw new Error("Verified social posts are required");
  const postsText = posts
    .map(
      (post, index) =>
        `[${index}] ${post.publishedAt} ${post.sourceUrl}\n${post.text}`
    )
    .join("\n---\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a trend analysis expert for the Base blockchain ecosystem. Analyze the following social media posts and extract:
1. Main themes/topics being discussed
2. Sentiment score (0-100, where 100 is most positive)
3. The zero-based indexes of posts that directly support each theme

Return objects containing: theme, sentimentScore (0-100), supportingPostIndexes.
Do not invent posts, counts, URLs, or evidence. Omit a theme unless at least one supplied post supports it.
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
                  supportingPostIndexes: {
                    type: "array",
                    minItems: 1,
                    uniqueItems: true,
                    items: { type: "integer", minimum: 0 },
                  },
                },
                required: ["theme", "sentimentScore", "supportingPostIndexes"],
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

    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    if (!Array.isArray(parsed.trends))
      throw new Error("LLM trend response is not an array");
    return parsed.trends.map((trend: any) => {
      const indexes = Array.isArray(trend.supportingPostIndexes)
        ? [...new Set<number>(trend.supportingPostIndexes)]
        : [];
      if (
        !indexes.length ||
        indexes.some(
          index =>
            !Number.isInteger(index) || index < 0 || index >= posts.length
        )
      ) {
        throw new Error("LLM returned invalid supporting post indexes");
      }
      return {
        theme: String(trend.theme),
        mentions: indexes.map(index => posts[index].sourceUrl),
        sentimentScore: Number(trend.sentimentScore),
        mentionCount: indexes.length,
      };
    });
  } catch (error) {
    console.error("Error parsing LLM response:", error);
    throw error;
  }
}

/**
 * Validate trend against on-chain metrics
 * Returns true if trend meets deployment threshold
 */
export function validateTrendThreshold(
  trend: TrendData,
  onChainMetrics: VerifiedOnChainMetrics,
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
  onChainMetrics: VerifiedOnChainMetrics,
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
      metricsSourceUrl: onChainMetrics.sourceUrl,
      metricsObservedAt: onChainMetrics.observedAt,
      chainId: onChainMetrics.chainId,
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
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  return {
    name: `${trendName} Pulse`,
    symbol: `${trendName.slice(0, 4).toUpperCase()}P`,
    description: `A token representing the Base ecosystem trend: "${theme}". Deployed by BasePulse on ${timestamp} with sentiment score ${sentiment.toFixed(1)}/100.`,
  };
}
