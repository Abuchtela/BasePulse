import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { errors, readOpportunity } from "../server/opportunities";
import { recordSchema } from "../shared/opportunity";
export default defineAction({
  description: "Read a private opportunity's immutable source, source-backed analysis, checklist, and revision before reviewing or editing it.",
  schema: z.object({ id: z.string().uuid().describe("Opportunity id") }),
  outputSchema: recordSchema, http: { method: "GET" }, readOnly: true, errors,
  link: ({ result }) => ({ url: `/home?id=${encodeURIComponent(result.id)}`, label: result.title }),
  run: async ({ id }, ctx) => readOpportunity(id, ctx),
});
