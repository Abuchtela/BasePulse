import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { http, type Address } from "viem";
import type { Project } from "./preflight.js";

const RPC = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";

interface Opportunity {
  id: string;
  title: string;
  officialSourceUrl: string;
  eligibility: string[];
  deadline: string;
  payout: string;
  fit: string;
  smallestNextStep: string;
  targetProject: Project | "Both";
  status: "open";
  verifiedAt: string;
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Don't sell untrusted, stale, or incomplete records as verified opportunities. */
export function isPayableOpportunity(o: unknown, target: Project, now: Date): o is Opportunity {
  if (!o || typeof o !== "object") return false;
  const v = o as Partial<Opportunity>;
  if (!isText(v.id) || !isText(v.title) || !isText(v.payout) ||
      !isText(v.fit) || !isText(v.smallestNextStep) || !isText(v.officialSourceUrl) ||
      v.status !== "open" || (v.targetProject !== target && v.targetProject !== "Both")) return false;
  if (!Array.isArray(v.eligibility) || v.eligibility.length === 0 || !v.eligibility.every(isText)) return false;
  try {
    if (new URL(v.officialSourceUrl).protocol !== "https:") return false;
  } catch { return false; }
  if (!isText(v.deadline) || !isText(v.verifiedAt)) return false;
  const deadline = Date.parse(v.deadline);
  const verified = Date.parse(v.verifiedAt);
  return Number.isFinite(deadline) && deadline > now.valueOf() &&
    Number.isFinite(verified) && verified <= now.valueOf();
}

export async function queryTrustedOpenOpportunities(
  target: Project,
  publisher: Address,
  rpcUrl = RPC,
  now = new Date(),
) {
  const rpc = new URL(rpcUrl);
  if (rpc.protocol !== "https:") throw new Error("ARKIV_RPC_URL must be an HTTPS endpoint");
  const client = createPublicClient({
    chain: tiramisu,
    cacheTime: 0,
    transport: http(rpcUrl, { retryCount: 1, timeout: 10_000 }),
  });
  if (await client.getChainId() !== tiramisu.id) throw new Error("Arkiv RPC wrong chain");
  const page = await client
    .select({ key: true, owner: true, payload: true, attributes: true, expiresAt: true })
    .where(eq("project", "claimbot"), eq("entity_type", "funding_opportunity"), eq("status", "open"))
    .createdBy(publisher)
    .limit(50)
    .fetch();
  return page.entities.flatMap(entity => {
    try {
      const opportunity = entity.toJson() as unknown;
      if (!isPayableOpportunity(opportunity, target, now)) return [];
      return [{ key: entity.key, owner: entity.owner, expiresAt: entity.expiresAt, opportunity }];
    } catch { return []; }
  });
}
