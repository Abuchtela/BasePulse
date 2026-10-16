import type { Hex } from "viem";
import { DEFAULT_RPC, publishOpportunity } from "./client.js";
import type { Opportunity } from "./model.js";

if (!process.argv.includes("--broadcast")) {
  throw new Error("Refusing to publish without --broadcast");
}
const privateKey = process.env.ARKIV_PRIVATE_KEY;
if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("Set a dedicated 32-byte ARKIV_PRIVATE_KEY; never use a production wallet");
}

const opportunity: Opportunity = {
  id: "arkiv-global-tour-stop-2026",
  title: "Arkiv Global Tour Stop",
  officialSourceUrl: "https://arkiv.devfolio.co/",
  eligibility: ["Worldwide", "Age 18+", "Solo or teams up to five"],
  deadline: "2026-10-18T22:59:00.000Z",
  payout: "$750 USDC plus one Devcon 8 ticket for each global track winner",
  fit: "ClaimBot stores independently queryable funding records with official-source provenance.",
  smallestNextStep: "Record the baseline commit and implement the Arkiv opportunity schema.",
  targetProject: "ClaimBot",
  region: "global",
  status: "open",
  verifiedAt: "2026-10-13T04:00:00.000Z",
};

const result = await publishOpportunity(
  opportunity,
  privateKey as Hex,
  process.env.ARKIV_RPC_URL ?? DEFAULT_RPC,
);
console.log(JSON.stringify(result, (_, value) => typeof value === "bigint" ? value.toString() : value, 2));
