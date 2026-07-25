# assets-src — original master images

Files here are **masters, not shipped assets**. This folder sits outside
`public/`, so Vite does not copy it into `dist/` and none of it is deployed.

## designs/

`catalog-1..6.png` — the original 1122×1402 lossless PNG masters for the six
"Shop by category" cards. They were previously in `public/designs/` and were
being served to every visitor at ~1.6 MB each (10.02 MB total).

They are now encoded to WebP q82 at two widths, and those variants live in
`public/designs/`:

| Master | Shipped | Size |
|---|---|---|
| `catalog-N.png` (1122×1402) | `catalog-N-800.webp` | 35–43 KB |
| | `catalog-N-400.webp` | 12–15 KB |

**10.02 MB → 0.31 MB (−96.9%).**

Keep the masters. Re-encoding from an already-lossy WebP would compound
artefacts — always regenerate from the PNG here.

## Regenerating

Requires Python with Pillow (`pip install Pillow`):

```bash
python3 -c "
from PIL import Image
for i in range(1,7):
    im = Image.open(f'assets-src/designs/catalog-{i}.png').convert('RGB')
    for w in (800, 400):
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(
            f'public/designs/catalog-{i}-{w}.webp', 'WEBP', quality=82, method=6)
"
```

Consumers of these paths: `CATALOG_CARDS` in `src/App.jsx` (uses both widths
via `srcset`) and the `catalog.img` field in `src/designer/data.js` (800w).

See `ASSET-MIGRATION.md` in the repo root for the remaining JPG directories,
which have **not** been converted.
