import "dotenv/config";
import { Table, getTableName, sql } from "drizzle-orm";
import db from ".";
import * as policeSchema from "./schemas/police";
import * as policeSeeds from "./seeds/police";
import { logger } from "@/lib/logger";

async function resetTable(table: Table) {
  const tableName = getTableName(table);
  const fullTableName = `"police"."${tableName}"`;

  await db.execute(sql.raw(`TRUNCATE TABLE ${fullTableName} RESTART IDENTITY CASCADE`));
}

export async function seedPoliceSchema() {
  logger.info("Seeding police schema...");
  const startTime = Date.now();

  try {
    logger.info("Resetting police tables...");

    await resetTable(policeSchema.suspectsTable);
    await resetTable(policeSchema.victimsTable);
    await resetTable(policeSchema.evidenceTable);
    await resetTable(policeSchema.caseNotesTable);

    await resetTable(policeSchema.incidentReportsTable);

    await resetTable(policeSchema.locationsTable);
    await resetTable(policeSchema.reportersTable);
    await resetTable(policeSchema.investigatorsTable);

    await resetTable(policeSchema.districtsTable);
    await resetTable(policeSchema.caseStatusesTable);
    await resetTable(policeSchema.incidentTypesTable);
    await resetTable(policeSchema.provincesTable);

    logger.info("Police tables reset");

    await policeSeeds.provinces(db);
    await policeSeeds.districts(db);
    await policeSeeds.incidentTypes(db);
    await policeSeeds.caseStatuses(db);

    await policeSeeds.investigators(db);
    await policeSeeds.reporters(db);
    await policeSeeds.locations(db);

    await policeSeeds.incidentReports(db);

    await policeSeeds.caseNotes(db);

    const durationMs = Date.now() - startTime;
    logger.info({ durationMs }, "Police schema seeded");
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Police schema seeding failed");
    throw error;
  }
}

if (require.main === module) {
  if (process.env.DB_SEEDING !== "true") {
    logger.error('DB_SEEDING must be set to "true". Usage: DB_SEEDING=true bun lib/db/police-seed.ts');
    process.exit(1);
  }

  seedPoliceSchema()
    .then(() => {
      logger.info("Police schema seeding completed");
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ error: err instanceof Error ? err.message : String(err) }, "Fatal error");
      process.exit(1);
    });
}
