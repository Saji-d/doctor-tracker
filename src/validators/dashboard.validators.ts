import { z } from "zod";

export const dashboardSummaryQuerySchema = z.object({
  query: z.object({
    range: z.string().regex(/^\d+d$/, "range must look like '30d'").default("30d"),
  }),
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>["query"];
