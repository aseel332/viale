"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/auth";
import { invalidateCatalogCache } from "@/lib/catalog";
import {
  discoverPerfumes,
  generatePerfumeDraft,
  persistPerfumeDraft,
  slugifyPerfume,
} from "@/lib/perfume-agent/agent";
import {
  generatedPerfumeImageUploader,
  isLocalPublicImage,
  publicImageObjectPath,
  uploadLocalPublicImage,
} from "@/lib/server/storage";
import type { PerfumeDiscoveryItem, PerfumeDraftProduct } from "@/lib/perfume-agent/types";
import type {
  CollectionInsert,
  Database,
  FragranceFamily,
  Gender,
  PerfumeCandidateInsert,
  PerfumeCandidateRow,
  PerfumeDiscoverySegment,
  PerfumeImportRow,
  ProductInsert,
  Season,
  SeasonCategory,
} from "@/types/database";

export type AdminActionState = {
  error?: string;
  message?: string;
  discoveries?: PerfumeDiscoveryItem[];
};

const FAMILIES: FragranceFamily[] = ["Fresh", "Floral", "Woody", "Oriental", "Gourmand", "Chypre"];
const GENDERS: Gender[] = ["Men", "Women", "Unisex"];
const SEASONS: Season[] = ["Spring", "Summer", "Autumn", "Winter"];
const COLLECTION_CATEGORIES: SeasonCategory[] = ["summer", "winter", "celebrity"];
const DISCOVERY_SEGMENTS: PerfumeDiscoverySegment[] = ["popular", "niche", "designer", "indie", "mixed"];

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function requiredField(formData: FormData, name: string, label: string) {
  const value = field(formData, name);
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parsePrice(raw: string, label: string) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a valid amount.`);
  return Math.round(value * 100) / 100;
}

function parseRequiredPrice(formData: FormData, name: string, label: string) {
  return parsePrice(requiredField(formData, name, label), label);
}

function parseOptionalDiscount(formData: FormData, price: number) {
  const raw = field(formData, "discount_price");
  if (!raw) return null;

  const discount = parsePrice(raw, "Discount price");
  if (discount <= 0) return null;
  if (discount >= price) throw new Error("Discount price must be lower than the base price.");
  return discount;
}

function parseRating(raw: string) {
  const value = Number(raw || "4.5");
  if (!Number.isFinite(value)) return 4.5;
  return Math.max(0, Math.min(5, Math.round(value * 10) / 10));
}

function parseBoolean(formData: FormData, name: string, defaultValue = false) {
  const values = formData.getAll(name);
  const value = values.length > 0 ? values[values.length - 1] : null;
  if (value == null) return defaultValue;
  return value === "on" || value === "true" || value === "1";
}

function splitList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getEnum<T extends string>(value: unknown, options: readonly T[], fallback: T) {
  return options.includes(value as T) ? (value as T) : fallback;
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function getBottleSizes(value: unknown) {
  const sizes = Array.isArray(value)
    ? value
        .map((item) => Number(item))
        .filter((item) => item === 5 || item === 10 || item === 30)
    : [];

  return sizes.length > 0 ? [...new Set(sizes)] : [5, 10, 30];
}

function importCandidate(row: PerfumeImportRow) {
  return row.candidate as Partial<PerfumeDraftProduct>;
}

async function knownPerfumeSlugs(supabase: SupabaseClient<Database>) {
  const [productsResult, importsResult, candidatesResult] = await Promise.all([
    supabase.from("products").select("id"),
    supabase.from("perfume_imports").select("product_slug"),
    supabase.from("perfume_candidates").select("product_slug"),
  ]);

  if (productsResult.error) throw new Error(productsResult.error.message);
  if (importsResult.error) throw new Error(importsResult.error.message);
  if (candidatesResult.error) throw new Error(candidatesResult.error.message);

  return new Set([
    ...(productsResult.data ?? []).map((row) => row.id),
    ...(importsResult.data ?? []).map((row) => row.product_slug),
    ...(candidatesResult.data ?? []).map((row) => row.product_slug),
  ].filter(Boolean));
}

async function existingPublishedOrDraftReason(supabase: SupabaseClient<Database>, productSlug: string) {
  const [productResult, importResult] = await Promise.all([
    supabase
      .from("products")
      .select("id")
      .eq("id", productSlug)
      .maybeSingle(),
    supabase
      .from("perfume_imports")
      .select("id, status")
      .eq("product_slug", productSlug)
      .neq("status", "rejected")
      .limit(1)
      .maybeSingle(),
  ]);

  if (productResult.error) throw new Error(productResult.error.message);
  if (importResult.error) throw new Error(importResult.error.message);

  if (productResult.data) return "Already exists as a listed product.";
  if (importResult.data) return `Already exists in import queue as ${importResult.data.status}.`;
  return null;
}

async function revalidateCatalog(productId?: string) {
  await invalidateCatalogCache();
  revalidatePath("/");
  revalidatePath("/men");
  revalidatePath("/women");
  revalidatePath("/search");
  revalidatePath("/admin");
  if (productId) revalidatePath(`/products/${productId}`);
}

export async function discoverPerfumesAdmin(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let jobId: string | null = null;

  try {
    const { supabase, user } = await requireAdmin();
    const rawLimit = Number(field(formData, "limit") || "8");
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(24, rawLimit)) : 8;
    const segment = getEnum(field(formData, "segment"), DISCOVERY_SEGMENTS, "mixed");
    const brand = field(formData, "brand");

    const { data: job, error: jobError } = await supabase
      .from("perfume_discovery_jobs")
      .insert({
        created_by: user.id,
        status: "running",
        segment,
        brand: brand || null,
        target_count: limit,
        found_count: 0,
        skipped_count: 0,
        error: null,
      })
      .select("*")
      .single();

    if (jobError) throw new Error(jobError.message);
    jobId = job.id;

    const knownSlugs = await knownPerfumeSlugs(supabase);
    const candidates: PerfumeCandidateInsert[] = [];
    let skippedCount = 0;
    const batchSize = 6;
    const maxAttempts = Math.min(6, Math.ceil(limit / batchSize) + 2);

    for (let attempt = 0; attempt < maxAttempts && candidates.length < limit; attempt += 1) {
      const discoveries = await discoverPerfumes({
        segment,
        brand: brand || undefined,
        limit: Math.min(batchSize, limit - candidates.length),
        exclude: Array.from(knownSlugs).slice(-24),
      });

      let newInAttempt = 0;
      for (const item of discoveries) {
        const productSlug = slugifyPerfume(item.brand, item.name);
        if (!productSlug || knownSlugs.has(productSlug)) {
          skippedCount += 1;
          continue;
        }

        knownSlugs.add(productSlug);
        newInAttempt += 1;
        candidates.push({
          job_id: job.id,
          created_by: user.id,
          status: "candidate",
          brand: item.brand,
          product_name: item.name,
          product_slug: productSlug,
          segment: item.segment,
          reason: item.reason,
          source_urls: item.sourceUrls.slice(0, 3),
          duplicate_reason: null,
          import_id: null,
          error: null,
        });

        if (candidates.length >= limit) break;
      }

      if (newInAttempt === 0) break;
    }

    let queuedCount = 0;
    if (candidates.length > 0) {
      const { data, error } = await supabase
        .from("perfume_candidates")
        .upsert(candidates, { onConflict: "product_slug", ignoreDuplicates: true })
        .select("id");

      if (error) throw new Error(error.message);
      queuedCount = data?.length ?? 0;
    }

    const { error: updateError } = await supabase
      .from("perfume_discovery_jobs")
      .update({
        status: "complete",
        found_count: queuedCount,
        skipped_count: skippedCount + Math.max(0, candidates.length - queuedCount),
        error: null,
      })
      .eq("id", job.id);

    if (updateError) throw new Error(updateError.message);
    revalidatePath("/admin");

    return {
      message: `Queued ${queuedCount} new candidates. Skipped ${skippedCount} already-known perfumes.`,
    };
  } catch (error) {
    if (jobId) {
      const context = await requireAdmin().catch(() => null);
      await context?.supabase
        .from("perfume_discovery_jobs")
        .update({
          status: "failed",
          error: error instanceof Error ? error.message : "Discovery failed.",
        })
        .eq("id", jobId);
      revalidatePath("/admin");
    }

    return { error: error instanceof Error ? error.message : "Could not discover perfumes." };
  }
}

export async function generatePerfumeImportAdmin(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const { supabase, user } = await requireAdmin();
    const brand = requiredField(formData, "brand", "Brand");
    const name = requiredField(formData, "name", "Perfume name");
    const generateImage = parseBoolean(formData, "generate_image", false);

    const draft = await generatePerfumeDraft({
      brand,
      name,
      generateImage,
      persist: false,
      saveImage: generatedPerfumeImageUploader(supabase),
    });
    await persistPerfumeDraft(supabase, user.id, `${brand} ${name}`.trim(), draft);
    revalidatePath("/admin");

    return { message: `${draft.brand} ${draft.name} is ready for pricing.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not generate perfume draft." };
  }
}

export async function rejectPerfumeCandidateAdmin(formData: FormData) {
  const { supabase } = await requireAdmin();
  const candidateId = requiredField(formData, "candidate_id", "Candidate id");

  const { error } = await supabase
    .from("perfume_candidates")
    .update({ status: "rejected", error: null })
    .eq("id", candidateId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function approvePerfumeCandidateAdmin(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const candidateId = requiredField(formData, "candidate_id", "Candidate id");
  const generateImage = parseBoolean(formData, "generate_image", true);

  const { data: candidate, error: candidateError } = await supabase
    .from("perfume_candidates")
    .select("*")
    .eq("id", candidateId)
    .single();

  if (candidateError || !candidate) {
    throw new Error(candidateError?.message ?? "Candidate not found.");
  }

  const row = candidate as PerfumeCandidateRow;
  if (row.status === "enriched") {
    throw new Error("This candidate is already enriched.");
  }

  const duplicateReason = await existingPublishedOrDraftReason(supabase, row.product_slug);
  if (duplicateReason) {
    await supabase
      .from("perfume_candidates")
      .update({
        status: "duplicate",
        duplicate_reason: duplicateReason,
        error: null,
      })
      .eq("id", row.id);
    revalidatePath("/admin");
    return;
  }

  const { error: approvedError } = await supabase
    .from("perfume_candidates")
    .update({ status: "approved", error: null })
    .eq("id", row.id);

  if (approvedError) throw new Error(approvedError.message);

  try {
    const draft = await generatePerfumeDraft({
      brand: row.brand,
      name: row.product_name,
      generateImage,
      persist: false,
      saveImage: generatedPerfumeImageUploader(supabase),
    });
    const importRow = await persistPerfumeDraft(
      supabase,
      user.id,
      `${row.brand} ${row.product_name}`.trim(),
      draft,
    );

    const { error: updateError } = await supabase
      .from("perfume_candidates")
      .update({
        status: "enriched",
        import_id: importRow.id,
        product_slug: importRow.product_slug,
        error: null,
      })
      .eq("id", row.id);

    if (updateError) throw new Error(updateError.message);
  } catch (error) {
    await supabase
      .from("perfume_candidates")
      .update({
        status: "failed",
        error: error instanceof Error ? error.message : "Candidate enrichment failed.",
      })
      .eq("id", row.id);
  } finally {
    revalidatePath("/admin");
  }
}

export async function publishImportAdmin(formData: FormData) {
  const { supabase } = await requireAdmin();
  const importId = requiredField(formData, "import_id", "Import id");
  const price = parseRequiredPrice(formData, "price", "Price");
  const discountPrice = parseOptionalDiscount(formData, price);

  const { data: importRow, error: importError } = await supabase
    .from("perfume_imports")
    .select("*")
    .eq("id", importId)
    .single();

  if (importError || !importRow) throw new Error(importError?.message ?? "Import draft not found.");

  const candidate = importCandidate(importRow);
  const id = field(formData, "product_id") || importRow.product_slug || slugifyPerfume(importRow.brand, importRow.product_name);
  const notes = getStringArray(candidate.notes).slice(0, 12);
  const seasons = getStringArray(candidate.seasons)
    .map((season) => getEnum(season, SEASONS, "Spring"))
    .filter((season, index, list) => list.indexOf(season) === index);

  const product: ProductInsert = {
    id,
    name: candidate.name || importRow.product_name,
    brand: candidate.brand || importRow.brand,
    price,
    discount_price: discountPrice,
    rating: parseRating(String(candidate.rating ?? "")),
    image_path: candidate.imageSrc || importRow.image_path || "/collection_img.png",
    tag: field(formData, "tag") || null,
    notes: notes.length > 0 ? notes : ["Signature", "Luxury", "Decant"],
    family: getEnum(candidate.family, FAMILIES, "Fresh"),
    gender: getEnum(candidate.gender, GENDERS, "Unisex"),
    seasons: seasons.length > 0 ? seasons : ["Spring", "Summer"],
    description: candidate.description || `${candidate.brand || importRow.brand} ${candidate.name || importRow.product_name}`,
    long_description: candidate.longDescription || candidate.description || "",
    bottle_sizes: getBottleSizes(candidate.bottleSizes),
    is_active: parseBoolean(formData, "is_active", false),
    source_import_id: importRow.id,
  };

  const { error: productError } = await supabase
    .from("products")
    .upsert(product, { onConflict: "id" });

  if (productError) throw new Error(productError.message);

  const { error: updateError } = await supabase
    .from("perfume_imports")
    .update({ status: "published", product_slug: product.id })
    .eq("id", importRow.id);

  if (updateError) throw new Error(updateError.message);

  await revalidateCatalog(product.id);
}

export async function updateProductAdmin(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productId = requiredField(formData, "product_id", "Product id");
  const price = parseRequiredPrice(formData, "price", "Price");
  const discountPrice = parseOptionalDiscount(formData, price);

  const { error } = await supabase
    .from("products")
    .update({
      price,
      discount_price: discountPrice,
      tag: field(formData, "tag") || null,
      is_active: parseBoolean(formData, "is_active", false),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  await revalidateCatalog(productId);
}

export async function syncCatalogImagesAdmin(
  _previousState: AdminActionState,
  _formData: FormData,
): Promise<AdminActionState> {
  void _previousState;
  void _formData;

  try {
    const { supabase } = await requireAdmin();
    const { data: products, error } = await supabase
      .from("products")
      .select("id, image_path");

    if (error) throw new Error(error.message);

    let uploadedCount = 0;
    let skippedCount = 0;
    const failures: string[] = [];

    for (const product of products ?? []) {
      if (!isLocalPublicImage(product.image_path)) {
        skippedCount += 1;
        continue;
      }

      try {
        const imagePath = await uploadLocalPublicImage(
          supabase,
          product.image_path,
          publicImageObjectPath("catalog/products", product.id, product.image_path),
        );

        const { error: updateError } = await supabase
          .from("products")
          .update({ image_path: imagePath })
          .eq("id", product.id);

        if (updateError) throw new Error(updateError.message);
        uploadedCount += 1;
      } catch (error) {
        failures.push(`${product.id}: ${error instanceof Error ? error.message : "upload failed"}`);
      }
    }

    await revalidateCatalog();

    return {
      message: `Uploaded ${uploadedCount} product images to Supabase Storage. Skipped ${skippedCount}.${failures.length ? ` Failed ${failures.length}.` : ""}`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not sync catalog images." };
  }
}

export async function createManualProductAdmin(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const { supabase } = await requireAdmin();
    const brand = requiredField(formData, "brand", "Brand");
    const name = requiredField(formData, "name", "Perfume name");
    const price = parseRequiredPrice(formData, "price", "Price");
    const discountPrice = parseOptionalDiscount(formData, price);
    const notes = splitList(requiredField(formData, "notes", "Notes")).slice(0, 12);
    const selectedSeasons = formData
      .getAll("seasons")
      .map((value) => getEnum(typeof value === "string" ? value : "", SEASONS, "Spring"))
      .filter((season, index, list) => list.indexOf(season) === index);

    const product: ProductInsert = {
      id: field(formData, "product_id") || slug(`${name}-${brand}`),
      name,
      brand,
      price,
      discount_price: discountPrice,
      rating: parseRating(field(formData, "rating")),
      image_path: field(formData, "image_path") || "/collection_img.png",
      tag: field(formData, "tag") || null,
      notes,
      family: getEnum(field(formData, "family"), FAMILIES, "Fresh"),
      gender: getEnum(field(formData, "gender"), GENDERS, "Unisex"),
      seasons: selectedSeasons.length > 0 ? selectedSeasons : ["Spring", "Summer"],
      description: requiredField(formData, "description", "Short description"),
      long_description: field(formData, "long_description") || field(formData, "description"),
      bottle_sizes: [5, 10, 30],
      is_active: parseBoolean(formData, "is_active", true),
      source_import_id: null,
    };

    const { error } = await supabase
      .from("products")
      .upsert(product, { onConflict: "id" });

    if (error) throw new Error(error.message);
    await revalidateCatalog(product.id);
    return { message: `${product.brand} ${product.name} was saved.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save product." };
  }
}

export async function createCollectionAdmin(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const { supabase } = await requireAdmin();
    const productIds = splitList(requiredField(formData, "product_ids", "Product ids")).slice(0, 4);
    if (productIds.length !== 4) throw new Error("Collections need exactly 4 product ids.");

    const name = requiredField(formData, "name", "Collection name");
    const collection: CollectionInsert = {
      id: field(formData, "collection_id") || slug(name),
      number: requiredField(formData, "number", "Collection number"),
      name,
      subtitle: requiredField(formData, "subtitle", "Subtitle"),
      description: requiredField(formData, "description", "Description"),
      bundle_price: parseRequiredPrice(formData, "bundle_price", "Bundle price"),
      season_category: getEnum(field(formData, "season_category"), COLLECTION_CATEGORIES, "summer"),
      is_active: parseBoolean(formData, "is_active", true),
    };

    const { error: collectionError } = await supabase
      .from("collections")
      .upsert(collection, { onConflict: "id" });

    if (collectionError) throw new Error(collectionError.message);

    const { error: deleteError } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collection.id);

    if (deleteError) throw new Error(deleteError.message);

    const { error: itemsError } = await supabase
      .from("collection_items")
      .insert(productIds.map((productId, index) => ({
        collection_id: collection.id,
        product_id: productId,
        sort_order: index + 1,
      })));

    if (itemsError) throw new Error(itemsError.message);

    await invalidateCatalogCache();
    revalidatePath("/collections");
    revalidatePath(`/collections/${collection.id}`);
    revalidatePath("/admin");
    return { message: `${collection.name} was saved.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save collection." };
  }
}
