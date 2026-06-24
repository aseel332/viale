import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const PRODUCT_IMAGES_BUCKET = "product-images";

function contentTypeForPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".avif") return "image/avif";
  return "image/png";
}

export function isLocalPublicImage(src: string | null | undefined) {
  return Boolean(src?.startsWith("/") && !src.startsWith("//"));
}

export function publicImageObjectPath(prefix: string, id: string, src: string) {
  const extension = path.extname(src).toLowerCase() || ".png";
  return `${prefix}/${id}${extension}`;
}

export async function uploadProductImageBuffer(
  supabase: SupabaseClient<Database>,
  objectPath: string,
  buffer: Buffer,
  contentType: string,
) {
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, buffer, {
      cacheControl: "31536000",
      contentType,
      upsert: true,
    });

  if (error) throw new Error(error.message);

  return supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(objectPath).data.publicUrl;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // matches the product-images bucket limit
const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function extensionForUpload(file: File) {
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/avif") return ".avif";
  return ".png";
}

export function uploadFileObjectPath(prefix: string, id: string, file: File) {
  return `${prefix}/${id}${extensionForUpload(file)}`;
}

/** Uploads a browser-submitted image File to the product-images bucket. */
export async function uploadImageFile(
  supabase: SupabaseClient<Database>,
  file: File,
  objectPath: string,
) {
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    throw new Error("Image must be a JPEG, PNG, WebP or AVIF file.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadProductImageBuffer(supabase, objectPath, buffer, file.type);
}

/**
 * Best-effort removal of previously-uploaded public images. Accepts the public
 * URLs we stored on a record and deletes the matching objects. Local public
 * paths (e.g. "/collection_img.png") and non-bucket URLs are ignored.
 */
export async function removeProductImages(
  supabase: SupabaseClient<Database>,
  urls: (string | null | undefined)[],
) {
  const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
  const objectPaths = urls
    .filter((url): url is string => Boolean(url) && url!.includes(marker))
    .map((url) => url.slice(url.indexOf(marker) + marker.length))
    .filter(Boolean);

  if (objectPaths.length === 0) return;

  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(objectPaths);
}

export function generatedPerfumeImageUploader(supabase: SupabaseClient<Database>) {
  return async ({ slug, b64, contentType }: { slug: string; b64: string; contentType: "image/png" }) => {
    return uploadProductImageBuffer(
      supabase,
      `generated/perfumes/${slug}.png`,
      Buffer.from(b64, "base64"),
      contentType,
    );
  };
}

export async function uploadLocalPublicImage(
  supabase: SupabaseClient<Database>,
  src: string,
  objectPath: string,
) {
  if (!isLocalPublicImage(src)) return src;

  const localPath = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
  const buffer = await readFile(localPath);
  return uploadProductImageBuffer(
    supabase,
    objectPath,
    buffer,
    contentTypeForPath(localPath),
  );
}
