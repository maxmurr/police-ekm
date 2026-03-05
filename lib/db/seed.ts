import "dotenv/config";
import { seedPoliceSchema } from "./police-seed";
import { logger } from "@/lib/logger";

if (process.env.DB_SEEDING !== "true") {
  logger.error('DB_SEEDING must be set to "true". Usage: DB_SEEDING=true bun lib/db/seed.ts');
  process.exit(1);
}

async function main() {
  logger.info("Starting database seed...");
  const startTime = Date.now();

  try {
    await seedPoliceSchema();

    const durationMs = Date.now() - startTime;
    logger.info({ durationMs }, "All schemas seeded successfully");
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Seeding failed");
    process.exit(1);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ error: err instanceof Error ? err.message : String(err) }, "Fatal error");
    process.exit(1);
  });
