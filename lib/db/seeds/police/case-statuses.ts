import { eq } from "drizzle-orm";
import type db from "../../index";
import { caseStatusesTable } from "../../schemas/police";
import caseStatusesData from "./data/case-statuses.json";

export default async function seed(database: typeof db) {
  const inserted = await Promise.all(
    caseStatusesData.map(async (caseStatus) => {
      // Check if case status already exists by Thai name
      const existing = await database
        .select()
        .from(caseStatusesTable)
        .where(eq(caseStatusesTable.statusNameTh, caseStatus.statusNameTh))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const [insertedCaseStatus] = await database.insert(caseStatusesTable).values(caseStatus).returning();

      return insertedCaseStatus;
    }),
  );

  const { logger } = await import("@/lib/logger");
  logger.info({ count: inserted.length }, "Seeded case statuses");
  return inserted;
}
