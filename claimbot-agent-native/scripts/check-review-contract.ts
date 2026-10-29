import assert from "node:assert/strict";
import { analysisSchema, assertSourceSupport, httpsSource } from "../shared/opportunity";
import list from "../actions/list-opportunities";

// Actual organizer-rule quotations; not seeded opportunity records or simulated API responses.
// Source: https://www.builder.io/hackathon/rules (reviewed October 29, 2026).
const quotation = "No purchase is necessary.";
const otherQuotation = "Pacific Time (America/Los_Angeles) controls all deadlines";
const analysis = analysisSchema.parse({
  claims: [{ kind: "eligibility", text: "No purchase required", quote: quotation }],
  inference: "", unknowns: [],
});
assert.equal(httpsSource("https://www.builder.io/hackathon/rules"), "https://www.builder.io/hackathon/rules");
assert.equal(analysisSchema.safeParse({}).success, false);
assertSourceSupport(quotation, analysis);
assert.throws(() => assertSourceSupport(otherQuotation, analysis));
await assert.rejects(() => list.run({}, { caller: "cli" }),
  (error: { errorCode?: string }) => error.errorCode === "unauthenticated");
console.log("PASS: real-source quote matching, unsupported-quote rejection, input shape, HTTPS URL, and signed-out access. No DB records or AI outputs created.");
