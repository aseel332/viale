import type { BottleSize } from "@/lib/product-utils";

export interface CartLine {
  id: string;
  itemType: "product" | "collection";
  refId: string;
  name: string;
  brand: string;
  imageSrc: string;
  sizeMl: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartSummary {
  lines: CartLine[];
  subtotal: number;
  count: number;
}

export type AddCartItemInput =
  | {
      itemType: "product";
      productId: string;
      sizeMl: BottleSize;
      quantity?: number;
    }
  | {
      itemType: "collection";
      collectionId: string;
      quantity?: number;
    };

export type UpdateCartItemInput = {
  quantity: number;
};

export type CheckoutAddressInput = {
  full_name: string;
  phone?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  country: "IN";
};

export type PaymentMethodChoice = "razorpay" | "cod";

/**
 * A single direct-purchase ("Buy Now") line. When present on a checkout/quote
 * request, the order is built from this product alone and the persistent cart
 * is left untouched.
 */
export type BuyNowInput = {
  productId: string;
  sizeMl: BottleSize;
  quantity?: number;
};

export type PlaceOrderInput = {
  address: CheckoutAddressInput;
  paymentMethod: PaymentMethodChoice;
  contactEmail?: string | null;
  notes?: string | null;
  /** When set, checkout only this product instead of the whole cart. */
  buyNow?: BuyNowInput | null;
};

/** Result of placing an order. For Razorpay, the client opens checkout with these. */
export type PlaceOrderResult = {
  orderId: string;
  paymentMethod: PaymentMethodChoice;
  razorpay?: {
    orderId: string;
    amount: number;     // paise
    keyId: string;
  };
};

export type ShippingQuoteOption = {
  available: boolean;
  charge: number;
  etdDays: number | null;
  courier: string | null;
};

export type ShippingQuoteResult = {
  serviceable: boolean;
  prepaid: ShippingQuoteOption;
  cod: ShippingQuoteOption;
};

export type ReviewInput = {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
};
