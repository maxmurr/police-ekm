import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../schemas/police";
import caseNotesData from "./data/case-notes.json";
import { logger } from "@/lib/logger";

export default async function seedCaseNotes(db: PostgresJsDatabase<typeof schema>) {
  const incidentReports = await db.select().from(schema.incidentReportsTable);

  const reportMap = new Map(incidentReports.map((report) => [report.caseNumber, report.id]));

  const investigators = await db.select().from(schema.investigatorsTable);
  const investigatorMap = new Map(investigators.map((inv) => [inv.investigatorName, inv.id]));

  const notesWithIds = caseNotesData.map((note) => {
    const { caseNumber, createdByName, ...rest } = note;
    return {
      ...rest,
      reportId: reportMap.get(caseNumber) || null,
      createdBy: createdByName ? investigatorMap.get(createdByName) || null : null,
    };
  });

  await db.insert(schema.caseNotesTable).values(notesWithIds as (typeof schema.caseNotesTable.$inferInsert)[]);
  logger.info({ count: caseNotesData.length }, "Seeded case notes");
}
