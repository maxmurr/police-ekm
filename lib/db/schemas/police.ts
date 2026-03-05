import {
  boolean,
  check,
  date,
  decimal,
  index,
  integer,
  pgSchema,
  serial,
  text,
  time,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { generateId } from "@/lib/id";
import { lifecycleDates } from "@/lib/db/schemas/utils";

export const policeSchema = pgSchema("police");

// ============================================================================
// REFERENCE/LOOKUP TABLES
// ============================================================================

export const provincesTable = policeSchema.table(
  "provinces",
  {
    id: serial("id").primaryKey(),
    provinceNameTh: varchar("province_name_th", { length: 100 }).notNull().unique(),
    provinceNameEn: varchar("province_name_en", { length: 100 }),
    region: varchar("region", { length: 50 }),
    regionCode: varchar("region_code", { length: 10 }),
    ...lifecycleDates,
  },
  (table) => [index("idx_provinces_region").on(table.region)],
);

export const districtsTable = policeSchema.table(
  "districts",
  {
    id: serial("id").primaryKey(),
    districtNameTh: varchar("district_name_th", { length: 100 }).notNull(),
    districtNameEn: varchar("district_name_en", { length: 100 }),
    provinceId: integer("province_id")
      .notNull()
      .references(() => provincesTable.id),
    ...lifecycleDates,
  },
  (table) => [
    unique("unique_district_province").on(table.districtNameTh, table.provinceId),
    index("idx_districts_province").on(table.provinceId),
  ],
);

export const incidentTypesTable = policeSchema.table(
  "incident_types",
  {
    id: serial("id").primaryKey(),
    incidentTypeNameTh: varchar("incident_type_name_th", { length: 100 }).notNull().unique(),
    incidentTypeNameEn: varchar("incident_type_name_en", { length: 100 }),
    category: varchar("category", { length: 50 }), // 'crime', 'accident', 'theft', 'other'
    severityLevel: varchar("severity_level", { length: 20 }).default("medium"), // 'low', 'medium', 'high', 'critical'
    description: text("description"),
    ...lifecycleDates,
  },
  (table) => [
    index("idx_incident_types_category").on(table.category),
    index("idx_incident_types_severity").on(table.severityLevel),
    check("chk_severity_level", sql`${table.severityLevel} IN ('low', 'medium', 'high', 'critical')`),
  ],
);

export const caseStatusesTable = policeSchema.table(
  "case_statuses",
  {
    id: serial("id").primaryKey(),
    statusNameTh: varchar("status_name_th", { length: 50 }).notNull().unique(),
    statusNameEn: varchar("status_name_en", { length: 50 }),
    statusOrder: integer("status_order"), // For workflow ordering (1=new, 2=investigating, 3=closed)
    isClosed: boolean("is_closed").default(false),
    description: varchar("description", { length: 255 }),
    ...lifecycleDates,
  },
  (table) => [index("idx_case_statuses_order").on(table.statusOrder)],
);

// ============================================================================
// ENTITY TABLES
// ============================================================================

export const investigatorsTable = policeSchema.table(
  "investigators",
  {
    id: varchar("id", { length: 20 })
      .$defaultFn(() => generateId("investigator", { length: 5 }))
      .primaryKey(),
    investigatorName: varchar("investigator_name", { length: 150 }).notNull(),
    rank: varchar("rank", { length: 50 }),
    rankLevel: integer("rank_level"), // Numerical rank for analytics (1-10)
    badgeNumber: varchar("badge_number", { length: 50 }).unique(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 100 }),
    department: varchar("department", { length: 100 }),
    isActive: boolean("is_active").default(true),
    hireDate: date("hire_date"),
    ...lifecycleDates,
  },
  (table) => [
    index("idx_investigators_department").on(table.department),
    index("idx_investigators_active").on(table.isActive),
    index("idx_investigators_rank_level").on(table.rankLevel),
  ],
);

export const reportersTable = policeSchema.table(
  "reporters",
  {
    id: serial("id").primaryKey(),
    reporterName: varchar("reporter_name", { length: 150 }).notNull(),
    reporterPhone: varchar("reporter_phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 100 }),
    address: text("address"),
    reporterType: varchar("reporter_type", { length: 20 }).default("citizen"), // 'citizen', 'business', 'government', 'anonymous'
    totalReports: integer("total_reports").default(0), // Denormalized for analytics
    lastReportDate: date("last_report_date"),
    ...lifecycleDates,
  },
  (table) => [
    unique("unique_name_phone").on(table.reporterName, table.reporterPhone),
    index("idx_reporters_type").on(table.reporterType),
    index("idx_reporters_total_reports").on(table.totalReports),
    check("chk_reporter_type", sql`${table.reporterType} IN ('citizen', 'business', 'government', 'anonymous')`),
  ],
);

export const locationsTable = policeSchema.table(
  "locations",
  {
    id: serial("id").primaryKey(),
    locationGeneral: varchar("location_general", { length: 255 }).notNull(),
    locationSpecific: text("location_specific"),
    districtId: integer("district_id").references(() => districtsTable.id),
    provinceId: integer("province_id")
      .notNull()
      .references(() => provincesTable.id),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    locationType: varchar("location_type", { length: 20 }).default("other"), // 'street', 'building', 'park', 'mall', 'residence', 'other'
    ...lifecycleDates,
  },
  (table) => [
    index("idx_locations_type").on(table.locationType),
    index("idx_locations_district").on(table.districtId),
    index("idx_locations_province").on(table.provinceId),
    check(
      "chk_location_type",
      sql`${table.locationType} IN ('street', 'building', 'park', 'mall', 'residence', 'other')`,
    ),
  ],
);

// ============================================================================
// MAIN FACT TABLE (STAR SCHEMA READY)
// ============================================================================

export const incidentReportsTable = policeSchema.table(
  "incident_reports",
  {
    id: varchar("id", { length: 20 })
      .$defaultFn(() => generateId("incidentReport", { length: 5 }))
      .primaryKey(),

    // Case reference number (e.g., "2568-001")
    caseNumber: varchar("case_number", { length: 20 }),

    // Time dimensions (for time-series analytics)
    // Note: PostgreSQL doesn't support GENERATED columns like MySQL
    // These computed fields should be calculated at application level or via triggers
    reportDate: date("report_date").notNull(),
    reportTime: time("report_time").notNull(),
    // reportDatetime, reportYear, reportMonth, etc. should be computed in app or via triggers

    // Incident occurrence time
    incidentDatetime: timestamp("incident_datetime"),
    // incidentYear, incidentMonth, incidentHour computed in app

    // Foreign keys
    reporterId: integer("reporter_id")
      .notNull()
      .references(() => reportersTable.id),
    incidentTypeId: integer("incident_type_id")
      .notNull()
      .references(() => incidentTypesTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    locationId: integer("location_id")
      .notNull()
      .references(() => locationsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    investigatorId: varchar("investigator_id", { length: 20 }).references(() => investigatorsTable.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    statusId: integer("status_id")
      .notNull()
      .default(1)
      .references(() => caseStatusesTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    // Metrics for analytics
    estimatedDamageAmount: decimal("estimated_damage_amount", {
      precision: 12,
      scale: 2,
    }),
    numberOfVictims: integer("number_of_victims").default(0),
    numberOfSuspects: integer("number_of_suspects").default(0),
    responseTimeMinutes: integer("response_time_minutes"), // Time from incident to report

    // Case resolution metrics
    caseClosedDate: date("case_closed_date"),
    resolutionTimeDays: integer("resolution_time_days"), // Days from report to closure

    // Text fields
    summary: text("summary").notNull(),

    ...lifecycleDates,
  },
  (table) => [
    index("idx_incident_reports_report_date").on(table.reportDate),
    index("idx_incident_reports_incident_datetime").on(table.incidentDatetime),
    index("idx_incident_reports_incident_type").on(table.incidentTypeId),
    index("idx_incident_reports_status").on(table.statusId),
    index("idx_incident_reports_investigator").on(table.investigatorId),
    index("idx_incident_reports_damage_amount").on(table.estimatedDamageAmount),
    index("idx_incident_reports_location").on(table.locationId),
    index("idx_incident_reports_reporter").on(table.reporterId),
    check("chk_number_of_victims", sql`${table.numberOfVictims} >= 0`),
    check("chk_number_of_suspects", sql`${table.numberOfSuspects} >= 0`),
    check("chk_estimated_damage", sql`${table.estimatedDamageAmount} >= 0 OR ${table.estimatedDamageAmount} IS NULL`),
  ],
);

// ============================================================================
// TRANSACTION TABLES (Use serial IDs for high-volume data)
// ============================================================================

export const caseNotesTable = policeSchema.table(
  "case_notes",
  {
    id: serial("id").primaryKey(),
    reportId: varchar("report_id", { length: 20 })
      .notNull()
      .references(() => incidentReportsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    noteText: text("note_text").notNull(),
    noteType: varchar("note_type", { length: 20 }).default("investigation"), // 'investigation', 'evidence', 'witness', 'resolution', 'other'
    priority: varchar("priority", { length: 10 }).default("medium"), // 'low', 'medium', 'high'
    createdBy: varchar("created_by", { length: 20 }).references(() => investigatorsTable.id),
    ...lifecycleDates,
  },
  (table) => [
    index("idx_case_notes_report").on(table.reportId),
    index("idx_case_notes_type").on(table.noteType),
    index("idx_case_notes_created_at").on(table.createdAt),
    check("chk_note_type", sql`${table.noteType} IN ('investigation', 'evidence', 'witness', 'resolution', 'other')`),
    check("chk_priority", sql`${table.priority} IN ('low', 'medium', 'high')`),
  ],
);

export const evidenceTable = policeSchema.table(
  "evidence",
  {
    id: serial("id").primaryKey(),
    reportId: varchar("report_id", { length: 20 })
      .notNull()
      .references(() => incidentReportsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    evidenceType: varchar("evidence_type", { length: 20 }).default("other"), // 'photo', 'video', 'document', 'physical', 'digital', 'other'
    description: text("description"),
    filePath: varchar("file_path", { length: 500 }),
    fileSizeKb: integer("file_size_kb"),
    collectedBy: varchar("collected_by", { length: 20 }).references(() => investigatorsTable.id),
    collectedAt: timestamp("collected_at").defaultNow(),
    chainOfCustody: text("chain_of_custody"),
    isKeyEvidence: boolean("is_key_evidence").default(false),
    ...lifecycleDates,
  },
  (table) => [
    index("idx_evidence_report").on(table.reportId),
    index("idx_evidence_type").on(table.evidenceType),
    index("idx_evidence_key").on(table.isKeyEvidence),
    check(
      "chk_evidence_type",
      sql`${table.evidenceType} IN ('photo', 'video', 'document', 'physical', 'digital', 'other')`,
    ),
  ],
);

export const victimsTable = policeSchema.table(
  "victims",
  {
    id: serial("id").primaryKey(),
    reportId: varchar("report_id", { length: 20 })
      .notNull()
      .references(() => incidentReportsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    victimName: varchar("victim_name", { length: 150 }),
    age: integer("age"),
    gender: varchar("gender", { length: 10 }), // 'male', 'female', 'other', 'unknown'
    injurySeverity: varchar("injury_severity", { length: 20 }), // 'none', 'minor', 'moderate', 'severe', 'fatal'
    hospitalName: varchar("hospital_name", { length: 200 }),
    ...lifecycleDates,
  },
  (table) => [
    index("idx_victims_report").on(table.reportId),
    index("idx_victims_injury_severity").on(table.injurySeverity),
    index("idx_victims_age").on(table.age),
    index("idx_victims_gender").on(table.gender),
    check("chk_gender", sql`${table.gender} IN ('male', 'female', 'other', 'unknown') OR ${table.gender} IS NULL`),
    check(
      "chk_injury_severity",
      sql`${table.injurySeverity} IN ('none', 'minor', 'moderate', 'severe', 'fatal') OR ${table.injurySeverity} IS NULL`,
    ),
  ],
);

export const suspectsTable = policeSchema.table(
  "suspects",
  {
    id: serial("id").primaryKey(),
    reportId: varchar("report_id", { length: 20 })
      .notNull()
      .references(() => incidentReportsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    suspectName: varchar("suspect_name", { length: 150 }),
    age: integer("age"),
    gender: varchar("gender", { length: 10 }), // 'male', 'female', 'other', 'unknown'
    arrestStatus: varchar("arrest_status", { length: 20 }).default("unknown"), // 'not_arrested', 'arrested', 'wanted', 'unknown'
    ...lifecycleDates,
  },
  (table) => [
    index("idx_suspects_report").on(table.reportId),
    index("idx_suspects_arrest_status").on(table.arrestStatus),
    check(
      "chk_suspect_gender",
      sql`${table.gender} IN ('male', 'female', 'other', 'unknown') OR ${table.gender} IS NULL`,
    ),
    check("chk_arrest_status", sql`${table.arrestStatus} IN ('not_arrested', 'arrested', 'wanted', 'unknown')`),
  ],
);
