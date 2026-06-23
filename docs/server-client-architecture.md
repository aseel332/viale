# Server / Client Boundary

Viale keeps database access, pricing, cart ownership, checkout totals, and external API calls on the server.

## Public Read Routes

- `GET /api/products`
- `GET /api/products/[id]`
- `GET /api/collections`
- `GET /api/collections/[id]`

The storefront pages use server-side data functions directly, while these routes expose the same server data layer for external or client-side consumers.

## Authenticated Mutation Routes

- `GET /api/cart`
- `POST /api/cart`
- `PATCH /api/cart/items/[id]`
- `DELETE /api/cart/items/[id]`
- `POST /api/wishlist`
- `POST /api/reviews`
- `POST /api/checkout`

These routes use the Supabase auth cookie on the server. Prices and totals are rebuilt from the server cart and product catalog; client totals are never trusted.

## Redis

Redis is optional in local development and enabled in deployment when these env vars exist:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Cached today:

- active storefront products
- active storefront collections
- India-biased geocode results

Admin product and collection mutations invalidate the catalog cache.
