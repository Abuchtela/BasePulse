import { DEFAULT_RPC, verifyTiramisu } from "./client.js";

const rpcUrl = process.env.ARKIV_RPC_URL ?? DEFAULT_RPC;
const chainId = await verifyTiramisu(rpcUrl);
console.log(JSON.stringify({ ok: true, network: "tiramisu", chainId, rpcUrl }, null, 2));
