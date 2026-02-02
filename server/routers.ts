import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getDeployedTokens, getTrendAnalysis, getTreasuryBalance, getSocialInteractions } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  basepulse: router({
    tokens: router({
      list: publicProcedure.query(async () => {
        return getDeployedTokens(50);
      }),
    }),
    trends: router({
      recent: publicProcedure.query(async () => {
        return getTrendAnalysis(20);
      }),
    }),
    treasury: router({
      balance: publicProcedure.query(async () => {
        const balance = await getTreasuryBalance();
        return { balance };
      }),
    }),
    social: router({
      interactions: publicProcedure.query(async () => {
        return getSocialInteractions(50);
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
