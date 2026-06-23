import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAgentTokenAuthorized } from "@/lib/admin/auth";
import {
  discoverPerfumes,
  generatePerfumeDraft,
  persistPerfumeDraft,
} from "@/lib/perfume-agent/agent";
import { generatedPerfumeImageUploader } from "@/lib/server/storage";
import type { DiscoverPerfumeInput, GeneratePerfumeInput } from "@/lib/perfume-agent/types";

export const dynamic = "force-dynamic";

type RequestBody =
  | ({ action: "discover" } & DiscoverPerfumeInput)
  | ({ action: "generate" } & GeneratePerfumeInput);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const hasToken = isAgentTokenAuthorized(request);
  let adminUserId: string | null = null;

  if (user) {
    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    adminUserId = admin?.user_id ?? null;
  }

  if (!user && !hasToken) {
    return NextResponse.json(
      { error: "Sign in as an admin or provide a valid PERFUME_AGENT_TOKEN bearer token." },
      { status: 401 },
    );
  }

  if (user && !adminUserId && !hasToken) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    if (body.action === "discover") {
      const items = await discoverPerfumes({
        segment: body.segment,
        brand: body.brand,
        limit: body.limit,
      });
      return NextResponse.json({ items });
    }

    if (body.action === "generate") {
      const draft = await generatePerfumeDraft({
        brand: body.brand,
        name: body.name,
        generateImage: body.generateImage,
        persist: body.persist,
        saveImage: adminUserId ? generatedPerfumeImageUploader(supabase) : undefined,
      });

      let importRow = null;
      if (body.persist !== false && adminUserId) {
        importRow = await persistPerfumeDraft(
          supabase,
          adminUserId,
          `${body.brand} ${body.name}`.trim(),
          draft,
        );
      }

      return NextResponse.json({
        draft,
        import: importRow,
        persisted: Boolean(importRow),
      });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Perfume agent failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
