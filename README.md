# Accel4U Business Solutions Inc. — Website + Admin CMS

Complete Vite + vanilla JavaScript website based on the uploaded *1st Final A4U Web Revision Proposal* (37 pages), with the existing Accel4U Vite/Supabase project as the starting point.

## Website pages

| Page | Route | Proposal reference |
| --- | --- | --- |
| Home | `/` | pp. 1–8 |
| About Us | `/about` | pp. 9–18 |
| Solutions | `/solutions` | pp. 19–27 |
| How To | `/how-to` | pp. 28–34 |
| Free Consultation | `/free-consultation` | pp. 35–37 |
| Admin CMS | `/admin` or `/admin.html` | New functionality requested |

The site includes branding, leadership/team cards, services, engagement models, industry panels, finance offerings, a consultation form, and the cost estimate calculator carried over from the original project (clearly labeled illustrative). Uploaded proposal images are included in `public/assets/`.

## Admin capabilities

- Supabase email/password authentication; only explicitly approved staff accounts can enter.
- Two roles: **admin** can edit and publish; **editor** can edit drafts but cannot publish.
- Add, edit, duplicate, reorder, hide, and remove supported website sections (Hero, Split, Cards, Steps, People, CTA, Media, Resources, Calculator and Consultation Form).
- Edit text, buttons/links, image URLs, item collections, per-section colors/alignment, SEO titles/descriptions, site name, logo, global theme and example calculator rates.
- Upload photos, videos, and documents to Supabase Storage; attach media to a selected section, select as logo, or copy its public URL for any item.
- Save draft, preview draft privately, publish live changes. Published content is separate from drafts.
- View consultation leads and update their pipeline status in the protected CMS.
- Small **Admin Login** link at the bottom-right of the website footer.

**Important:** CMS publishing writes to **Supabase**, not GitHub. GitHub stores website code, Vercel hosts it, Supabase handles auth/content/uploads/leads. Once deployed, most content changes can be published without touching GitHub.

## Step 1 — Supabase setup (required for a working CMS)

1. Create a project at https://supabase.com/. Keep your database password private.
2. In **SQL Editor**, run the entire file `supabase/schema.sql`.
3. In **Authentication → Users**, create your own email/password user (or invite yourself). Set a strong password; confirm the email if required.
4. In **SQL Editor**, grant your user the `admin` role, replacing the sample email with the actual account email:

```sql
insert into public.site_admins (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR_REAL_EMAIL@example.com'
on conflict (user_id) do update set role = excluded.role;
```

5. In **Project Settings → API / API Keys**, copy your Supabase **Project URL** and **publishable / anon key**. Never copy a **service_role** or secret key into this site.
6. In **Authentication → URL Configuration**, add your Vercel website URL (for example `https://your-name.vercel.app`) to allowed redirect URLs, and set the site URL. Add `http://localhost:5173` or `http://localhost:5173/admin.html` for local password resets as appropriate.
7. Supabase Storage bucket `site-media` is created by the SQL and is **public**. Upload only public website assets, never confidential documents.

You may add a staff editor by creating another Supabase Auth user and assigning `role='editor'` via the same SQL.

## Step 2 — Run on your computer

Install **Node.js 20.19+** (Node 22 is recommended), then run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp` if preferred.

Update `.env.local` with real values:

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY
```

Open `http://localhost:5173` for the website or `http://localhost:5173/admin.html` for the admin screen.

**Without Supabase credentials**, the public website displays bundled sample content so you can preview the design, but admin login, uploads, CMS publishing and consultations will not work.

## Step 3 — Upload to GitHub

1. Create a new **private** GitHub repository, for example `accel4u-website`.
2. Upload/extract this project's contents to the repository root. Make sure `package.json`, `index.html`, `admin.html`, `src/`, `public/` and `supabase/` are at the root. Do **not** upload the ZIP file itself as the only repository file.
3. **Do not commit** `.env` or `.env.local`. The `.gitignore` excludes them. `.env.example` is safe.
4. Commit your project.

Command line alternative:

```bash
git init
git add .
git commit -m "Create Accel4U website and CMS"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

## Step 4 — Deploy on Vercel

1. At https://vercel.com/, select **Add New → Project**, connect GitHub, and import your project.
2. Set the framework preset to **Vite**.
3. Set build command `npm run build`, output directory `dist`. Root directory should be repository root.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — your **public/publishable** Supabase key
5. Click **Deploy**. After the domain is ready, add that site URL to Supabase Auth redirect allowed URLs.
6. Open `https://your-site.vercel.app/admin` and sign in. Edit a page, click **Save Draft**, optionally **Preview Draft**, then **Publish**. Refresh the public website to verify changes.

The included `vercel.json` rewrites page URLs to the website entry point. It does not expose CMS drafts or credentials.

## Security and production notes

- The admin route is intentionally discoverable in the footer, but all sensitive operations require Supabase Auth **and database-enforced RLS policies**. Hiding the login page is not a security mechanism.
- Database admin membership cannot be granted by public users or the CMS. Only a project owner with SQL Dashboard access can assign roles.
- Public content is stored in `site_published`; drafts in `site_drafts`. Public visitors never receive drafts through database policies.
- Consultation requests are in `lead_submissions` and not publicly readable; users consent to inquiry processing, and marketing opt-in is separate and optional.
- Public forms have basic input validation and a honeypot, **not production-grade rate limiting/CAPTCHA**. Before high-volume launch, implement Cloudflare Turnstile with server verification or equivalent anti-spam/rate limiting.
- Files in the public `site-media` bucket are accessible by URL; only upload material approved for public release. Maximum file size in the included bucket config: 48 MB, subject to Supabase plan limits.
- Embedded video playback supports MP4 and WebM. Other files are linked for download/viewing; ZIP and Office files are not displayed as embedded video.
- Images/videos are from the user's uploaded proposal where available. Verify leadership photos/titles, official pricing, rights, legal copy, and contact details before public launch.
- The cost calculator uses **example rates**, not verified Accel4U pricing. Hide the calculator section in the editor if you prefer not to show estimates.
- Deploying code to GitHub/Vercel is separate from publishing CMS content. A code change requires Git commit/deploy; a content change after the initial setup does not.

## Development commands

```bash
npm run dev       # local server
npm run build     # production build
npm run preview   # inspect production build
```

## Project structure

```
index.html                     Public website
admin.html                     Protected admin sign-in and dashboard UI
src/main.js                    Public pages / content renderer / forms
src/style.css                  Responsive public site styles
src/admin.js                   Admin editor / draft / publish / uploads
src/admin.css                  Admin dashboard styles
src/default-content.js        Full initial website content
src/content.js                Supabase published/draft persistence
src/supabase.js               Supabase client using public env vars
src/utils.js                  Safe rendering helpers
public/assets/                Included approved website images
supabase/schema.sql           Database tables, RLS, media bucket, roles
vercel.json                   Vercel routing and security headers
.env.example                  Public environment variable names
```

## Original project changes

This project preserves the existing Vite + Supabase technology approach while replacing the original limited one-page editor with a five-page content-driven website and a multi-page CMS. It also replaces the original demo consultation form with database-backed submissions **after Supabase is configured**.
