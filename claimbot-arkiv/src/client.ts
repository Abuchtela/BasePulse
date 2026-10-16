import { createPublicClient, createWalletClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ENTITY_TYPE, PROJECT, isEligibleAndOpen, opportunityEntityParameters, type Opportunity } from "./model.js";

export const DEFAULT_RPC = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";

export function publicArkivClient(rpcUrl = DEFAULT_RPC) {
  return createPublicClient({
    chain: tiramisu,
    cacheTime: 0,
    transport: http(rpcUrl, { retryCount: 1, timeout: 10_000 }),
  });
}

export async function verifyTiramisu(rpcUrl = DEFAULT_RPC): Promise<number> {
  const client = publicArkivClient(rpcUrl);
  const chainId = await client.getChainId();
  if (chainId !== tiramisu.id) throw new Error(`Wrong chain: expected ${tiramisu.id}, received ${chainId}`);
  return chainId;
}

export async function queryOpenOpportunities(
  target: "BasePulse" | "ClaimBot",
  rpcUrl = DEFAULT_RPC,
  now = new Date(),
) {
  const client = publicArkivClient(rpcUrl);
  const page = await client
    .select({ key: true, owner: true, payload: true, attributes: true, expiresAt: true })
    .where(eq("project", PROJECT), eq("entity_type", ENTITY_TYPE), eq("status", "open"))
    .limit(50)
    .fetch();

  return page.entities.flatMap((entity) => {
    try {
      const opportunity = entity.toJson() as Opportunity;
      return isEligibleAndOpen(opportunity, target, now)
        ? [{ key: entity.key, owner: entity.owner, expiresAt: entity.expiresAt, opportunity }]
        : [];
    } catch {
      return [];
    }
  });
}

export async function publishOpportunity(
  input: Opportunity,
  privateKey: Hex,
  rpcUrl = DEFAULT_RPC,
) {
  const chainId = await verifyTiramisu(rpcUrl);
  const account = privateKeyToAccount(privateKey);
  const reader = publicArkivClient(rpcUrl);
  const balance = await reader.getBalance({ address: account.address });
  if (balance === 0n) throw new Error("Dedicated Tiramisu signer needs test GLM before publishing");

  const duplicate = await reader
    .select({ key: true })
    .where(
      eq("project", PROJECT),
      eq("entity_type", ENTITY_TYPE),
      eq("opportunity_id", input.id),
    )
    .createdBy(account.address)
    .limit(2)
    .fetch();
  if (duplicate.entities.length || duplicate.hasNextPage()) {
    throw new Error("This signer already published the opportunity ID; reconcile instead of duplicating it");
  }

  const wallet = createWalletClient({
    account,
    chain: tiramisu,
    cacheTime: 0,
    transport: http(rpcUrl, { retryCount: 0, timeout: 15_000 }),
  });
  const created = await wallet.createEntity(opportunityEntityParameters(input));
  return { ...created, chainId, creator: account.address };
}
