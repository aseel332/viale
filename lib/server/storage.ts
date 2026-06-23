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
