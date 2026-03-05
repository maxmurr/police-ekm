import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../schemas/police";
import reportersData from "./data/reporters.json";
import { logger } from "@/lib/logger";

export default async function seedReporters(db: PostgresJsDatabase<typeof schema>) {
  await db.insert(schema.reportersTable).values(reportersData);
  logger.info({ count: reportersData.length }, "Seeded reporters");
}
