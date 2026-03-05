CREATE SCHEMA "police_legacy";
--> statement-breakpoint
CREATE TABLE "police_legacy"."incident_reports_legacy" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"case_number" varchar(20),
	"report_date" date NOT NULL,
	"report_time" time NOT NULL,
	"reporter_name" varchar(255) NOT NULL,
	"reporter_phone" varchar(50) NOT NULL,
	"report_type" varchar(100) NOT NULL,
	"incident_location" varchar(255) NOT NULL,
	"incident_location_specific" text,
	"incident_location_province" varchar(100) NOT NULL,
	"summary" text NOT NULL,
	"investigator" varchar(150),
	"case_status" varchar(100) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_legacy_report_date" ON "police_legacy"."incident_reports_legacy" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "idx_legacy_report_type" ON "police_legacy"."incident_reports_legacy" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "idx_legacy_case_status" ON "police_legacy"."incident_reports_legacy" USING btree ("case_status");--> statement-breakpoint
CREATE INDEX "idx_legacy_investigator" ON "police_legacy"."incident_reports_legacy" USING btree ("investigator");--> statement-breakpoint
CREATE INDEX "idx_legacy_province" ON "police_legacy"."incident_reports_legacy" USING btree ("incident_location_province");--> statement-breakpoint
CREATE INDEX "idx_legacy_case_number" ON "police_legacy"."incident_reports_legacy" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_legacy_reporter_phone" ON "police_legacy"."incident_reports_legacy" USING btree ("reporter_phone");