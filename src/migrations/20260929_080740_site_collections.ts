import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_team_group" AS ENUM('mgmt', 'dev', 'design', 'qa', 'biz', 'tbc');
  CREATE TYPE "public"."enum_projects_cat" AS ENUM('health', 'edu', 'lang', 'prod');
  CREATE TYPE "public"."enum_projects_art" AS ENUM('cells', 'plate', 'grid', 'bubbles', 'translate', 'card', 'checklist', 'wave', 'layers');
  CREATE TYPE "public"."enum_products_rel_kind" AS ENUM('project', 'service');
  CREATE TYPE "public"."enum_products_price_key" AS ENUM('priceAsk', 'monthly');
  CREATE TYPE "public"."enum_services_related_kind" AS ENUM('project', 'product', 'static');
  CREATE TYPE "public"."enum_services_related_caption" AS ENUM('relatedLabel', 'relatedProducts');
  CREATE TYPE "public"."enum_insights_kind" AS ENUM('news', 'product', 'case');
  CREATE TYPE "public"."enum_insights_link_label_key" AS ENUM('segProducts');
  CREATE TABLE "team" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"name_ko" varchar,
  	"role" varchar NOT NULL,
  	"role_en" varchar,
  	"group" "enum_team_group" DEFAULT 'dev' NOT NULL,
  	"photo" varchar,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL,
  	"item_en" varchar
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"title" varchar NOT NULL,
  	"desc" varchar,
  	"tag_en" varchar,
  	"title_en" varchar,
  	"desc_en" varchar,
  	"cat" "enum_projects_cat" NOT NULL,
  	"art" "enum_projects_art" DEFAULT 'grid' NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_feats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"title_en" varchar,
  	"body" varchar,
  	"body_en" varchar
  );
  
  CREATE TABLE "products_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"title_en" varchar,
  	"body" varchar,
  	"body_en" varchar
  );
  
  CREATE TABLE "products_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"label_en" varchar,
  	"body" varchar,
  	"body_en" varchar
  );
  
  CREATE TABLE "products_rel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_products_rel_kind" NOT NULL,
  	"ref_id" varchar,
  	"abbr" varchar NOT NULL,
  	"label" varchar,
  	"label_en" varchar
  );
  
  CREATE TABLE "products_teaser_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chip" varchar NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"cat" varchar,
  	"lead" varchar NOT NULL,
  	"who_h" varchar,
  	"who" varchar,
  	"note" varchar,
  	"cat_en" varchar,
  	"lead_en" varchar,
  	"who_h_en" varchar,
  	"who_en" varchar,
  	"note_en" varchar,
  	"ruo" boolean DEFAULT true,
  	"price_key" "enum_products_price_key" DEFAULT 'priceAsk' NOT NULL,
  	"topic" varchar NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_related" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_services_related_kind" NOT NULL,
  	"ref_id" varchar,
  	"abbr" varchar NOT NULL,
  	"label" varchar,
  	"label_en" varchar
  );
  
  CREATE TABLE "services_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chip" varchar NOT NULL
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"body" varchar,
  	"blurb" varchar,
  	"name_en" varchar,
  	"body_en" varchar,
  	"blurb_en" varchar,
  	"related_caption" "enum_services_related_caption" DEFAULT 'relatedLabel' NOT NULL,
  	"number" varchar NOT NULL,
  	"code" varchar NOT NULL,
  	"abbr" varchar NOT NULL,
  	"anchor" varchar NOT NULL,
  	"weight" numeric,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faq" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"question_en" varchar,
  	"answer_en" varchar,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "insights" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar,
  	"heading_en" varchar,
  	"body_en" varchar,
  	"kind" "enum_insights_kind" DEFAULT 'news' NOT NULL,
  	"date" varchar NOT NULL,
  	"link_href" varchar,
  	"link_external" boolean DEFAULT false,
  	"link_label_key" "enum_insights_link_label_key",
  	"order" numeric DEFAULT 0 NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "team_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faq_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "insights_id" integer;
  ALTER TABLE "projects_bullets" ADD CONSTRAINT "projects_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_feats" ADD CONSTRAINT "products_feats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_steps" ADD CONSTRAINT "products_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_facts" ADD CONSTRAINT "products_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rel" ADD CONSTRAINT "products_rel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_teaser_chips" ADD CONSTRAINT "products_teaser_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_related" ADD CONSTRAINT "services_related_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_chips" ADD CONSTRAINT "services_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "team_slug_idx" ON "team" USING btree ("slug");
  CREATE INDEX "team_updated_at_idx" ON "team" USING btree ("updated_at");
  CREATE INDEX "team_created_at_idx" ON "team" USING btree ("created_at");
  CREATE INDEX "projects_bullets_order_idx" ON "projects_bullets" USING btree ("_order");
  CREATE INDEX "projects_bullets_parent_id_idx" ON "projects_bullets" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "products_feats_order_idx" ON "products_feats" USING btree ("_order");
  CREATE INDEX "products_feats_parent_id_idx" ON "products_feats" USING btree ("_parent_id");
  CREATE INDEX "products_steps_order_idx" ON "products_steps" USING btree ("_order");
  CREATE INDEX "products_steps_parent_id_idx" ON "products_steps" USING btree ("_parent_id");
  CREATE INDEX "products_facts_order_idx" ON "products_facts" USING btree ("_order");
  CREATE INDEX "products_facts_parent_id_idx" ON "products_facts" USING btree ("_parent_id");
  CREATE INDEX "products_rel_order_idx" ON "products_rel" USING btree ("_order");
  CREATE INDEX "products_rel_parent_id_idx" ON "products_rel" USING btree ("_parent_id");
  CREATE INDEX "products_teaser_chips_order_idx" ON "products_teaser_chips" USING btree ("_order");
  CREATE INDEX "products_teaser_chips_parent_id_idx" ON "products_teaser_chips" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "services_related_order_idx" ON "services_related" USING btree ("_order");
  CREATE INDEX "services_related_parent_id_idx" ON "services_related" USING btree ("_parent_id");
  CREATE INDEX "services_chips_order_idx" ON "services_chips" USING btree ("_order");
  CREATE INDEX "services_chips_parent_id_idx" ON "services_chips" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "faq_updated_at_idx" ON "faq" USING btree ("updated_at");
  CREATE INDEX "faq_created_at_idx" ON "faq" USING btree ("created_at");
  CREATE UNIQUE INDEX "insights_slug_idx" ON "insights" USING btree ("slug");
  CREATE INDEX "insights_updated_at_idx" ON "insights" USING btree ("updated_at");
  CREATE INDEX "insights_created_at_idx" ON "insights" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_insights_fk" FOREIGN KEY ("insights_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_team_id_idx" ON "payload_locked_documents_rels" USING btree ("team_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_faq_id_idx" ON "payload_locked_documents_rels" USING btree ("faq_id");
  CREATE INDEX "payload_locked_documents_rels_insights_id_idx" ON "payload_locked_documents_rels" USING btree ("insights_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_feats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_rel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_teaser_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_related" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "insights" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "team" CASCADE;
  DROP TABLE "projects_bullets" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "products_feats" CASCADE;
  DROP TABLE "products_steps" CASCADE;
  DROP TABLE "products_facts" CASCADE;
  DROP TABLE "products_rel" CASCADE;
  DROP TABLE "products_teaser_chips" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "services_related" CASCADE;
  DROP TABLE "services_chips" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "faq" CASCADE;
  DROP TABLE "insights" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_team_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_products_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faq_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_insights_fk";
  
  DROP INDEX "payload_locked_documents_rels_team_id_idx";
  DROP INDEX "payload_locked_documents_rels_projects_id_idx";
  DROP INDEX "payload_locked_documents_rels_products_id_idx";
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_faq_id_idx";
  DROP INDEX "payload_locked_documents_rels_insights_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "team_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "projects_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "products_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faq_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "insights_id";
  DROP TYPE "public"."enum_team_group";
  DROP TYPE "public"."enum_projects_cat";
  DROP TYPE "public"."enum_projects_art";
  DROP TYPE "public"."enum_products_rel_kind";
  DROP TYPE "public"."enum_products_price_key";
  DROP TYPE "public"."enum_services_related_kind";
  DROP TYPE "public"."enum_services_related_caption";
  DROP TYPE "public"."enum_insights_kind";
  DROP TYPE "public"."enum_insights_link_label_key";`)
}
