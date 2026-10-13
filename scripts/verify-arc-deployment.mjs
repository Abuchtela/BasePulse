// Independently verify the user-provided Arc mainnet deployment against chain RPC.
// Read only: no wallet, private keys, transactions, or gas expenditure.
import { readFile, writeFile } from "node:fs/promises";
import { toFunctionSelector } from "viem";

const stated = Object.freeze({
  chainId: 5042,
  transactionHash: "0xa29565ca13c91df360705106b2dcd5d1e822cb415f388cf5a0b5dc0cf290d45b",
  contractAddress: "0xa8ffe853e041b0033441a4bea272a5cbb032e9c6",
  blockNumber: 25760713,
});
const providers = [
  "https://rpc.mainnet.arc.io",
  "https://arc-rpc.publicnode.com",
  "https://rpc.arc-scan.org",
];

async function postRpc(url, method, params = []) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 181, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  const result = await response.json();
  if (result.error) throw new Error(`${url}: ${result.error.message}`);
  if (!Object.hasOwn(result, "result")) throw new Error(`Malformed ${method} result`);
  return result.result;
}

async function verifiedProvider(url, contract) {
  const chain = BigInt(await postRpc(url, "eth_chainId"));
  if (chain !== BigInt(stated.chainId)) throw new Error(`Wrong chain ID: ${chain}`);
  const receipt = await postRpc(url, "eth_getTransactionReceipt", [stated.transactionHash]);
  if (!receipt) throw new Error("No transaction receipt at this provider");
  if (receipt.transactionHash?.toLowerCase() !== stated.transactionHash) throw new Error("Hash mismatch");
  if (receipt.status !== "0x1") throw new Error("Transaction did not succeed");
  if (receipt.contractAddress?.toLowerCase() !== stated.contractAddress) throw new Error("Different contract address");
  if (Number(BigInt(receipt.blockNumber)) !== stated.blockNumber) throw new Error("Block number mismatch");
  if (receipt.to !== null) throw new Error("Not a contract creation receipt");

  const transaction = await postRpc(url, "eth_getTransactionByHash", [stated.transactionHash]);
  if (!transaction || transaction.hash?.toLowerCase() !== stated.transactionHash) throw new Error("No matching transaction");
  if (transaction.to !== null) throw new Error("Not a contract creation transaction");
  if (transaction.from?.toLowerCase() !== receipt.from?.toLowerCase()) throw new Error("Sender mismatch");
  if ((transaction.input || transaction.data)?.toLowerCase() !== contract.bytecode.toLowerCase()) {
    throw new Error("Deployed creation bytecode does not match compiled BasePulse ArcTreasuryProof.sol");
  }

  const deployedCode = await postRpc(url, "eth_getCode", [stated.contractAddress, "latest"]);
  if (!/^0x[0-9a-f]+$/i.test(deployedCode || "") || deployedCode.length < 80) {
    throw new Error("No runtime contract code found");
  }
  const owner = await postRpc(url, "eth_call", [{
    to: stated.contractAddress, data: toFunctionSelector("owner()"),
  }, "latest"]);
  if (!/^0x[0-9a-f]{64}$/i.test(owner || "") || owner.slice(-40).toLowerCase() !== transaction.from.slice(2).toLowerCase()) {
    throw new Error("owner() did not match contract deployer");
  }
  const count = await postRpc(url, "eth_call", [{
    to: stated.contractAddress, data: toFunctionSelector("proofCount()"),
  }, "latest"]);
  if (!/^0x[0-9a-f]+$/i.test(count || "")) throw new Error("Cannot read proofCount()");

  return {
    ...stated,
    status: "verified",
    contractType: "ArcTreasuryProof",
    sourcePath: "contracts/ArcTreasuryProof.sol",
    deployer: transaction.from,
    proofCount: BigInt(count).toString(),
    verifiedAgainst: url,
    contractCreationBytecodeMatched: true,
    ownerMatchedDeployer: true,
    explorerTransaction: "https://explorer.arc.io/tx/" + stated.transactionHash,
    explorerContract: "https://explorer.arc.io/address/" + stated.contractAddress,
  };
}

const contract = JSON.parse(await readFile("docs/arc-demo/ArcTreasuryProof.json", "utf8"));
if (contract.chainId !== stated.chainId) throw new Error("Artifact has wrong chain ID");
let verified;
for (const provider of providers) {
  try {
    verified = await verifiedProvider(provider, contract);
    break;
  } catch (error) {
    console.error(`Arc verification via ${provider}: ${error.message}`);
  }
}
if (!verified) throw new Error("Unable to independently verify deployment: refusing to publish an unverified record");
await writeFile("docs/arc-demo/arc-deployment-verified.json", JSON.stringify(verified, null, 2) + "\n");
console.log("INDEPENDENTLY VERIFIED ARC MAINNET DEPLOYMENT", JSON.stringify(verified));
