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

export function imagePrompt(brand: string, name: string, visualHints: string[]) {
  return `
Create a square ecommerce product image on a clean white background.
Top text: "${brand} ${name}" in elegant small black catalog typography.
Main subject: the recognizable retail perfume bottle for ${brand} ${name} on the left and the Viale decant atomizer from the reference image on the right.
Decant: keep the Viale bottle shape, black sprayer, clear glass, and label style from the reference image. Fill the decant with liquid color matching the fragrance or retail bottle color.
Composition: both bottles side by side, full objects visible, centered, generous padding, no cropping.
Style: premium photorealistic studio product photography, soft shadows, crisp glass reflections.
Visual hints: ${visualHints.length ? visualHints.join(", ") : "use publicly known bottle shape, color, cap, and material cues at a high level"}.
Constraints: no watermarks, no extra props, no people, do not copy trademarked label artwork exactly; make the retail bottle recognizable by silhouette, color, cap, and material cues.
`;
}
