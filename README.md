# Our Todo

A shared todo app for you and a friend — Next.js 15, Tailwind CSS, Supabase Auth + PostgreSQL, deployable on Vercel.

## Features

- Shared todo list (both of you see and edit the same items)
- **Two-person only**: email allowlist + optional invite code
- Labels, priority (Low / Medium / High), complete & delete
- **Daily scoring**: low 3 pts, medium 5 pts, high 8 pts — scored nightly
- Timer icon shows your daily score history with expandable completed tasks
- UI matched to the provided screenshots

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key. Set **`ALLOWED_EMAILS`** to your two emails (comma-separated). Optionally set `APP_INVITE_CODE` as a second gate at signup.

## Two-person access

This app is meant for exactly two people. Access is controlled in three layers:

1. **`ALLOWED_EMAILS`** — only these emails can sign up or log in
2. **`APP_INVITE_CODE`** — optional extra check at signup
3. **Members list** — once logged in, the todos page shows who has joined (e.g. `Members (1/2)`)

To see or manage all auth users (including deleting a stranger who somehow got in), use the Supabase dashboard: [Authentication → Users](https://supabase.com/dashboard/project/cgyffptaeisausevvukg/auth/users).

After both of you have signed up, you can disable new signups in Supabase under **Auth → Providers → Email → Disable sign ups**.

3. In the [Supabase Auth settings](https://supabase.com/dashboard/project/cgyffptaeisausevvukg/auth/providers):

- Enable Email provider
- For local testing, consider disabling **Confirm email** so you can log in immediately after signup
- Add `http://localhost:3000/auth/callback` (and your Vercel URL) under Redirect URLs

4. Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Daily scores

Apply the migration in `supabase/migrations/20260720170000_daily_scores.sql` via the Supabase SQL editor. It will:

1. Track when todos are completed (`completed_at`)
2. Store daily points per user (`daily_scores`, `daily_score_items`)
3. Provide `process_daily_scores()` — scores yesterday’s completed todos, then resets them for the new day

Point values: **Low 3**, **Medium 5**, **High 8**.

Schedule the nightly cron in Supabase (requires `pg_cron`):

```sql
select cron.schedule(
  'daily-todo-scores',
  '0 0 * * *',
  $$select public.process_daily_scores();$$
);
```

Test manually:

```sql
select public.process_daily_scores();
```

Tap the **timer icon** next to logout to view past days, scores, and completed tasks.

## Deploy on Vercel

1. Push this repo to GitHub
2. Import the project in Vercel
3. Set environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ALLOWED_EMAILS` (your two emails, comma-separated)
- `APP_INVITE_CODE`
- `NEXT_PUBLIC_SITE_URL` (your production URL, e.g. `https://your-app.vercel.app`)

4. Add the production `/auth/callback` URL in Supabase Auth redirect allowlist
5. Deploy

## Invite your friend

1. Add both emails to `ALLOWED_EMAILS` in `.env.local` (and Vercel when deployed)
2. Share the app URL, invite code, and tell them to sign up at `/signup`
3. Once both appear under **Members (2/2)**, disable signups in Supabase if you want
