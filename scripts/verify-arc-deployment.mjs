// Resolve and independently verify an Arc mainnet contract deployment.
// A separate user-provided transaction hash is retained for audit but is NOT assumed to be the creation transaction.
import { readFile, writeFile } from "node:fs/promises";
import { toFunctionSelector, toEventSelector } from "viem";

const supplied = Object.freeze({
  chainId: 5042,
  userSuppliedTransactionHash: "0xa29565ca13c91df360705106b2dcd5d1e822cb415f388cf5a0b5dc0cf290d45b",
  contractAddress: "0xa8ffe853e041b0033441a4bea272a5cbb032e9c6",
  reportedDeploymentBlock: 25760713,
});
const providers = ["https://rpc.mainnet.arc.io", "https://arc-rpc.publicnode.com"];
async function rpc(url, method, params = []) {
  const response = await fetch(url, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 181, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} on ${method}`);
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  if (!Object.hasOwn(body, "result")) throw new Error(`Malformed response to ${method}`);
  return body.result;
}

async function getBlockReceipts(url, blockNumber) {
  const blockHex = "0x" + blockNumber.toString(16);
  const block = await rpc(url, "eth_getBlockByNumber", [blockHex, false]);
  if (!block || Number(BigInt(block.number)) !== blockNumber) throw new Error("Reported deployment block not returned");
  console.log("REPORTED BLOCK", blockNumber, "transactions", block.transactions?.length);
  try {
    const receipts = await rpc(url, "eth_getBlockReceipts", [blockHex]);
    if (Array.isArray(receipts)) return receipts;
  } catch (error) {
    console.log("Block receipts batch unavailable:", error.message, "- using transaction receipts");
  }
  if (!Array.isArray(block.transactions) || block.transactions.length > 200) {
    throw new Error("Cannot inspect all block transactions safely");
  }
  const receipts = [];
  for (const hash of block.transactions) {
    receipts.push(await rpc(url, "eth_getTransactionReceipt", [hash]));
  }
  return receipts.filter(Boolean);
}

async function verifyProvider(url, artifact) {
  const chain = BigInt(await rpc(url, "eth_chainId"));
  if (chain !== BigInt(supplied.chainId)) throw new Error("Wrong chain id " + chain);

  const userTx = await rpc(url, "eth_getTransactionReceipt", [supplied.userSuppliedTransactionHash]);
  if (userTx) {
    console.log("USER PROVIDED HASH", supplied.userSuppliedTransactionHash,
      "block", BigInt(userTx.blockNumber).toString(),
      "contractAddress", userTx.contractAddress,
      "status", userTx.status);
  }
  const code = await rpc(url, "eth_getCode", [supplied.contractAddress, "latest"]);
  if (!/^0x[0-9a-f]+$/i.test(code || "") || code.length < 80) {
    throw new Error("Reported contract address has no deployed code on Arc mainnet");
  }
  console.log("CONTRACT HAS LIVE CODE", supplied.contractAddress, "bytes", (code.length - 2) / 2);

  const receipts = await getBlockReceipts(url, supplied.reportedDeploymentBlock);
  const receipt = receipts.find((x) => x?.contractAddress?.toLowerCase() === supplied.contractAddress);
  if (!receipt) throw new Error("No contract creation receipt matches this address in reported block");
  if (receipt.status !== "0x1") throw new Error("Deployment receipt reverted");
  const creationTx = await rpc(url, "eth_getTransactionByHash", [receipt.transactionHash]);
  if (!creationTx || creationTx.to !== null) throw new Error("Creation transaction missing or has recipient");
  if ((creationTx.input || creationTx.data)?.toLowerCase() !== artifact.bytecode.toLowerCase()) {
    throw new Error("Onchain creation bytecode does not match compiled BasePulse ArcTreasuryProof.sol");
  }
  if (creationTx.from?.toLowerCase() !== receipt.from?.toLowerCase()) throw new Error("Deployer mismatch");
  const owner = await rpc(url, "eth_call", [{
    to: supplied.contractAddress, data: toFunctionSelector("owner()"),
  }, "latest"]);
  if (!/^0x[0-9a-f]{64}$/i.test(owner || "") ||
      owner.slice(-40).toLowerCase() !== creationTx.from.slice(2).toLowerCase()) {
    throw new Error("owner() does not match contract deployer");
  }
  const count = await rpc(url, "eth_call", [{
    to: supplied.contractAddress, data: toFunctionSelector("proofCount()"),
  }, "latest"]);
  if (!/^0x[0-9a-f]+$/i.test(count || "")) throw new Error("Cannot read proofCount()");
  let proofTransactionHash = null;
  let anchoredDigest = null;
  let proofEventVerified = false;
  if (userTx?.status === "0x1") {
    const proofTx = await rpc(url, "eth_getTransactionByHash", [supplied.userSuppliedTransactionHash]);
    const selector = toFunctionSelector("recordProof(bytes32)");
    const eventSelector = toEventSelector("TreasuryProofRecorded(bytes32,address,uint256)");
    const rawInput = proofTx?.input || proofTx?.data || "";
    const isProofCall = proofTx?.to?.toLowerCase() === supplied.contractAddress &&
      proofTx?.from?.toLowerCase() === creationTx.from?.toLowerCase() &&
      rawInput.toLowerCase().startsWith(selector.toLowerCase()) &&
      /^0x[0-9a-f]{64}$/i.test("0x" + rawInput.slice(10));
    if (isProofCall) {
      const digest = "0x" + rawInput.slice(10).toLowerCase();
      const proofEvent = (userTx.logs || []).find((log) =>
        log.address?.toLowerCase() === supplied.contractAddress &&
        log.topics?.[0]?.toLowerCase() === eventSelector.toLowerCase() &&
        log.topics?.[1]?.toLowerCase() === digest);
      if (!proofEvent) throw new Error("recordProof transaction missing expected TreasuryProofRecorded log");
      const isRecorded = await rpc(url, "eth_call", [{
        to: supplied.contractAddress,
        data: toFunctionSelector("recorded(bytes32)") + digest.slice(2),
      }, "latest"]);
      if (BigInt(isRecorded) !== 1n) throw new Error("recorded(bytes32) is false for the claimed proof hash");
      proofTransactionHash = supplied.userSuppliedTransactionHash;
      anchoredDigest = digest;
      proofEventVerified = true;
      console.log("VERIFIED RECORDED PROOF", proofTransactionHash, "digest", digest);
    }
  }

  if (!proofEventVerified) throw new Error("Expected user-provided onchain proof transaction was not independently verified");

  return {
    chainId: supplied.chainId,
    network: "Arc Mainnet",
    status: "verified",
    contractType: "ArcTreasuryProof",
    sourcePath: "contracts/ArcTreasuryProof.sol",
    contractAddress: supplied.contractAddress,
    deploymentTransactionHash: receipt.transactionHash,
    deploymentBlock: Number(BigInt(receipt.blockNumber)),
    deployer: creationTx.from,
    proofCount: BigInt(count).toString(),
    proofTransactionHash,
    anchoredDigest,
    proofEventVerified,
    userSuppliedOtherTransactionHash: proofTransactionHash ? null : supplied.userSuppliedTransactionHash,
    compilerCreationBytecodeMatched: true,
    ownerMatchedDeployer: true,
    verifiedAgainst: url,
    explorerTransaction: "https://explorer.arc.io/tx/" + receipt.transactionHash,
    explorerContract: "https://explorer.arc.io/address/" + supplied.contractAddress,
  };
}

const artifact = JSON.parse(await readFile("docs/arc-demo/ArcTreasuryProof.json", "utf8"));
if (artifact.chainId !== supplied.chainId) throw new Error("Wrong compiled artifact chain");
let proof;
for (const url of providers) {
  try { proof = await verifyProvider(url, artifact); break; }
  catch (error) { console.error("VERIFY ATTEMPT", url, error.message); }
}
if (!proof) throw new Error("Cannot publish without independent contract code + receipt verification");
await writeFile("docs/arc-demo/arc-deployment-verified.json", JSON.stringify(proof, null, 2) + "\n");
console.log("VERIFIED MAINNET CONTRACT", JSON.stringify(proof));
