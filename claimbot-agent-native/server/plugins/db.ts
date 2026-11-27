import { runMigrations } from "@agent-native/core/db";

export default runMigrations([{
  version: 1,
  name: "claimbot-source-backed-opportunities",
  sql: `CREATE TABLE IF NOT EXISTS claimbot_opportunities (
    id TEXT PRIMARY KEY, owner_email TEXT NOT NULL, org_id TEXT,
    title TEXT NOT NULL, source_url TEXT NOT NULL, source_text TEXT NOT NULL,
    captured_at TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
    analysis JSONB, checklist JSONB NOT NULL DEFAULT '[]'::jsonb
  );
  CREATE INDEX IF NOT EXISTS claimbot_owner_org_captured_idx
    ON claimbot_opportunities (owner_email, org_id, captured_at);`,
}], { table: "claimbot_migrations" });
