# Drucka static storefront — pre-launch checklist

Status on 2026-10-07. Branch `static/simple-storefront`, **uncommitted, not deployed**. This file is not part of the
built site (only `static/` and the generated pages ship). `npm run build` prints the short version of the open items
(`LAUNCH_BLOCKERS` in `data/catalog.js`).

## 1. Image rights

No status below is assumed. "Unknown" means nobody has shown a source or licence in writing yet.

### Shipped by this static site

| Asset | Where | Status | Note |
| --- | --- | --- | --- |
| `static/favicon.svg` ("D" mark) | browser tab, every page | AI-generated with known source | Drawn as SVG code by Claude in this branch; no third-party artwork. |
| Five line icons on cards (wallpaper, photo, prints, shop, school) | Home, cards | AI-generated with known source | Inline SVG drawn in `scripts/build.mjs` by Claude in this branch. |
| WhatsApp glyph | every WhatsApp button | Unknown / needs confirmation | Standard WhatsApp logo shape, carried over from the old site; source of the SVG path not recorded. It is Meta's trademark, used only to link to WhatsApp. Check WhatsApp's brand guidelines. |
| Fonts: Inter, Fraunces, Mukta | all pages | Confirmed licensed | SIL Open Font License. Fraunces and Mukta downloaded from Google Fonts on 2026-10-07 with the owner's permission; Mukta is used only for the ₹ sign since the Marathi text was removed (2026-10-08); Inter carried over from the old site. |
| Photos | none | — | The build fails if any raster image or `<img>` ships while `IMAGES_APPROVED = false`. |

### Old site pictures (NOT shipped by this branch, but still live on www.drucka.in until this branch is deployed)

All **Unknown / needs confirmation**: no source or licence is recorded in the repo or its history. 118 files in
`public/` (plus 95 working copies in `assets-src/`):

| Folder (origin/main) | Files | Examples | Status |
| --- | --- | --- | --- |
| `public/images/hero` | 4 | hero-1, hero-2, hero-3 | Unknown / needs confirmation |
| `public/images/categories` | 14 | girls-tshirt, hoodie-1 | Unknown / needs confirmation |
| `public/images/frames` | 13 | classic-black, designer-black-gold | Unknown / needs confirmation (looked like stock/retail photos) |
| `public/images/gallery` | 12 | gallery-wall-set, grand-gallery | Unknown / needs confirmation |
| `public/images/statement` | 16 | burano, fuji | Unknown / needs confirmation |
| `public/images/phonecases` | 6 | case-1, case-2 | Unknown / needs confirmation |
| `public/images/prints` | 5 | print-1, print-2 | Unknown / needs confirmation |
| `public/images/mini` | 3 | mini-2x3, mini-3x3, mini-4x3 | Unknown / needs confirmation |
| `public/images/studio` | 2 | made-in-studio, delivered-in-india | Unknown / needs confirmation (may be Drucka's own; confirm) |
| `public/images` (top level) | 10 | canvas, cushion, frame | Unknown / needs confirmation |
| `public/mockups` | 21 | canvas-front-white, frame-front-black | Unknown / needs confirmation |
| `public/designs` | 12 | catalog-1, catalog-2 | Unknown / needs confirmation |

To use any picture: Drucka confirms in writing that it owns it or holds a licence (or it is replaced with Drucka's
own photo), then set `IMAGES_APPROVED = true` in `data/catalog.js`.

## 2. Business and legal (pending; nothing invented)

- [ ] Registered business / legal entity name (not in policies or structured data)
- [ ] GSTIN
- [ ] Grievance officer name and contact
- [ ] Policy pages (Shipping, Returns, Privacy) stay **not production-ready** until the three items above are added
- Structured data (`Store` JSON-LD on Home) holds only confirmed facts: name, URL, phone, email, Kolhapur address,
  founding date 1996-06-29 (owner-confirmed), Instagram. No legal name, tax ID, reviews or ratings.

## 3. Wallpaper costing (pending)

- [ ] Supplier quotations
- [ ] Physical mapping of WP-01 to WP-05 to supplier rolls (site names differ from blueprint names, e.g. WP-01
      "Smooth Non-Woven" vs "Coarse")
- [ ] Raw-material costing in `../costing/Drucka-wallpaper-costing.xlsx`; normalise all five media to one GST basis
      after the CA confirms the input-credit position
- [ ] Confirm or change the starting prices ₹99 / ₹149 / ₹199 per sq ft, then assign each media to a tier
- [ ] "Best for" note per media

## 4. Delivery economics (pending)

- [ ] Confirm the prints/frames rule: delivery from ₹49, free on orders of ₹2,999 and above (copied from the old
      policies). Check large frames (18×24″, 24×36″) for volumetric courier cost.
- Wallpaper and large-format delivery: charged separately per order (owner ruling), no rule to set yet.

## 5. Other open items

- [ ] Mini prints: only "packs from ₹190" approved; no size-wise prices
- [ ] Canvas and frames: no confirmed sizes, prices or frame styles (enquiry only)
- [ ] Photo décor, mobile back covers, commercial, Schools & Hospitals: quote only; no catalogue PDF, site-visit offer,
      project photos or institution logos
- [ ] Real-device and screen-reader testing (automated checks only so far)
- [ ] Deployment: www.drucka.in still serves the OLD site ("Custom T-Shirts … Personalized Gifts", ₹19 starting
      price, mugs, cushions, gallery-wall sets). It changes only when this branch is reviewed, committed and deployed
      with the owner's permission.

## 6. Claims the build refuses (`scripts/verify.mjs`)

Any Marathi (Devanagari) text, including inside pre-filled WhatsApp messages (owner, 2026-10-08). "Free reprint guarantee", any 24-hour / "24 तास" turnaround, same-day promises, any WP code, waterproof / washable /
eco-friendly / fire- or flame-retardant / non-toxic claims, a wallpaper "₹X / sq ft" without "from", the ₹49 /
₹2,999 rule on the wallpaper page, any unapproved ₹ figure, and any ₹ on the quote-only pages.

## 7. Before merging to `main` (retiring the old app)

Production (`main`, commit `3412618`) still runs the old React app **with a live backend**. Merging this branch removes
it (commit `4ea2591`). The owner checks these in their own dashboards; Claude does not log in to them.

### What stops working at merge

| Old feature | Where | After merge |
| --- | --- | --- |
| Online checkout | `/api/razorpay/create-order` | gone |
| Razorpay webhook (mark paid → upload artwork → create Qikink order) | `/api/razorpay/webhook` | 404; Razorpay keeps retrying until disabled |
| Daily order-status cron (Qikink sync, COD Purchase event) | `/api/cron/poll-orders`, 03:00 | removed from `vercel.json` |
| Orders and tracking | `/api/orders`, `/api/orders/track`, `/track` | gone; `/track` now redirects to `/order-tracking` (WhatsApp) |
| Admin and artwork upload | `/admin`, `/api/admin/product-map`, `/api/upload-artwork` | gone; `/admin` redirects home |
| Meta Pixel and CAPI Purchase events | site-wide | gone (affects ads that optimise on Purchase) |

### Checks, in this order

- [ ] **Razorpay — deferred by the owner (2026-10-08), check later, before merging:** any real payments taken on
      www.drucka.in recently? Note them before merging.
- [ ] **Supabase — deferred by the owner (2026-10-08), check later, before merging:** in the project that really
      holds the orders, any paid / processing orders not yet delivered? Finish them by hand. Identifying this project
      also settles the two test orders `TEST-DUPE-9f3k2a` and `TEST-TAMPER-7q2m9x` (do not delete them until the
      project is confirmed).
- **Qikink — not needed (owner, 2026-10-08):** Drucka does not use Qikink. All Qikink code was already removed in
  `4ea2591`; its Vercel env vars go with the other backend env vars below.
- [ ] **Owner confirms** retiring the old admin / order-management flow. It is recoverable if needed: the code stays
      on `main` (`3412618`) and on the PR #46 branch, and Vercel's Instant Rollback can restore the previous deployment.
- [ ] Push this branch → check the Vercel **preview**: redirects (incl. `/track` → `/order-tracking`), WhatsApp
      buttons and messages, policies, SEO tags, mobile layout.
- [ ] Merge to `main` only after the preview is approved → smoke-test production.
- [ ] **At merge:** disable the Razorpay webhook in the Razorpay dashboard.
- [ ] **Only after merge + smoke test + a few stable days:** remove the old backend env vars in Vercel (Razorpay,
      Supabase, Qikink, Cloudinary, CAPI, `CRON_SECRET`). Not earlier: a rollback to the old deployment needs them.
- [ ] Redirects stay temporary (307) for now; consider 308 once the site is final (the guard enforces 307 until then).
