# Drucka — simple static storefront

A plain static website for Drucka, following the static-safe parts of the *Drucka.in Website Blueprint*
(2026-10-07): **Wallpapers** (made to size), **Your own photo** (`/photo-decor`: photo wallpaper, décor prints,
mobile back covers, canvas, frames), **Photo Prints (+ Mini Prints)**, **Commercial** and **Schools & Hospitals**
(`/institutions`). Customers read the details, tap a WhatsApp button (the message is pre-filled with their choice),
send their photos or wall sizes in the chat, and Drucka confirms, prints and ships by hand.

```
Static website  ->  WhatsApp  ->  Drucka confirms  ->  print  ->  courier
```

## What this site deliberately does NOT have

No database, no Supabase, no Cloudflare, no Cloudinary, no Qikink, no Razorpay/online payment,
no customer login or admin panel, no order tracking page, no `api/` routes, no photo upload,
no analytics or Meta Pixel, no cookies, and **no JavaScript at all** on the pages.

`npm run build` enforces this: `scripts/verify.mjs` fails the build if the output contains a script,
a form, a link to any host other than WhatsApp, a backend/tracker reference, an inline style
(the CSP forbids it), a broken link, an image without `alt`, or a price that is not in
`data/catalog.js`. Canvas and Frames pages may not show any price at all.

## Changing things (no coding needed beyond editing text)

| To change | Edit |
| --- | --- |
| A photo/mini print price or size, contact numbers, delivery rule | `data/catalog.js` |
| Wallpaper styles, media names, starting prices, "best for" notes | `WALLPAPER_STYLES` / `WALLPAPER_MEDIA` / `WALLPAPER_TIERS` in `data/catalog.js` |
| Commercial services, school/hospital themes, photo décor media | `data/catalog.js` |
| Shipping / Returns / Privacy wording | `data/policies.js` |
| Colours, fonts, spacing | `static/site.css` |
| Page layout and copy | `scripts/build.mjs` |
| Pictures | none ship yet (see below); only `static/favicon.svg` and the fonts |

Prices are written once, in `data/catalog.js`; every page and every WhatsApp message is generated from it,
so the site cannot show two different prices for the same size. The guard also rejects any ₹ amount on a page that
is not an approved figure from that file.

Canvas and Photo Frames have **no confirmed sizes or prices**, so the site shows none: the customer asks on
WhatsApp. To publish a size list later, fill `CANVAS_SIZES` / `FRAME_SIZES` in `data/catalog.js`.

## Wallpaper prices, dispatch and returns (owner rulings 2026-10-07)

- **Prices:** only three *starting* prices are published: Standard from ₹99, Premium from ₹149, Designer / Luxury
  from ₹199 per sq ft (`WALLPAPER_TIERS`). They are not tied to a media and never shown as a flat rate; custom
  artwork is quoted on WhatsApp. Media-specific prices come later, after raw-material costing.
- **Media:** five customer-facing names (Smooth Non-Woven, Canvas Texture, Sand Texture, Linen / Textile Texture,
  Peel & Stick). The WP codes and the blueprint names stay inside `data/catalog.js`; WP-06 to WP-08 are hidden.
- **Dispatch:** normally 3–5 working days after the customer approves the design; delivery 2–4 working days after
  that, depending on location and courier. No "24 hours" promise anywhere.
- **Returns:** custom-made products (wallpaper, photo décor, canvas, made-to-size work) are not returnable for change
  of mind; defects, wrong items and transit damage must be reported within 48 hours with photos/video. Photo prints,
  mini prints and frames keep the 7-day free replacement.
- **Trust bar:** Printing since 1996 · Made-to-size wallpaper · Premium print quality · Secure packaging · Defect
  support. Do not add "free reprint guarantee", colour, waterproof, washable, eco-friendly, non-toxic or
  fire-retardant claims without a written policy or supplier certificate.

The guard fails the build on any ₹ amount that is not approved, on a WP code shown to customers, on "free reprint
guarantee", and on a 24-hour turnaround promise. Commercial, Schools & Hospitals and Your own photo pages are
quote-only: no ₹ may appear on them.

## Ready-made artwork: layout sample only

The ready-made artwork section does not exist yet (no design list, pictures or return rule). To look at where it will
go, run `npm run dev:sample`: it adds two clearly marked placeholder pages (`/ready-made` and
`/ready-made/sample-design`) with no real designs, prices, pictures or order buttons. They are `noindex`, left out of the
sitemap, and exist only with that flag: `npm run build` (what Vercel runs) never creates them, and the guard fails a
normal build that contains them.

## Run locally

```
npm run dev      # builds, then serves http://localhost:5190
npm run build    # builds into dist/ and runs the guard
```

Needs Node 18+. There are no dependencies to install.

## Deploy

Vercel serves the `dist/` folder (`vercel.json`: `npm run build`, output `dist`, strict security headers incl. a
CSP that allows nothing but this site's own files). No environment variables are needed. Old product URLs
(t-shirts, mugs, etc.) redirect to the home page; `/mini-prints` goes to the Mini Prints section.
The old app's pages also redirect (all temporary 307s, checked by the guard): `/shop`, `/catalog`, `/catalogue`,
`/cart`, `/login`, `/account`, `/admin` -> home; `/customize`, `/customise` -> `/photo-decor`; `/mini` -> Mini Prints;
`/track`, `/track-order` -> `/order-tracking` (a noindex page: tracking now happens on WhatsApp).

## NOT production-ready yet

Full pre-launch list, including the image-rights inventory: [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).

The same list is printed at the end of every `npm run build` (`LAUNCH_BLOCKERS` in `data/catalog.js`). It does not
block builds, so remove a line there only when it is truly settled.

- **Policy pages (Shipping, Returns, Privacy):** the registered business name, GSTIN and grievance officer details
  have not been provided. Do not treat these pages as production-ready.
- **Mini prints:** only "packs from ₹190" (minimum 10 prints per order) is approved. Size-wise prices (the old code
  charged ₹19 / ₹25 / ₹29) have no verified source, so none are shown. Add them only from a verified price list.
- **Canvas Prints and Photo Frames:** no confirmed sizes or prices, so the pages show none ("on WhatsApp").
- **Photo Frames:** Drucka's real frame styles are not confirmed, so the page lists none ("Frame options on WhatsApp").
- **Pictures:** none ship. The old site's hero, photo-print, mini-print, frame and canvas pictures have no recorded
  source or licence, so they were removed (the home hero is text-only). While `IMAGES_APPROVED` is `false` in
  `data/catalog.js`, the build fails if any raster image or `<img>` tag appears in the output. Add pictures only
  after Drucka confirms in writing that it owns them or is licensed to use them, then set it to `true`.
- **Delivery charges:** from ₹49 and free over ₹2,999 (photo prints, mini prints and frames only) are copied from the old policies and not re-confirmed. Wallpaper and large-format delivery is quoted per order.
- **Wallpaper:** media-specific prices and "best for" notes not supplied; confirm which physical roll each WP code is,
  because the customer-facing names differ from the blueprint names.
- **Photo décor, mobile back covers, commercial, Schools & Hospitals:** no sizes or prices (quote only); no school
  catalogue PDF, site-visit offer, project photos or institution logos.
- Left out because a static site cannot do them: live price calculator, wall preview/crop, cart and payment,
  upload, mega-menu, order tracker, exit-intent offer, analytics.
- Real-device and screen-reader testing has not been done.
