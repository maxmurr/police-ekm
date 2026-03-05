import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import db from ".";
import { logger } from "@/lib/logger";

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  logger.info("Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const durationMs = Date.now() - start;

  logger.info({ durationMs }, "Migrations completed");
  process.exit(0);
};

runMigrate().catch((err) => {
  logger.error({ error: err instanceof Error ? err.message : String(err) }, "Migration failed");
  process.exit(1);
});
