import { revalidateTag } from "next/cache";
import type { CollectionAfterDeleteHook, CollectionConfig } from "payload";
import { slugify } from "@/lib/slugify";

// Every public read goes through src/lib/cachedPosts.ts, which tags its
// unstable_cache entries "posts" and lets them serve up to 60s stale so a
// Postgres outage degrades gracefully (WOS-329). That means every write path
// has to invalidate the same tag, or a published/edited/deleted post can sit
// invisible on the public site for up to a minute — this hook is that half
// of the contract.
const invalidatePostsCache = () => {
  try {
    // Next 16 requires a cache-life profile as the second argument (bare
    // revalidateTag(tag) is deprecated). profile:"max" does NOT mean
    // "invalidate immediately" — per Next's own revalidateTag docs it's the
    // opposite: a one-year stale-while-revalidate window, so the very next
    // request (this hook's own test, or a real reader) is served the old
    // cached value while a fresh fetch runs in the background. Confirmed by
    // reproducing: publish a post, then immediately load its public page —
    // with "max" it 404s because the previously-cached "no post at this
    // slug" lookup is still being served stale.
    // Payload's hooks run inside a Route Handler (its REST API), not a
    // Server Action, so updateTag() isn't available here — the docs'
    // prescribed alternative for that case is { expire: 0 }, which forces
    // the next request to block on a fresh fetch instead of serving stale
    // data. That's what "a hard write, not a soft nudge" actually requires.
    revalidateTag("posts", { expire: 0 });
  } catch {
    // Payload's admin /create view auto-creates a blank draft server-side,
    // during the admin page's own React render — Next forbids calling
    // revalidateTag mid-render ("used during render which is unsupported")
    // and throws. That auto-created draft was never public, so there is
    // nothing to invalidate for it; swallow it rather than break the admin
    // page. A real publish/update always runs from a route handler or
    // server action, outside render, where this succeeds normally.
  }
};

// _posts_v_parent_id_posts_id_fk is ON DELETE SET NULL, so deleting a post
// can leave its version rows behind with parent_id = NULL (and latest =
// true, if the deleted post was itself the latest version). Every
// draft:true read (the admin list view, BeforeDashboard) selects
// _posts_v WHERE latest = true and returns { id: doc.parent, ...doc.version
// }, so an orphaned row surfaces as a doc with id: null — Payload's <Table>
// then falls back to the row index as its React key, which can collide with
// a real post id on the same page ("Encountered two children with the same
// key"). Sweep every parentless version row after each delete (not just
// this doc's) so the table can't reaccumulate garbage from any delete path
// (admin UI, REST, bulk). See migrations/20261001_220000_purge_orphan_post_versions
// for the one-time cleanup of rows that already existed.
const purgeOrphanedVersions: CollectionAfterDeleteHook = async ({ req }) => {
  try {
    await req.payload.db.deleteVersions({
      collection: "posts",
      req,
      where: { parent: { equals: null } },
    });
  } catch (err) {
    req.payload.logger.error({ err, msg: "Failed to sweep parentless post versions" });
  }
};

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: {
    singular: { en: "Post", ko: "포스트" },
    plural: { en: "Posts", ko: "포스트" },
  },
  defaultSort: "-updatedAt",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "updatedAt"],
    listSearchableFields: ["title", "slug"],
    hideAPIURL: true,
    description: {
      ko: "글을 쓰고 '초안 저장'으로 보관하거나 '변경 사항 게시'로 발행하세요.",
      en: "Write a post, keep it with Save Draft, or make it live with Publish.",
    },
  },
  // Drafts are never public. Anonymous/public reads only see published posts;
  // logged-in users (editors/admins) can also see drafts in the admin UI.
  access: {
    read: ({ req }) => {
      if (req.user) return true;
      return { _status: { equals: "published" } };
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [invalidatePostsCache],
    afterDelete: [invalidatePostsCache, purgeOrphanedVersions],
  },
  versions: {
    drafts: {
      // WOS-312 §6 promises editors a visible "Write -> Save draft ->
      // Preview -> Publish" flow. Autosave alone hides that first step, so
      // we surface an explicit Save Draft button on top of it.
      autosave: { interval: 2000, showSaveDraftButton: true },
    },
    maxPerDoc: 25,
  },
  fields: [
    {
      // Unnamed tabs keep title/content/titleEn/etc. all top-level fields
      // (a named tab would namespace them under `ko.title`, breaking
      // useAsTitle/defaultColumns/listSearchableFields below). Two full
      // language tabs on one screen so authors never need a locale switcher
      // to write the other language (WOS-320 follow-up).
      type: "tabs",
      tabs: [
        {
          label: { en: "Korean", ko: "한국어" },
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              label: { en: "Title (Korean)", ko: "제목" },
              admin: {
                description: {
                  ko: "글의 제목입니다.",
                  en: "The post's title.",
                },
              },
            },
            {
              name: "content",
              type: "richText",
              label: { en: "Content (Korean)", ko: "본문" },
              admin: {
                description: {
                  ko: "본문을 입력하세요. 서식은 위쪽 도구 모음을 사용하세요.",
                  en: "Write the post body. Use the toolbar above for formatting.",
                },
              },
            },
            {
              name: "excerpt",
              type: "textarea",
              label: { en: "Excerpt (Korean)", ko: "요약" },
              admin: {
                description: {
                  ko: "목록 화면에 보이는 한두 문장 요약 (선택).",
                  en: "One or two sentences shown on list pages (optional).",
                },
              },
            },
          ],
        },
        {
          label: { en: "English", ko: "English" },
          fields: [
            {
              name: "titleEn",
              type: "text",
              label: { en: "Title (English)", ko: "제목 (영문)" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 비워두면 한국어 제목이 대신 표시됩니다.",
                  en: "Optional. If left blank, the Korean title is shown instead.",
                },
              },
            },
            {
              name: "contentEn",
              type: "richText",
              label: { en: "Content (English)", ko: "본문 (영문)" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 비워두면 한국어 본문이 대신 표시됩니다.",
                  en: "Optional. If left blank, the Korean content is shown instead.",
                },
              },
            },
            {
              name: "excerptEn",
              type: "textarea",
              label: { en: "Excerpt (English)", ko: "요약 (영문)" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 비워두면 한국어 요약이 대신 표시됩니다.",
                  en: "Optional. If left blank, the Korean excerpt is shown instead.",
                },
              },
            },
          ],
        },
      ],
    },
    {
      // Shared across languages, not part of either tab — collapsed by
      // default so the edit screen stays title + body first (WOS-320).
      type: "collapsible",
      label: { en: "Additional info", ko: "추가 정보" },
      admin: { initCollapsed: true },
      fields: [
        {
          name: "banner",
          type: "upload",
          relationTo: "media",
          label: { en: "Banner image", ko: "배너 이미지" },
          admin: {
            description: {
              ko: "글 상단에 표시되는 큰 이미지 (선택).",
              en: "Large image shown at the top of the post (optional).",
            },
          },
        },
      ],
    },
    {
      // Shared across languages on purpose — a post's URL must not change
      // when the reader switches language, or inbound links break.
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: { en: "Slug (URL)", ko: "슬러그 (URL)" },
      admin: {
        position: "sidebar",
        description: {
          ko: "제목에서 자동 생성됩니다. 이유를 알 때만 수정하세요.",
          en: "Auto-generated from the title. Edit only if you know why.",
        },
      },
      hooks: {
        beforeValidate: [
          ({ value, data, originalDoc }) => {
            if (value) return value;
            const source = data?.title ?? originalDoc?.title;
            if (!source) return value;
            return slugify(typeof source === "string" ? source : String(source));
          },
        ],
      },
    },
    {
      name: "publishedAt",
      type: "date",
      label: { en: "Published at", ko: "발행일" },
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime" },
        description: {
          ko: "처음 게시할 때 자동으로 채워집니다.",
          en: "Filled in automatically the first time you publish.",
        },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value, operation }) => {
            // Stamp publishedAt the first time a post goes live, don't
            // overwrite it on later edits.
            if (value) return value;
            if (operation === "update" && siblingData._status === "published") {
              return new Date().toISOString();
            }
            return value;
          },
        ],
      },
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      label: { en: "Author", ko: "작성자" },
      admin: { position: "sidebar" },
    },
  ],
};
