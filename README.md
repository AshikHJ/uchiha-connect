# UCHIHA CONNECT STUDIO (UC)

> **One Identity. Every Connection.**  
> A premium digital business card creation platform inspired by Blinq and Canva, engineered for hackathon organizers to manage, customize, and individually publish up to 30 participant cards without participant logins.

---

## ✦ Brand & Visual Identity

- **Official Brand Name:** UCHIHA CONNECT
- **Short Name / Abbreviation:** UC
- **Tagline:** One Identity. Every Connection.
- **Charcoal Black:** `#111111`
- **Deep Crimson:** `#B51F35`
- **White:** `#FFFFFF`
- **Muted Grey:** `#8B8985`
- **Warm White:** `#F8F4EC`
- **Cream:** `#F1E7D7`
- **Typography:** Inter, Manrope, DM Serif Display, JetBrains Mono

---

## ✦ Key Features

1. **PIN-Protected Organizer Access**
   - Zero participant sign-up or accounts required.
   - Secure server-side PIN authentication with PBKDF2 with SHA-256 and salted hashing.
   - HMAC signed session token in HttpOnly secure cookie or Bearer token.
   - Built-in rate limiting (max 5 failed attempts per 15 minutes) with an automated lockout countdown.

2. **30 Pre-Seeded Participant Slots**
   - Pre-configured slots `CID-001` through `CID-030`.
   - Independent publishing state machine: `draft`, `published`, `unpublished`.
   - Publishing one card never exposes or affects other cards.

3. **Simple Participant Creation Workflow**
   - Prominent **`+ CREATE NEW CARD`** action.
   - Personal information: Full name, profile photo (file upload or URL), headline, bio, college, department, email, phone.
   - Automatic social icon detection: Paste any URL (Instagram, LinkedIn, GitHub, X, YouTube, Behance, Dribbble, Website) and UC automatically recognizes the platform and attaches official brand icons.
   - Live mobile card preview side-by-side with the editor.
   - Post-publication drawer with instant public link, copy button, QR download, and `+ CREATE NEXT CARD` (which clears the form while keeping previous participants intact).

4. **Canva-Style Visual Card Editor (`/studio/editor/:id`)**
   - Full drag-and-drop element repositioning.
   - Resize handles with multi-axis support.
   - In-line and sidebar typography controls (font size, weight, color, alignment).
   - Card background and theme color customization.
   - Multi-step Undo and Redo history stack.
   - Structured JSON design persistence.

5. **10 Original Handcrafted Templates**
   1. *Minimal White* — Scandinavian gallery aesthetic.
   2. *Premium Black* — Obsidian luxury with metallic borders.
   3. *Crimson & Charcoal Developer* — Signature UCHIHA CONNECT deep crimson palette.
   4. *Editorial Cream* — Warm cream with DM Serif Display editorial typography.
   5. *Futuristic Technology* — Cyber slate with neon cyan accents.
   6. *Professional Blue* — Executive navy and cobalt trust.
   7. *Creative Gradient* — Sunset coral/orange banner with glass cards.
   8. *Luxury Black and Gold* — Brushed gold typography and matte charcoal.
   9. *Modern Portfolio* — Split-view showcase with large photo emphasis.
   10. *Minimal Dark* — Matte graphite with crisp typography.

6. **Public Participant Digital Cards (`/p/:username`)**
   - Permanent URLs: `/p/ashi`, `/p/rahul`, `/p/priya`.
   - Mobile-first, responsive on iOS, Android, tablets, and desktops.
   - Instant "Save Contact" (generates and downloads RFC-compliant vCard `.vcf`).
   - One-click share with QR popup modal.
   - Direct mail, phone, and social links opening safely in new tabs (`rel="noopener noreferrer"`).
   - Strictly blocks access to draft or unpublished cards with an elegant unavailable notice.

7. **Print-Ready QR Codes & Bulk ZIP Export**
   - Unique high-resolution QR codes (PNG & SVG).
   - Print badge layout containing participant name, ID, and UCHIHA CONNECT banner.
   - Single-click bulk ZIP export generating all 30 QR codes organized with an `INDEX.md`.

---

## ✦ Getting Started (Local Development)

### 1. Start Backend API Server
```bash
node server/index.js
# Runs on http://localhost:3001
```

### 2. Start Vite Frontend
```bash
npm run dev
# Runs on http://localhost:5173
```

### 3. Open Organizer Studio
Navigate to `http://localhost:5173/studio`.
- Default Organizer PIN: **`2026`**

---

## ✦ Supabase Setup (Optional Production Database)

1. Open your Supabase Dashboard.
2. Go to the **SQL Editor**.
3. Paste and run the migration file from:
   `supabase/migrations/001_create_tables.sql`
4. Copy your Supabase URL and keys into `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## ✦ Vercel Deployment

1. Import the repository into [Vercel](https://vercel.com).
2. Configure the environment variables from `.env.example`.
3. Deploy!
