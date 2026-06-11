# Drucka × Qikink — Deployment Guide

## Deployment modes (pick one per stage)

### A) Local development
```
cd drucka-site
npm install
npm run dev          # http://localhost:5173
```
No backend needed — API calls fall back to localStorage + demo payloads.
To test the staging banner locally: create `.env.local` with `VITE_STAGING=true`.

### B) Vercel STAGING (safe testing — current stage) ✅
1. `vercel link` (once), then deploy a PREVIEW: `vercel` (no `--prod`).
2. Vercel → Settings → Environment Variables → scope **Preview**:
   - All vars from `.env.example`, with the SAFE staging values:
     `QIKINK_MODE=sandbox` · `AUTO_SEND_ON_PAID=false` · `ALLOWED_ORIGIN=*`
   - `VITE_STAGING=true` → testers see the amber **STAGING** banner.
3. Frontend flags already match staging: `ENABLE_COD_TESTING=true`,
   `ENABLE_RAZORPAY=false` (in `src/App.jsx` → `FEATURES`).
4. Share the `*.vercel.app` preview URL for testing. Nothing auto-sends
   to Qikink; COD test orders need manual admin approval + send.

### C) Hostinger frontend + Vercel backend (split hosting)
1. Deploy the backend to Vercel as in (B) — the `api/` functions are the
   only part that needs Node.
2. Build the frontend with the backend URL baked in:
   ```
   set VITE_API_BASE_URL=https://your-project.vercel.app   (Windows)
   npm run build
   ```
3. Upload the `dist/` folder contents to Hostinger `public_html/` via
   File Manager or FTP.
4. On Vercel set `ALLOWED_ORIGIN=https://your-hostinger-domain` (CORS).
5. Razorpay webhook URL still points at Vercel:
   `https://your-project.vercel.app/api/razorpay/webhook`.

### D) Hostinger VPS / Node.js full app (no Vercel)
1. Needs a Node 18+ VPS plan (shared hosting can't run the API).
2. Wrap the `api/` handlers in an Express server, e.g.:
   ```js
   import express from "express";
   import ordersHandler from "./api/orders.js";
   const app = express();
   app.use(express.json({ limit: "5mb" }));
   app.all("/api/orders", (req, res) => ordersHandler(req, res));
   // ...same for the other 8 endpoints; mount the webhook with
   // express.raw({ type: "*/*" }) so the signature sees raw bytes
   app.use(express.static("dist"));
   app.listen(3000);
   ```
3. Put env vars in the VPS environment (PM2 ecosystem file or systemd),
   never in the repo. Run behind Nginx + HTTPS (certbot).
4. This mode is more work — (C) is recommended unless you must leave Vercel.

---

# Production setup details (Vercel)

## Architecture

```
Drucka React site (Vite, static)
        │ fetch
        ▼
Vercel serverless functions (/api/*)        ← all secrets live here
   ├─ /api/orders               → Supabase (orders table)
   ├─ /api/upload-artwork       → Cloudinary (signed upload)
   ├─ /api/qikink/token         → Qikink auth (token cached server-side)
   ├─ /api/qikink/create-order  → Qikink order + saves qikink_order_id
   └─ /api/qikink/order-status  → Qikink polling + saves tracking number
```

The frontend works WITHOUT the backend too (localStorage + WhatsApp +
demo payload), so nothing breaks during rollout.

## Step-by-step

1. **Supabase** — create a project at supabase.com → SQL Editor → run
   `supabase/schema.sql`. Copy the Project URL and the **service_role**
   key (Settings → API). Do NOT use the anon key here.

2. **Cloudinary** — create a free account → Dashboard → copy cloud name,
   API key, API secret.

3. **Qikink** — https://creator.qikink.com/dashboard → API section →
   copy Client ID + Client Secret. Start with sandbox.
   ⚠ Open the API docs there and confirm the endpoint paths/fields used
   in `api/_lib/qikink.js`, `create-order.js`, `order-status.js` —
   adjust if your account's docs differ.

4. **Product mapping** — fill REAL Qikink product IDs + SKU patterns in
   `QIKINK_PRODUCT_MAP` (src/App.jsx) from your Qikink dashboard:
   Regular T-Shirt / Polo / Kids T-Shirt / Hoodie / Mug.

5. **Vercel** — `npm i -g vercel`, then from `drucka-site/`:
   ```
   vercel login
   vercel link        # create the project
   ```
   Project settings: Framework = Vite, Build = `npm run build`,
   Output = `dist` (Vercel builds in the cloud, so the local R:-drive
   folder locks don't matter).

6. **Environment variables** — Vercel → Project → Settings →
   Environment Variables. This is a **Vite + Vercel API** project (NOT
   Next.js) — there are no `NEXT_PUBLIC_` variables anywhere.

   **Add these (backend secrets — server-side only):**

   | Variable | Staging (Preview) | Live (Production) |
   |---|---|---|
   | `QIKINK_CLIENT_ID` | your Qikink client id | same |
   | `QIKINK_CLIENT_SECRET` | your Qikink client secret | same |
   | `QIKINK_MODE` | `sandbox` | `live` |
   | `AUTO_SEND_ON_PAID` | `false` | `true` (once Razorpay live) |
   | `SUPABASE_URL` | project URL | same |
   | `SUPABASE_SERVICE_ROLE_KEY` | service-role key | same |
   | `CLOUDINARY_CLOUD_NAME` | cloud name | same |
   | `CLOUDINARY_API_KEY` | API key | same |
   | `CLOUDINARY_API_SECRET` | API secret | same |
   | `ADMIN_SECRET` | strong random string | fresh strong value |
   | `ALLOWED_ORIGIN` | `*` | `https://www.drucka.in` |

   **Add these (frontend — PUBLIC, bundled into the browser build):**

   | Variable | Staging (Preview) | Live (Production) |
   |---|---|---|
   | `VITE_STAGING` | `true` (amber banner) | unset / `false` |
   | `VITE_API_BASE_URL` | empty (same origin) | empty on Vercel; the Vercel URL only when frontend is on Hostinger |

   **Optional (only when `ENABLE_RAZORPAY` is turned on):**
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.

   **Delete these old Next.js leftovers — nothing reads them anymore:**
   `NEXT_PUBLIC_ADMIN_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`,
   `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

7. **Deploy** — `vercel --prod`. Point drucka.in at the deployment
   (Vercel → Domains).

8. **Verify** —
   - Admin panel (footer → Admin) → enter the Admin API key
     (= ADMIN_SECRET) → Test connection → "Qikink sandbox connection OK ✓"
   - Place a test order → Mark Paid (admin) → Send to Qikink →
     real `qikinkOrderId` appears; check Supabase table + Qikink
     sandbox dashboard.
   - Orders tab → ⟳ status button → tracking number appears once
     Qikink ships.

9. **Go live** — flip `QIKINK_MODE=live`, re-test with one real order,
   then switch `ADMIN_SECRET` to a fresh strong value.

## Razorpay setup (live payments)

1. Razorpay Dashboard → Account & Settings → **API Keys** → copy
   `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` into Vercel env vars.
2. Dashboard → **Webhooks** → Add:
   - URL: `https://<your-domain>/api/razorpay/webhook`
   - Events: `payment.captured`, `order.paid`
   - Secret: same value as `RAZORPAY_WEBHOOK_SECRET` env var.
3. Set `AUTO_SEND_ON_PAID=true` so paid orders go straight to Qikink
   (webhook → mark Paid → upload artwork → create Qikink order).
4. Run `supabase/schema-update.sql` (payment columns + product_map table).
5. Admin → Product Mapping → fill REAL Qikink IDs/SKUs → Save mappings.

Flow: Customer designs → Checkout → Razorpay/UPI → order saved in
Supabase → webhook marks Paid → backend sends to Qikink → Qikink prints
& ships under the Drucka brand → tracking shows on the Drucka site.
WhatsApp ordering and COD-on-approval remain as fallbacks.

## 🚀 LIVE LAUNCH CHECKLIST

Qikink:
- [ ] Live API approved
- [ ] Sandbox test order created end-to-end
- [ ] Live product IDs copied into Admin → Product Mapping
- [ ] Variant SKU patterns copied + one SKU spot-checked per product
- [ ] Print areas confirmed against PHOTO_AREAS / placements
- [ ] Brand/packing slip settings checked (customer must see Drucka)
- [ ] Return address configured in Qikink account

Cloudinary:
- [ ] Signed upload working (POST /api/upload-artwork returns a URL)
- [ ] Artwork URL publicly reachable (open in incognito)
- [ ] Uploaded file quality OK (editor downscales to 700px — raise `max`
      in UploadPanel if Qikink needs higher print resolution)
- [ ] Folder `drucka-artwork` visible in Media Library

Supabase:
- [ ] schema.sql + schema-update.sql both run; orders + product_map exist
- [ ] RLS enabled on both tables, NO public policies
- [ ] service-role key only in Vercel env (never in frontend/localStorage)
- [ ] Admin → Orders → "Sync from server" works with the Admin API key

Vercel:
- [ ] All env vars from .env.example added (Production + Preview)
- [ ] All /api routes deployed (check Functions tab)
- [ ] Frontend build successful, drucka.in domain attached
- [ ] Admin → Test connection → "Qikink sandbox/live connection OK ✓"
- [ ] /api/upload-artwork test OK (send any order to Qikink once)

Payment:
- [ ] Razorpay account active (KYC done)
- [ ] Test payment success in test mode
- [ ] Webhook configured + delivering (Dashboard → Webhooks → logs)
- [ ] RAZORPAY_WEBHOOK_SECRET set and signature verified
- [ ] Paid order auto-sends to Qikink (AUTO_SEND_ON_PAID=true)

Customer experience:
- [ ] Order confirmation screen shows order ID after payment
- [ ] WhatsApp confirmation message arrives ("Notify Drucka" button)
- [ ] Track Order (footer) works with order ID + phone
- [ ] Refund/cancel policy page or FAQ entry added
- [ ] Support contact visible (WhatsApp button + footer email)
- [ ] Real UPI ID replaced in CONFIG.upiId (manual-UPI fallback)

## Optional next steps
- Vercel Cron → GET /api/qikink/order-status for open orders every 30
  min, then WhatsApp the customer on "Shipped" (WhatsApp Business API).
