import { getLiveClimateSnapshot } from "../liveClimate";
import { publicProcedure, router } from "../_core/trpc";

export const climateRouter = router({
  liveSignals: publicProcedure.query(() => getLiveClimateSnapshot()),
  refresh: publicProcedure.mutation(() => getLiveClimateSnapshot(true)),
});
