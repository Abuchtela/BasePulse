// Live RPC smoke checks; never sends a transaction or accesses secrets.
const networks = [
  { name: "mainnet", url: process.env.ARC_MAINNET_RPC_URL || "https://rpc.mainnet.arc.io", chainId: 5042 },
  { name: "testnet", url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.io", chainId: 5042002 },
];
async function rpc(url, method, params = []) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} (${method})`);
  const body = await response.json();
  if (body.error) throw new Error(`JSON-RPC error ${body.error.code}: ${body.error.message}`);
  if (typeof body.result !== "string" || !/^0x[0-9a-fA-F]+$/.test(body.result)) {
    throw new Error(`Invalid ${method} result`);
  }
  return body.result;
}

let failures = 0;
for (const n of networks) {
  try {
    const chainId = Number(BigInt(await rpc(n.url, "eth_chainId")));
    if (chainId !== n.chainId) throw new Error(`Wrong chain: ${chainId}`);
    const block = BigInt(await rpc(n.url, "eth_blockNumber"));
    if (block <= 0n) throw new Error("Invalid head block");
    const balanceOfZeroAddress = "0x70a08231" + "0".repeat(64);
    const zeroAddressBalance = await rpc(n.url, "eth_call", [{
      to: "0x3600000000000000000000000000000000000000",
      data: balanceOfZeroAddress,
    }, "latest"]);
    console.log(`VERIFIED ${n.name} chainId=${chainId} block=${block} USDC.balanceOf(0x0)=${BigInt(zeroAddressBalance)}`);
  } catch (error) {
    failures += 1;
    console.error(`FAILED ${n.name}: ${error.message}`);
  }
}
if (failures) process.exitCode = 1;
