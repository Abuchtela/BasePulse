import { index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { OpportunityRecord } from "../../shared/opportunity";

export const opportunities = pgTable("claimbot_opportunities", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  orgId: text("org_id"),
  title: text("title").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceText: text("source_text").notNull(),
  capturedAt: text("captured_at").notNull(),
  revision: integer("revision").notNull().default(1),
  analysis: jsonb("analysis").$type<OpportunityRecord["analysis"]>(),
  checklist: jsonb("checklist").$type<OpportunityRecord["checklist"]>().notNull().default([]),
}, table => [index("claimbot_owner_org_captured_idx").on(table.ownerEmail, table.orgId, table.capturedAt)]);
