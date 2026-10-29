import { defineAction } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../server/db";
import { opportunities } from "../server/db/schema";
import { errors, readOpportunity, scope } from "../server/opportunities";
import { analysisSchema, assertSourceSupport, checklistItemSchema, recordSchema } from "../shared/opportunity";

export default defineAction({
  description: "Save source-quoted analysis or edit a private opportunity checklist using its current revision; rejects unsupported quotes and conflicting edits.",
  schema: z.object({
    id: z.string().uuid().describe("Opportunity id"),
    expectedRevision: z.number().int().positive().describe("Current revision from get-opportunity; stale edits are rejected"),
    analysis: analysisSchema.optional().describe("Source-backed claims with exact quotes; fit is inference and unknown facts stay unknown"),
    checklist: z.array(checklistItemSchema).max(40).optional().describe("Whole edited checklist; only mark done when completion evidence exists"),
  }).refine(args => args.analysis !== undefined || args.checklist !== undefined, "Provide analysis or checklist"),
  outputSchema: recordSchema, errors,
  run: async ({ id, expectedRevision, analysis, checklist }, ctx) => {
    const current = await readOpportunity(id, ctx);
    if (analysis) {
      try { assertSourceSupport(current.sourceText, analysis); }
      catch { return errors.noWrite("A cited quote was not found verbatim in the saved source. Correct it before saving.", "unsupported_claim"); }
    }
    if (checklist) {
      if (new Set(checklist.map(item => item.id)).size !== checklist.length) {
        return errors.noWrite("Checklist item ids must be unique.", "conflict");
      }
      if (checklist.some(item => item.done && !item.evidence.trim())) {
        return errors.noWrite("Completed items require a real evidence link or note.", "unsupported_claim");
      }
    }
    const [saved] = await getDb().update(opportunities).set({
      ...(analysis ? { analysis } : {}), ...(checklist ? { checklist } : {}), revision: expectedRevision + 1,
    }).where(and(scope(ctx), eq(opportunities.id, id), eq(opportunities.revision, expectedRevision))).returning();
    if (!saved) return errors.noWrite("This opportunity changed. Read the latest revision before editing again.", "conflict", { statusCode: 409 });
    return recordSchema.parse(saved);
  },
});
