import { and, eq } from "drizzle-orm";
import type db from "../../index";
import { districtsTable, provincesTable } from "../../schemas/police";
import districtsData from "./data/districts.json";

export default async function seed(database: typeof db) {
  const { logger } = await import("@/lib/logger");
  logger.info("Seeding districts...");

  // First, get all provinces with their IDs
  const provinces = await database.select().from(provincesTable);

  // Create a map of province Thai name to ID
  const provinceMap = new Map(provinces.map((p) => [p.provinceNameTh, p.id]));

  let insertedCount = 0;
  let skippedCount = 0;

  // Process districts in batches for better performance
  const batchSize = 100;
  for (let i = 0; i < districtsData.length; i += batchSize) {
    const batch = districtsData.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (district) => {
        const provinceId = provinceMap.get(district.provinceNameTh);

        if (!provinceId) {
          logger.warn(
            { district: district.districtNameTh, province: district.provinceNameTh },
            "Province not found for district",
          );
          skippedCount++;
          return null;
        }

        // Check if district already exists
        const existing = await database
          .select()
          .from(districtsTable)
          .where(
            and(eq(districtsTable.districtNameTh, district.districtNameTh), eq(districtsTable.provinceId, provinceId)),
          )
          .limit(1);

        if (existing.length > 0) {
          skippedCount++;
          return existing[0];
        }

        const [insertedDistrict] = await database
          .insert(districtsTable)
          .values({
            districtNameTh: district.districtNameTh,
            districtNameEn: district.districtNameEn,
            provinceId: provinceId,
          })
          .returning();

        insertedCount++;
        return insertedDistrict;
      }),
    );
  }

  logger.info({ inserted: insertedCount, skipped: skippedCount }, "Seeded districts");
  return { inserted: insertedCount, skipped: skippedCount };
}
