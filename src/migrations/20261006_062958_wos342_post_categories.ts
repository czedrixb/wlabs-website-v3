import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_categories" AS ENUM('news', 'notes', 'research');
  CREATE TYPE "public"."enum__posts_v_version_categories" AS ENUM('news', 'notes', 'research');
  CREATE TABLE "posts_categories" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_posts_categories",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_posts_v_version_categories" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__posts_v_version_categories",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "posts_categories" ADD CONSTRAINT "posts_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_categories" ADD CONSTRAINT "_posts_v_version_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_categories_order_idx" ON "posts_categories" USING btree ("order");
  CREATE INDEX "posts_categories_parent_idx" ON "posts_categories" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_categories_order_idx" ON "_posts_v_version_categories" USING btree ("order");
  CREATE INDEX "_posts_v_version_categories_parent_idx" ON "_posts_v_version_categories" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "posts_categories" CASCADE;
  DROP TABLE "_posts_v_version_categories" CASCADE;
  DROP TYPE "public"."enum_posts_categories";
  DROP TYPE "public"."enum__posts_v_version_categories";`)
}
