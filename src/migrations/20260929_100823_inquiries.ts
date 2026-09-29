import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_inquiries_topic" AS ENUM('general', 'ai', 'custom', 'data', 'design', 'support', 'skinarch', 'wiz', 'brainarch', 'partnership', 'newsletter', 'other');
  CREATE TYPE "public"."enum_inquiries_locale" AS ENUM('ko', 'en');
  CREATE TYPE "public"."enum_inquiries_captcha_status" AS ENUM('ok', 'skipped', 'unavailable', 'error', 'low-score');
  CREATE TYPE "public"."enum_inquiries_status" AS ENUM('new', 'replied', 'archived');
  CREATE TABLE "inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ref" varchar NOT NULL,
  	"topic" "enum_inquiries_topic" NOT NULL,
  	"name" varchar NOT NULL,
  	"org" varchar,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"message" varchar,
  	"consent_privacy" boolean DEFAULT false NOT NULL,
  	"consent_marketing" boolean DEFAULT false,
  	"locale" "enum_inquiries_locale" NOT NULL,
  	"source" varchar DEFAULT 'contact-form' NOT NULL,
  	"captcha_status" "enum_inquiries_captcha_status" DEFAULT 'skipped' NOT NULL,
  	"captcha_score" numeric,
  	"user_agent" varchar,
  	"ip" varchar,
  	"status" "enum_inquiries_status" DEFAULT 'new' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "inquiries_id" integer;
  CREATE UNIQUE INDEX "inquiries_ref_idx" ON "inquiries" USING btree ("ref");
  CREATE INDEX "inquiries_updated_at_idx" ON "inquiries" USING btree ("updated_at");
  CREATE INDEX "inquiries_created_at_idx" ON "inquiries" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk" FOREIGN KEY ("inquiries_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("inquiries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "inquiries" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "inquiries" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_inquiries_fk";
  
  DROP INDEX "payload_locked_documents_rels_inquiries_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "inquiries_id";
  DROP TYPE "public"."enum_inquiries_topic";
  DROP TYPE "public"."enum_inquiries_locale";
  DROP TYPE "public"."enum_inquiries_captcha_status";
  DROP TYPE "public"."enum_inquiries_status";`)
}
