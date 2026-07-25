# Asset migration — JPG/PNG → WebP (+ AVIF)

**Status — all five passes complete:**
- ✅ **P1 — the six catalog PNGs** — §2. 10.33 → 0.31 MB.
- ✅ **P2 — 57 JPGs under `public/images/`** — §3. −38% on the adopted set.
- ✅ **P3 — `public/mockups/`** — §4. 9.69 → 0.30 MB.
- ✅ **P4 — resizing to measured slots** — §5. Plus 1.57 MB of dead art removed.
- ✅ **P5 — `srcset` for card-vs-lightbox sections** — §6. Card bytes −50%.
- ⏳ **AVIF** — §8. Not started, low priority.
- ❌ Nothing has been **deleted**. Masters moved to `assets-src/` (outside
  `public/`, so they no longer deploy). See `assets-src/README.md`.

**Net: `dist/` ~30.0 MB → 8.67 MB (−71%).**

Measured from the working tree on 2026-07-25. Figures inside each section are
snapshots *at that step*; §7 is the only authoritative final tally.

---

## 1. Why this matters

| Format | Files | Total |
|---|---:|---:|
| PNG | 6 | **10.02 MB** |
| JPG | 57 | 3.99 MB |
| WebP (already migrated) | 18 | 2.37 MB |
| **Total raster** | **81** | **16.38 MB** |

**86% of the non-WebP weight sits in six files.** `public/designs/catalog-1..6.png`
are the six "Shop by category" cards — the second section on the homepage. Each
is a **1122×1402 photographic image stored as lossless PNG at ~1.6 MB**.

This is the single largest performance defect on the site. PNG is the wrong
container for photographic content; these should never have shipped as PNG.

---

## 2. Priority 1 — the six catalog PNGs ✅ DONE

Encoded with Pillow at **WebP q82, method 6**, two widths each. **Measured, not
estimated:**

| Master (moved to `assets-src/`) | 800w | 400w | Saving |
|---|---:|---:|---:|
| `catalog-1.png` — 1.60 MB | 36 KB | 13 KB | 97.0% |
| `catalog-2.png` — 1.59 MB | 42 KB | 15 KB | 96.5% |
| `catalog-3.png` — 1.63 MB | 36 KB | 13 KB | 97.1% |
| `catalog-4.png` — 1.77 MB | 37 KB | 12 KB | 97.3% |
| `catalog-5.png` — 1.79 MB | 40 KB | 13 KB | 97.1% |
| `catalog-6.png` — 1.65 MB | 42 KB | 15 KB | 96.6% |
| **Total 10.02 MB** | **234 KB** | **81 KB** | **−96.9%** |

`dist/designs/` went from **10.33 MB → 0.31 MB**.

### Responsive variants — wired up
`CATALOG_CARDS` in `src/App.jsx` now ships:

```jsx
srcSet={`${c.img400} 400w, ${c.img} 800w`}
sizes="(min-width: 1024px) 400px, 50vw"
width={800} height={1000}
```

Verified in-browser: a 390 px phone slot (195 CSS px × DPR 2.05) resolves to the
**400w** file; a DPR-1 desktop slot (387 CSS px) also resolves to **400w**; the
**800w** file serves retina desktops (387 × 2 = 774 px). Total `/designs/`
transfer for all six cards: **83 KB**.

`src/designer/data.js` (`catalog.img` in the product registry) was updated to the
800w WebP too, so the registry cannot drift back to the PNGs.

---

## 3. Priority 2 — the 57 JPGs under `public/images/` ✅ DONE

WebP q82, **same dimensions** (no downscaling — these are used at varied sizes).

| | Result |
|---|---|
| Converted and adopted | **55 of 57** |
| Adopted set | 3.69 MB JPG → **2.28 MB WebP (−38.2%)** |
| JPG originals retired to `assets-src/images/` | **50 files, 3.21 MB** |
| JPGs deliberately kept in `public/` | **7** |
| `dist/images/` *(after this step; §5 and §6 change it again)* | 6.36 MB → **5.43 MB** |

### The ≥15% adoption threshold
Two files were converted, measured, and then **rejected** because WebP barely
beat the JPG — shipping a second copy for no gain is pure churn:

| File | WebP gain | Decision |
|---|---:|---|
| `images/mini/mini-3x3.jpg` | 0.1% | keep JPG, WebP deleted |
| `images/frames/traditional-ornate-live.jpg` | 9.9% | keep JPG, WebP deleted |

### The 7 JPGs still in `public/` — do not remove
Five carry **`og:image` / `twitter:image` / JSON-LD duty**. WhatsApp is Drucka's
main order channel and its link-preview handling of WebP is unreliable, so the
JPG must stay reachable:

`hero-lifestyle.jpg` · `tshirt.jpg` · `mug.jpg` · `prints/print-1.jpg` ·
`frames/premium-golden-live.jpg`

Plus the two threshold rejects above. Verified: **every prerendered `og:image`
URL resolves to a real file on disk.**

`src/seo/landings.js` now carries both fields — `image` (JPG, for og/JSON-LD)
and `imageWebp` (shown to visitors). `ProductLanding.tsx` renders
`data.imageWebp ?? data.image`, so a landing with no adopted WebP still works.

## 4. Priority 3 — `public/mockups/` ✅ DONE

**9.69 MB → 0.30 MB (−96.9%).** All 20 mockups are now WebP q82.

### The alpha question — resolved
Every PNG was inspected before encoding. **None of them use transparency:**
five were RGB (no alpha channel at all) and five were RGBA with a
*fully opaque* alpha channel (min=255 — dead weight). Lossy WebP was therefore
safe, and the RGBA files were flattened to RGB before encoding.

| File | PNG | WebP | Saving |
|---|---:|---:|---:|
| `cushion-front-white` | 1499 KB | 64 KB | 95.7% |
| `canvas-front-white` | 1245 KB | 21 KB | 98.3% |
| `frame-front-white` | 1086 KB | 9 KB | 99.1% |
| `frame-front-black` | 1041 KB | 19 KB | 98.2% |
| `mug-front-white` | 1016 KB | 18 KB | 98.3% |
| `keychain-front-white` | 945 KB | 18 KB | 98.1% |
| `kids-model-front/back-white` | 1438 KB | 31 KB | 97.8% |
| `kids-tshirt-front/back-white` | 1326 KB | 12 KB | 99.1% |
| **10 PNGs total** | **9.37 MB** | **0.19 MB** | **−98.0%** |

The ten tshirt-line JPGs were converted too (326 KB → 117 KB, −64%), so the
resolver's first candidate always hits instead of 404-ing twice.

### Both resolvers updated
1. `getMockupAsset` (src/App.jsx) — the candidate chain now tries
   `.webp` → `.png` → `.jpg`. Purely **additive**: a missing WebP falls
   through exactly as before, so dropping a legacy file back in still works.
2. `product.mockups.ext` (src/designer/data.js) — set to `"webp"` for the
   eight products with real assets. `poster`, `stickers` and
   `invitation-cards` keep `"png"` because they have **no** mockup files at
   all; behaviour there is unchanged (placeholder).

`public/mockups/README.txt` updated to document WebP as the expected format.

### Verified after retiring the originals
- All 20 `.webp` return `content-type: image/webp`.
- The retired `.png`/`.jpg` return `text/html` — note the SPA rewrite in
  `vercel.json` serves `index.html` for any missing path, so a missing image
  is a **200 with HTML**, never a 404. The `onError` chains still fire because
  HTML fails to decode as an image.
- Editors opened and the correct WebP loaded, with no fallback request and no
  "Mockup image missing" placeholder:
  `frame-front-black.webp` (19,132 B, 928×1152) ·
  `mug-front-white.webp` (18,120 B) ·
  `tshirt-front-white.webp` (7,204 B, 760×905)
- Homepage: 29 images, **0 broken** (28 WebP + 1 JPG).

> ⚠ Unrelated pre-existing bug found while testing: the **Cushion** catalog
> card does not open any editor (silent no-op, no console error). Confirmed
> not caused by this migration — `editorFlags.js` and the editor shells are
> untouched. Canvas and Keychain may share it. Tracked separately.

---

## 5. Priority 4 — resizing `public/images/` ✅ DONE

Re-encoding was exhausted; the remaining question was **dimensions**. Every
image's real slot was measured in the browser at 1440 and 390 px rather than
assumed, because most of them turned out to be sized correctly already.

### Measured over-delivery (natural width ÷ CSS slot, desktop)

| Folder | Natural | Max slot | Over | Verdict |
|---|---:|---:|---:|---|
| `frames/*-live` | 1000 px | 150 px | 6.7× | **resized → 400 px** |
| `prints/print-2..4` | 420 px | 84 px | 5.0× | **resized → 250 px** |
| `gallery/` | 1200 px | 360 px card | 3.3× | **kept** — lightbox shows it at **868 px** |
| `studio/` | 1200 px | 592 px | 2.0× | kept — exactly retina |
| `hero/` | 1920 px | 1425 px | 1.3× | kept — full-bleed |
| `designs/` | 400/800 px | 387 px | 1.0× | already optimal |
| `frames/premium-golden-live` | 1000 px | **590 px** | 1.7× | kept — /photo-frames landing hero |
| `prints/print-1` | 420 px | **590 px** | 0.7× | kept — already **upscaled**, do not shrink |

Result: **138 KB → 47 KB (−66%)** across the seven files that had real headroom.
Modest in absolute terms — which is the finding. The raw folder sizes suggested
far more headroom than actually existed.

### Three traps this avoided
1. **The lightbox.** `GalleryWalls` (and `StatementCollection`, `PhoneCases`)
   open a `Lightbox` that renders the image at **868 CSS px**. Sizing gallery
   art to its 360 px card would have visibly degraded every lightbox.
2. **Landing heroes.** `premium-golden-live` and `print-1` are the hero images
   on `/photo-frames` and `/photo-prints`, shown at 590 px — not the 150 px and
   84 px thumbnails they also appear as on the homepage.
3. **The frame customiser.** The non-`-live` frame files are consumed by
   `customizerData.ts` inside the lazy-loaded `PhotoFrameCustomizer`. That modal
   could not be opened during testing, so its display size is **unmeasured** and
   those files were **left untouched**.

### Dead weight removed: `images/scroll/` (1.57 MB)
Nine files referenced only by `ScrollShowcase`, which is neither imported nor
rendered (turned off in Phase 1). Moved to `assets-src/images/scroll/`. The
re-enable comment in `src/App.jsx` now lists all three steps needed to restore
the intro, including moving this art back.

### Verified
Homepage and landings at 1440 and 390 px: **0 broken images, and no image is
upscaled** (natural width ≥ CSS width everywhere). Resized files retain
3.8–5.2× headroom on mobile. All four landing `og:image` URLs still resolve to
their unchanged JPGs.

---

## 6. Priority 5 — `srcset` for the gallery cards ✅ DONE

The one case where resizing was impossible but `srcset` worked. `GalleryWalls`
renders a fixed **360 px** card, yet its image is 1200 px because the same file
is opened in the `Lightbox` at **868 px**. Every visitor was downloading
lightbox-grade art for a thumbnail they might never click.

A 720 px card variant was generated per wall (`<name>-720.webp`):

```jsx
src={wall.card}
srcSet={`${wall.card} 720w, ${wall.image} 1200w`}
sizes="360px"
```

The card slot is a fixed `w-[360px]` at **every** breakpoint, so `sizes` is an
exact value rather than a guess. Selection: 1× and 2× displays take the 720w
file; only a 3× display reaches for the 1200w. The `Lightbox` still points at
`wall.image` directly, so its quality is untouched — and that file is now
fetched **on demand**, only when a card is actually opened.

No `width`/`height` attributes: these files have differing ratios
(1200×896, but `grand-gallery` is 1200×670) and the `aspect-[7/5]` wrapper
already reserves the space, so a single hardcoded pair would have been wrong.

| | Before | After |
|---|---:|---:|
| Gallery bytes on homepage load | 498 KB | **235 KB (−52.9%)** |
| Lightbox image | 1200 px, eager | 1200 px, **on demand** |

Verified at 1440 and 390 px: all six cards select the 720w file; opening a
lightbox fetches `osaka-trio.webp` (1200×896, 110 KB) and renders it at 868 px;
0 broken, 0 upscaled.

### Same treatment for `statement/` and `phonecases/`
Both carry the identical card-vs-lightbox pattern. They are currently **off the
homepage**, so they were temporarily rendered on the dev server to measure real
slots, then reverted — the widths below are measured, not computed.

| | `statement/` | `phonecases/` |
|---|---|---|
| Grid | 2 / 3 / 4-up | 1 / 3-up |
| Widest card slot | **304 px** @ vw 1023 | **591 px** @ vw 639 |
| Slot @ 1440 | 286 px | 368 px |
| Lightbox | 648 px | 648 px |
| Source | 1000 px | 900 px |
| Card variant | `-640.webp` | `-640.webp` |
| Card bytes | 661 KB → **327 KB** | 173 KB → **101 KB** |

**The widest slot is not the desktop one in either case** — this is the whole
reason the breakpoint edges had to be measured. `phonecases` is 1-up below the
`sm` breakpoint, so at vw 639 its card is 591 px: **1.6× wider than at 1440**.
Sizing from the desktop slot alone would have shipped a visibly soft image to
every phone in the 590–639 px range.

```jsx
/* statement */ sizes="(min-width: 1280px) 290px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 47vw"
/* phonecases */ sizes="(min-width: 1280px) 375px, (min-width: 640px) 29vw, 93vw"
```

Verified selection, including the retina path:

| Viewport | DPR | `statement` picks | `phonecases` picks |
|---|---:|---|---|
| 1440 | 1 | `-640` | `-640` |
| 639 | 2 | `-640` (296×2=592) | **full 900w** (591×2=1182 → best available) |

That escalation is the srcset doing exactly its job: the same markup serves the
small file to a desktop and the full file to a retina phone at the widest slot.
Lightboxes still use `image` directly — verified at 648 px from the 1000 px
source, unchanged.

---

## 7. Where the payload stands

| Folder | Before | After |
|---|---:|---:|
| `dist/designs/` | 10.33 MB | **0.31 MB** |
| `dist/images/` | 6.36 MB | **4.41 MB** |
| `dist/mockups/` | 9.69 MB | **0.30 MB** |
| **`dist/` total** | **~30.0 MB** | **8.67 MB (−71%)** |

Card bytes actually transferred, per section, at desktop:

| Section | Before | After |
|---|---:|---:|
| `gallery/` | 498 KB | **235 KB** |
| `statement/` | 661 KB | **327 KB** |
| `phonecases/` | 173 KB | **101 KB** |
| **Total** | **1332 KB** | **663 KB (−50%)** |

> Note the deploy grew by ~0.23 MB in §6 while **what a visitor downloads went
> down**. Both the 720w and 1200w gallery files ship, but no one fetches both.
> Deploy size and transferred bytes are different metrics — optimise the second.

Remaining `dist/images/` weight is files correctly sized for their slots —
`gallery/`, `statement/` and `phonecases/` have all had the §6 treatment, so
there is no obvious blanket win left.

The two places still worth a look, both deliberately skipped:

- **The non-`-live` frame files** (`customizerData.ts`, inside the lazy-loaded
  `PhotoFrameCustomizer`). Their display size was never measured because the
  modal would not open during testing — see §5. Measure before touching.
- **`hero/`** at 0.66 MB. Correctly sized at 1.3× for a full-bleed slot, but
  `hero-2.webp` is 218 KB and could take a lower quality setting without a
  visible cost, since it is a background under a dark gradient.

## 8. AVIF — still not started

Optional pass via `<picture>`. Typically another 15–25% over WebP at the cost of
slower encodes and a second variant set. Low priority now that the payload is
down 71%.
