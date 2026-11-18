# Certifurb (Skyline)

Next.js storefront + CMS for renewed laptops, backed by **Supabase** (Postgres, Auth, Storage).

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. In the SQL editor, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Copy env vars:

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings → API**.

4. Install and seed:

```bash
npm install
npm run seed
# optional demo customer (demo@certifurb.com / Demo@1234):
# SEED_SAMPLES=1 npm run seed
```

5. Start the app:

```bash
npm run dev
```

- Storefront: [http://localhost:3000](http://localhost:3000)
- CMS: [http://localhost:3000/cms](http://localhost:3000/cms) — first signup becomes the **owner**

## Architecture

- Server Components / Server Actions talk to Supabase directly (low latency).
- Middleware refreshes the auth session cookie.
- Published catalogue is cached with `cacheTag("catalog")` and invalidated when CMS products/inventory change.
- Product images upload to the `product-images` Storage bucket.
