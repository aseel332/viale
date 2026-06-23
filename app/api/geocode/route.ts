import { NextResponse, type NextRequest } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";
const GEOCODE_TTL_SECONDS = 60 * 60 * 24 * 7;

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
};

function compact(parts: Array<string | undefined>) {
  return parts.map((p) => p?.trim()).filter(Boolean).join(", ");
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `viale:geocode:in:${q.toLowerCase()}`;
  const cached = await cacheGet<{ results: unknown[] }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("accept-language", "en-IN");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Viale/1.0 (address-autocomplete)",
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 502 });
  }

  const data = (await res.json()) as NominatimResult[];
  const results = data.map((item) => {
    const address = item.address ?? {};
    const line1 = compact([address.house_number, address.road]) || address.neighbourhood || address.suburb || "";
    const city = address.city || address.town || address.village || "";

    return {
      label: item.display_name ?? compact([line1, city, address.state, address.postcode]),
      line1,
      line2: compact([address.neighbourhood, address.suburb]),
      city,
      state: address.state ?? "",
      postal_code: address.postcode ?? "",
      country: (address.country_code ?? "in").toUpperCase(),
      lat: item.lat ?? null,
      lon: item.lon ?? null,
    };
  });

  const payload = { results };
  await cacheSet(cacheKey, payload, GEOCODE_TTL_SECONDS);
  return NextResponse.json(payload);
}
