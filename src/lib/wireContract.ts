import { convertLexicalToHTML, UploadHTMLConverter } from "@payloadcms/richtext-lexical/html";
import type { HTMLConvertersFunction } from "@payloadcms/richtext-lexical/html";
import type { SerializedUploadNode } from "@payloadcms/richtext-lexical";

// UploadHTMLConverter.upload is typed as `HTMLConverter<...>`, which — like
// any converter entry — is allowed to be a plain string instead of a
// function. Payload's own export is always the function form; this just
// gives TypeScript that narrowing once instead of re-asserting it below.
if (typeof UploadHTMLConverter.upload !== "function") {
  throw new Error("@payloadcms/richtext-lexical's UploadHTMLConverter.upload is no longer a function");
}
const defaultUploadConverter = UploadHTMLConverter.upload;
import type { Locale } from "@/lib/locale";
import { pick } from "@/lib/locale";
import { mediaPath } from "@/lib/mediaPath";
import type { Media, Post } from "@/payload-types";
import { siteUrl } from "@/lib/siteUrl";

// This feeds an external Nuxt consumer (see the module doc below), so URLs
// here must stay ABSOLUTE unlike the frontend's mediaPath()-only usage —
// just absolute against the real, current origin instead of whatever
// serverURL happened to stamp on them (WOS-339: a stale Vercel
// NEXT_PUBLIC_SERVER_URL pointed every media URL at a dead deployment).
function absoluteMediaUrl(url: string): string {
  return new URL(mediaPath(url), siteUrl).toString();
}

// Inline images in post body content (Lexical "upload" nodes) go through
// Payload's default UploadHTMLConverter, which renders uploadDoc.url
// verbatim. Rather than reimplement its HTML/escaping, rewrite the upload
// doc's urls to absolute ones first and hand off to the default — same
// <picture>/<img>/non-image-link output, just with a correct origin.
const wireHTMLConverters: HTMLConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: (args) => {
    const node = args.node as SerializedUploadNode;
    if (typeof node.value !== "object" || !node.value) return defaultUploadConverter(args);
    const uploadDoc = node.value as Media;
    const patchedDoc: Media = {
      ...uploadDoc,
      url: uploadDoc.url ? absoluteMediaUrl(uploadDoc.url) : uploadDoc.url,
      sizes: uploadDoc.sizes
        ? Object.fromEntries(
            Object.entries(uploadDoc.sizes).map(([size, imageSize]) => [
              size,
              imageSize?.url ? { ...imageSize, url: absoluteMediaUrl(imageSize.url) } : imageSize,
            ]),
          )
        : uploadDoc.sizes,
    };
    // SerializedUploadNode's `value`/`relationTo` are a union keyed by every
    // upload-enabled collection slug (just "media" here) — TS can't follow
    // that this patched doc still matches whichever member `node` was, so
    // this cast re-asserts what's already true at runtime.
    const patchedNode = { ...node, value: patchedDoc } as unknown as SerializedUploadNode;
    return defaultUploadConverter({ ...args, node: patchedNode });
  },
});

/**
 * Mirrors the old Laravel `PostResource` wire shape so the Nuxt site's
 * `server/api/getBlogs.get.js` / `getPost/[id].get.js` proxies can point at
 * this app by only changing `NUXT_BLOG_API_BASE` (WOS-314) — no template
 * changes. Field names and casing are intentionally snake_case to match.
 */
export type WirePost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  banner_url: string | null;
  published_at: string | null;
  author: { name: string; twitter: string | null } | null;
};

export type WirePostSummary = Omit<WirePost, "content">;

function bannerUrl(banner: Post["banner"]): string | null {
  if (!banner || typeof banner === "number") return null;
  const url = (banner as Media).url;
  return url ? absoluteMediaUrl(url) : null;
}

function authorOf(author: Post["author"]): WirePost["author"] {
  if (!author || typeof author === "number") return null;
  // The users collection no longer has a twitter field; the key stays in the
  // wire shape (always null) so old Nuxt consumers keep parsing unchanged.
  return { name: author.name, twitter: null };
}

export function toWirePostSummary(post: Post, locale: Locale): WirePostSummary {
  return {
    id: post.id,
    title: pick(locale, post.title, post.titleEn),
    slug: post.slug,
    excerpt: pick(locale, post.excerpt ?? null, post.excerptEn),
    banner_url: bannerUrl(post.banner),
    published_at: post.publishedAt ?? null,
    author: authorOf(post.author),
  };
}

export function toWirePost(post: Post, locale: Locale): WirePost {
  const content = pick(locale, post.content, post.contentEn);
  return {
    ...toWirePostSummary(post, locale),
    content: content ? convertLexicalToHTML({ data: content, converters: wireHTMLConverters }) : null,
  };
}
