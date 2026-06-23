# Perfume Import Agent + Admin Dashboard

The perfume agent researches perfume candidates, generates Viale product drafts, and can create transparent bottle images. Publishing is manual through `/admin` so price, discount, availability, and collections stay under admin control.

## Environment

Required:

- `OPENAI_API_KEY`
- `PERFUME_AGENT_TOKEN` with at least 32 characters for bearer-token API access

Optional:

- `OPENAI_RESEARCH_MODEL` defaults to `gpt-5.5`
- `OPENAI_IMAGE_MODEL` defaults to `gpt-image-1.5`

Generated images are written under `public/generated/perfumes`. On a hosted deployment, make sure that path is persisted or replace it with Supabase Storage before relying on generated images long term.

## Database Setup

Run the migrations through Supabase SQL Editor in order:

- `supabase/migrations/007_perfume_import_agent.sql`
- `supabase/migrations/008_admin_dashboard.sql`

Then promote your own signed-in user to admin. Find your user id in Supabase Auth, then run:

```sql
insert into public.admin_users (user_id, role)
values ('YOUR_AUTH_USER_ID', 'owner')
on conflict (user_id) do update set role = excluded.role;
```

## Dashboard Flow

1. Sign in on the storefront with the admin account.
2. Open `/admin`.
3. Use `Agent` to discover perfumes or generate one draft from brand + perfume name.
4. In `Import Queue`, enter price, optional discount price, optional tag, and choose whether it is available on the storefront.
5. Publish the draft. It writes to `public.products` and revalidates the storefront.
6. Use `Products` to update price, discount, tag, or availability.
7. Use `Manual Product` to add a product without the agent.
8. Use `Collections` to create manual 4-product collections.

## API

`POST /api/admin/perfume-agent`

Authentication:

- Admin Supabase session, or
- `Authorization: Bearer $PERFUME_AGENT_TOKEN`

Token-only requests can discover and generate drafts, but persistence requires an admin session.

Discover perfume ideas:

```bash
curl -X POST http://localhost:3000/api/admin/perfume-agent \
  -H "Authorization: Bearer $PERFUME_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"discover","segment":"mixed","limit":12}'
```

Generate one draft:

```bash
curl -X POST http://localhost:3000/api/admin/perfume-agent \
  -H "Authorization: Bearer $PERFUME_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"generate","brand":"Dior","name":"Sauvage","generateImage":true,"persist":false}'
```

## Protection Layers

- `/admin` is gated by Next Proxy for signed-in users.
- `/admin` also calls `requireAdminPage()` server-side and returns 404 for non-admin users.
- Every admin server action calls `requireAdmin()` again because actions are directly POST-able.
- `public.admin_users` plus RLS policies restrict product, collection, and import writes to admins.
- The agent API accepts only admin sessions or the bearer token; normal signed-in users are rejected.
