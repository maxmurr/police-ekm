import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../schemas/police";
import incidentReportsData from "./data/incident-reports.json";
import { logger } from "@/lib/logger";

export default async function seedIncidentReports(db: PostgresJsDatabase<typeof schema>) {
  const investigators = await db.select().from(schema.investigatorsTable);
  const investigatorMap = new Map(investigators.map((inv) => [inv.investigatorName, inv.id]));

  const reportsWithIds = incidentReportsData.map((report) => {
    const { investigatorName, ...rest } = report;
    return {
      ...rest,
      investigatorId: investigatorName ? investigatorMap.get(investigatorName) || null : null,
    };
  });

  await db
    .insert(schema.incidentReportsTable)
    .values(reportsWithIds as (typeof schema.incidentReportsTable.$inferInsert)[]);
  logger.info({ count: incidentReportsData.length }, "Seeded incident reports");
}
