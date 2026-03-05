import { eq } from "drizzle-orm";
import type db from "../../index";
import { incidentTypesTable } from "../../schemas/police";
import incidentTypesData from "./data/incident-types.json";

export default async function seed(database: typeof db) {
  const inserted = await Promise.all(
    incidentTypesData.map(async (incidentType) => {
      // Check if incident type already exists by Thai name
      const existing = await database
        .select()
        .from(incidentTypesTable)
        .where(eq(incidentTypesTable.incidentTypeNameTh, incidentType.incidentTypeNameTh))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const [insertedIncidentType] = await database.insert(incidentTypesTable).values(incidentType).returning();

      return insertedIncidentType;
    }),
  );

  const { logger } = await import("@/lib/logger");
  logger.info({ count: inserted.length }, "Seeded incident types");
  return inserted;
}
