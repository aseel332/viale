import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Proxy (formerly "middleware") — runs on every matched request.
 * Refreshes the Supabase auth session so Server Components always receive a
 * valid session, and gates the routes listed in PROTECTED_PATHS.
 */

const PROTECTED_PATHS = ["/checkout", "/admin"];

export async function proxy(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);

  // Revalidate the auth token against the Supabase auth server (getUser),
  // rather than trusting the cookie's JWT blindly (getSession). This also
  // refreshes the session cookie — must run before any other supabase calls.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL("/account", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js)$).*)",
  ],
};
