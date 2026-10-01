import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Several e2e runs of publish-toggle.spec.ts (2026-09-29) deleted their
// temporary post while _posts_v_parent_id_posts_id_fk is ON DELETE SET NULL,
// leaving behind version rows with parent_id = NULL and latest = true.
// Payload's admin list/dashboard queries use draft:true, which reads
// _posts_v WHERE latest = true and returns { id: doc.parent, ...doc.version }
// — so each orphan surfaces as a doc with id: null. Payload's own <Table>
// then falls back to the row index as the React key, colliding with a real
// post id on the same page ("Encountered two children with the same key, 5").
// See src/collections/Posts.ts (purgeOrphanedVersions) for the ongoing sweep
// that keeps these from reaccumulating.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "_posts_v" WHERE "parent_id" IS NULL;`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Irreversible by design: the deleted rows were unreachable garbage with
  // no parent post to restore them under.
}
