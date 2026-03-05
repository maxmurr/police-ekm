import { eq } from "drizzle-orm";
import type db from "../../index";
import { provincesTable } from "../../schemas/police";
import provincesData from "./data/provinces.json";

export default async function seed(database: typeof db) {
  const inserted = await Promise.all(
    provincesData.map(async (province) => {
      // Check if province already exists by Thai name
      const existing = await database
        .select()
        .from(provincesTable)
        .where(eq(provincesTable.provinceNameTh, province.provinceNameTh))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const [insertedProvince] = await database.insert(provincesTable).values(province).returning();

      return insertedProvince;
    }),
  );

  const { logger } = await import("@/lib/logger");
  logger.info({ count: inserted.length }, "Seeded provinces");
  return inserted;
}
