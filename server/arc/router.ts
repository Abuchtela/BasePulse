import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getArcRecentTransfers, getArcStatus, getArcTransactionProof, getArcTreasuryBalance } from "./arcTreasury";

const network = z.enum(["mainnet", "testnet"]).default("testnet");
const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const hash = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

export const arcRouter = router({
  status: publicProcedure.input(z.object({ network })).query(({ input }) => getArcStatus(input.network)),
  balance: publicProcedure.input(z.object({ network, address })).query(({ input }) => getArcTreasuryBalance(input.network, input.address)),
  transfers: publicProcedure.input(z.object({ network, address, blocks: z.number().int().min(1).max(500).default(200) })).query(({ input }) => getArcRecentTransfers(input.network, input.address, input.blocks)),
  transaction: publicProcedure.input(z.object({ network, hash })).query(({ input }) => getArcTransactionProof(input.network, input.hash as `0x${string}`)),
});
