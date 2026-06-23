"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, ChevronDown, ChevronUp, Check } from "lucide-react";
import {
  BOTTLE_SIZES,
  effectiveBasePrice,
  priceForSize,
  formatPrice,
  type BottleSize,
  type Product,
} from "@/lib/product-utils";
import { addCartItem, submitReview, toggleWishlist } from "@/lib/client/commerce-api";
import type { ReviewWithProfile } from "@/types/database";

interface Props {
  product: Product;
  reviews: ReviewWithProfile[];
  isSignedIn: boolean;
  userReview: { id: string; rating: number; title: string | null; body: string | null } | null;
  initialWishlisted?: boolean;
}

// ── Star Rating Display ───────────────────────────────────────────────────────
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(value);
        const partial = !filled && i < value;
        return (
          <span key={i} className={`text-[13px] ${filled ? "text-[#C9A86C]" : partial ? "text-[#C9A86C]/50" : "text-[#D8D5D0]"}`}>
            ★
          </span>
        );
      })}
    </div>
  );
}

// ── Interactive star picker ───────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition-colors"
          style={{ color: star <= (hovered || value) ? "#C9A86C" : "#D8D5D0" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProductDetailClient({ product, reviews, isSignedIn, userReview, initialWishlisted = false }: Props) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<BottleSize>(5);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [descOpen, setDescOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(userReview?.rating ?? 0);
  const [reviewTitle, setReviewTitle] = useState(userReview?.title ?? "");
  const [reviewBody, setReviewBody] = useState(userReview?.body ?? "");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const basePrice = effectiveBasePrice(product);
  const hasDiscount = basePrice < product.price;
  const displayPrice = priceForSize(basePrice, selectedSize);
  const originalDisplayPrice = priceForSize(product.price, selectedSize);

  function handleAddToCart() {
    if (!isSignedIn) {
      window.location.href = "/account?redirectTo=/products/" + product.id;
      return;
    }
    startTransition(async () => {
      const result = await addCartItem({ itemType: "product", productId: product.id, sizeMl: selectedSize, quantity: 1 });
      if (result.status === 401) {
        window.location.href = "/account?redirectTo=/products/" + product.id;
        return;
      }
      router.refresh();
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    });
  }

  function handleBuyNow() {
    if (!isSignedIn) {
      window.location.href = "/account?redirectTo=/products/" + product.id;
      return;
    }
    startTransition(async () => {
      const result = await addCartItem({ itemType: "product", productId: product.id, sizeMl: selectedSize, quantity: 1 });
      if (result.status === 401) {
        window.location.href = "/account?redirectTo=/products/" + product.id;
        return;
      }
      router.push("/checkout");
    });
  }

  function handleWishlist() {
    if (!isSignedIn) {
      window.location.href = "/account?redirectTo=/products/" + product.id;
      return;
    }
    startTransition(async () => {
      const result = await toggleWishlist(product.id);
      if (result.status === 401) {
        window.location.href = "/account?redirectTo=/products/" + product.id;
        return;
      }
      setIsWishlisted((p) => !p);
    });
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError("");
    if (reviewRating === 0) { setReviewError("Please select a star rating."); return; }
    startTransition(async () => {
      const result = await submitReview({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      });
      if (result.error) {
        setReviewError(result.error);
      } else {
        setReviewSuccess(true);
        router.refresh();
      }
    });
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : product.rating;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  // Season icon map
  const seasonColors: Record<string, string> = {
    Spring: "bg-[#D4EAC8] text-[#3A6B2A]",
    Summer: "bg-[#FAE8A0] text-[#7A5A10]",
    Autumn: "bg-[#F4C89A] text-[#7A3A10]",
    Winter: "bg-[#C8D8EC] text-[#1A3A5C]",
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Breadcrumb */}
      <div className="max-w-screen-xl mx-auto px-5 md:px-10 pt-28 pb-4">
        <nav className="flex items-center gap-2 text-[11px] tracking-[0.1em] uppercase text-[#6B6B6B]">
          <Link href="/" className="hover:text-[#111] transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/${product.gender === "Men" ? "men" : product.gender === "Women" ? "women" : ""}`} className="hover:text-[#111] transition-colors">
            {product.gender}
          </Link>
          <span>/</span>
          <span className="text-[#111]">{product.name}</span>
        </nav>
      </div>

      {/* Main grid */}
      <section className="max-w-screen-xl mx-auto px-5 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

        {/* ── Left: Product Image ────────────────────────────────────────── */}
        <div className="relative group">
          {product.tag && (
            <div className="absolute top-5 left-5 z-10 bg-[#111] text-white text-[9px] tracking-[0.25em] uppercase px-3 py-1.5">
              {product.tag}
            </div>
          )}
          <button
            onClick={handleWishlist}
            className={`absolute top-5 right-5 z-10 w-9 h-9 flex items-center justify-center border transition-all duration-200 ${
              isWishlisted
                ? "bg-[#111] border-[#111] text-white"
                : "bg-white/80 border-[#E8E4DE] text-[#111] hover:bg-[#111] hover:text-white hover:border-[#111]"
            }`}
            aria-label="Add to wishlist"
          >
            <Heart size={15} strokeWidth={1.5} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
          <div className="bg-[#F5F1EB] aspect-[3/4] overflow-hidden">
            <img
              src={product.imageSrc}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          {/* Scent notes strip */}
          <div className="flex flex-wrap gap-2 mt-4">
            {product.notes.map((note) => (
              <span
                key={note}
                className="text-[10px] tracking-[0.12em] uppercase text-[#6B6B6B] border border-[#E8E4DE] px-3 py-1.5"
              >
                {note}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: Product Info ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:pt-4">
          {/* Brand & Name */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">{product.brand}</p>
            <h1 className="text-[2.5rem] md:text-[3rem] font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] leading-[1.05] mb-3">
              {product.name}
            </h1>
            <p className="text-[#6B6B6B] text-[14px] leading-relaxed">{product.description}</p>
          </div>

          {/* Rating row */}
          <div className="flex items-center gap-3">
            <StarRating value={avgRating} />
            <span className="text-sm font-semibold text-[#111]">{avgRating.toFixed(1)}</span>
            <span className="text-[12px] text-[#6B6B6B]">
              ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#E8E4DE]" />

          {/* Family & Seasons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] border border-[#E8E4DE] px-3 py-1.5">
              {product.family}
            </span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] border border-[#E8E4DE] px-3 py-1.5">
              {product.gender}
            </span>
            {product.seasons.map((s) => (
              <span key={s} className={`text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 ${seasonColors[s] ?? "bg-[#F0EDE8] text-[#6B6B6B]"}`}>
                {s}
              </span>
            ))}
          </div>

          {/* Size selector */}
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#111] mb-3 font-medium">
              Select Size
            </p>
            <div className="flex gap-3">
              {BOTTLE_SIZES.map((size) => {
                const sizePrice = priceForSize(basePrice, size);
                const originalSizePrice = priceForSize(product.price, size);
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`flex-1 flex flex-col items-center py-4 border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-[#111] bg-[#111] text-white"
                        : "border-[#E8E4DE] text-[#111] hover:border-[#111]"
                    }`}
                  >
                    <span className="text-[15px] font-semibold">{size}ml</span>
                    <span className={`text-[11px] mt-1 ${isSelected ? "text-white/70" : "text-[#6B6B6B]"}`}>
                      {formatPrice(sizePrice)}
                      {hasDiscount && (
                        <span className="ml-1 line-through opacity-70">
                          {formatPrice(originalSizePrice)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-0.5">
                Price · {selectedSize}ml
              </p>
              <p className="text-4xl font-[family-name:var(--font-cormorant)] font-medium text-[#111]">
                {formatPrice(displayPrice)}
              </p>
              {hasDiscount && (
                <p className="text-sm text-[#6B6B6B] line-through mt-1">
                  {formatPrice(originalDisplayPrice)}
                </p>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isPending}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] tracking-[0.2em] uppercase font-medium transition-all duration-300 ${
                addedToCart
                  ? "bg-[#3A7A3A] text-white border-2 border-[#3A7A3A]"
                  : "bg-[#111] text-white hover:bg-[#333] border-2 border-[#111]"
              } disabled:opacity-60`}
            >
              {addedToCart ? (
                <>
                  <Check size={14} />
                  Added to Bag
                </>
              ) : (
                <>
                  <ShoppingBag size={14} />
                  Add to Bag
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-[11px] tracking-[0.2em] uppercase font-medium border-2 border-[#111] text-[#111] hover:bg-[#111] hover:text-white transition-all duration-300 disabled:opacity-60"
            >
              Buy Now
            </button>
          </div>

          {/* Shipping note */}
          <p className="text-[11px] text-[#6B6B6B] leading-relaxed border-l-2 border-[#C9A86C] pl-3">
            Ships within 24 hours · Secure, discreet packaging · 100% authentic
          </p>

          {/* Long description accordion */}
          <div className="border-t border-[#E8E4DE]">
            <button
              onClick={() => setDescOpen((p) => !p)}
              className="w-full flex items-center justify-between py-4 text-[11px] tracking-[0.2em] uppercase font-medium text-[#111] hover:text-[#C9A86C] transition-colors"
            >
              The Scent Story
              {descOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {descOpen && (
              <div className="pb-5 space-y-4">
                {product.longDescription.trim().split(/\n\n+/).map((para, i) => (
                  <p key={i} className="text-[13px] text-[#4A4A4A] leading-[1.8]">
                    {para.trim()}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Reviews Section ──────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-5 md:px-10 py-16 border-t border-[#E8E4DE]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Rating summary */}
          <div className="lg:border-r border-[#E8E4DE] lg:pr-12">
            <h2 className="text-2xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] mb-6">
              Customer Reviews
            </h2>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-[family-name:var(--font-cormorant)] font-medium text-[#111] leading-none">
                {avgRating.toFixed(1)}
              </span>
              <div>
                <StarRating value={avgRating} />
                <p className="text-[11px] text-[#6B6B6B] mt-1">{reviews.length} reviews</p>
              </div>
            </div>
            {/* Distribution bars */}
            <div className="space-y-2 mt-6">
              {ratingDistribution.map(({ star, count }) => {
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[11px] text-[#6B6B6B] w-4">{star}</span>
                    <span className="text-[11px] text-[#C9A86C]">★</span>
                    <div className="flex-1 h-1.5 bg-[#F0EDE8] overflow-hidden">
                      <div
                        className="h-full bg-[#C9A86C] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#6B6B6B] w-4">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews list + write review */}
          <div className="lg:col-span-2">
            {/* Write review */}
            {isSignedIn && !reviewSuccess && (
              <div className="mb-10 p-6 bg-white border border-[#E8E4DE]">
                <h3 className="text-[11px] tracking-[0.2em] uppercase font-medium text-[#111] mb-5">
                  {userReview ? "Update Your Review" : "Write a Review"}
                </h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] block mb-2">Rating</label>
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <div>
                    <label className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] block mb-2">Title (optional)</label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Absolute masterpiece"
                      className="w-full border border-[#E8E4DE] px-4 py-3 text-sm text-[#111] placeholder-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] block mb-2">Review</label>
                    <textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Share your experience with this fragrance…"
                      rows={4}
                      className="w-full border border-[#E8E4DE] px-4 py-3 text-sm text-[#111] placeholder-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors resize-none"
                    />
                  </div>
                  {reviewError && (
                    <p className="text-red-600 text-sm">{reviewError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3 hover:bg-[#333] transition-colors disabled:opacity-60"
                  >
                    {isPending ? "Submitting…" : "Submit Review"}
                  </button>
                </form>
              </div>
            )}

            {reviewSuccess && (
              <div className="mb-10 p-5 bg-[#F0F7F0] border border-[#A8D4A8] text-[#2A5A2A] text-sm flex items-center gap-3">
                <Check size={16} />
                Thank you for your review! It will appear shortly.
              </div>
            )}

            {!isSignedIn && (
              <div className="mb-10 p-5 border border-[#E8E4DE] text-center">
                <p className="text-[13px] text-[#6B6B6B] mb-3">Sign in to leave a review</p>
                <Link
                  href={`/account?redirectTo=/products/${product.id}`}
                  className="text-[11px] tracking-[0.2em] uppercase text-[#111] border-b border-[#111] pb-0.5 hover:text-[#C9A86C] hover:border-[#C9A86C] transition-colors"
                >
                  Sign in →
                </Link>
              </div>
            )}

            {/* Review list */}
            {reviews.length === 0 ? (
              <p className="text-[13px] text-[#6B6B6B] text-center py-8">
                No reviews yet. Be the first to share your thoughts.
              </p>
            ) : (
              <div className="space-y-8">
                {reviews.map((review) => {
                  const profileData = review.profile as { full_name?: string; avatar_url?: string } | null;
                  const name = profileData?.full_name ?? "Anonymous";
                  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <article key={review.id} className="border-b border-[#E8E4DE] pb-8 last:border-0">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        {profileData?.avatar_url ? (
                          <img
                            src={profileData.avatar_url}
                            alt={name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#E8E4DE] flex items-center justify-center flex-shrink-0">
                            <span className="text-[11px] font-medium text-[#6B6B6B]">{initials}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className="text-[13px] font-medium text-[#111]">{name}</span>
                            {review.is_verified_purchase && (
                              <span className="text-[9px] tracking-[0.15em] uppercase text-[#3A7A3A] bg-[#EAF4EA] px-2 py-0.5">
                                Verified Purchase
                              </span>
                            )}
                            <span className="text-[11px] text-[#6B6B6B] ml-auto">
                              {new Date(review.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <StarRating value={review.rating} />
                          {review.title && (
                            <p className="text-[14px] font-medium text-[#111] mt-2">{review.title}</p>
                          )}
                          {review.body && (
                            <p className="text-[13px] text-[#4A4A4A] leading-relaxed mt-2">{review.body}</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
