import { decodeEventLog, parseAbi, type TransactionReceipt } from "viem";
import { USDC_BY_NETWORK } from "./checkoutPolicy.ts";

const events = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)",
]);

export interface PaymentExpectation {
  network: string; transaction: `0x${string}`; payer: string; payTo: string;
  amount: string; nonce: string;
}

/** A facilitator success alone is insufficient: inspect the mined USDC events. */
export function verifyPaymentReceipt(receipt: TransactionReceipt, expected: PaymentExpectation) {
  const token = USDC_BY_NETWORK[expected.network];
  if (!token || receipt.status !== "success" || receipt.transactionHash.toLowerCase() !== expected.transaction.toLowerCase()) {
    throw new Error("Payment transaction is not a successful receipt on the expected network.");
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(expected.nonce)) throw new Error("Missing signed payment nonce.");
  let transfer = false;
  let authorization = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== token.toLowerCase()) continue;
    try {
      const event = decodeEventLog({ abi: events, data: log.data, topics: log.topics });
      if (event.eventName === "Transfer") {
        transfer ||= event.args.from.toLowerCase() === expected.payer.toLowerCase() &&
          event.args.to.toLowerCase() === expected.payTo.toLowerCase() && event.args.value === BigInt(expected.amount);
      } else {
        authorization ||= event.args.authorizer.toLowerCase() === expected.payer.toLowerCase() &&
          event.args.nonce.toLowerCase() === expected.nonce.toLowerCase();
      }
    } catch { /* Other USDC events are unrelated to this payment. */ }
  }
  if (!transfer || !authorization) throw new Error("Receipt does not contain this payment's USDC transfer and authorization nonce.");
  return {
    verified: true as const, ...expected, asset: token, blockNumber: receipt.blockNumber.toString(),
    blockHash: receipt.blockHash,
    explorerUrl: `https://${expected.network === "eip155:84532" ? "sepolia." : ""}basescan.org/tx/${receipt.transactionHash}`,
    verifiedAt: new Date().toISOString(),
  };
}
