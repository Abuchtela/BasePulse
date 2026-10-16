import { DEFAULT_RPC, queryOpenOpportunities } from "./client.js";

const target = process.argv[2] === "BasePulse" ? "BasePulse" : "ClaimBot";
const results = await queryOpenOpportunities(target, process.env.ARKIV_RPC_URL ?? DEFAULT_RPC);
console.log(JSON.stringify({ target, count: results.length, results }, (_, value) => typeof value === "bigint" ? value.toString() : value, 2));
