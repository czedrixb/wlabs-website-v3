import type { JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import type { SerializedUploadNode } from "@payloadcms/richtext-lexical";
import type { Media } from "@/payload-types";
import { mediaPath } from "@/lib/mediaPath";

// Payload's own UploadJSXConverter (the default used for Lexical "upload"
// nodes — inline images dropped into post body content) renders
// uploadDoc.url verbatim. mediaPath() already strips the origin for the
// hero banner (blog/[slug]/page.tsx), but body images went through this
// converter unpatched, so they still carried whatever absolute origin
// serverURL happened to stamp on them (WOS-339: a stale Vercel
// NEXT_PUBLIC_SERVER_URL pointed every uploadDoc.url at a dead deployment).
// Same <picture>/<img>/non-image-link shape as the default, just with
// mediaPath() applied to every url before it reaches the DOM.
export const postRichTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: ({ node }) => {
    const uploadNode = node as SerializedUploadNode;
    if (typeof uploadNode.value !== "object") return null;

    const uploadDoc = uploadNode.value as Media;
    const alt = uploadNode.fields?.alt || uploadDoc?.alt || "";
    const url = mediaPath(uploadDoc.url ?? "");

    if (!uploadDoc.mimeType?.startsWith("image")) {
      return (
        <a href={url} rel="noopener noreferrer">
          {uploadDoc.filename}
        </a>
      );
    }

    if (!uploadDoc.sizes || !Object.keys(uploadDoc.sizes).length) {
      return (
        <img
          alt={alt}
          height={uploadDoc.height ?? undefined}
          src={url}
          width={uploadDoc.width ?? undefined}
        />
      );
    }

    const pictureJSX: React.ReactNode[] = [];
    for (const size in uploadDoc.sizes) {
      const imageSize = uploadDoc.sizes[size as keyof typeof uploadDoc.sizes];
      if (
        !imageSize ||
        !imageSize.width ||
        !imageSize.height ||
        !imageSize.mimeType ||
        !imageSize.filesize ||
        !imageSize.filename ||
        !imageSize.url
      ) {
        continue;
      }
      pictureJSX.push(
        <source
          key={size}
          media={`(max-width: ${imageSize.width}px)`}
          srcSet={mediaPath(imageSize.url)}
          type={imageSize.mimeType}
        />,
      );
    }
    pictureJSX.push(
      <img
        key="image"
        alt={alt}
        height={uploadDoc.height ?? undefined}
        src={url}
        width={uploadDoc.width ?? undefined}
      />,
    );
    return <picture>{pictureJSX}</picture>;
  },
});
