import { createWalletClient, createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { jsonToPayload, ExpirationTime } from "@arkiv-network/sdk/utils";
import { str, i32, u64 } from "@arkiv-network/sdk/attr";
import { custom, http } from "viem";
import { eq } from "@arkiv-network/sdk/query";

interface InjectedWallet {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}
declare global { interface Window { ethereum?: InjectedWallet } }
const rpc = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
let authorized = "";
const publisherConfig = fetch("/config",{cache:"no-store"}).then(async response => {
  if (!response.ok) throw new Error("Could not retrieve the authorized publisher from ClaimBot.");
  const config = await response.json() as { publisher: string };
  if (!/^0x[a-fA-F0-9]{40}$/.test(config.publisher)) throw new Error("Invalid publisher address configured on the server.");
  authorized = config.publisher.toLowerCase();
  return config.publisher;
});
const statusNode = document.querySelector("#status") as HTMLElement;
const connectButton = document.querySelector("#connect") as HTMLButtonElement;
const submitButton = document.querySelector("#publish") as HTMLButtonElement;
const walletNode = document.querySelector("#wallet") as HTMLElement;
const form = document.querySelector("#opportunity") as HTMLFormElement;

let account: `0x${string}` | null = null;
publisherConfig.then(publisher => { walletNode.textContent = "Required publisher: " + publisher; }).catch(error => {
  connectButton.disabled = true;
  status(error instanceof Error ? error.message : String(error), true);
});
function status(message: string, error = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle("error", error);
}
function field(name: string): string {
  const input = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  return input?.value.trim() ?? "";
}
function connectedWallet(): InjectedWallet {
  if (!window.ethereum) throw new Error("No browser wallet detected. Open this page in MetaMask's in-app browser or a browser with an injected wallet.");
  return window.ethereum;
}
async function ensureArkiv(wallet: InjectedWallet) {
  const chainId = await wallet.request({ method: "eth_chainId" });
  if (chainId === "0x7614d1") return;
  try {
    await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x7614d1" }] });
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code !== 4902) throw error;
    await wallet.request({ method: "wallet_addEthereumChain", params: [{
      chainId: "0x7614d1",
      chainName: "Arkiv Tiramisu Testnet",
      nativeCurrency: { name: "GLM", symbol: "GLM", decimals: 18 },
      rpcUrls: [rpc],
      blockExplorerUrls: ["https://tiramisu.explorer.arkiv.network"],
    }] });
    await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x7614d1" }] });
  }
  if ((await wallet.request({ method: "eth_chainId" })) !== "0x7614d1") throw new Error("Wallet is not on Arkiv Tiramisu.");
}
connectButton.addEventListener("click", async () => {
  try {
    await publisherConfig;
    const wallet = connectedWallet();
    const accounts = await wallet.request({ method: "eth_requestAccounts" }) as string[];
    const first = accounts[0];
    if (!first || first.toLowerCase() !== authorized) throw new Error("Connected address does not match the configured ClaimBot Arkiv publisher.");
    await ensureArkiv(wallet);
    account = first as `0x${string}`;
    walletNode.textContent = "Connected publisher: " + account;
    submitButton.disabled = false;
    status("Publisher wallet connected. You can review and sign a record.");
  } catch (error) {
    account = null;
    submitButton.disabled = true;
    status(error instanceof Error ? error.message : String(error), true);
  }
});
publisherConfig.then(() => window.ethereum?.request({method:"eth_accounts"})).then(value=>{
  const first=(value as string[]|undefined)?.[0]; if(first?.toLowerCase()===authorized) walletNode.textContent="Authorized publisher detected. Click Connect Wallet to verify the network.";
}).catch(()=>{});
form.addEventListener("submit", async event => {
  event.preventDefault();
  submitButton.disabled = true;
  try {
    await publisherConfig;
    const wallet = connectedWallet();
    const accounts = await wallet.request({ method: "eth_accounts" }) as string[];
    const selected = accounts[0];
    if (!account || !selected || selected.toLowerCase() !== authorized || selected.toLowerCase() !== account.toLowerCase()) {
      throw new Error("Connect the authorized publisher account before submitting.");
    }
    await ensureArkiv(wallet);
    const source = new URL(field("officialSourceUrl"));
    if (source.protocol !== "https:") throw new Error("Official source must be HTTPS.");
    const deadline = new Date(field("deadline"));
    const now = new Date();
    if (Number.isNaN(deadline.valueOf()) || deadline <= now) throw new Error("Deadline must be in the future.");
    const eligibility = field("eligibility").split("\n").map(x=>x.trim()).filter(Boolean);
    if (!eligibility.length) throw new Error("At least one eligibility requirement is needed.");
    const confirmation = form.elements.namedItem("verified") as HTMLInputElement;
    if (!confirmation?.checked) throw new Error("Check the official-source verification confirmation.");
    const target = field("targetProject") as "ClaimBot" | "BasePulse" | "Both";
    if (!["ClaimBot","BasePulse","Both"].includes(target)) throw new Error("Invalid target project.");
    const record = {
      id:field("id"), title:field("title"), officialSourceUrl:source.toString(),
      eligibility, deadline:deadline.toISOString(),
      payout:field("payout"), fit:field("fit"), smallestNextStep:field("smallestNextStep"),
      targetProject:target, region:"global" as const, status:"open" as const, verifiedAt:now.toISOString(),
    };
    if (!/^[a-zA-Z0-9_-]{4,80}$/.test(record.id)) throw new Error("Opportunity ID must be 4–80 letters, numbers, underscores or hyphens.");
    if (!record.id || !record.title || !record.payout || !record.fit || !record.smallestNextStep) {
      throw new Error("Complete every required opportunity field.");
    }
    // Preserve the server-side writer+ID duplicate check before creating an immutable record.
    const read = createPublicClient({chain:tiramisu,transport:http(rpc,{retryCount:1,timeout:10000})});
    const existing = await read.select({key:true})
      .where(eq("project","claimbot"),eq("entity_type","funding_opportunity"),eq("opportunity_id",record.id))
      .createdBy(account).limit(1).fetch();
    if (existing.entities.length || existing.hasNextPage()) {
      throw new Error("This publisher already created that opportunity ID. Do not submit duplicate records; choose a new versioned ID only after re-verifying the official source.");
    }
    // Wallet signs inside its own interface: no private key is ever sent or stored here.
    const client = createWalletClient({
      chain:tiramisu, account: account,
      transport: custom(wallet as Parameters<typeof custom>[0]),
    });
    status("Review the Arkiv Tiramisu testnet transaction in your wallet. Nothing is submitted until you approve.");
    const created = await client.createEntity({
      payload: jsonToPayload(record), contentType:"application/json",
      attributes: {
        project:str("claimbot"), entity_type:str("funding_opportunity"), schema_version:i32(1),
        opportunity_id:str(record.id), status:str("open"), region:str("global"),
        target_project:str(target.toLowerCase()),
        deadline_at:u64(BigInt(deadline.valueOf())), verified_at:u64(BigInt(now.valueOf())),
      },
      expires:ExpirationTime.fromDays(14),
      flags: { readonly: true, permissionlessExtension: false },
    });
    status("Submitted on Arkiv. Entity: " + String(created.entityKey) + "; Tx: " + String(created.txHash) + ". Check /api/opportunities?project=ClaimBot after confirmation.");
    console.info("Arkiv submission", {entityKey:created.entityKey,txHash:created.txHash});
  } catch (error) {
    status(error instanceof Error ? error.message : String(error), true);
  } finally {
    submitButton.disabled = false;
  }
});
