import OpenAI, { toFile } from "openai";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PerfumeImportRow } from "@/types/database";
import { BOTTLE_SIZES } from "@/lib/product-utils";
import { discoveryPrompt, imagePrompt, researchPrompt } from "./prompts";
import { perfumeDiscoverySchema, perfumeResearchSchema } from "./schemas";
import type {
  DiscoverPerfumeInput,
  GeneratePerfumeInput,
  PerfumeDiscoveryItem,
  PerfumeDraftProduct,
  PerfumeResearch,
} from "./types";

const DEFAULT_RESEARCH_MODEL = "gpt-5-mini";
const DEFAULT_IMAGE_MODEL = "gpt-image-1.5";
const DEFAULT_IMAGE_SIZE = "1024x1536"; // 2:3 portrait — closest native size to the storefront's 3:4 product card
const DEFAULT_IMAGE_QUALITY = "high"; // bottle-label fidelity matters more than generation cost here
const DEFAULT_SEARCH_CONTEXT_SIZE = "low";
const DEFAULT_DISCOVERY_MAX_OUTPUT_TOKENS = 2200;
const DEFAULT_RESEARCH_MAX_OUTPUT_TOKENS = 4200;
const DEFAULT_DISCOVERY_BATCH_LIMIT = 6;

type SearchContextSize = "low" | "medium" | "high";
type ResponseLike = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  status?: string;
  incomplete_details?: { reason?: string } | null;
  error?: { message?: string; code?: string | null } | null;
};

function integerEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name] ?? "");
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function searchContextSize(): SearchContextSize {
  const value = process.env.OPENAI_SEARCH_CONTEXT_SIZE;
  return value === "medium" || value === "high" || value === "low"
    ? value
    : DEFAULT_SEARCH_CONTEXT_SIZE;
}

function discoveryBatchLimit() {
  return integerEnv(
    "OPENAI_DISCOVERY_BATCH_LIMIT",
    DEFAULT_DISCOVERY_BATCH_LIMIT,
    2,
    8,
  );
}

function isRetryableStructuredOutputError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes("OpenAI response was incomplete")
    || error.message.includes("OpenAI response did not contain parseable JSON")
    || error.message.includes("Unexpected end of JSON input");
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to .env.local before running the perfume agent.");
  }
  return new OpenAI({ apiKey });
}

export function slugifyPerfume(brand: string, name: string) {
  return `${name}-${brand}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function responseText(response: ResponseLike) {
  const outputText = response.output_text?.trim();
  if (outputText) return outputText;

  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? content.refusal ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function responseDebugSummary(response: ResponseLike, text: string) {
  const status = response.status ? `status=${response.status}` : null;
  const incomplete = response.incomplete_details?.reason
    ? `incomplete=${response.incomplete_details.reason}`
    : null;
  const error = response.error?.message ? `error=${response.error.message}` : null;
  const preview = text ? `preview=${text.slice(0, 220)}` : null;
  return [status, incomplete, error, preview].filter(Boolean).join("; ");
}

function parseJson<T>(responseOrValue: ResponseLike | string): T {
  const text = typeof responseOrValue === "string"
    ? responseOrValue.trim()
    : responseText(responseOrValue);

  if (typeof responseOrValue !== "string") {
    if (responseOrValue.status === "incomplete") {
      throw new Error(`OpenAI response was incomplete (${responseOrValue.incomplete_details?.reason ?? "unknown"}). The request needs a smaller output shape or a higher max output token cap.`);
    }

    if (responseOrValue.status === "failed" || responseOrValue.error) {
      throw new Error(`OpenAI response failed. ${responseDebugSummary(responseOrValue, text)}`);
    }
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return JSON.parse(fenced[1]) as T;

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      const details = typeof responseOrValue === "string"
        ? text.slice(0, 220)
        : responseDebugSummary(responseOrValue, text);
      throw new Error(`OpenAI response did not contain parseable JSON. ${details}`);
    }
    return JSON.parse(match[0]) as T;
  }
}

function clampRating(value: number) {
  if (!Number.isFinite(value)) return 4.5;
  return Math.max(0, Math.min(5, Math.round(value * 10) / 10));
}

function toDraft(research: PerfumeResearch, imageSrc: string, imagePromptText: string | null): PerfumeDraftProduct {
  const id = slugifyPerfume(research.brand, research.name);
  return {
    id,
    name: research.name,
    brand: research.brand,
    price: null,
    compareAtPrice: null,
    discountPrice: null,
    isAvailable: false,
    status: "draft",
    rating: clampRating(research.ratingEstimate),
    imageSrc,
    notes: research.notes.slice(0, 10),
    family: research.family,
    gender: research.gender,
    seasons: research.seasons,
    description: research.description,
    longDescription: research.longDescription,
    bottleSizes: [...BOTTLE_SIZES],
    import: {
      generatedAt: new Date().toISOString(),
      concentration: research.concentration,
      sourceUrls: research.sourceUrls,
      sources: research.sources,
      reviewSummary: research.reviewSummary,
      reviewCountEstimate: research.reviewCountEstimate,
      popularitySignals: research.popularitySignals,
      confidence: research.confidence,
      missingFields: research.missingFields,
      bottleImageUrl: research.bottleImageUrl,
      imagePrompt: imagePromptText,
    },
  };
}

export async function discoverPerfumes(input: DiscoverPerfumeInput = {}): Promise<PerfumeDiscoveryItem[]> {
  const client = getOpenAI();
  const limit = Math.max(1, Math.min(discoveryBatchLimit(), input.limit ?? DEFAULT_DISCOVERY_BATCH_LIMIT));
  const createResponse = (requestedLimit: number, maxOutputTokens: number) => client.responses.create({
    model: process.env.OPENAI_RESEARCH_MODEL ?? DEFAULT_RESEARCH_MODEL,
    reasoning: { effort: "low" },
    tools: [{ type: "web_search", search_context_size: searchContextSize() }],
    input: discoveryPrompt({ ...input, limit: requestedLimit }),
    max_output_tokens: maxOutputTokens,
    text: {
      format: {
        type: "json_schema",
        name: "perfume_discovery",
        schema: perfumeDiscoverySchema,
        strict: true,
      },
    },
    store: false,
  });

  const maxOutputTokens = integerEnv(
    "OPENAI_DISCOVERY_MAX_OUTPUT_TOKENS",
    DEFAULT_DISCOVERY_MAX_OUTPUT_TOKENS,
    900,
    4500,
  );

  let parsed: { items: PerfumeDiscoveryItem[] };
  try {
    parsed = parseJson(await createResponse(limit, maxOutputTokens));
  } catch (error) {
    if (!isRetryableStructuredOutputError(error)) throw error;
    const retryLimit = Math.max(2, Math.ceil(limit / 2));
    const retryTokens = Math.min(4500, maxOutputTokens + 1200);
    try {
      parsed = parseJson(await createResponse(retryLimit, retryTokens));
    } catch (retryError) {
      if (!isRetryableStructuredOutputError(retryError) || retryLimit <= 2) throw retryError;
      parsed = parseJson(await createResponse(2, Math.min(4500, retryTokens + 1200)));
    }
  }

  return parsed.items.slice(0, limit);
}

export async function researchPerfume(brand: string, name: string): Promise<PerfumeResearch> {
  const client = getOpenAI();
  const createResponse = (compact: boolean, maxOutputTokens: number) => client.responses.create({
    model: process.env.OPENAI_RESEARCH_MODEL ?? DEFAULT_RESEARCH_MODEL,
    reasoning: { effort: "low" },
    tools: [{ type: "web_search", search_context_size: searchContextSize() }],
    input: researchPrompt(brand, name, compact),
    max_output_tokens: maxOutputTokens,
    text: {
      format: {
        type: "json_schema",
        name: "perfume_research",
        schema: perfumeResearchSchema,
        strict: true,
      },
      verbosity: "low",
    },
    store: false,
  });

  const maxOutputTokens = integerEnv(
    "OPENAI_RESEARCH_MAX_OUTPUT_TOKENS",
    DEFAULT_RESEARCH_MAX_OUTPUT_TOKENS,
    2400,
    6200,
  );

  try {
    return parseJson<PerfumeResearch>(await createResponse(false, maxOutputTokens));
  } catch (error) {
    if (!isRetryableStructuredOutputError(error)) throw error;
    const retryMaxOutputTokens = Math.min(6200, Math.max(5200, maxOutputTokens + 1400));
    return parseJson<PerfumeResearch>(await createResponse(true, retryMaxOutputTokens));
  }
}

async function saveGeneratedImage(slug: string, b64: string) {
  const dir = path.join(process.cwd(), "public", "generated", "perfumes");
  await mkdir(dir, { recursive: true });
  const filename = `${slug}.png`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, Buffer.from(b64, "base64"));
  return `/generated/perfumes/${filename}`;
}

async function decantReferenceFile() {
  const filePath = path.join(process.cwd(), "public", "viale_decant.png");
  const buffer = await readFile(filePath);
  return toFile(buffer, "viale_decant.png", { type: "image/png" });
}

const MAX_BOTTLE_REFERENCE_BYTES = 8 * 1024 * 1024;

async function fetchBottleReferenceFile(url: string | null) {
  if (!url) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BOTTLE_REFERENCE_BYTES) return null;

    const extension = contentType.split("/")[1]?.split(";")[0] || "jpg";
    return toFile(buffer, `retail-bottle.${extension}`, { type: contentType });
  } catch (error) {
    console.warn(`Could not fetch bottle reference image from ${url}:`, error);
    return null;
  }
}

export async function generatePerfumeImage(
  research: PerfumeResearch,
  saveImage?: GeneratePerfumeInput["saveImage"],
) {
  const client = getOpenAI();
  const slug = slugifyPerfume(research.brand, research.name);
  const useReferences = process.env.OPENAI_IMAGE_USE_DECANT_REFERENCE !== "false";
  const bottleReference = useReferences ? await fetchBottleReferenceFile(research.bottleImageUrl) : null;

  const prompt = imagePrompt(research.brand, research.name, [
    research.concentration ?? "",
    research.family,
    ...research.notes.slice(0, 5),
  ].filter(Boolean), Boolean(bottleReference));

  const imageParams = {
    model: process.env.OPENAI_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL,
    prompt,
    size: (process.env.OPENAI_IMAGE_SIZE ?? DEFAULT_IMAGE_SIZE) as "1024x1024" | "1024x1536" | "1536x1024",
    quality: (process.env.OPENAI_IMAGE_QUALITY ?? DEFAULT_IMAGE_QUALITY) as "low" | "medium" | "high" | "auto",
    output_format: "png" as const,
    background: "opaque" as const,
    n: 1,
  };

  const response = !useReferences
    ? await client.images.generate(imageParams)
    : await client.images.edit({
        ...imageParams,
        image: [
          await decantReferenceFile(),
          ...(bottleReference ? [bottleReference] : []),
        ],
        input_fidelity: "high",
      });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation completed without image data.");

  const imageSrc = saveImage
    ? await saveImage({ slug, b64, contentType: "image/png" })
    : await saveGeneratedImage(slug, b64);
  return { imageSrc, prompt };
}

export async function generatePerfumeDraft(input: GeneratePerfumeInput) {
  if (!input.brand?.trim() || !input.name?.trim()) {
    throw new Error("Brand and perfume name are required.");
  }

  const research = await researchPerfume(input.brand.trim(), input.name.trim());
  let imageSrc = "/collection_img.png";
  let imagePromptText: string | null = null;

  if (input.generateImage !== false) {
    const image = await generatePerfumeImage(research, input.saveImage);
    imageSrc = image.imageSrc;
    imagePromptText = image.prompt;
  }

  return toDraft(research, imageSrc, imagePromptText);
}

export async function persistPerfumeDraft(
  supabase: SupabaseClient<Database>,
  createdBy: string,
  query: string,
  draft: PerfumeDraftProduct,
): Promise<PerfumeImportRow> {
  const { data, error } = await supabase
    .from("perfume_imports")
    .insert({
      created_by: createdBy,
      status: "ready",
      query,
      brand: draft.brand,
      product_name: draft.name,
      product_slug: draft.id,
      candidate: draft as unknown as Record<string, unknown>,
      sources: draft.import.sources as unknown as Array<Record<string, unknown>>,
      image_path: draft.imageSrc,
      image_prompt: draft.import.imagePrompt,
      error: null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
