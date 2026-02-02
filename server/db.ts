import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, deployedTokens, trendAnalysis, treasuryTransactions, socialInteractions, agentMetrics, InsertDeployedToken, InsertTrendAnalysis, InsertTreasuryTransaction, InsertSocialInteraction, InsertAgentMetric } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * BasePulse Query Helpers
 */

export async function getDeployedTokens(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deployedTokens).orderBy(desc(deployedTokens.createdAt)).limit(limit);
}

export async function getDeployedTokenById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deployedTokens).where(eq(deployedTokens.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDeployedToken(token: InsertDeployedToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(deployedTokens).values(token);
}

export async function getTrendAnalysis(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trendAnalysis).orderBy(desc(trendAnalysis.createdAt)).limit(limit);
}

export async function createTrendAnalysis(trend: InsertTrendAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(trendAnalysis).values(trend);
}

export async function getTreasuryBalance() {
  const db = await getDb();
  if (!db) return "0";
  // Sum all treasury transactions
  const result = await db.select().from(treasuryTransactions);
  let balance = 0;
  result.forEach((tx) => {
    const amount = parseFloat(tx.amount.toString());
    if (tx.type === "fee_collection" || tx.type === "reward") {
      balance += amount;
    } else if (tx.type === "deployment_cost" || tx.type === "reinvestment") {
      balance -= amount;
    }
  });
  return balance.toString();
}

export async function createTreasuryTransaction(tx: InsertTreasuryTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(treasuryTransactions).values(tx);
}

export async function getSocialInteractions(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialInteractions).orderBy(desc(socialInteractions.createdAt)).limit(limit);
}

export async function createSocialInteraction(interaction: InsertSocialInteraction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(socialInteractions).values(interaction);
}

export async function createAgentMetric(metric: InsertAgentMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agentMetrics).values(metric);
}
