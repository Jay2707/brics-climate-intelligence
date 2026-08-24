import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { climateRouter } from "./routers/climate";
import { accessRouter, alertsRouter, evidenceRouter } from "./routers/evidence";
import { satelliteRouter } from "./routers/satellite";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  climate: climateRouter,
  satellite: satelliteRouter,
  evidence: evidenceRouter,
  alerts: alertsRouter,
  access: accessRouter,
});

export type AppRouter = typeof appRouter;
