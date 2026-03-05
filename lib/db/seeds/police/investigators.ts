import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../schemas/police";
import investigatorsData from "./data/investigators.json";
import { logger } from "@/lib/logger";

export default async function seedInvestigators(db: PostgresJsDatabase<typeof schema>) {
  await db.insert(schema.investigatorsTable).values(investigatorsData);
  logger.info({ count: investigatorsData.length }, "Seeded investigators");
}
