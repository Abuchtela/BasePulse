import assert from "node:assert/strict";
import test from "node:test";
import { isEligibleAndOpen, opportunityEntityParameters, validateOpportunity, type Opportunity } from "../src/model.js";

const fixture: Opportunity = {
  id: "arkiv-global-tour-stop-2026",
  title: "Arkiv Global Tour Stop",
  officialSourceUrl: "https://arkiv.devfolio.co/",
  eligibility: ["Worldwide", "Age 18+"],
  deadline: "2026-10-18T22:59:00.000Z",
  payout: "$750 USDC plus a Devcon ticket",
  fit: "Verifiable opportunity provenance for ClaimBot",
  smallestNextStep: "Create an Arkiv-backed record",
  targetProject: "ClaimBot",
  region: "global",
  status: "open",
  verifiedAt: "2026-10-13T04:00:00.000Z",
};

test("validates and canonicalizes an open official opportunity", () => {
  const actual = validateOpportunity(fixture, new Date("2026-10-13T03:00:00.000Z"));
  assert.equal(actual.officialSourceUrl, "https://arkiv.devfolio.co/");
  assert.equal(actual.deadline, "2026-10-18T22:59:00.000Z");
});

test("rejects expired opportunities", () => {
  assert.throws(
    () => validateOpportunity(fixture, new Date("2026-10-19T00:00:00.000Z")),
    /deadline must be in the future/,
  );
});

test("rejects non-HTTPS evidence", () => {
  assert.throws(
    () => validateOpportunity({ ...fixture, officialSourceUrl: "http://example.com" }, new Date("2026-10-13T03:00:00.000Z")),
    /must use HTTPS/,
  );
});

test("builds the documented Arkiv schema", () => {
  const entity = opportunityEntityParameters(fixture, new Date("2026-10-13T03:00:00.000Z"));
  const attributes = entity.attributes as unknown as Record<string, { type: string; value: unknown }>;
  assert.equal(entity.contentType, "application/json");
  assert.equal(attributes.project?.value, "claimbot");
  assert.equal(attributes.entity_type?.value, "funding_opportunity");
  assert.equal(attributes.deadline_at?.type, "u64");
  assert.equal(entity.flags?.readonly, true);
});

test("matches only the intended active project", () => {
  const now = new Date("2026-10-13T03:00:00.000Z");
  assert.equal(isEligibleAndOpen(fixture, "ClaimBot", now), true);
  assert.equal(isEligibleAndOpen(fixture, "BasePulse", now), false);
});
