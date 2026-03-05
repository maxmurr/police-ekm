import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../schemas/police";
import locationsData from "./data/locations.json";
import { logger } from "@/lib/logger";

export default async function seedLocations(db: PostgresJsDatabase<typeof schema>) {
  await db.insert(schema.locationsTable).values(locationsData);
  logger.info({ count: locationsData.length }, "Seeded locations");
}
