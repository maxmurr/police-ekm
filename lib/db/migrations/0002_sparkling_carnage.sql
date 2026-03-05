CREATE SCHEMA "police";
--> statement-breakpoint
CREATE TABLE "police"."case_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" varchar(20) NOT NULL,
	"note_text" text NOT NULL,
	"note_type" varchar(20) DEFAULT 'investigation',
	"priority" varchar(10) DEFAULT 'medium',
	"created_by" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_note_type" CHECK ("police"."case_notes"."note_type" IN ('investigation', 'evidence', 'witness', 'resolution', 'other')),
	CONSTRAINT "chk_priority" CHECK ("police"."case_notes"."priority" IN ('low', 'medium', 'high'))
);
--> statement-breakpoint
CREATE TABLE "police"."case_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"status_name_th" varchar(50) NOT NULL,
	"status_name_en" varchar(50),
	"status_order" integer,
	"is_closed" boolean DEFAULT false,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "case_statuses_status_name_th_unique" UNIQUE("status_name_th")
);
--> statement-breakpoint
CREATE TABLE "police"."districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"district_name_th" varchar(100) NOT NULL,
	"district_name_en" varchar(100),
	"province_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_district_province" UNIQUE("district_name_th","province_id")
);
--> statement-breakpoint
CREATE TABLE "police"."evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" varchar(20) NOT NULL,
	"evidence_type" varchar(20) DEFAULT 'other',
	"description" text,
	"file_path" varchar(500),
	"file_size_kb" integer,
	"collected_by" varchar(20),
	"collected_at" timestamp DEFAULT now(),
	"chain_of_custody" text,
	"is_key_evidence" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_evidence_type" CHECK ("police"."evidence"."evidence_type" IN ('photo', 'video', 'document', 'physical', 'digital', 'other'))
);
--> statement-breakpoint
CREATE TABLE "police"."incident_reports" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"report_date" date NOT NULL,
	"report_time" time NOT NULL,
	"incident_datetime" timestamp,
	"reporter_id" integer NOT NULL,
	"incident_type_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"investigator_id" varchar(20),
	"status_id" integer DEFAULT 1 NOT NULL,
	"estimated_damage_amount" numeric(12, 2),
	"number_of_victims" integer DEFAULT 0,
	"number_of_suspects" integer DEFAULT 0,
	"response_time_minutes" integer,
	"case_closed_date" date,
	"resolution_time_days" integer,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_number_of_victims" CHECK ("police"."incident_reports"."number_of_victims" >= 0),
	CONSTRAINT "chk_number_of_suspects" CHECK ("police"."incident_reports"."number_of_suspects" >= 0),
	CONSTRAINT "chk_estimated_damage" CHECK ("police"."incident_reports"."estimated_damage_amount" >= 0 OR "police"."incident_reports"."estimated_damage_amount" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "police"."incident_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_type_name_th" varchar(100) NOT NULL,
	"incident_type_name_en" varchar(100),
	"category" varchar(50),
	"severity_level" varchar(20) DEFAULT 'medium',
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "incident_types_incident_type_name_th_unique" UNIQUE("incident_type_name_th"),
	CONSTRAINT "chk_severity_level" CHECK ("police"."incident_types"."severity_level" IN ('low', 'medium', 'high', 'critical'))
);
--> statement-breakpoint
CREATE TABLE "police"."investigators" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"investigator_name" varchar(150) NOT NULL,
	"rank" varchar(50),
	"rank_level" integer,
	"badge_number" varchar(50),
	"phone" varchar(20),
	"email" varchar(100),
	"department" varchar(100),
	"is_active" boolean DEFAULT true,
	"hire_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investigators_badge_number_unique" UNIQUE("badge_number")
);
--> statement-breakpoint
CREATE TABLE "police"."locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_general" varchar(255) NOT NULL,
	"location_specific" text,
	"district_id" integer,
	"province_id" integer NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"location_type" varchar(20) DEFAULT 'other',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_location_type" CHECK ("police"."locations"."location_type" IN ('street', 'building', 'park', 'mall', 'residence', 'other'))
);
--> statement-breakpoint
CREATE TABLE "police"."provinces" (
	"id" serial PRIMARY KEY NOT NULL,
	"province_name_th" varchar(100) NOT NULL,
	"province_name_en" varchar(100),
	"region" varchar(50),
	"region_code" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provinces_province_name_th_unique" UNIQUE("province_name_th")
);
--> statement-breakpoint
CREATE TABLE "police"."reporters" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_name" varchar(150) NOT NULL,
	"reporter_phone" varchar(20) NOT NULL,
	"email" varchar(100),
	"address" text,
	"reporter_type" varchar(20) DEFAULT 'citizen',
	"total_reports" integer DEFAULT 0,
	"last_report_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_name_phone" UNIQUE("reporter_name","reporter_phone"),
	CONSTRAINT "chk_reporter_type" CHECK ("police"."reporters"."reporter_type" IN ('citizen', 'business', 'government', 'anonymous'))
);
--> statement-breakpoint
CREATE TABLE "police"."suspects" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" varchar(20) NOT NULL,
	"suspect_name" varchar(150),
	"age" integer,
	"gender" varchar(10),
	"arrest_status" varchar(20) DEFAULT 'unknown',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_suspect_gender" CHECK ("police"."suspects"."gender" IN ('male', 'female', 'other', 'unknown') OR "police"."suspects"."gender" IS NULL),
	CONSTRAINT "chk_arrest_status" CHECK ("police"."suspects"."arrest_status" IN ('not_arrested', 'arrested', 'wanted', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "police"."victims" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" varchar(20) NOT NULL,
	"victim_name" varchar(150),
	"age" integer,
	"gender" varchar(10),
	"injury_severity" varchar(20),
	"hospital_name" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_gender" CHECK ("police"."victims"."gender" IN ('male', 'female', 'other', 'unknown') OR "police"."victims"."gender" IS NULL),
	CONSTRAINT "chk_injury_severity" CHECK ("police"."victims"."injury_severity" IN ('none', 'minor', 'moderate', 'severe', 'fatal') OR "police"."victims"."injury_severity" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "police"."case_notes" ADD CONSTRAINT "case_notes_report_id_incident_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "police"."incident_reports"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "police"."case_notes" ADD CONSTRAINT "case_notes_created_by_investigators_id_fk" FOREIGN KEY ("created_by") REFERENCES "police"."investigators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "police"."districts" ADD CONSTRAINT "districts_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "police"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "police"."evidence" ADD CONSTRAINT "evidence_report_id_incident_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "police"."incident_reports"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "police"."evidence" ADD CONSTRAINT "evidence_collected_by_investigators_id_fk" FOREIGN KEY ("collected_by") REFERENCES "police"."investigators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "police"."incident_reports" ADD CONSTRAINT "incident_reports_reporter_id_reporters_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "police"."reporters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "police"."incident_reports" ADD CONSTRAINT "incident_reports_incident_type_id_incident_types_id_fk" FOREIGN KEY ("incident_type_id") REFERENCES "police"."incident_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "police"."incident_reports" ADD CONSTRAINT "incident_reports_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "police"."locations"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "police"."incident_reports" ADD CONSTRAINT "incident_reports_investigator_id_investigators_id_fk" FOREIGN KEY ("investigator_id") REFERENCES "police"."investigators"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "police"."incident_reports" ADD CONSTRAINT "incident_reports_status_id_case_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "police"."case_statuses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "police"."locations" ADD CONSTRAINT "locations_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "police"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "police"."locations" ADD CONSTRAINT "locations_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "police"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "police"."suspects" ADD CONSTRAINT "suspects_report_id_incident_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "police"."incident_reports"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "police"."victims" ADD CONSTRAINT "victims_report_id_incident_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "police"."incident_reports"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_case_notes_report" ON "police"."case_notes" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_case_notes_type" ON "police"."case_notes" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "idx_case_notes_created_at" ON "police"."case_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_case_statuses_order" ON "police"."case_statuses" USING btree ("status_order");--> statement-breakpoint
CREATE INDEX "idx_districts_province" ON "police"."districts" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_report" ON "police"."evidence" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_type" ON "police"."evidence" USING btree ("evidence_type");--> statement-breakpoint
CREATE INDEX "idx_evidence_key" ON "police"."evidence" USING btree ("is_key_evidence");--> statement-breakpoint
CREATE INDEX "idx_incident_reports_report_date" ON "police"."incident_reports" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "idx_incident_reports_incident_datetime" ON "police"."incident_reports" USING btree ("incident_datetime");--> statement-breakpoint
CREATE INDEX "idx_incident_reports_incident_type" ON "police"."incident_reports" USING btree ("incident_type_id");--> statement-breakpoint
CREATE INDEX "idx_incident_reports_status" ON "police"."incident_reports" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "idx_incident_reports_investigator" ON "police"."incident_reports" USING btree ("investigator_id");--> statement-breakpoint
CREATE INDEX "idx_incident_reports_damage_amount" ON "police"."incident_reports" USING btree ("estimated_damage_amount");--> statement-breakpoint
CREATE INDEX "idx_incident_reports_location" ON "police"."incident_reports" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_incident_reports_reporter" ON "police"."incident_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "idx_incident_types_category" ON "police"."incident_types" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_incident_types_severity" ON "police"."incident_types" USING btree ("severity_level");--> statement-breakpoint
CREATE INDEX "idx_investigators_department" ON "police"."investigators" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_investigators_active" ON "police"."investigators" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_investigators_rank_level" ON "police"."investigators" USING btree ("rank_level");--> statement-breakpoint
CREATE INDEX "idx_locations_type" ON "police"."locations" USING btree ("location_type");--> statement-breakpoint
CREATE INDEX "idx_locations_district" ON "police"."locations" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "idx_locations_province" ON "police"."locations" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "idx_provinces_region" ON "police"."provinces" USING btree ("region");--> statement-breakpoint
CREATE INDEX "idx_reporters_type" ON "police"."reporters" USING btree ("reporter_type");--> statement-breakpoint
CREATE INDEX "idx_reporters_total_reports" ON "police"."reporters" USING btree ("total_reports");--> statement-breakpoint
CREATE INDEX "idx_suspects_report" ON "police"."suspects" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_suspects_arrest_status" ON "police"."suspects" USING btree ("arrest_status");--> statement-breakpoint
CREATE INDEX "idx_victims_report" ON "police"."victims" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_victims_injury_severity" ON "police"."victims" USING btree ("injury_severity");--> statement-breakpoint
CREATE INDEX "idx_victims_age" ON "police"."victims" USING btree ("age");--> statement-breakpoint
CREATE INDEX "idx_victims_gender" ON "police"."victims" USING btree ("gender");