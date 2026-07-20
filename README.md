# Our Todo

A shared todo app for you and a friend — Next.js 15, Tailwind CSS, Supabase Auth + PostgreSQL, deployable on Vercel.

## Features

- Shared todo list (both of you see and edit the same items)
- **Two-person only**: email allowlist + optional invite code
- Members panel on the todos page (who has joined)
- Labels, priority (Low / Medium / High), complete & delete
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
