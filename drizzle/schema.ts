import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Deployed tokens tracked by BasePulse agent
 */
export const deployedTokens = mysqlTable("deployed_tokens", {
  id: int("id").autoincrement().primaryKey(),
  tokenAddress: varchar("tokenAddress", { length: 42 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 512 }),
  trendTheme: varchar("trendTheme", { length: 255 }).notNull(),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }),
  deploymentTxHash: varchar("deploymentTxHash", { length: 66 }).notNull(),
  deploymentBlockNumber: int("deploymentBlockNumber"),
  initialLiquidity: decimal("initialLiquidity", { precision: 20, scale: 8 }),
  currentMarketCap: decimal("currentMarketCap", { precision: 20, scale: 8 }),
  totalVolume24h: decimal("totalVolume24h", { precision: 20, scale: 8 }),
  holders: int("holders"),
  status: mysqlEnum("status", ["pending", "deployed", "active", "inactive"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeployedToken = typeof deployedTokens.$inferSelect;
export type InsertDeployedToken = typeof deployedTokens.$inferInsert;

/**
 * Trend analysis results
 */
export const trendAnalysis = mysqlTable("trend_analysis", {
  id: int("id").autoincrement().primaryKey(),
  theme: varchar("theme", { length: 255 }).notNull(),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }).notNull(),
  mentionCount: int("mentionCount").notNull(),
  onChainVolume: decimal("onChainVolume", { precision: 20, scale: 8 }),
  onChainVolumeUSD: decimal("onChainVolumeUSD", { precision: 20, scale: 2 }),
  deploymentTriggered: boolean("deploymentTriggered").default(false),
  deployedTokenId: int("deployedTokenId"),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrendAnalysis = typeof trendAnalysis.$inferSelect;
export type InsertTrendAnalysis = typeof trendAnalysis.$inferInsert;

/**
 * Treasury transactions
 */
export const treasuryTransactions = mysqlTable("treasury_transactions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["fee_collection", "reinvestment", "deployment_cost", "reward"]).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  amountUSD: decimal("amountUSD", { precision: 20, scale: 2 }),
  tokenAddress: varchar("tokenAddress", { length: 42 }),
  txHash: varchar("txHash", { length: 66 }),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TreasuryTransaction = typeof treasuryTransactions.$inferSelect;
export type InsertTreasuryTransaction = typeof treasuryTransactions.$inferInsert;

/**
 * Social interactions and community engagement
 */
export const socialInteractions = mysqlTable("social_interactions", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["twitter", "farcaster"]).notNull(),
  postId: varchar("postId", { length: 255 }).notNull(),
  postContent: text("postContent"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  engagementCount: int("engagementCount"),
  mentionedTokenId: int("mentionedTokenId"),
  agentResponse: text("agentResponse"),
  responsePostId: varchar("responsePostId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialInteraction = typeof socialInteractions.$inferSelect;
export type InsertSocialInteraction = typeof socialInteractions.$inferInsert;

/**
 * Agent metrics and performance tracking
 */
export const agentMetrics = mysqlTable("agent_metrics", {
  id: int("id").autoincrement().primaryKey(),
  metricType: varchar("metricType", { length: 100 }).notNull(),
  value: decimal("value", { precision: 20, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"),
});

export type AgentMetric = typeof agentMetrics.$inferSelect;
export type InsertAgentMetric = typeof agentMetrics.$inferInsert;