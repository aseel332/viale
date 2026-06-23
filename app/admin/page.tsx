import AdminDashboard from "./AdminDashboard";
import { requireAdminPage } from "@/lib/admin/auth";
import type {
  CollectionRow,
  PerfumeCandidateRow,
  PerfumeDiscoveryJobRow,
  PerfumeImportRow,
  ProductRow,
} from "@/types/database";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Viale" };

export default async function AdminPage() {
  const { supabase, admin } = await requireAdminPage();

  const [importsResult, productsResult, collectionsResult, candidatesResult, jobsResult] = await Promise.all([
    supabase
      .from("perfume_imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("collections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("perfume_candidates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("perfume_discovery_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (importsResult.error) throw new Error(importsResult.error.message);
  if (productsResult.error) throw new Error(productsResult.error.message);
  if (collectionsResult.error) throw new Error(collectionsResult.error.message);
  if (candidatesResult.error) throw new Error(candidatesResult.error.message);
  if (jobsResult.error) throw new Error(jobsResult.error.message);

  return (
    <AdminDashboard
      role={admin.role}
      imports={(importsResult.data ?? []) as PerfumeImportRow[]}
      products={(productsResult.data ?? []) as ProductRow[]}
      collections={(collectionsResult.data ?? []) as CollectionRow[]}
      candidates={(candidatesResult.data ?? []) as PerfumeCandidateRow[]}
      jobs={(jobsResult.data ?? []) as PerfumeDiscoveryJobRow[]}
    />
  );
}
