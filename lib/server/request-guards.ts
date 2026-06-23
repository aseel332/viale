import "server-only";

import type { NextRequest } from "next/server";

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === request.nextUrl.origin;
}

export function forbiddenIfCrossOrigin(request: NextRequest) {
  return isSameOriginRequest(request) ? null : { error: "Cross-origin requests are not allowed." };
}
