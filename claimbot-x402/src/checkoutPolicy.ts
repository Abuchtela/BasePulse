import type { PaymentRequired, PaymentRequirements } from "@x402/core/types";

export const USDC_BY_NETWORK: Record<string, `0x${string}`> = {
  "eip155:84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "eip155:8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

/** Validate every payment field before asking a wallet to sign. */
export function checkoutOffer(challenge: PaymentRequired, expected: {
  network: string; payTo: string; amount: string; resource: string;
}): PaymentRequirements {
  if (challenge.x402Version !== 2 || challenge.resource?.url !== expected.resource) {
    throw new Error("Payment challenge does not match this report URL.");
  }
  const asset = USDC_BY_NETWORK[expected.network];
  if (!asset || !/^[1-9][0-9]*$/.test(expected.amount) || BigInt(expected.amount) > 100000n) {
    throw new Error("Checkout supports USDC payments up to 0.10 USDC per report.");
  }
  const offer = challenge.accepts.find(o => o.scheme === "exact" &&
    o.network === expected.network && o.payTo.toLowerCase() === expected.payTo.toLowerCase() &&
    o.asset.toLowerCase() === asset.toLowerCase() && o.amount === expected.amount &&
    Number.isInteger(o.maxTimeoutSeconds) && o.maxTimeoutSeconds > 0 && o.maxTimeoutSeconds <= 60 &&
    o.extra?.name === (expected.network === "eip155:84532" ? "USDC" : "USD Coin") && o.extra?.version === "2" &&
    (!o.extra?.assetTransferMethod || o.extra.assetTransferMethod === "eip3009"));
  if (!offer) throw new Error("Unexpected amount, receiver, asset, network, or signing domain. Payment stopped.");
  return offer;
}
