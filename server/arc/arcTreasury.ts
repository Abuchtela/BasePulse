/**
 * Arc treasury read-only integration.
 * Arc uses USDC for gas. Native USDC values have 18 decimals, while
 * the ERC-20-compatible USDC predeploy exposes 6-decimal values.
 * Source: https://docs.arc.io/arc/references/evm-differences
 *
 * No private keys, signing or fund-moving operations exist in this module.
 */
import {
  createPublicClient,
  decodeEventLog,
  defineChain,
  formatUnits,
  getAddress,
  http,
  parseAbiItem,
  type Address,
  type Hex,
} from "viem";

export type ArcNetwork = "mainnet" | "testnet";

export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

const networks = {
  mainnet: {
    id: 5042,
    label: "Arc Mainnet",
    rpc: "https://rpc.mainnet.arc.io",
    explorer: "https://explorer.arc.io",
    env: "ARC_MAINNET_RPC_URL",
  },
  testnet: {
    id: 5042002,
    label: "Arc Testnet",
    rpc: "https://rpc.testnet.arc.io",
    explorer: "https://explorer.testnet.arc.io",
    env: "ARC_TESTNET_RPC_URL",
  },
} as const;

const usdcBalanceAbi = [{
  type: "function",
  name: "balanceOf",
  stateMutability: "view",
  inputs: [{ name: "account", type: "address" }],
  outputs: [{ name: "", type: "uint256" }],
}] as const;

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export function getArcNetwork(network: ArcNetwork) {
  const config = networks[network];
  return {
    ...config,
    chain: defineChain({
      id: config.id,
      name: config.label,
      nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
      rpcUrls: { default: { http: [config.rpc] } },
      blockExplorers: { default: { name: "Arc Explorer", url: config.explorer } },
    }),
  };
}

function createArcClient(network: ArcNetwork) {
  const config = getArcNetwork(network);
  const endpoint = process.env[config.env] || config.rpc; 
  if (!endpoint) throw new Error("Arc mainnet RPC must be configured explicitly");
  if (!/^https:\/\//i.test(endpoint)) {
    throw new Error("Arc RPC URL must use HTTPS");
  }
  return createPublicClient({
    chain: config.chain,
    transport: http(endpoint, { timeout: 12_000, retryCount: 1 }),
  });
}

async function checkedClient(network: ArcNetwork) {
  const client = createArcClient(network);
  const actualChainId = await client.getChainId();
  const expected = networks[network].id;
  if (actualChainId !== expected) {
    throw new Error(`Arc RPC chain mismatch: expected ${expected}, got ${actualChainId}`);
  }
  return client;
}

export function normalizeArcAddress(address: string): Address {
  return getAddress(address);
}

export function formatArcNativeUsdc(wei: bigint): string {
  return formatUnits(wei, 18);
}

export function formatArcTokenUsdc(units: bigint): string {
  return formatUnits(units, 6);
}

export type ArcTransferLog = {
  address: Address;
  topics: readonly Hex[];
  data: Hex;
  transactionHash: Hex | null;
  blockNumber: bigint | null;
  logIndex: number | null;
};

/** Only the USDC predeploy's canonical 6-decimal Transfer logs are included.
 * Do not aggregate the native system emitter: it can duplicate these transfers.
 */
export function parseArcTransferLogs(logs: readonly ArcTransferLog[]) {
  return logs.flatMap((log) => {
    if (log.address.toLowerCase() !== ARC_USDC_ADDRESS.toLowerCase()) return [];
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
      });
      if (decoded.eventName !== "Transfer") return [];
      return [{
        txHash: log.transactionHash,
        blockNumber: log.blockNumber?.toString() ?? null,
        logIndex: log.logIndex,
        from: decoded.args.from,
        to: decoded.args.to,
        amountUsdc: formatArcTokenUsdc(decoded.args.value),
      }];
    } catch {
      // Ignore unrelated/invalid log data; never manufacture a transfer.
      return [];
    }
  });
}

export async function getArcStatus(network: ArcNetwork) {
  const client = await checkedClient(network);
  const latestBlock = await client.getBlockNumber();
  const config = networks[network];
  return {
    network,
    chainId: config.id,
    latestBlock: latestBlock.toString(),
    explorer: config.explorer,
    rpcConnected: true as const,
  };
}

export async function getArcTreasuryBalance(network: ArcNetwork, address: string) {
  const owner = normalizeArcAddress(address);
  const client = await checkedClient(network);
  const [erc20Balance, blockNumber] = await Promise.all([
    client.readContract({
      address: ARC_USDC_ADDRESS,
      abi: usdcBalanceAbi,
      functionName: "balanceOf",
      args: [owner],
    }),
    client.getBlockNumber(),
  ]);
  // Two views of Arc USDC, NOT amounts to add together.
  return {
    network,
    address: owner,
    blockNumber: blockNumber.toString(),
    usdcBalance: formatArcTokenUsdc(erc20Balance),
    note: "The same USDC pays transaction fees; this balance is the six-decimal ERC-20 view.",
    explorerUrl: `${networks[network].explorer}/address/${owner}`,
  };
}

export async function getArcRecentTransfers(
  network: ArcNetwork,
  address: string,
  blocks = 200,
) {
  const owner = normalizeArcAddress(address);
  if (!Number.isInteger(blocks) || blocks < 1 || blocks > 500) {
    throw new Error("blocks must be an integer between 1 and 500");
  }
  const client = await checkedClient(network);
  const latest = await client.getBlockNumber();
  const fromBlock = latest > BigInt(blocks - 1) ? latest - BigInt(blocks - 1) : 0n;
  const [sent, received] = await Promise.all([
    client.getLogs({ address: ARC_USDC_ADDRESS, event: transferEvent, args: { from: owner }, fromBlock, toBlock: latest }),
    client.getLogs({ address: ARC_USDC_ADDRESS, event: transferEvent, args: { to: owner }, fromBlock, toBlock: latest }),
  ]);
  const unique = new Map<string, ArcTransferLog>();
  for (const log of [...sent, ...received]) {
    unique.set(`${log.transactionHash}:${log.logIndex}`, log);
  }
  const transfers = parseArcTransferLogs([...unique.values()])
    .sort((a, b) => {
      const byBlock = BigInt(b.blockNumber ?? 0) - BigInt(a.blockNumber ?? 0);
      return byBlock > 0n ? 1 : byBlock < 0n ? -1 : (b.logIndex ?? 0) - (a.logIndex ?? 0);
    })
    .slice(0, 50)
    .map((entry) => ({
      ...entry,
      explorerUrl: entry.txHash ? `${networks[network].explorer}/tx/${entry.txHash}` : null,
    }));
  return {
    network,
    address: owner,
    scannedFromBlock: fromBlock.toString(),
    scannedToBlock: latest.toString(),
    transfers,
    warning: "Only the requested recent block window is scanned; this is not full transaction history.",
  };
}

export async function getArcTransactionProof(network: ArcNetwork, txHash: Hex) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new Error("Invalid transaction hash");
  const client = await checkedClient(network);
  const [receipt, transaction] = await Promise.all([
    client.getTransactionReceipt({ hash: txHash }),
    client.getTransaction({ hash: txHash }),
  ]);
  return {
    network,
    hash: txHash,
    status: receipt.status,
    blockNumber: receipt.blockNumber.toString(),
    from: transaction.from,
    to: transaction.to,
    nativeValueUsdc: formatArcNativeUsdc(transaction.value),
    nativeValueNote: "Transaction msg.value, not necessarily the final amount received by a contract.",
    feeUsdc: formatArcNativeUsdc(receipt.gasUsed * receipt.effectiveGasPrice),
    usdcTransfers: parseArcTransferLogs(receipt.logs),
    explorerUrl: `${networks[network].explorer}/tx/${txHash}`,
    verifiedFromRpc: true as const,
  };
}
