import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getSatelliteLayer } from "../satellite";

const citySchema = z.enum(["New Delhi", "Beijing", "São Paulo", "Johannesburg", "Moscow"]);

export const satelliteRouter = router({
  getLayer: publicProcedure.input(z.object({ city: citySchema, layer: z.enum(["no2", "aerosol"]) })).query(({ input }) => getSatelliteLayer(input)),
});
