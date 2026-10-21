import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getNearConfigStatus, loadNearPolicyConfig } from "./config";
import { OneClickNearIntentsClient } from "./nearIntentsClient";
import { NearTreasuryService } from "./service";
import { DbNearIntentStore } from "./store";
import { treasuryIntentSchema } from "./types";

const config = loadNearPolicyConfig();
const service = new NearTreasuryService(config, new OneClickNearIntentsClient(config), new DbNearIntentStore());

export const nearRouter = router({
  config: publicProcedure.query(() => getNearConfigStatus(config)),
  tokens: adminProcedure
    .input(z.object({ blockchain: z.string().min(2).max(32).optional() }).optional())
    .query(async ({ input }) => {
      const tokens = await new OneClickNearIntentsClient(config).tokens();
      const blockchain = input?.blockchain?.toLowerCase();
      return blockchain ? tokens.filter(token => token.blockchain === blockchain) : tokens;
    }),
  quote: adminProcedure
    .input(z.object({ intent: treasuryIntentSchema }))
    .mutation(({ input }) => service.prepare(input.intent)),
  submitDeposit: adminProcedure
    .input(z.object({
      idempotencyKey: z.string().min(8).max(128),
      txHash: z.string().min(8).max(255),
      depositAddress: z.string().min(2).max(255),
    }))
    .mutation(({ input }) => service.submitDeposit(input.idempotencyKey, input.txHash, input.depositAddress)),
  status: adminProcedure
    .input(z.object({ idempotencyKey: z.string().min(8).max(128) }))
    .query(({ input }) => service.status(input.idempotencyKey)),
});
