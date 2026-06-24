import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProductById, getStorefrontCollectionById } from "@/lib/catalog";
import { resolveSizePrice, type BottleSize } from "@/lib/product-utils";
import type { AddCartItemInput, BuyNowInput, CartLine, CartSummary } from "@/types/commerce";

function validBottleSize(value: unknown): BottleSize {
  return value === 5 || value === 10 || value === 30 ? value : 5;
}

function normalizeQuantity(value: unknown, fallback = 1) {
  const quantity = Number(value ?? fallback);
  if (!Number.isFinite(quantity)) return fallback;
  return Math.max(1, Math.min(20, Math.floor(quantity)));
}

function revalidateCart() {
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/", "layout");
}

export async function addProductToCart(
  productId: string,
  sizeMl: BottleSize,
  quantity = 1,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const product = await getProductById(productId);
  if (!product) return { error: "Product is unavailable." };

  const { error } = await supabase.from("cart_items").upsert(
    {
      user_id: user.id,
      item_type: "product",
      product_id: productId,
      collection_id: null,
      size_ml: sizeMl,
      quantity: normalizeQuantity(quantity),
    },
    { onConflict: "user_id,product_id,size_ml", ignoreDuplicates: false },
  );

  if (error) return { error: error.message };
  revalidateCart();
  return {};
}

export async function addCollectionToCart(
  collectionId: string,
  quantity = 1,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const collection = await getStorefrontCollectionById(collectionId);
  if (!collection) return { error: "Collection is unavailable." };

  const { error } = await supabase.from("cart_items").upsert(
    {
      user_id: user.id,
      item_type: "collection",
      product_id: null,
      collection_id: collectionId,
      size_ml: null,
      quantity: normalizeQuantity(quantity),
    },
    { onConflict: "user_id,collection_id", ignoreDuplicates: false },
  );

  if (error) return { error: error.message };
  revalidateCart();
  return {};
}

export async function addCartItem(input: AddCartItemInput): Promise<{ error?: string }> {
  if (input.itemType === "product") {
    return addProductToCart(input.productId, validBottleSize(input.sizeMl), input.quantity);
  }

  return addCollectionToCart(input.collectionId, input.quantity);
}

export async function removeFromCart(cartItemId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidateCart();
  return {};
}

export async function updateCartQuantity(
  cartItemId: string,
  quantity: number,
): Promise<{ error?: string }> {
  if (quantity < 1) return removeFromCart(cartItemId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: normalizeQuantity(quantity) })
    .eq("id", cartItemId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidateCart();
  return {};
}

export async function toggleWishlist(
  productId: string,
): Promise<{ error?: string; added?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const product = await getProductById(productId);
  if (!product) return { error: "Product is unavailable." };

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("wishlist_items").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/account");
    return { added: false };
  }

  const { error } = await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
  if (error) return { error: error.message };
  revalidatePath("/account");
  return { added: true };
}

export async function getCartCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", user.id);

  return (data ?? []).reduce((sum, row) => sum + (row.quantity ?? 0), 0);
}

export async function getCart(): Promise<CartSummary> {
  const empty: CartSummary = { lines: [], subtotal: 0, count: 0 };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data: rows } = await supabase
    .from("cart_items")
    .select("id, item_type, product_id, collection_id, size_ml, quantity")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!rows) return empty;

  const lines: CartLine[] = [];

  for (const row of rows) {
    if (row.item_type === "product" && row.product_id) {
      const product = await getProductById(row.product_id);
      if (!product) continue;
      const size = validBottleSize(row.size_ml);
      const unitPrice = resolveSizePrice(product, size).price;
      lines.push({
        id: row.id,
        itemType: "product",
        refId: product.id,
        name: product.name,
        brand: product.brand,
        imageSrc: product.imageSrc,
        sizeMl: size,
        quantity: row.quantity,
        unitPrice,
        lineTotal: unitPrice * row.quantity,
      });
    } else if (row.item_type === "collection" && row.collection_id) {
      const collection = await getStorefrontCollectionById(row.collection_id);
      if (!collection) continue;
      const unitPrice = collection.bundlePrice;
      lines.push({
        id: row.id,
        itemType: "collection",
        refId: collection.id,
        name: collection.name,
        brand: "Collection · Box of 4",
        imageSrc: collection.displayItems[0]?.imageSrc ?? "/collection_img.png",
        sizeMl: null,
        quantity: row.quantity,
        unitPrice,
        lineTotal: unitPrice * row.quantity,
      });
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  return { lines, subtotal, count };
}

/**
 * Build a one-line cart summary for a "Buy Now" direct purchase, without
 * touching the user's persistent cart. Price is resolved server-side from the
 * catalogue — the client never sets it. Returns an empty summary if the product
 * is unavailable.
 */
export async function buildBuyNowSummary(input: BuyNowInput): Promise<CartSummary> {
  const empty: CartSummary = { lines: [], subtotal: 0, count: 0 };

  const product = await getProductById(input.productId);
  if (!product) return empty;

  const size = validBottleSize(input.sizeMl);
  const quantity = normalizeQuantity(input.quantity);
  const unitPrice = resolveSizePrice(product, size).price;

  const line: CartLine = {
    id: `buy-now:${product.id}:${size}`,
    itemType: "product",
    refId: product.id,
    name: product.name,
    brand: product.brand,
    imageSrc: product.imageSrc,
    sizeMl: size,
    quantity,
    unitPrice,
    lineTotal: unitPrice * quantity,
  };

  return { lines: [line], subtotal: line.lineTotal, count: quantity };
}
