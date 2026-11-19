import { CdpX402Client, SpendControlError } from "@coinbase/cdp-sdk/x402";
import { wrapFetchWithPayment } from "@x402/fetch";

const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const USDC_BASE_SEPOLIA = "0x036cbd53842c5426634e7929541ec2318f3dcf7e";

const required = ["CDP_API_KEY_ID", "CDP_API_KEY_SECRET", "CDP_WALLET_SECRET"] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const url = process.argv[2] ?? process.env.X402_API_URL;
if (!url) {
  throw new Error("Pass an x402 endpoint URL as the first argument or set X402_API_URL.");
}

const productionRequested = process.env.X402_ENVIRONMENT === "production";
const mainnetUnlocked = process.env.ALLOW_MAINNET_X402 === "true";
if (productionRequested && !mainnetUnlocked) {
  throw new Error(
    "Mainnet x402 is locked. Set ALLOW_MAINNET_X402=true only when you intentionally want to spend real USDC.",
  );
}

const environment = productionRequested ? "production" : "development";
const network = productionRequested ? "eip155:8453" : "eip155:84532";
const usdc = productionRequested ? USDC_BASE : USDC_BASE_SEPOLIA;

const perPaymentUsd = Number(process.env.X402_MAX_PER_PAYMENT_USD ?? "0.25");
const dailyUsd = Number(process.env.X402_DAILY_BUDGET_USD ?? "5.00");
if (!Number.isFinite(perPaymentUsd) || perPaymentUsd <= 0) throw new Error("Invalid X402_MAX_PER_PAYMENT_USD");
if (!Number.isFinite(dailyUsd) || dailyUsd <= 0) throw new Error("Invalid X402_DAILY_BUDGET_USD");
if (perPaymentUsd > dailyUsd) throw new Error("Per-payment cap cannot exceed daily budget");

const toAtomicUsdc = (usd: number) => BigInt(Math.floor(usd * 1_000_000));

const client = new CdpX402Client({
  environment,
  builderCode: process.env.BASE_BUILDER_CODE || undefined,
  spendControls: {
    maxAmountPerPayment: { atomic: toAtomicUsdc(perPaymentUsd), asset: usdc },
    maxCumulativeSpend: { atomic: toAtomicUsdc(dailyUsd), asset: usdc },
    maxCumulativeSpendWindow: "24h",
    allowedNetworks: [network],
    allowedAssets: [usdc],
    onApproachingLimit: (spent, limit) => {
      const pct = (Number(spent.atomic) / Number(limit.atomic)) * 100;
      console.warn(`[x402] Daily budget ${pct.toFixed(0)}% consumed`);
    },
  },
});

const fetchWithPayment = wrapFetchWithPayment(globalThis.fetch, client);

async function main() {
  const { evmAddress } = await client.getAddresses();
  console.log(JSON.stringify({
    event: "x402_wallet_ready",
    environment,
    network,
    wallet: evmAddress,
    maxPerPaymentUsd: perPaymentUsd,
    dailyBudgetUsd: dailyUsd,
    url,
  }));

  try {
    const response = await fetchWithPayment(url);
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

    console.log(JSON.stringify({
      event: "x402_result",
      ok: response.ok,
      status: response.status,
      url,
      body,
    }, null, 2));

    if (!response.ok) process.exitCode = 1;
  } catch (error) {
    if (error instanceof SpendControlError) {
      console.error(JSON.stringify({
        event: "x402_payment_blocked",
        code: error.code,
        message: error.message,
        details: error.details,
      }, null, 2));
      process.exitCode = 2;
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
