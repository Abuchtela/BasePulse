import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import { createWalletClient, createPublicClient, custom, http, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { checkoutOffer } from "../src/checkoutPolicy.js";
import { verifyPaymentReceipt, type PaymentExpectation } from "../src/receipt.js";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const project = $<HTMLSelectElement>("project");
const buy = $<HTMLButtonElement>("buy");
const refresh = $<HTMLButtonElement>("refresh");
const verify = $<HTMLButtonElement>("verify");
const download = $<HTMLButtonElement>("download");
type Config = {network: string; payTo: string; amount: string; price: string};
let config: Config;
let busy = false;
let purchase: {report: unknown; reportSha256: string; settlement: unknown; payment: PaymentExpectation; verification?: unknown} | undefined;
function status(text: string, error = false) { $("status").textContent = text; $("status").classList.toggle("error", error); }
function text(parent: HTMLElement, tag: string, content: string) {
  const node = document.createElement(tag); node.textContent = content; parent.append(node); return node;
}
function link(parent: HTMLElement, label: string, url: string) {
  const parsed = new URL(url); if (parsed.protocol !== "https:") return;
  const node = document.createElement("a"); node.textContent = label; node.href = parsed.href;
  node.target = "_blank"; node.rel = "noopener noreferrer"; parent.append(node);
}
async function available() {
  buy.disabled = true;
  try {
    const [configResponse, previewResponse] = await Promise.all([
      fetch("/config", {cache:"no-store"}),
      fetch(`/api/opportunities/preview?project=${encodeURIComponent(project.value)}`, {cache:"no-store"}),
    ]);
    if (!configResponse.ok) throw new Error("Payment configuration unavailable.");
    config = await configResponse.json();
    if (!["eip155:84532", "eip155:8453"].includes(config.network)) throw new Error("Unsupported payment network.");
    $("network").textContent = `${config.network === "eip155:84532" ? "Base Sepolia testnet · test USDC only · this is not real revenue" : "Base mainnet · real USDC"} · ${config.price} per report`;
    const preview = await previewResponse.json();
    if (!previewResponse.ok) throw new Error(preview.error || "Could not check opportunities.");
    $("availability").textContent = `${preview.count} source-checked ${preview.count === 1 ? "opportunity" : "opportunities"} available.`;
    $("titles").replaceChildren();
    for (const item of preview.opportunities) text($("titles"), "p", item.title);
    buy.textContent = `Connect wallet & buy report · ${config.price} ${config.network === "eip155:84532" ? "test " : ""}USDC`;
    buy.disabled = preview.count === 0;
    status(preview.count ? "Ready. Review and approve payment in your wallet when prompted." : "No current signed records. The designated publisher must publish a verified opportunity first.");
  } catch (error) { status(error instanceof Error ? error.message : String(error), true); }
}
async function checkReceipt() {
  if (!purchase) return;
  const client = createPublicClient({chain: purchase.payment.network === "eip155:84532" ? baseSepolia : base, transport:http()});
  const expectedId = Number(purchase.payment.network.split(":")[1]);
  if (await client.getChainId() !== expectedId) throw new Error("Receipt RPC returned the wrong network.");
  const receipt = await client.waitForTransactionReceipt({hash:purchase.payment.transaction, confirmations:1, timeout:45_000});
  purchase.verification = verifyPaymentReceipt(receipt, purchase.payment);
  text($("receipt-content"), "p", "Confirmed: the mined USDC transfer and signed authorization nonce match this checkout.");
  status("Report delivered. Payment independently verified onchain.");
}
function showReport(report: {project:string; count:number; results:Array<{opportunity:Record<string, unknown>; key:string; owner:string}>}) {
  $("report").hidden = false; $("results").replaceChildren();
  for (const item of report.results) {
    const o = item.opportunity;
    const article = document.createElement("article"); $("results").append(article);
    text(article,"h3",String(o.title));
    text(article,"p",String(o.payout));
    link(article,"Organizer's official source",String(o.officialSourceUrl));
    text(article,"p",o.deadline === null ? "Deadline: no closing date published; confirm in the application." : `Deadline: ${String(o.deadline)}`);
    const list = document.createElement("ul"); article.append(list);
    for (const criterion of o.eligibility as string[]) text(list,"li",criterion);
    text(article,"p",`Fit: ${String(o.fit)}`);
    text(article,"p",`Next step: ${String(o.smallestNextStep)}`);
    text(article,"p",`Source checked: ${String(o.verifiedAt)} · Arkiv entity: ${item.key} · Publisher: ${item.owner}`);
  }
}
buy.addEventListener("click", async () => {
  if (busy || purchase) return;
  busy = true; buy.disabled = true; refresh.disabled = true; project.disabled = true;
  let signatureSent = false;
  let payload: unknown;
  try {
    const resource = new URL(`/api/opportunities?project=${encodeURIComponent(project.value)}`,location.origin).href;
    status("Checking the report before requesting a payment signature…");
    const initial = await fetch(resource, {cache:"no-store",headers:{Accept:"application/json"}});
    if (initial.status !== 402) {
      const result = await initial.json();
      throw new Error(result.error || "No payable report was returned. No payment was signed.");
    }
    const httpClient = new x402HTTPClient(new x402Client());
    const challenge = httpClient.getPaymentRequiredResponse(name => initial.headers.get(name));
    const offer = checkoutOffer(challenge, {...config, resource});
    if (!window.ethereum) throw new Error("Open ClaimBot in your wallet's browser, or use a browser with a wallet installed.");
    const accounts = await window.ethereum.request({method:"eth_requestAccounts"}) as Address[];
    if (!accounts[0]) throw new Error("No wallet selected.");
    const chain = config.network === "eip155:84532" ? baseSepolia : base;
    const chainHex = `0x${chain.id.toString(16)}`;
    if (await window.ethereum.request({method:"eth_chainId"}) !== chainHex) {
      await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:chainHex}]});
    }
    if (await window.ethereum.request({method:"eth_chainId"}) !== chainHex) throw new Error("Switch to the displayed payment network.");
    const wallet = createWalletClient({chain,account:accounts[0],transport:custom(window.ethereum as Parameters<typeof custom>[0])});
    const signer = toClientEvmSigner({address:accounts[0],
      signTypedData: args => wallet.signTypedData(args as Parameters<typeof wallet.signTypedData>[0]),
    });
    const client = new x402Client().register(config.network as `eip155:${number}`,new ExactEvmScheme(signer));
    const paymentClient = new x402HTTPClient(client);
    status(`Review a ${config.price} ${chain.id === 84532 ? "test " : ""}USDC payment to ${config.payTo} in your wallet.`);
    // Pin the reviewed offer. No alternate asset, recipient or chain can be selected by the SDK.
    const signed = await paymentClient.createPaymentPayload({...challenge, accepts:[offer]});
    payload = signed.payload;
    const authorization = (signed.payload as {authorization?:{from?:string;nonce?:string}}).authorization;
    if (authorization?.from?.toLowerCase() !== accounts[0].toLowerCase() || !authorization?.nonce) throw new Error("Wallet returned an unexpected payment authorization.");
    status("Submitting the signed authorization once. Keep this page open…");
    signatureSent = true;
    const response = await fetch(resource,{headers:paymentClient.encodePaymentSignatureHeader(signed),cache:"no-store"});
    const body = await response.text();
    let settlement;
    try { settlement = paymentClient.getPaymentSettleResponse(name=>response.headers.get(name)); }
    catch { throw new Error("Payment response has no settlement receipt. Do not pay again until the wallet activity has been checked."); }
    if (!settlement.success || settlement.network !== config.network || !/^0x[a-fA-F0-9]{64}$/.test(settlement.transaction)) {
      throw new Error("The facilitator did not confirm a settlement transaction. Check wallet activity before another purchase.");
    }
    const reportSha256 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(body))),b=>b.toString(16).padStart(2,"0")).join("");
    purchase = {report:body,reportSha256,settlement,payment:{network:config.network,transaction:settlement.transaction as `0x${string}`,payer:accounts[0],payTo:config.payTo,amount:offer.amount,nonce:authorization.nonce}};
    $("receipt").hidden = false; $("receipt-content").replaceChildren();
    text($("receipt-content"),"p",`Settlement reported. Transaction: ${settlement.transaction}`);
    link($("receipt-content"),"Inspect payment on BaseScan",`https://${chain.id === 84532 ? "sepolia." : ""}basescan.org/tx/${settlement.transaction}`);
    text($("receipt-content"),"p",`Report SHA-256: ${reportSha256}`);
    download.disabled = false; verify.disabled = false;
    if (!response.ok) throw new Error("A payment receipt was returned but report delivery failed. Download the evidence and do not pay again.");
    showReport(JSON.parse(body));
    status("Report delivered. Checking the mined USDC transfer…");
    await checkReceipt();
  } catch (error) { status(error instanceof Error ? error.message : String(error),true); }
  finally {
    // An ambiguous network failure after submission must never trigger automatic re-payment.
    if (signatureSent && !purchase) {
      $("receipt").hidden = false;
      const evidence = {status:"outcome-unknown",network:config.network,payTo:config.payTo,authorization:(payload as {authorization?:unknown})?.authorization,createdAt:new Date().toISOString()};
      text($("receipt-content"),"pre",JSON.stringify(evidence,null,2));
      status("Payment outcome is unknown. Do not pay again. Keep this authorization evidence and check wallet activity.",true);
    }
    busy = false;
    if (!signatureSent) {refresh.disabled=false; project.disabled=false; buy.disabled=false;}
  }
});
verify.addEventListener("click",async()=>{verify.disabled=true;try{await checkReceipt();}catch(error){status(error instanceof Error?error.message:String(error),true);}finally{verify.disabled=false;}});
download.addEventListener("click",()=>{
  if (!purchase) return;
  const blob = new Blob([JSON.stringify({...purchase,notice:"Report digest is local content identification, not an onchain content commitment."},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`claimbot-${purchase.payment.transaction}.json`;a.click();URL.revokeObjectURL(url);
});
refresh.addEventListener("click",available);project.addEventListener("change",available);
await available();
