/* ── Drucka catalogue — the ONE file to edit for prices, sizes and contact details ──
   Every page is generated from this file (npm run build), so a price changed
   here changes everywhere and the pages can never disagree with each other.

   What is approved for publishing and what is not (owner ruling, 2026-10-06):
   - Photo prints: sizes + prices confirmed by Drucka, 2026-09-21. No minimum order.
   - Mini prints: ONLY the pack figure "packs from ₹190" (₹19 x the 10-print minimum) and the
     minimum of 10 prints per order are approved. Size-wise prices are NOT approved (the old
     code charged ₹19 / ₹25 / ₹29 by size, but no verified source states the ₹25 and ₹29).
     Do not add per-size mini prices here until Drucka supplies a verified size-wise list.
   - Canvas Prints and Photo Frames: NO price list and NO size list has been confirmed, so the
     site shows no price and no fixed sizes; the customer asks on WhatsApp.
   - Frame styles and frame pictures: NOT approved (the six old pictures looked like stock/retail
     photos and the styles Drucka really offers are unconfirmed). The site shows none.
   - Delivery rule (from ₹49, free over ₹2,999, 2–4 days) and 7-day replacement:
     taken from the policies Drucka already published. */

export const SITE = {
  name: "Drucka",
  url: "https://www.drucka.in",
  tagline: "Your memories, beautifully printed.",
  /* owner confirmed 2026-10-07: printing since 29 June 1996. Shown as "since 1996" so it never goes out of date. */
  printingSince: 1996,
  foundingDate: "1996-06-29",
};

export const CONTACT = {
  whatsappDigits: "917083811355", // country code + number, no "+" or spaces
  whatsappDisplay: "+91 70838 11355",
  email: "hello@drucka.in",
  studio: "Kolhapur, Maharashtra 416001, India",
  instagram: "https://instagram.com/druc.ka",
};

export const DELIVERY = {
  from: 49, // ₹ starting delivery charge
  freeOver: 2999, // ₹ order value at or above which delivery is free
  /* owner ruling 2026-10-07: no "24 hours" promise; dispatch 3–5 working days after approval, then 2–4 days delivery */
  dispatch: "3–5 working days after you approve the design",
  days: "2–4 working days after dispatch",
  daysNote: "depending on location and courier",
};

/* Returns (owner ruling 2026-10-07):
   - photo prints, mini prints, photo frames: free replacement within RETURN_WINDOW_DAYS of delivery (unchanged);
   - custom-made products (wallpaper, photo décor incl. photo wallpaper and back covers, canvas, made-to-size
     commercial/institution work): no change-of-mind returns; defects, wrong items, our sizing errors and transit
     damage reported within CUSTOM_REPORT_HOURS of delivery, with photos/video, are verified and then
     replaced/reprinted or otherwise resolved. Do not advertise a "free reprint guarantee". */
export const RETURN_WINDOW_DAYS = 7;
export const CUSTOM_REPORT_HOURS = 48;

/* Regular photo prints — sold singly, no minimum. */
export const PHOTO_SIZES = [
  { id: "4x6", label: "4×6″", name: "Classic Photo Print", price: 39 },
  { id: "5x7", label: "5×7″", name: "Desk & Gift Print", price: 59 },
  { id: "6x8", label: "6×8″", name: "Large Memory Print", price: 89 },
  { id: "8x10", label: "8×10″", name: "Portrait & Framing", price: 129 },
  { id: "a4", label: "A4", name: "8.3 × 11.7″ Poster", price: 149 },
  { id: "a3", label: "A3", name: "11.7 × 16.5″ Poster", price: 299 },
  { id: "12x18", label: "12×18″", name: "Panoramic Wall Print", price: 399 },
];

/* Mini prints — small prints, minimum 10 PER ORDER across any mix of mini sizes.
   Only the pack figure is published; there is deliberately NO per-size price list. */
export const MINI_MIN = 10;
export const MINI_PACK_FROM = 190;
export const MINI_SIZE_RANGE = "2×3″ to 4×3″";

/* Canvas and frames: leave EMPTY until Drucka confirms the sizes it makes.
   Entry shape: { id: "8x12", label: "8×12″" } */
export const CANVAS_SIZES = [];
export const FRAME_SIZES = [];

/* ── Made-to-size wallpaper (Drucka.in Website Blueprint, 2026-10-07) ──
   Pricing (owner ruling 2026-10-07): ONLY three "starting at" prices per tier are published. They are NOT tied
   to a media and are never shown as a flat rate; the exact price depends on media, wall size and customisation
   and is confirmed on WhatsApp. Media-specific prices come later, after raw-material costing. */
export const WALLPAPER_TIERS = [
  { name: "Standard", from: 99 },
  { name: "Premium", from: 149 },
  { name: "Designer / Luxury", from: 199 },
];
export const WALLPAPER_STYLES = ["Botanical", "Pichwai", "Floral", "Luxury Interiors", "Skin Tones", "Heritage", "Vinyl"];
/* Customer-facing media names (owner ruling 2026-10-07). The site never shows the WP codes.
   `blueprintName` = the name the blueprint gave that code; internal reference only, never shown. The new names do
   not describe the same surface as several blueprint names (e.g. WP-01 "Coarse" -> "Smooth Non-Woven"), so check
   which physical roll each code means before taking orders.
   `show: false` = not offered on the site (WP-06 to WP-08, owner ruling 2026-10-07).
   `bestFor` = the one-line "which room / place" note, filled from Drucka's production experience. */
export const WALLPAPER_MEDIA = [
  { code: "WP-01", name: "Smooth Non-Woven", blueprintName: "Coarse", show: true, bestFor: "" },
  { code: "WP-02", name: "Canvas Texture", blueprintName: "Leather", show: true, bestFor: "" },
  { code: "WP-03", name: "Sand Texture", blueprintName: "Straw", show: true, bestFor: "" },
  { code: "WP-04", name: "Linen / Textile Texture", blueprintName: "Sand", show: true, bestFor: "" },
  { code: "WP-05", name: "Peel & Stick", blueprintName: "(not named)", show: true, bestFor: "" },
  { code: "WP-06", name: "Non-Woven", blueprintName: "Non-Woven", show: false, bestFor: "" },
  { code: "WP-07", name: "Diamond", blueprintName: "Diamond", show: false, bestFor: "" },
  { code: "WP-08", name: "Non-Adhesive Canvas", blueprintName: "Non-Adhesive Canvas", show: false, bestFor: "" },
];

/* ── Photo décor: the customer's own photo (blueprint /photo-decor). Enquiry only — no sizes or prices supplied. ── */
export const PHOTO_DECOR_MEDIA = ["Smooth", "Linen / Non-woven", "Canvas", "Sand", "Leather", "Peel & Stick"];

/* ── Commercial & wide-format (quote-based; no prices on the site) ── */
export const COMMERCIAL_SERVICES = [
  { name: "Vinyl stickers", detail: "Cut and printed vinyl for walls, windows and products." },
  { name: "Glass graphics", detail: "Frosted and one-way vision film for doors, cabins and shop windows." },
  { name: "Retail branding", detail: "Shop walls, counters and window displays." },
  { name: "Office graphics", detail: "Office walls, cabin glass and values walls." },
  { name: "Vehicle graphics", detail: "Graphics for cars, vans and other vehicles. Tell us the vehicle type." },
  { name: "Backlit signage", detail: "Backlit prints for signs and display boxes." },
  { name: "Fine-art reproduction", detail: "Reproductions of paintings and artwork for artists and collectors." },
];

/* ── Schools & Hospitals (blueprint /institutions; quote-based) ── */
export const INSTITUTION_THEMES = {
  schools: ["Alphabet", "World map", "Solar system", "Animals", "Marathi alphabet (Barakhadi)", "History timeline"],
  hospitals: ["Pediatric interiors", "Wayfinding", "Calm nature walls"],
};

/* Shown at the end of every build. None of these blocks a build; they are the list of things that
   must be settled before this site is treated as production-ready. Remove a line when it is done. */
/* No picture ships until Drucka has confirmed it owns, or is licensed to use, every picture it adds
   (the old site's hero, photo-print, mini-print, frame and canvas pictures have no recorded source or
   licence and were removed, owner ruling 2026-10-06). While this is false the build fails if ANY
   raster image or <img> tag ends up in the output; only the site's own favicon.svg and fonts ship.
   Set it to true only after the rights are confirmed in writing. */
export const IMAGES_APPROVED = false;

export const LAUNCH_BLOCKERS = [
  "Policy pages: business name, GSTIN and grievance officer details not provided — the Shipping, Returns and Privacy pages are NOT production-ready.",
  "Mini prints: only 'packs from ₹190' is approved; size-wise prices need a verified source.",
  "Canvas Prints and Photo Frames: sizes and prices not confirmed (the pages show none).",
  "Photo Frames: real styles not confirmed (the page lists none).",
  "Pictures: none ship (source/licence of the old site pictures is unknown). Add pictures only after Drucka confirms the rights, then set IMAGES_APPROVED = true in data/catalog.js.",
  "Delivery charge rule for photo prints, mini prints and frames (from ₹49, free on orders of ₹2,999 and above) is copied from the old policies and not re-confirmed. Wallpaper and large-format delivery is quoted per order; no shipping rule set yet.",
  "Wallpaper: only tier starting prices (₹99 / ₹149 / ₹199 per sq ft) are approved; media-specific prices wait for raw-material costing. No 'best for' note for any media yet.",
  "Wallpaper media: the customer-facing names (e.g. WP-01 'Smooth Non-Woven') differ from the blueprint names (WP-01 'Coarse'); confirm which physical roll each code is before taking orders.",
  "Photo décor, mobile back covers, commercial and Schools & Hospitals: no sizes or prices supplied (enquiry / quote only). No school catalogue PDF, site-visit offer, project photos or institution logos yet.",
  "Blueprint items left out because a static site cannot do them: live price calculator, wall preview/crop, cart and payment, upload, mega-menu, order tracker, exit-intent offer, analytics.",
  "www.drucka.in still serves the OLD site (T-shirts, gifts, ₹19) until this branch is reviewed, committed and deployed. Image-rights inventory: LAUNCH-CHECKLIST.md.",
  "Real-device and screen-reader testing not done.",
];
