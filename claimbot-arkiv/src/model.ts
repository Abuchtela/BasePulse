import type { CreateEntityParameters } from "@arkiv-network/sdk";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { i32, str, u64 } from "@arkiv-network/sdk/attr";

export const PROJECT = "claimbot";
export const ENTITY_TYPE = "funding_opportunity";

export type Opportunity = {
  id: string;
  title: string;
  officialSourceUrl: string;
  eligibility: string[];
  deadline: string;
  payout: string;
  fit: string;
  smallestNextStep: string;
  targetProject: "BasePulse" | "ClaimBot" | "Both";
  region: "global" | "us" | "other";
  status: "open";
  verifiedAt: string;
};

function requireText(value: string, field: string): string {
  const clean = value.trim();
  if (!clean) throw new Error(`${field} is required`);
  return clean;
}

export function validateOpportunity(input: Opportunity, now = new Date()): Opportunity {
  const officialSource = new URL(input.officialSourceUrl);
  if (officialSource.protocol !== "https:") throw new Error("officialSourceUrl must use HTTPS");
  if (input.eligibility.length === 0) throw new Error("eligibility must not be empty");

  const deadline = new Date(input.deadline);
  if (Number.isNaN(deadline.valueOf())) throw new Error("deadline must be a valid ISO date");
  if (deadline <= now) throw new Error("deadline must be in the future");

  const verifiedAt = new Date(input.verifiedAt);
  if (Number.isNaN(verifiedAt.valueOf())) throw new Error("verifiedAt must be a valid ISO date");

  return {
    ...input,
    id: requireText(input.id, "id"),
    title: requireText(input.title, "title"),
    officialSourceUrl: officialSource.toString(),
    eligibility: input.eligibility.map((item) => requireText(item, "eligibility item")),
    deadline: deadline.toISOString(),
    payout: requireText(input.payout, "payout"),
    fit: requireText(input.fit, "fit"),
    smallestNextStep: requireText(input.smallestNextStep, "smallestNextStep"),
    verifiedAt: verifiedAt.toISOString(),
  };
}

export function opportunityEntityParameters(
  input: Opportunity,
  now = new Date(),
): CreateEntityParameters {
  const opportunity = validateOpportunity(input, now);

  return {
    payload: jsonToPayload(opportunity),
    contentType: "application/json",
    attributes: {
      project: str(PROJECT),
      entity_type: str(ENTITY_TYPE),
      schema_version: i32(1),
      opportunity_id: str(opportunity.id),
      status: str(opportunity.status),
      region: str(opportunity.region),
      target_project: str(opportunity.targetProject.toLowerCase()),
      deadline_at: u64(BigInt(new Date(opportunity.deadline).valueOf())),
      verified_at: u64(BigInt(new Date(opportunity.verifiedAt).valueOf())),
    },
    expires: ExpirationTime.fromDays(60),
    flags: { readonly: true, permissionlessExtension: false },
  };
}

export function isEligibleAndOpen(
  opportunity: Opportunity,
  target: "BasePulse" | "ClaimBot",
  now = new Date(),
): boolean {
  return (
    opportunity.status === "open" &&
    new Date(opportunity.deadline) > now &&
    (opportunity.targetProject === target || opportunity.targetProject === "Both")
  );
}
