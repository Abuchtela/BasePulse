import { randomUUID } from "node:crypto";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { getDb } from "../server/db";
import { opportunities } from "../server/db/schema";
import { errors, readOpportunity, scope } from "../server/opportunities";
import { httpsSource, recordSchema } from "../shared/opportunity";

export default defineAction({
  description: "Save an organizer URL and user-supplied source text for a private funding-opportunity review; this does not verify the live website.",
  schema: z.object({
    title: z.string().trim().min(1).max(200).describe("Opportunity title"),
    sourceUrl: z.string().url().max(2000).describe("Official organizer HTTPS URL"),
    sourceText: z.string().trim().min(40).max(40000).describe("Real source text copied from the organizer; never invented or sample text"),
  }),
  outputSchema: recordSchema,
  errors,
  link: ({ result }) => ({ url: `/home?id=${encodeURIComponent(result.id)}`, label: result.title }),
  run: async (args, ctx) => {
    scope(ctx);
    let sourceUrl: string;
    try { sourceUrl = httpsSource(args.sourceUrl); }
    catch { return errors.noWrite("Use an HTTPS organizer URL without credentials.", "invalid_source"); }
    const id = randomUUID();
    await getDb().insert(opportunities).values({ ...args, sourceUrl, id,
      ownerEmail: ctx!.userEmail!, orgId: ctx!.orgId ?? null, capturedAt: new Date().toISOString(), checklist: [] });
    return readOpportunity(id, ctx);
  },
});
