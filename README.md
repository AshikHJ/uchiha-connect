# UCHIHA CONNECT STUDIO

Digital business cards with an organizer studio, visual editor, public profiles,
vCards and QR exports. React 18 + TypeScript + Vite, with an Express API.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run server
```

In a second terminal:

```sh
npm run dev
```

Open http://localhost:5173/studio. The **local demo PIN is 2026**. Local startup
creates 30 slots, including three demo profiles. The backend loads `.env`
automatically; copying `.env.example` is optional for local development.

Local data lives in `server/data/local-db.json`, which is excluded from Git.
Writes use atomic file replacement and revision checks. Use one local backend
process; use Supabase for multiple instances or any production deployment.
Database write failures return errors rather than claiming a successful save.

## Production / Vercel

1. Create a Supabase project. Run
   `supabase/migrations/002_persistent_state.sql` in its SQL Editor.
   Migration 002 is standalone; the tables in 001 are legacy schema and are not
   used by the updated API.
2. Configure **server-side** environment variables:
   - `SUPABASE_URL`: your project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: your service-role key, kept secret.
   - `SESSION_SECRET`: a unique random secret of at least 32 characters. Generate
     one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `ORGANIZER_PIN`: a private 6-12 digit PIN for first initialization.
   - `PRODUCTION_DOMAIN`: your actual public HTTPS origin, used for QR links.
3. Import the repository into Vercel as a Vite project. Build with `npm run build`
   and use `dist` as the output directory. `api/index.js` serves the API through
   the routes in `vercel.json`. Vercel sets `VERCEL`; for other hosts set
   `NODE_ENV=production` and serve the built frontend separately from the API.
4. Sign in with the configured PIN, create a card, save and publish it. Visit
   `/p/<username>`, and verify it again after a fresh deployment. Verify both
   desktop and mobile presentation before distributing QR codes.

Production refuses to use temporary files or the former public session secret.
The API stores a private JSON state document in `uc_app_state`; revision checks
return HTTP 409 if another request has changed it. Reload before retrying.
The service-role key stays in the backend; anonymous clients cannot read this
state document or PIN settings directly. Public profiles pass through the API,
which checks their publication status.

`ORGANIZER_PIN` initializes a new database only. Change an existing PIN in
Settings. PIN changes revoke old sessions while retaining the current browser
session. **Logout revokes all organizer sessions** (this app has one organizer).
Cookies are HttpOnly, SameSite=Lax, and Secure in production. The browser no
longer saves session tokens in localStorage. API clients can still use the
login response's bearer token.

Login attempts are counted atomically in Supabase: up to five submissions per
IP per 15-minute window, including successful logins. HTTP 429 includes
`Retry-After` and a countdown. Local development uses an in-process limiter.
`TRUST_PROXY_HOPS` must match your ingress (defaults to 1 on Vercel, 0 locally).
Set `ALLOWED_ORIGINS` only for additional trusted frontend origins; the usual
same-origin deployment needs none. Cookies require a same-site frontend/API.

### Existing data

Back up existing data before switching deployment versions. Migration 002 does
not automatically import `server/data/db.json`, the legacy SQL tables, or an old
serverless instance's temporary file. The committed `db.json` is retained as a
legacy demo fixture and is no longer used as live storage. Existing cards can
be exported/imported as CSV through the studio, but CSV does not retain visual
editor layouts; preserve a full JSON backup for custom designs. Production
initializes empty participant slots and never publishes demo data.

## Card designs and uploads

The editor, live preview and public saved-design renderer share the same element
renderer. It supports positioning, typography, rotation, opacity, avatars,
shapes, badges, dividers, social links, project cards, contact buttons and QR
codes. The preview includes unsaved edits. Editing participant details preserves
a custom design unless a different template is chosen. Legacy cards without a
saved design retain their original layout until saved through the editor.

Save Contact, Share, Email and Call remain available alongside custom designs.
Images are stored as inline data in the persisted card document, not a separate
Supabase Storage upload. Choose PNG/JPEG/WebP/GIF files smaller than 1.4 MB.
The API body limit is 4 MB; larger multi-image designs should use HTTPS image URLs.

## Verification

```sh
npm test
npm run build
npm audit --audit-level=moderate
```

`npm run test:api` and `npm run test:serverless` run the same self-contained
HTTP regression suite through the serverless entrypoint. Tests use isolated
temporary databases, assert outcomes, and exit nonzero on failures. They cover
publication, saved designs, authentication, session revocation, input validation,
CORS, local persistence across a fresh process, revision conflicts, production
configuration guards, and the Supabase client's HTTP/RPC behavior. An embedded
PostgreSQL test also applies migration 002 and checks permissions, revision
updates, throttling, and lockout expiry.

Supabase protocol tests use a controlled PostgREST fixture. They do not prove
that a live project's SQL, RLS or deployment credentials are configured; complete
the production checks above in your own project. CI runs the tests, build and
dependency audit on pushes and pull requests.
