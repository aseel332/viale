import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/catalog";
import { PRODUCTS } from "@/lib/products";
import ProductDetailClient from "./ProductDetailClient";
import type { ReviewWithProfile } from "@/types/database";

// ── Static params ─────────────────────────────────────────────────────────────
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Product (cached catalogue), reviews, and the authenticated user are all
  // independent — fetch them concurrently instead of waterfalling so the page
  // is bound by the slowest single query rather than their sum.
  const supabase = await createClient();
  const [product, { data: reviews }, { data: { user } }] = await Promise.all([
    getProductById(id),
    supabase
      .from("reviews")
      .select(`
        id, rating, title, body, is_verified_purchase, created_at,
        profile:profiles(full_name, avatar_url)
      `)
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.auth.getUser(),
  ]);

  if (!product) notFound();

  // User's existing review + whether the product is already wishlisted
  let userReview: { id: string; rating: number; title: string | null; body: string | null } | null = null;
  let isWishlisted = false;
  if (user) {
    const [{ data: review }, { data: wish }] = await Promise.all([
      supabase
        .from("reviews")
        .select("id, rating, title, body")
        .eq("product_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("wishlist_items")
        .select("id")
        .eq("product_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    userReview = review;
    isWishlisted = Boolean(wish);
  }

  const typedReviews = (reviews ?? []) as unknown as ReviewWithProfile[];

  return (
    <ProductDetailClient
      product={product}
      reviews={typedReviews}
      isSignedIn={!!user}
      userReview={userReview}
      initialWishlisted={isWishlisted}
    />
  );
}
