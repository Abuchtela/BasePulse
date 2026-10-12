/**
 * Browser-wallet deployment for BasePulse's non-custodial proof registry.
 * No seed phrases or signing keys are processed or requested by this app.
 * Each transaction requires explicit approval in the user's wallet.
 */
const RPC = "https://rpc.mainnet.arc.io";
const READ_RPCS = [RPC, "https://rpc.arc-scan.org"];
const ARC_ID = "0x13b2"; // 5042
const $ = (id) => document.getElementById(id);
const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HEX_WORD = /^0x[0-9a-fA-F]{64}$/;
const rpcApproved = new Set();

async function callEndpoint(endpoint, method, params = []) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 101, method, params }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const body = await response.json();
  if (body.error) throw new Error(body.error.message || "RPC error");
  if (!Object.hasOwn(body, "result")) throw new Error("Malformed RPC response");
  return body.result;
}

/**
 * Queries only. Arcscan's secondary RPC is READ-ONLY, and must never be
 * installed as a wallet's transaction broadcast endpoint.
 */
async function rpc(method, params = []) {
  let lastError;
  for (const endpoint of READ_RPCS) {
    try {
      if (!rpcApproved.has(endpoint)) {
        const chain = await callEndpoint(endpoint, "eth_chainId");
        if (BigInt(chain) !== 5042n) throw new Error("Endpoint is not Arc mainnet");
        rpcApproved.add(endpoint);
      }
      const result = await callEndpoint(endpoint, method, params);
      if (result === null && method === "eth_getTransactionReceipt") continue;
      return result;
    } catch (error) {
      lastError = error;
      // The next provider is only for reading and verifying chain data.
    }
  }
  throw new Error("Arc read RPC endpoints unavailable: " + (lastError?.message || "Unknown error"));
}

async function checkArcRpc() {
  const chain = await rpc("eth_chainId");
  if (BigInt(chain) !== 5042n) throw new Error("RPC does not report Arc mainnet (5042)");
}

async function getArcWallet() {
  const wallet = window.ethereum;
  if (!wallet || typeof wallet.request !== "function") {
    throw new Error("Open this page inside a wallet browser (MetaMask or Coinbase Wallet) with Arc mainnet support.");
  }
  const accounts = await wallet.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || !HEX_ADDRESS.test(accounts[0] || "")) {
    throw new Error("No valid account returned by your wallet");
  }
  const current = await wallet.request({ method: "eth_chainId" });
  if (BigInt(current) !== 5042n) {
    try {
      await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_ID }] });
    } catch (error) {
      if (error.code !== 4902) throw error;
      await wallet.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: ARC_ID,
          chainName: "Arc Mainnet",
          nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
          rpcUrls: [RPC],
          blockExplorerUrls: ["https://explorer.arc.io"],
        }],
      });
      await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_ID }] });
    }
  }
  if (BigInt(await wallet.request({ method: "eth_chainId" })) !== 5042n) {
    throw new Error("Wallet is not connected to Arc mainnet");
  }
  return { wallet, account: accounts[0] };
}

async function loadArtifact() {
  const response = await fetch("./ArcTreasuryProof.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Compiled contract artifact missing from deployed website");
  const artifact = await response.json();
  if (artifact.chainId !== 5042 ||
      !/^0x[0-9a-fA-F]+$/.test(artifact.bytecode || "") ||
      !/^0x[0-9a-fA-F]{8}$/.test(artifact.recordProofSelector || "")) {
    throw new Error("Compiled contract artifact is invalid");
  }
  return artifact;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function awaitReceipt(hash) {
  if (!HEX_WORD.test(hash)) throw new Error("Wallet returned an invalid transaction hash");
  for (let attempt = 0; attempt < 45; attempt++) {
    const receipt = await rpc("eth_getTransactionReceipt", [hash]);
    if (receipt) {
      if (receipt.transactionHash?.toLowerCase() !== hash.toLowerCase()) {
        throw new Error("RPC receipt hash mismatch");
      }
      return receipt;
    }
    await delay(2000);
  }
  throw new Error("Transaction submitted but receipt not found yet. Check the explorer.");
}

function show(id, message, error = false) {
  const element = $(id);
  element.textContent = message;
  element.classList.toggle("error", error);
}

function txLink(id, hash) {
  const el = $(id);
  el.replaceChildren();
  const anchor = document.createElement("a");
  anchor.href = "https://explorer.arc.io/tx/" + hash;
  anchor.textContent = "View transaction on Arc Explorer";
  anchor.rel = "noopener noreferrer";
  anchor.target = "_blank";
  el.append(anchor);
}

async function deployRegistry() {
  const button = $("deploy-proof");
  button.disabled = true;
  $("deploy-tx-link").replaceChildren();
  try {
    show("deploy-status", "Checking Arc mainnet and deployable bytecode…");
    await checkArcRpc();
    const artifact = await loadArtifact();
    const { wallet, account } = await getArcWallet();
    show("deploy-status", "Requesting wallet approval. Arc charges a small USDC network fee.");
    const hash = await wallet.request({
      method: "eth_sendTransaction",
      params: [{ from: account, data: artifact.bytecode, value: "0x0" }],
    });
    txLink("deploy-tx-link", hash);
    show("deploy-status", "Transaction sent: " + hash + ". Verifying deployment receipt…");
    const receipt = await awaitReceipt(hash);
    if (receipt.status !== "0x1" || !HEX_ADDRESS.test(receipt.contractAddress || "")) {
      throw new Error("Contract creation did not succeed onchain (transaction may have reverted)");
    }
    const code = await rpc("eth_getCode", [receipt.contractAddress, "latest"]);
    if (!code || code === "0x" || code.length < 80) throw new Error("No contract bytecode found at receipt address");
    $("proof-contract").value = receipt.contractAddress;
    show("deploy-status", "VERIFIED on Arc mainnet at " + receipt.contractAddress + " (block " + Number(BigInt(receipt.blockNumber)).toLocaleString("en-US") + "). Deployment transaction: " + hash);
    const codeLink = document.createElement("a");
    codeLink.href = "https://explorer.arc.io/address/" + receipt.contractAddress;
    codeLink.textContent = "View deployed contract";
    codeLink.target = "_blank";
    codeLink.rel = "noopener noreferrer";
    $("deploy-tx-link").append(" · ", codeLink);
  } catch (error) {
    show("deploy-status", error.message || String(error), true);
  } finally {
    button.disabled = false;
  }
}

async function verifyRegistry() {
  const address = $("proof-contract").value.trim();
  if (!HEX_ADDRESS.test(address)) {
    show("proof-status", "Enter a valid 0x contract address", true);
    return;
  }
  try {
    await checkArcRpc();
    const code = await rpc("eth_getCode", [address, "latest"]);
    if (!code || code === "0x") throw new Error("No deployed contract at this address on Arc mainnet");
    // Additional check: owner() and proofCount() are part of our contract's ABI.
    const artifact = await loadArtifact();
    const ownerMethod = artifact.abi.some((x) => x.name === "owner");
    if (!ownerMethod) throw new Error("Unexpected contract ABI");
    const ownerResult = await rpc("eth_call", [{ to: address, data: "0x8da5cb5b" }, "latest"]);
    if (!/^0x[0-9a-fA-F]{64}$/.test(ownerResult)) throw new Error("owner() response invalid; not a matching proof registry");
    const owner = "0x" + ownerResult.slice(-40);
    show("proof-status", "Live contract detected. Owner: " + owner + ". For strongest proof, save the creation transaction hash as well.");
  } catch (error) {
    show("proof-status", error.message || String(error), true);
  }
}

async function recordProof() {
  const button = $("anchor-proof");
  button.disabled = true;
  $("proof-tx-link").replaceChildren();
  try {
    const address = $("proof-contract").value.trim();
    const digest = $("proof-hash").value.trim();
    if (!HEX_ADDRESS.test(address)) throw new Error("Enter your deployed proof registry address");
    if (!HEX_WORD.test(digest) || /^0x0{64}$/.test(digest)) throw new Error("Enter a nonzero 32-byte hash (0x + 64 hex characters)");
    await checkArcRpc();
    const artifact = await loadArtifact();
    const code = await rpc("eth_getCode", [address, "latest"]);
    if (code === "0x") throw new Error("No contract code at supplied Arc address");
    const { wallet, account } = await getArcWallet();
    show("proof-status", "Review and approve the proof-recording transaction in your wallet.");
    const hash = await wallet.request({
      method: "eth_sendTransaction",
      params: [{
        from: account,
        to: address,
        value: "0x0",
        data: artifact.recordProofSelector + digest.slice(2),
      }],
    });
    txLink("proof-tx-link", hash);
    show("proof-status", "Anchoring proof on Arc mainnet. Checking receipt…");
    const receipt = await awaitReceipt(hash);
    if (receipt.status !== "0x1") throw new Error("Proof transaction reverted. Only the registry owner can record new hashes.");
    show("proof-status", "VERIFIED: proof hash anchored in Arc mainnet transaction " + hash);
  } catch (error) {
    show("proof-status", error.message || String(error), true);
  } finally {
    button.disabled = false;
  }
}


async function diagnoseWallet() {
  const el = $("wallet-diagnostics");
  if (!el) return;
  const btn = $("diagnose-wallet");
  btn.disabled = true;
  try {
    show("wallet-diagnostics", "Checking Arc read RPC…");
    await checkArcRpc();
    const wallet = window.ethereum;
    if (!wallet || typeof wallet.request !== "function") {
      throw new Error("Arc read RPC works, but no injected wallet was found. Open this page in your wallet's built-in browser.");
    }
    const chain = await wallet.request({ method: "eth_chainId" });
    if (BigInt(chain) !== 5042n) {
      throw new Error("Arc read RPC works, but wallet is on chain " + BigInt(chain) + ". Switch the wallet to Arc Mainnet (5042).");
    }
    try {
      const block = await wallet.request({ method: "eth_getBlockByNumber", params: ["latest", false] });
      if (!block?.number) throw new Error("Empty block response");
      show("wallet-diagnostics", "Arc RPC and wallet network both respond. Latest wallet block: " + BigInt(block.number).toString() + ". If you already deployed, check wallet history for a contract-creation transaction hash.");
    } catch (error) {
      throw new Error("Arc read RPC works, but your WALLET'S RPC failed reading a block: " +
        (error?.message || String(error)) +
        ". Edit Arc Mainnet network in your wallet; set the RPC URL to https://rpc.mainnet.arc.io. Do not use the read-only fallback RPC to send transactions. Reopen this page in your wallet browser.");
    }
  } catch (error) {
    show("wallet-diagnostics", error?.message || String(error), true);
  } finally {
    btn.disabled = false;
  }
}

$("diagnose-wallet")?.addEventListener("click", diagnoseWallet);
$("deploy-proof").addEventListener("click", deployRegistry);
$("verify-proof").addEventListener("click", verifyRegistry);
$("anchor-proof").addEventListener("click", recordProof);
