import type { DiscoverPerfumeInput } from "./types";

export function discoveryPrompt({ segment = "mixed", brand, limit = 12, exclude = [] }: DiscoverPerfumeInput) {
  const excluded = exclude.slice(0, 24);
  return `
Find ${limit} fragrance products suitable for Viale, a luxury perfume decant ecommerce store in India.

Scope:
- Segment preference: ${segment}.
- Brand filter: ${brand?.trim() || "none"}.
- Avoid these already-known products: ${excluded.length ? excluded.join("; ") : "none"}.
- Include a mix of globally popular designer fragrances and respected niche/indie fragrances unless a specific segment is requested.
- Return actual perfume/fragrance product names, not just brand names.
- Prefer products with enough public source coverage to infer notes, gender positioning, seasonality, and popularity.

Rules:
- Use current web sources.
- Include 1-3 source URLs for every item.
- Do not invent products.
- Keep reasons under 140 characters.
- Return only the JSON requested by the schema.
`;
}

export function researchPrompt(brand: string, name: string, compact = false) {
  return `
Research this fragrance for Viale's product import queue:

Brand: ${brand}
Product: ${name}

Create a structured draft that can be reviewed by an admin before publishing.

Important rules:
- Use web search and cite source URLs.
- Prefer official brand/product pages for product identity where available.
- Use fragrance databases, reputable retailers, and editorial/review sites only to triangulate notes, family, wearer positioning, popularity, and review sentiment.
- Do not copy user reviews or editorial descriptions verbatim. Summarize review sentiment in your own words.
- If facts conflict, choose the most reliable source and mention uncertainty in missingFields.
- Price must not be generated. Pricing is handled manually by the admin dashboard.
- Try to find a direct, hot-linkable photo URL (ending in a real image extension, from the official brand site or a major retailer such as Sephora, Nordstrom, FragranceX, or Macy's) showing the actual retail bottle for this product. Put it in bottleImageUrl. Only return a URL you are confident points directly to an image file; if you cannot find one, set bottleImageUrl to null. Never invent a URL.
- Convert the fragrance into Viale's allowed website values:
  - family: Fresh, Floral, Woody, Oriental, Gourmand, or Chypre
  - gender: Men, Women, or Unisex
  - seasons: Spring, Summer, Autumn, Winter
- Description should be one polished ecommerce sentence.
- Long description should be ${compact ? "one short paragraph under 450 characters" : "1-2 short editorial paragraphs under 900 characters"} suitable for a luxury decant store.
- ratingEstimate should be a conservative 0-5 aggregate signal inferred from public review/rating signals; do not claim it is exact.
- confidence should reflect source quality and cross-source agreement from 0 to 1.
- Keep notes and source lists short. Prefer ${compact ? "2-3" : "3-5"} strong sources over many weak ones.
- Keep reviewSummary under ${compact ? "220" : "350"} characters.
- Keep popularitySignals short, under 110 characters each.
- Keep missingFields short, under 90 characters each.
- Return only the JSON requested by the schema.
`;
}

// Fixed studio rules every generated product image must follow, regardless of which
// perfume is being rendered. Keep this constant instead of re-deriving layout per call.
// Canvas is a tall 3:4 portrait to match the storefront's product card aspect ratio.
export const STUDIO_LAYOUT_PROMPT = `
Create a tall 3:4 portrait ecommerce product image on a clean, pure white background.
Layout:
- Top-left corner: the perfume brand name in elegant catalog typography, with the perfume name set directly beneath it in a smaller line. No logo, icon, or other mark — just this text.
- Right side of the frame, vertically centered: the two bottles, large and close together as a single confident pair — sized so each bottle fills roughly two-thirds of the available height on that side. Keep modest padding so neither bottle touches the edge of the frame, but do not shrink them down or leave large empty gaps around them.
  - Of the pair, the recognizable retail bottle goes on the left and the Viale decant atomizer from "Reference image 1" goes on the right, standing close enough together to read as one product grouping.
- Leave the lower-left/centre area mostly empty white space; do not add any other text, props, or people.
Decant: replicate the exact bottle shape, black sprayer, clear glass, and label style from "Reference image 1". Fill the decant's liquid with a color matching the fragrance.
Style: premium photorealistic studio product photography, soft shadows, crisp glass reflections.
Constraints: no watermarks, no extra props, no people.
`;

export function imagePrompt(
  brand: string,
  name: string,
  visualHints: string[],
  hasBottleReference: boolean,
) {
  return `
${STUDIO_LAYOUT_PROMPT}

This image is for: ${brand} ${name}.
Top-left text: "${brand}" rendered in typography that evokes ${brand}'s own real logo/label style, with "${name}" in a smaller line beneath it.
Retail bottle: ${hasBottleReference
    ? `"Reference image 2" is an actual, current product photo of this exact bottle. Treat it as ground truth and reproduce it as faithfully as possible — same bottle silhouette and proportions, same cap shape and color, same glass tone, same label text, layout, and placement. Only change the camera angle, lighting, and background to match this studio scene; do not redesign, restyle, simplify, or guess at any part of the bottle that is visible in the reference.`
    : `no reference photo was found, so use publicly known bottle shape, color, cap, and material cues at a high level.`}
Visual hints: ${visualHints.length ? visualHints.join(", ") : "none beyond the above"}.
`;
}
