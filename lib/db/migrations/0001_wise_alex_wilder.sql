CREATE SCHEMA "school";
--> statement-breakpoint
CREATE TABLE "school"."academic_years" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"semester" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_year_semester" UNIQUE("year","semester"),
	CONSTRAINT "chk_semester" CHECK ("school"."academic_years"."semester" IN (1, 2, 3)),
	CONSTRAINT "chk_dates" CHECK ("school"."academic_years"."end_date" > "school"."academic_years"."start_date")
);
--> statement-breakpoint
CREATE TABLE "school"."attendances" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar(20) NOT NULL,
	"academic_year_id" varchar(20) NOT NULL,
	"leave_type_id" varchar(20) NOT NULL,
	"leave_date" date NOT NULL,
	"reason" text,
	"approved_by" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_student_leave_date" UNIQUE("student_id","leave_date","academic_year_id")
);
--> statement-breakpoint
CREATE TABLE "school"."enrollments" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"student_id" varchar(20) NOT NULL,
	"plan_id" varchar(20),
	"grade_level" integer NOT NULL,
	"academic_year" integer NOT NULL,
	"section" varchar(10),
	"enrollment_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_student_enrollment" UNIQUE("student_id","academic_year","grade_level"),
	CONSTRAINT "chk_grade_level" CHECK ("school"."enrollments"."grade_level" >= 1 AND "school"."enrollments"."grade_level" <= 12)
);
--> statement-breakpoint
CREATE TABLE "school"."first_aid_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar(20) NOT NULL,
	"sickness_type_id" varchar(20) NOT NULL,
	"academic_year_id" varchar(20),
	"visit_date" date NOT NULL,
	"visit_time" time NOT NULL,
	"symptoms" text,
	"cause" text,
	"location_of_accident" varchar(200),
	"treatment_given" text,
	"attended_by" varchar(100),
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school"."food_categories" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"category_name" varchar(50) NOT NULL,
	"category_name_en" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_categories_category_name_unique" UNIQUE("category_name")
);
--> statement-breakpoint
CREATE TABLE "school"."food_menus" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"menu_name" varchar(100) NOT NULL,
	"menu_name_en" varchar(100),
	"category_id" varchar(20),
	"unit_price" numeric(8, 2) NOT NULL,
	"description" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_unit_price" CHECK ("school"."food_menus"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "school"."food_sources" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"source_name" varchar(50) NOT NULL,
	"location" varchar(100),
	"operation_hours" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_sources_source_name_unique" UNIQUE("source_name")
);
--> statement-breakpoint
CREATE TABLE "school"."food_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar(20) NOT NULL,
	"menu_id" varchar(20) NOT NULL,
	"source_id" varchar(20) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(8, 2) NOT NULL,
	"total_amount" numeric(8, 2) NOT NULL,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_quantity" CHECK ("school"."food_transactions"."quantity" > 0),
	CONSTRAINT "chk_unit_price_positive" CHECK ("school"."food_transactions"."unit_price" >= 0),
	CONSTRAINT "chk_total_amount" CHECK ("school"."food_transactions"."total_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "school"."guardians" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"student_id" varchar(20) NOT NULL,
	"relationship" varchar(20) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"email" varchar(100),
	"occupation" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school"."leave_types" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"leave_type_name" varchar(50) NOT NULL,
	"leave_type_name_en" varchar(50),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leave_types_leave_type_name_unique" UNIQUE("leave_type_name")
);
--> statement-breakpoint
CREATE TABLE "school"."library_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar(20) NOT NULL,
	"entry_date_time" timestamp DEFAULT now() NOT NULL,
	"exit_date_time" timestamp,
	"purpose" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_exit_after_entry" CHECK ("school"."library_visits"."exit_date_time" IS NULL OR "school"."library_visits"."exit_date_time" > "school"."library_visits"."entry_date_time")
);
--> statement-breakpoint
CREATE TABLE "school"."scorings" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar(20) NOT NULL,
	"subject_id" varchar(20) NOT NULL,
	"academic_year_id" varchar(20) NOT NULL,
	"raw_score" numeric(5, 2),
	"grade" varchar(5),
	"grade_point" numeric(3, 2),
	"remarks" text,
	"recorded_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_student_subject_year" UNIQUE("student_id","subject_id","academic_year_id"),
	CONSTRAINT "chk_raw_score" CHECK ("school"."scorings"."raw_score" >= 0 AND "school"."scorings"."raw_score" <= 100),
	CONSTRAINT "chk_grade_point" CHECK ("school"."scorings"."grade_point" >= 0.0 AND "school"."scorings"."grade_point" <= 4.0)
);
--> statement-breakpoint
CREATE TABLE "school"."sickness_types" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"type_name" varchar(100) NOT NULL,
	"type_name_en" varchar(100),
	"category" varchar(50),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sickness_types_type_name_unique" UNIQUE("type_name")
);
--> statement-breakpoint
CREATE TABLE "school"."students" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"date_of_birth" date,
	"gender" varchar(10),
	"address" text,
	"phone" varchar(20),
	"email" varchar(100),
	"enrollment_date" date,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school"."study_plans" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"student_id" varchar(20),
	"plan_name" varchar(100) NOT NULL,
	"plan_code" varchar(20) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "study_plans_plan_code_unique" UNIQUE("plan_code")
);
--> statement-breakpoint
CREATE TABLE "school"."subjects" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"subject_code" varchar(20) NOT NULL,
	"subject_name" varchar(100) NOT NULL,
	"subject_name_en" varchar(100),
	"credits" numeric(3, 1),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_subject_code_unique" UNIQUE("subject_code"),
	CONSTRAINT "chk_credits" CHECK ("school"."subjects"."credits" >= 0 AND "school"."subjects"."credits" <= 10)
);
--> statement-breakpoint
DROP TABLE "academic_years" CASCADE;--> statement-breakpoint
DROP TABLE "attendances" CASCADE;--> statement-breakpoint
DROP TABLE "enrollments" CASCADE;--> statement-breakpoint
DROP TABLE "first_aid_rooms" CASCADE;--> statement-breakpoint
DROP TABLE "food_categories" CASCADE;--> statement-breakpoint
DROP TABLE "food_menus" CASCADE;--> statement-breakpoint
DROP TABLE "food_sources" CASCADE;--> statement-breakpoint
DROP TABLE "food_transactions" CASCADE;--> statement-breakpoint
DROP TABLE "guardians" CASCADE;--> statement-breakpoint
DROP TABLE "leave_types" CASCADE;--> statement-breakpoint
DROP TABLE "library_visits" CASCADE;--> statement-breakpoint
DROP TABLE "scorings" CASCADE;--> statement-breakpoint
DROP TABLE "sickness_types" CASCADE;--> statement-breakpoint
DROP TABLE "students" CASCADE;--> statement-breakpoint
DROP TABLE "study_plans" CASCADE;--> statement-breakpoint
DROP TABLE "subjects" CASCADE;--> statement-breakpoint
ALTER TABLE "school"."attendances" ADD CONSTRAINT "attendances_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."attendances" ADD CONSTRAINT "attendances_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "school"."academic_years"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."attendances" ADD CONSTRAINT "attendances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "school"."leave_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."enrollments" ADD CONSTRAINT "enrollments_plan_id_study_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "school"."study_plans"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."first_aid_rooms" ADD CONSTRAINT "first_aid_rooms_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."first_aid_rooms" ADD CONSTRAINT "first_aid_rooms_sickness_type_id_sickness_types_id_fk" FOREIGN KEY ("sickness_type_id") REFERENCES "school"."sickness_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."first_aid_rooms" ADD CONSTRAINT "first_aid_rooms_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "school"."academic_years"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."food_menus" ADD CONSTRAINT "food_menus_category_id_food_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "school"."food_categories"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."food_transactions" ADD CONSTRAINT "food_transactions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."food_transactions" ADD CONSTRAINT "food_transactions_menu_id_food_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "school"."food_menus"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."food_transactions" ADD CONSTRAINT "food_transactions_source_id_food_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "school"."food_sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."guardians" ADD CONSTRAINT "guardians_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."library_visits" ADD CONSTRAINT "library_visits_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."scorings" ADD CONSTRAINT "scorings_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."scorings" ADD CONSTRAINT "scorings_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "school"."subjects"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."scorings" ADD CONSTRAINT "scorings_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "school"."academic_years"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school"."study_plans" ADD CONSTRAINT "study_plans_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "school"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_academic_years_year" ON "school"."academic_years" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_attendances_student_id" ON "school"."attendances" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_attendances_academic_year_id" ON "school"."attendances" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_attendances_leave_type_id" ON "school"."attendances" USING btree ("leave_type_id");--> statement-breakpoint
CREATE INDEX "idx_attendances_leave_date" ON "school"."attendances" USING btree ("leave_date");--> statement-breakpoint
CREATE INDEX "idx_enrollments_student_id" ON "school"."enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_plan_id" ON "school"."enrollments" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_academic_year" ON "school"."enrollments" USING btree ("academic_year");--> statement-breakpoint
CREATE INDEX "idx_first_aid_rooms_student_id" ON "school"."first_aid_rooms" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_first_aid_rooms_sickness_type_id" ON "school"."first_aid_rooms" USING btree ("sickness_type_id");--> statement-breakpoint
CREATE INDEX "idx_first_aid_rooms_academic_year_id" ON "school"."first_aid_rooms" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_first_aid_rooms_visit_date" ON "school"."first_aid_rooms" USING btree ("visit_date");--> statement-breakpoint
CREATE INDEX "idx_food_categories_name" ON "school"."food_categories" USING btree ("category_name");--> statement-breakpoint
CREATE INDEX "idx_food_menus_category_id" ON "school"."food_menus" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_food_menus_available" ON "school"."food_menus" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "idx_food_sources_name" ON "school"."food_sources" USING btree ("source_name");--> statement-breakpoint
CREATE INDEX "idx_food_transactions_student_id" ON "school"."food_transactions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_food_transactions_menu_id" ON "school"."food_transactions" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "idx_food_transactions_source_id" ON "school"."food_transactions" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_food_transactions_date" ON "school"."food_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_guardians_student_id" ON "school"."guardians" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_guardians_email" ON "school"."guardians" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_leave_types_name" ON "school"."leave_types" USING btree ("leave_type_name");--> statement-breakpoint
CREATE INDEX "idx_library_visits_student_id" ON "school"."library_visits" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_library_visits_entry_date" ON "school"."library_visits" USING btree ("entry_date_time");--> statement-breakpoint
CREATE INDEX "idx_scorings_student_id" ON "school"."scorings" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_scorings_subject_id" ON "school"."scorings" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_scorings_academic_year_id" ON "school"."scorings" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_scorings_recorded_date" ON "school"."scorings" USING btree ("recorded_date");--> statement-breakpoint
CREATE INDEX "idx_sickness_types_name" ON "school"."sickness_types" USING btree ("type_name");--> statement-breakpoint
CREATE INDEX "idx_sickness_types_category" ON "school"."sickness_types" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_students_email" ON "school"."students" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_students_status" ON "school"."students" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_students_enrollment_date" ON "school"."students" USING btree ("enrollment_date");--> statement-breakpoint
CREATE INDEX "idx_study_plans_student_id" ON "school"."study_plans" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_study_plans_plan_code" ON "school"."study_plans" USING btree ("plan_code");--> statement-breakpoint
CREATE INDEX "idx_subjects_code" ON "school"."subjects" USING btree ("subject_code");