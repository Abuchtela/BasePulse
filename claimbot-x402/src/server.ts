import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { queryOpenOpportunities } from "../../claimbot-arkiv/src/client.js";

const payTo = process.env.X402_PAY_TO;
if (!payTo || !/^0x[a-fA-F0-9]{40}$/.test(payTo)) {
  throw new Error("X402_PAY_TO must be a real, valid EVM receiving address");
}
const isMainnet = process.env.X402_NETWORK === "base";
if (isMainnet && process.env.ALLOW_MAINNET_X402_SELLER !== "true") {
  throw new Error("Mainnet seller locked until explicitly enabled");
}
if (process.env.X402_NETWORK && !["base","base-sepolia"].includes(process.env.X402_NETWORK)) {
  throw new Error("Supported networks: base, base-sepolia");
}
const network = isMainnet ? "eip155:8453" : "eip155:84532";
const facilitatorUrl = process.env.X402_FACILITATOR_URL
  ?? (isMainnet ? "" : "https://x402.org/facilitator");
if (!facilitatorUrl || new URL(facilitatorUrl).protocol !== "https:") {
  throw new Error("X402_FACILITATOR_URL must be an HTTPS facilitator that supports the chosen chain");
}
const price = process.env.X402_PRICE ?? "$0.10";
if (!/^\$(?:0\.[0-9]{1,6}|[1-9][0-9]*(?:\.[0-9]{1,6})?)$/.test(price) || Number(price.slice(1)) <= 0) {
  throw new Error("X402_PRICE must be a positive USD amount, e.g. $0.10");
}
const facilitator = new HTTPFacilitatorClient({ url: facilitatorUrl });
const resourceServer = new x402ResourceServer(facilitator)
  .register(network, new ExactEvmScheme());
const app = express();
app.disable("x-powered-by");
app.get("/health", (_req,res) => res.json({ status: "ok", service:"claimbot-x402", network, paymentEnabled:true }));
app.use(paymentMiddleware({
  "GET /api/opportunities": {
    accepts:[{scheme:"exact", price, network, payTo, maxTimeoutSeconds:60}],
    description:"Verified-source open funding opportunities for BasePulse or ClaimBot",
    mimeType:"application/json",
  },
}, resourceServer));
app.get("/api/opportunities", async (req,res) => {
  const project = req.query.project;
  if (project !== "BasePulse" && project !== "ClaimBot") {
    res.status(400).json({ error:"project must be BasePulse or ClaimBot" });
    return;
  }
  try {
    // Queries live Arkiv state; never returns fabricated opportunities.
    const results = await queryOpenOpportunities(project, process.env.ARKIV_RPC_URL);
    res.setHeader("Cache-Control","no-store");
    res.json({ project, count:results.length, results:JSON.parse(JSON.stringify(results,(_,v)=>typeof v==="bigint"?v.toString():v)) });
  } catch (error) {
    console.error("Arkiv query failed:", error);
    res.status(503).json({error:"Verified opportunity data temporarily unavailable"});
  }
});
const port = Number(process.env.PORT || "4021");
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
app.listen(port, () => console.log(`ClaimBot x402 seller listening on ${port}; network=${network}; price=${price}`));
