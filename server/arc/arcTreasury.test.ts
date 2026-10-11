import { describe, expect, it } from "vitest";
import { encodeEventTopics, encodeAbiParameters } from "viem";
import { ARC_USDC_ADDRESS, formatArcNativeUsdc, formatArcTokenUsdc, getArcNetwork, normalizeArcAddress, parseArcTransferLogs } from "./arcTreasury";

const from = "0x1111111111111111111111111111111111111111";
const to = "0x2222222222222222222222222222222222222222";
const transferAbi = [{ type: "event", name: "Transfer", inputs: [
  { name: "from", type: "address", indexed: true },
  { name: "to", type: "address", indexed: true },
  { name: "value", type: "uint256", indexed: false },
] }] as const;

describe("Arc read-only USDC treasury", () => {
  it("uses the confirmed testnet chain", () => {
    expect(getArcNetwork("testnet").id).toBe(5042002);
    expect(getArcNetwork("testnet").rpc).toBe("https://rpc.testnet.arc.network");
  });
  it("keeps native 18 decimals separate from token 6 decimals", () => {
    expect(formatArcNativeUsdc(1230000000000000000n)).toBe("1.23");
    expect(formatArcTokenUsdc(1230000n)).toBe("1.23");
  });
  it("rejects invalid addresses", () => {
    expect(() => normalizeArcAddress("not a wallet")).toThrow();
  });
  it("decodes authentic-form USDC Transfer logs and ignores spoofed emitters", () => {
    const topics = encodeEventTopics({ abi: transferAbi, eventName: "Transfer", args: { from, to } });
    const data = encodeAbiParameters([{ type: "uint256" }], [1230000n]);
    const log = {
      address: ARC_USDC_ADDRESS,
      topics, data,
      transactionHash: ("0x" + "a".repeat(64)) as `0x${string}`,
      blockNumber: 42n,
      logIndex: 0,
    };
    const parsed = parseArcTransferLogs([log]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].amountUsdc).toBe("1.23");
    expect(parseArcTransferLogs([{ ...log, address: from }])).toEqual([]);
    expect(parseArcTransferLogs([{ ...log, data: "0x" }])).toEqual([]);
  });
});
