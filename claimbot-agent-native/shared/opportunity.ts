import { z } from "zod";

export const claimSchema = z.object({
  kind: z.enum(["summary", "eligibility", "deadline", "payout", "requirement"]),
  text: z.string().trim().min(1).max(1200),
  quote: z.string().trim().min(8).max(600),
});
export const checklistItemSchema = z.object({
  id: z.string().min(1).max(100),
  text: z.string().trim().min(1).max(1200),
  done: z.boolean(),
  evidence: z.string().max(2000),
});
export const analysisSchema = z.object({
  claims: z.array(claimSchema).max(30),
  inference: z.string().max(4000),
  unknowns: z.array(z.string().max(1000)).max(20),
});
export const recordSchema = z.object({
  id: z.string(), title: z.string(), sourceUrl: z.string(), sourceText: z.string(),
  capturedAt: z.string(), revision: z.number().int(),
  analysis: analysisSchema.nullable(),
  checklist: z.array(checklistItemSchema).max(40),
});
export type OpportunityRecord = z.infer<typeof recordSchema>;

// Exact-source support is not a claim that the organizer's website was checked.
export function assertSourceSupport(source: string, analysis: z.infer<typeof analysisSchema>) {
  for (const claim of analysis.claims) {
    if (!source.includes(claim.quote)) {
      throw new Error("Every claim needs an exact quotation from the saved source text.");
    }
  }
}

export function httpsSource(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Use an HTTPS organizer URL without credentials.");
  }
  return url.href;
}
