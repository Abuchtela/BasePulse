import { defineAction } from "@agent-native/core/action";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../server/db";
import { opportunities } from "../server/db/schema";
import { errors, scope } from "../server/opportunities";

export default defineAction({
  description: "List the latest 50 funding opportunities in the caller's private workspace, without downloading source bodies.",
  schema: z.object({}),
  outputSchema: z.array(z.object({ id: z.string(), title: z.string(), capturedAt: z.string(), revision: z.number() })),
  http: { method: "GET" }, readOnly: true, errors,
  run: async (_args, ctx) => getDb().select({ id: opportunities.id, title: opportunities.title,
    capturedAt: opportunities.capturedAt, revision: opportunities.revision })
    .from(opportunities).where(scope(ctx)).orderBy(desc(opportunities.capturedAt)).limit(50),
});
