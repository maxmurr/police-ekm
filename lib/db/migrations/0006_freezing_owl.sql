CREATE SCHEMA "stgabriel";
--> statement-breakpoint
CREATE TABLE "stgabriel"."attendances" (
	"id" serial PRIMARY KEY NOT NULL,
	"วันที่" date NOT NULL,
	"ปีการศึกษา" integer NOT NULL,
	"ภาคเรียน" integer NOT NULL,
	"รหัสนักเรียน" varchar(20) NOT NULL,
	"ประเภท" text NOT NULL,
	"source_year" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_stgabriel_semester" CHECK ("stgabriel"."attendances"."ภาคเรียน" >= 1 AND "stgabriel"."attendances"."ภาคเรียน" <= 3)
);
--> statement-breakpoint
CREATE TABLE "stgabriel"."food_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_date" date NOT NULL,
	"product_id" text,
	"product_name" text,
	"product_categories" text,
	"amount" real,
	"unit_price" real,
	"total_price" real,
	"source" text,
	"student_id" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_stgabriel_amount" CHECK ("stgabriel"."food_transactions"."amount" >= 0),
	CONSTRAINT "chk_stgabriel_unit_price" CHECK ("stgabriel"."food_transactions"."unit_price" >= 0),
	CONSTRAINT "chk_stgabriel_total_price" CHECK ("stgabriel"."food_transactions"."total_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stgabriel"."hospital_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"รหัสประจำตัวนักเรียน" varchar(20) NOT NULL,
	"วันที่ใช้บริการ" date NOT NULL,
	"เวลา" time,
	"ประเภท" text,
	"รายละเอียด" text,
	"ปีการศึกษา" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stgabriel"."library_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"วันเวลาที่เข้าห้องสมุด" timestamp NOT NULL,
	"รหัสประจำตัวนักเรียน" varchar(20) NOT NULL,
	"file_year" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stgabriel"."scorings" (
	"id" serial PRIMARY KEY NOT NULL,
	"รหัสประจำตัวนักเรียน" varchar(20) NOT NULL,
	"ปีการศึกษา" integer NOT NULL,
	"คะแนนเต็ม" real,
	"คะแนนที่ได้" real,
	"ร้อยละ" real,
	"เกรด" text,
	"รหัสวิชา" text,
	"ชื่อวิชา" text,
	"ชื่อวิชาภาษาอังกฤษ" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_stgabriel_max_score" CHECK ("stgabriel"."scorings"."คะแนนเต็ม" >= 0),
	CONSTRAINT "chk_stgabriel_score_obtained" CHECK ("stgabriel"."scorings"."คะแนนที่ได้" >= 0 AND "stgabriel"."scorings"."คะแนนที่ได้" <= "stgabriel"."scorings"."คะแนนเต็ม"),
	CONSTRAINT "chk_stgabriel_percentage" CHECK ("stgabriel"."scorings"."ร้อยละ" >= 0 AND "stgabriel"."scorings"."ร้อยละ" <= 100)
);
--> statement-breakpoint
CREATE TABLE "stgabriel"."semester_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"รหัสประจำตัว" varchar(20) NOT NULL,
	"ปีการศึกษา" integer NOT NULL,
	"ภาคเรียน" integer NOT NULL,
	"จำนวนเงิน" real,
	"ชำระแล้ว" real,
	"ค้างชำระ" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_stgabriel_student_semester_fee" UNIQUE("รหัสประจำตัว","ปีการศึกษา","ภาคเรียน"),
	CONSTRAINT "chk_stgabriel_fee_amount" CHECK ("stgabriel"."semester_fees"."จำนวนเงิน" >= 0),
	CONSTRAINT "chk_stgabriel_amount_paid" CHECK ("stgabriel"."semester_fees"."ชำระแล้ว" >= 0),
	CONSTRAINT "chk_stgabriel_unpaid_balance" CHECK ("stgabriel"."semester_fees"."ค้างชำระ" >= 0),
	CONSTRAINT "chk_stgabriel_semester_fee" CHECK ("stgabriel"."semester_fees"."ภาคเรียน" >= 1 AND "stgabriel"."semester_fees"."ภาคเรียน" <= 3)
);
--> statement-breakpoint
CREATE TABLE "stgabriel"."students" (
	"รหัสประจำตัว" varchar(20) PRIMARY KEY NOT NULL,
	"ชั้น" text,
	"ห้อง" text,
	"เลขที่" integer,
	"วันเกิด" date,
	"คำนำหน้า" text,
	"ชื่อ" text,
	"นามสกุล" text,
	"เพศ" text,
	"name" text,
	"surname" text,
	"ตำบล" text,
	"อำเภอ" text,
	"จังหวัด" text,
	"เชื้อชาติ" text,
	"สัญชาติ" text,
	"ศาสนา" text,
	"รายได้ต่อปีของบิดา" real,
	"รายได้ต่อปีของมารดา" real,
	"รายได้ต่อปีของผู้ปกครอง" real,
	"อาชีพของบิดา" text,
	"อาชีพของมารดา" text,
	"อาชีพของผู้ปกครอง" text,
	"สถานะภาพครอบครัว" text,
	"ra" text,
	"จำนวนพี่น้องในครอบครัว" integer,
	"บุคคลที่นักเรียนพักอาศัย" text,
	"กรุ๊ปเลือด" text,
	"แผนการเรียน" text,
	"ชื่อบิดา" text,
	"นามสกุลบิดา" text,
	"ชื่อมารดา" text,
	"นามสกุลมารดา" text,
	"เบอร์โทรศัพท์บิดา" text,
	"เบอร์โทรศัพท์มารดา" text,
	"เบอร์โทรศัพท์ผู้ปกครอง" text,
	"โรงเรียนเดิม" text,
	"ชั้นที่จบมา" text,
	"จังหวัดที่จบมา" text,
	"ภูมิลำเนา" text,
	"ปีที่เข้าเรียน" integer,
	"วันที่เข้าเรียน" date,
	"source_year" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stgabriel"."attendances" ADD CONSTRAINT "attendances_รหัสนักเรียน_students_รหัสประจำตัว_fk" FOREIGN KEY ("รหัสนักเรียน") REFERENCES "stgabriel"."students"("รหัสประจำตัว") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stgabriel"."food_transactions" ADD CONSTRAINT "food_transactions_student_id_students_รหัสประจำตัว_fk" FOREIGN KEY ("student_id") REFERENCES "stgabriel"."students"("รหัสประจำตัว") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stgabriel"."hospital_visits" ADD CONSTRAINT "hospital_visits_รหัสประจำตัวนักเรียน_students_รหัสประจำตัว_fk" FOREIGN KEY ("รหัสประจำตัวนักเรียน") REFERENCES "stgabriel"."students"("รหัสประจำตัว") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stgabriel"."library_visits" ADD CONSTRAINT "library_visits_รหัสประจำตัวนักเรียน_students_รหัสประจำตัว_fk" FOREIGN KEY ("รหัสประจำตัวนักเรียน") REFERENCES "stgabriel"."students"("รหัสประจำตัว") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stgabriel"."scorings" ADD CONSTRAINT "scorings_รหัสประจำตัวนักเรียน_students_รหัสประจำตัว_fk" FOREIGN KEY ("รหัสประจำตัวนักเรียน") REFERENCES "stgabriel"."students"("รหัสประจำตัว") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stgabriel"."semester_fees" ADD CONSTRAINT "semester_fees_รหัสประจำตัว_students_รหัสประจำตัว_fk" FOREIGN KEY ("รหัสประจำตัว") REFERENCES "stgabriel"."students"("รหัสประจำตัว") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_stgabriel_attendances_student_id" ON "stgabriel"."attendances" USING btree ("รหัสนักเรียน");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_attendances_date" ON "stgabriel"."attendances" USING btree ("วันที่");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_attendances_academic_year" ON "stgabriel"."attendances" USING btree ("ปีการศึกษา");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_attendances_type" ON "stgabriel"."attendances" USING btree ("ประเภท");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_food_transactions_date" ON "stgabriel"."food_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_food_transactions_student_id" ON "stgabriel"."food_transactions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_food_transactions_source" ON "stgabriel"."food_transactions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_food_transactions_category" ON "stgabriel"."food_transactions" USING btree ("product_categories");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_hospital_visits_student_id" ON "stgabriel"."hospital_visits" USING btree ("รหัสประจำตัวนักเรียน");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_hospital_visits_date" ON "stgabriel"."hospital_visits" USING btree ("วันที่ใช้บริการ");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_hospital_visits_type" ON "stgabriel"."hospital_visits" USING btree ("ประเภท");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_hospital_visits_academic_year" ON "stgabriel"."hospital_visits" USING btree ("ปีการศึกษา");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_library_visits_student_id" ON "stgabriel"."library_visits" USING btree ("รหัสประจำตัวนักเรียน");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_library_visits_datetime" ON "stgabriel"."library_visits" USING btree ("วันเวลาที่เข้าห้องสมุด");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_scorings_student_id" ON "stgabriel"."scorings" USING btree ("รหัสประจำตัวนักเรียน");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_scorings_academic_year" ON "stgabriel"."scorings" USING btree ("ปีการศึกษา");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_scorings_subject_code" ON "stgabriel"."scorings" USING btree ("รหัสวิชา");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_semester_fees_student_id" ON "stgabriel"."semester_fees" USING btree ("รหัสประจำตัว");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_semester_fees_academic_year" ON "stgabriel"."semester_fees" USING btree ("ปีการศึกษา");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_students_class_room" ON "stgabriel"."students" USING btree ("ชั้น","ห้อง");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_students_gender" ON "stgabriel"."students" USING btree ("เพศ");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_students_religion" ON "stgabriel"."students" USING btree ("ศาสนา");--> statement-breakpoint
CREATE INDEX "idx_stgabriel_students_source_year" ON "stgabriel"."students" USING btree ("source_year");