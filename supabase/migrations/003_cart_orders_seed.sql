-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Cart / Orders / Account Migration  (+ catalogue seed)
-- Adds: profile phone + default address, saved payment methods,
--        and seeds the products / collections / collection_items tables so the
--        cart, wishlist, reviews and order foreign keys resolve.
-- Run in: Supabase Dashboard → SQL Editor (idempotent — safe to re-run).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Profiles: contact + default address ───────────────────────────────────
alter table public.profiles
  add column if not exists phone   text,
  add column if not exists address jsonb;          -- ShippingAddress shape

-- ── Saved payment methods ──────────────────────────────────────────────────
-- Stores ONLY non-sensitive display metadata (never full PANs/CVC).
-- A real PSP (Stripe, etc.) holds the actual card; this is for UI display.
create table if not exists public.payment_methods (
  id               uuid        not null default uuid_generate_v4(),
  user_id          uuid        not null references auth.users (id) on delete cascade,
  brand            text        not null,                         -- "Visa", "Mastercard", …
  last4            text        not null check (char_length(last4) = 4),
  exp_month        smallint    not null check (exp_month between 1 and 12),
  exp_year         smallint    not null check (exp_year between 2024 and 2100),
  cardholder_name  text        not null,
  is_default       boolean     not null default false,
  created_at       timestamptz not null default now(),

  constraint payment_methods_pkey primary key (id)
);

create index if not exists idx_payment_methods_user on public.payment_methods (user_id);

alter table public.payment_methods enable row level security;

drop policy if exists "payment_methods_select_own" on public.payment_methods;
create policy "payment_methods_select_own"
  on public.payment_methods for select using (auth.uid() = user_id);

drop policy if exists "payment_methods_insert_own" on public.payment_methods;
create policy "payment_methods_insert_own"
  on public.payment_methods for insert with check (auth.uid() = user_id);

drop policy if exists "payment_methods_update_own" on public.payment_methods;
create policy "payment_methods_update_own"
  on public.payment_methods for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "payment_methods_delete_own" on public.payment_methods;
create policy "payment_methods_delete_own"
  on public.payment_methods for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Catalogue seed — products
-- Mirrors lib/products.ts. The app renders rich copy from that file; these rows
-- exist so FKs (cart_items / order_items / reviews / wishlist) resolve and so
-- orders can join product display data.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.products (id, name, brand, price, rating, image_path, tag, notes, family, gender, seasons, description) values
  ('sauvage-dior',        'Sauvage',            'Dior',                       1490, 4.9, '/top_1.png',          'Bestseller', array['Bergamot','Pepper','Ambroxan','Vetiver'],        'Fresh',    'Men',    array['Summer','Spring']::season[],                        'A raw and noble freshness — the quintessential modern masculine.'),
  ('tobacco-vanille-tf',  'Tobacco Vanille',    'Tom Ford',                   1990, 4.8, '/top_2.png',          'Top Pick',   array['Tobacco','Vanilla','Tonka Bean','Sandalwood'],   'Oriental', 'Unisex', array['Autumn','Winter']::season[],                        'An opulent embrace of tobacco and vanilla — rich, dark, and utterly seductive.'),
  ('aventus-creed',       'Aventus',            'Creed',                      2490, 4.9, '/top_3.png',          'Iconic',     array['Pineapple','Blackcurrant','Birch','Ambergris'],  'Fresh',    'Men',    array['Spring','Summer']::season[],                        'Creed''s masterpiece — the scent of power, success and ambition.'),
  ('baccarat-rouge-mfk',  'Baccarat Rouge 540', 'Maison Francis Kurkdjian',   2660, 4.9, '/collection_img.png', null,         array['Jasmine','Amberwood','Cedar','Saffron'],         'Floral',   'Unisex', array['Spring','Summer','Autumn','Winter']::season[],      'An ethereal, amberwood and floral accord — the internet''s most-loved fragrance.'),
  ('lost-cherry-tf',      'Lost Cherry',        'Tom Ford',                   2160, 4.7, '/collection_img.png', null,         array['Cherry','Rose','Tonka Bean','Benzoin'],          'Gourmand', 'Unisex', array['Autumn','Winter']::season[],                        'Dark, sweet temptation — a cherry that bites back.'),
  ('good-girl-ch',        'Good Girl',          'Carolina Herrera',           1330, 4.6, '/collection_img.png', 'Bestseller', array['Jasmine','Cocoa','Tuberose','Sandalwood'],       'Oriental', 'Women',  array['Autumn','Winter']::season[],                        'The duality of femininity — white florals by day, dark cocoa by night.'),
  ('flowerbomb-vr',       'Flowerbomb',         'Viktor & Rolf',              1330, 4.6, '/collection_img.png', 'Top Pick',   array['Jasmine','Rose','Patchouli','Vanilla'],          'Floral',   'Women',  array['Spring','Summer']::season[],                        'A floral explosion so intense it rewrites the genre.'),
  ('libre-ysl',           'Libre',              'Yves Saint Laurent',         1490, 4.7, '/collection_img.png', null,         array['Lavender','Jasmine','Vanilla','Musk'],           'Floral',   'Women',  array['Spring','Summer','Autumn','Winter']::season[],      'Freedom in a bottle — lavender and jasmine in a bold, unapologetic accord.'),
  ('bleu-chanel',         'Bleu de Chanel',     'Chanel',                     1660, 4.8, '/collection_img.png', null,         array['Citrus','Grapefruit','Sandalwood','Vetiver'],    'Fresh',    'Men',    array['Spring','Summer']::season[],                        'Chanel''s defining masculine — free, fresh, and effortlessly elegant.'),
  ('black-orchid-tf',     'Black Orchid',       'Tom Ford',                   1830, 4.8, '/collection_img.png', null,         array['Black Orchid','Patchouli','Vetiver','Incense'],  'Oriental', 'Unisex', array['Autumn','Winter']::season[],                        'Dark, velvety glamour — Tom Ford''s most mysterious creation.'),
  ('miss-dior',           'Miss Dior',          'Dior',                       1660, 4.8, '/collection_img.png', null,         array['Rose','Iris','Jasmine','Peony'],                 'Floral',   'Women',  array['Spring','Summer']::season[],                        'The original Dior feminine — an exquisite rose wrapped in chypre.'),
  ('coco-mad-chanel',     'Coco Mademoiselle',  'Chanel',                     1830, 4.9, '/collection_img.png', 'Iconic',     array['Orange','Rose','Vetiver','Patchouli'],           'Chypre',   'Women',  array['Spring','Summer','Autumn','Winter']::season[],      'The bold spirit of Coco Chanel reborn for a new generation.'),
  ('oud-wood-tf',         'Oud Wood',           'Tom Ford',                   2320, 4.7, '/collection_img.png', null,         array['Oud','Sandalwood','Vetiver','Rosewood'],         'Woody',    'Men',    array['Autumn','Winter']::season[],                        'Rare oud distilled to its purest, most sophisticated expression.'),
  ('spicebomb-vr',        'Spicebomb Extreme',  'Viktor & Rolf',              1830, 4.6, '/collection_img.png', null,         array['Tobacco','Vanilla','Cayenne','Cardamom'],        'Oriental', 'Men',    array['Autumn','Winter']::season[],                        'The original Spicebomb, amplified to explosive intensity.'),
  ('lavb-lancome',        'La Vie Est Belle',   'Lancôme',                    1160, 4.5, '/collection_img.png', null,         array['Iris','Jasmine','Praline','Patchouli'],          'Gourmand', 'Women',  array['Spring','Summer','Autumn','Winter']::season[],      'Life is beautiful — and so is this joyful iris and praline accord.'),
  ('si-intense-armani',   'Sì Intense',         'Giorgio Armani',             1490, 4.7, '/collection_img.png', null,         array['Blackcurrant','Rose','Patchouli','Vanilla'],     'Chypre',   'Women',  array['Autumn','Winter']::season[],                        'An intense, modern chypre — femininity amplified.'),
  ('hacivat-nishane',     'Hacivat',            'Nishane',                    2160, 4.7, '/collection_img.png', null,         array['Pineapple','Oakmoss','Cedar','Jasmine'],         'Fresh',    'Unisex', array['Spring','Summer']::season[],                        'A Turkish artisan masterwork — pineapple and oakmoss in perfect harmony.'),
  ('black-opium-ysl',     'Black Opium',        'Yves Saint Laurent',         1330, 4.7, '/collection_img.png', null,         array['Coffee','Vanilla','White Flowers','Patchouli'],  'Oriental', 'Women',  array['Autumn','Winter']::season[],                        'Coffee and white flowers — a rock ''n'' roll oriental for the modern woman.')
on conflict (id) do update set
  name = excluded.name, brand = excluded.brand, price = excluded.price, rating = excluded.rating,
  image_path = excluded.image_path, tag = excluded.tag, notes = excluded.notes,
  family = excluded.family, gender = excluded.gender, seasons = excluded.seasons,
  description = excluded.description, is_active = true, updated_at = now();

-- ═══════════════════════════════════════════════════════════════════════════
-- Catalogue seed — collections + collection_items
-- Mirrors lib/collections.ts.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.collections (id, number, name, subtitle, bundle_price, season_category, description) values
  ('summer-01', '01', 'The Fresh Escape',  'Crisp, solar and unmistakably summer',     6140, 'summer',    'Four luminous scents built for long, bright days — citrus-forward openings, airy woods and a whisper of the sea.'),
  ('summer-02', '02', 'Garden in Bloom',   'Floral and feminine, made for golden hours', 6810, 'summer',  'A bouquet in a box — jasmine, rose and peony intertwined with luminous amber.'),
  ('winter-01', '01', 'The Dark Luxe',     'Rich, smoky and built for cold nights',    7300, 'winter',    'Tobacco, oud and dark woods for the season of long shadows — deep, layered and built to linger.'),
  ('winter-02', '02', 'Sweet Noir',        'Warm, indulgent and dangerously addictive', 6310, 'winter',   'Cherry, coffee and cocoa wrapped in vanilla warmth — a gourmand quartet for candlelit evenings.'),
  ('celeb-01',  '01', 'Red Carpet Ready',  'The most coveted names in luxury fragrance', 8630, 'celebrity', 'Four of the most recognised, most requested scents in modern perfumery, decanted for you to try.'),
  ('celeb-02',  '02', 'Power Signatures',  'Bold, commanding and impossible to ignore', 7970, 'celebrity', 'The scents worn by those who walk into a room and own it — rich woods, dark spice and pure presence.')
on conflict (id) do update set
  number = excluded.number, name = excluded.name, subtitle = excluded.subtitle,
  bundle_price = excluded.bundle_price, season_category = excluded.season_category,
  description = excluded.description, is_active = true, updated_at = now();

insert into public.collection_items (collection_id, product_id, sort_order) values
  ('summer-01', 'sauvage-dior',       1),
  ('summer-01', 'bleu-chanel',        2),
  ('summer-01', 'hacivat-nishane',    3),
  ('summer-01', 'libre-ysl',          4),
  ('summer-02', 'flowerbomb-vr',      1),
  ('summer-02', 'miss-dior',          2),
  ('summer-02', 'baccarat-rouge-mfk', 3),
  ('summer-02', 'coco-mad-chanel',    4),
  ('winter-01', 'tobacco-vanille-tf', 1),
  ('winter-01', 'oud-wood-tf',        2),
  ('winter-01', 'black-orchid-tf',    3),
  ('winter-01', 'spicebomb-vr',       4),
  ('winter-02', 'lost-cherry-tf',     1),
  ('winter-02', 'black-opium-ysl',    2),
  ('winter-02', 'good-girl-ch',       3),
  ('winter-02', 'coco-mad-chanel',    4),
  ('celeb-01',  'baccarat-rouge-mfk', 1),
  ('celeb-01',  'aventus-creed',      2),
  ('celeb-01',  'coco-mad-chanel',    3),
  ('celeb-01',  'lost-cherry-tf',     4),
  ('celeb-02',  'tobacco-vanille-tf', 1),
  ('celeb-02',  'oud-wood-tf',        2),
  ('celeb-02',  'sauvage-dior',       3),
  ('celeb-02',  'aventus-creed',      4)
on conflict (collection_id, sort_order) do update set
  product_id = excluded.product_id;
