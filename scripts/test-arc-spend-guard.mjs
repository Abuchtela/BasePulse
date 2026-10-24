import { readFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  keccak256,
  parseUnits,
  publicActions,
  toBytes,
} from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { defineChain } from "viem/utils";

const mnemonic = "test test test test test test test test test test test junk";
const owner = mnemonicToAccount(mnemonic, { addressIndex: 0 });
const recipient = mnemonicToAccount(mnemonic, { addressIndex: 1 });
const port = 18542;
const rpcUrl = `http://127.0.0.1:${port}`;
const chain = defineChain({
  id: 5042,
  name: "Local Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
});

let ganache;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForRpc(client) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await client.getChainId();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("Local Arc RPC did not start");
}

try {
  const [guardSource, tokenSource] = await Promise.all([
    readFile("contracts/ArcSpendGuard.sol", "utf8"),
    readFile("contracts/test/MockArcUSDC.sol", "utf8"),
  ]);
  const compilerInput = {
    language: "Solidity",
    sources: {
      "contracts/ArcSpendGuard.sol": { content: guardSource },
      "contracts/test/MockArcUSDC.sol": { content: tokenSource },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // Ganache 7 does not support Cancun's MCOPY opcode. Arc accepts this
      // conservative target, which also makes the local runtime deterministic.
      evmVersion: "shanghai",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const compile = spawnSync(
    "npx",
    ["--yes", "--package=solc@0.8.28", "solcjs", "--standard-json"],
    { encoding: "utf8", input: JSON.stringify(compilerInput), maxBuffer: 10 * 1024 * 1024 },
  );
  if (compile.status !== 0) throw new Error(compile.stderr || compile.stdout);
  const jsonStart = compile.stdout.indexOf("{");
  if (jsonStart < 0) throw new Error(`Invalid compiler output: ${compile.stdout}`);
  const compilerOutput = JSON.parse(compile.stdout.slice(jsonStart));
  const fatalErrors = (compilerOutput.errors ?? []).filter((error) => error.severity === "error");
  if (fatalErrors.length) throw new Error(fatalErrors.map((error) => error.formattedMessage).join("\n"));
  const guardArtifact = compilerOutput.contracts["contracts/ArcSpendGuard.sol"].ArcSpendGuard;
  const tokenArtifact = compilerOutput.contracts["contracts/test/MockArcUSDC.sol"].MockArcUSDC;
  const guardAbi = guardArtifact.abi;
  const guardBin = guardArtifact.evm.bytecode.object;
  const tokenAbi = tokenArtifact.abi;
  const tokenBin = tokenArtifact.evm.bytecode.object;

  ganache = spawn(
    "npx",
    [
      "--yes",
      "ganache@7.9.2",
      "--server.port",
      String(port),
      "--chain.chainId",
      "5042",
      "--wallet.mnemonic",
      mnemonic,
      "--logging.quiet",
    ],
    { stdio: ["ignore", "pipe", "pipe"], detached: true },
  );

  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const testClient = createTestClient({ chain, mode: "ganache", transport: http(rpcUrl) })
    .extend(publicActions);
  const wallet = createWalletClient({ account: owner, chain, transport: http(rpcUrl) });
  await waitForRpc(publicClient);

  const tokenHash = await wallet.deployContract({ abi: tokenAbi, bytecode: `0x${tokenBin.trim()}` });
  const tokenReceipt = await publicClient.waitForTransactionReceipt({ hash: tokenHash });
  const tokenAddress = tokenReceipt.contractAddress;
  assert(tokenAddress, "Mock USDC deployment failed");

  // Arc fixes USDC at this predeploy address, so mirror mock runtime code there locally.
  const mockCode = await publicClient.getCode({ address: tokenAddress });
  await testClient.setCode({
    address: "0x3600000000000000000000000000000000000000",
    bytecode: mockCode,
  });
  const usdc = "0x3600000000000000000000000000000000000000";
  const oneUsdc = parseUnits("1", 6);
  const guardHash = await wallet.deployContract({
    abi: guardAbi,
    bytecode: `0x${guardBin.trim()}`,
    args: [oneUsdc, parseUnits("2", 6)],
  });
  const guardReceipt = await publicClient.waitForTransactionReceipt({ hash: guardHash });
  const guard = guardReceipt.contractAddress;
  assert(guard, "SpendGuard deployment failed");

  for (const call of [
    { functionName: "mint", args: [owner.address, parseUnits("5", 6)] },
    { functionName: "approve", args: [guard, parseUnits("2", 6)] },
  ]) {
    const hash = await wallet.writeContract({ address: usdc, abi: tokenAbi, ...call });
    await publicClient.waitForTransactionReceipt({ hash });
  }
  let hash = await wallet.writeContract({
    address: guard,
    abi: guardAbi,
    functionName: "setRecipientPermission",
    args: [recipient.address, true],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const block = await publicClient.getBlock();
  const intent = keccak256(toBytes("basepulse-local-payment-1"));
  hash = await wallet.writeContract({
    address: guard,
    abi: guardAbi,
    functionName: "executePayment",
    args: [intent, recipient.address, parseUnits("0.75", 6), block.timestamp + 300n],
  });
  const paymentReceipt = await publicClient.waitForTransactionReceipt({ hash });
  assert(paymentReceipt.status === "success", "Allowed payment failed");

  const balance = await publicClient.readContract({
    address: usdc,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [recipient.address],
  });
  assert(balance === parseUnits("0.75", 6), "Recipient did not receive 0.75 USDC");

  hash = await wallet.writeContract({
    address: guard,
    abi: guardAbi,
    functionName: "setLimits",
    args: [parseUnits("0.8", 6), parseUnits("0.8", 6)],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const rejectionCases = [
    ["replay", [intent, recipient.address, 1n, block.timestamp + 300n]],
    [
      "per-payment cap",
      [keccak256(toBytes("too-large")), recipient.address, parseUnits("1.01", 6), block.timestamp + 300n],
    ],
    [
      "expired intent",
      [keccak256(toBytes("expired")), recipient.address, 1n, block.timestamp - 1n],
    ],
    [
      "daily cap",
      [keccak256(toBytes("daily-cap")), recipient.address, parseUnits("0.1", 6), block.timestamp + 300n],
    ],
    [
      "recipient allowlist",
      [keccak256(toBytes("not-allowed")), owner.address, 1n, block.timestamp + 300n],
    ],
  ];
  for (const [label, args] of rejectionCases) {
    let rejected = false;
    try {
      await publicClient.simulateContract({
        account: owner,
        address: guard,
        abi: guardAbi,
        functionName: "executePayment",
        args,
      });
    } catch {
      rejected = true;
    }
    assert(rejected, `${label} was not rejected`);
  }

  hash = await wallet.writeContract({ address: guard, abi: guardAbi, functionName: "setPaused", args: [true] });
  await publicClient.waitForTransactionReceipt({ hash });
  let pausedRejected = false;
  try {
    await publicClient.simulateContract({
      account: owner,
      address: guard,
      abi: guardAbi,
      functionName: "executePayment",
      args: [keccak256(toBytes("paused")), recipient.address, 1n, block.timestamp + 300n],
    });
  } catch {
    pausedRejected = true;
  }
  assert(pausedRejected, "paused payment was not rejected");

  console.log("ArcSpendGuard integration tests passed:");
  console.log("- deployed with Arc chain ID 5042 and fixed USDC predeploy");
  console.log("- transferred 0.75 mock USDC through owner allowance");
  console.log("- rejected replay, per-payment/daily caps, expiry, disallowed recipient, and pause");
} finally {
  if (ganache?.pid) {
    try {
      process.kill(-ganache.pid, "SIGTERM");
    } catch {
      // The process group already exited.
    }
  }
}
