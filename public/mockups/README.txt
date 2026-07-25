DRUCKA — PHOTO MOCKUPS FOLDER
=============================

The editor loads blank-product photos from here. Missing files show a
"Mockup image missing" card with the exact expected filename.
Each view tries: selected colour (.webp, .png, .jpg) -> white (.webp, .png, .jpg).
WEBP IS PREFERRED - see ASSET-MIGRATION.md section 4.

NAMING (all lowercase):
  adult flat:   tshirt-front-white.webp      tshirt-back-white.webp
  adult male:   tshirt-male-front-white.webp tshirt-male-back-white.webp
  adult female: tshirt-female-front-white.webp tshirt-female-back-white.webp
  kids flat:    kids-tshirt-front-white.webp kids-tshirt-back-white.webp
  kids model:   kids-model-front-white.webp  kids-model-back-white.webp

  Replace "white" with: black | navy | red | yellow
  Same pattern for: oversized, hoodie, kids-hoodie, mug, frame,
  cushion, canvas, keychain (e.g. hoodie-front-black.webp)

ALREADY INSTALLED (2026-07-25, all .webp):
  tshirt front/back: white black navy
  tshirt male front/back: white
  tshirt female front/back: white
  kids-tshirt front/back: white
  kids-model front/back: white
  mug, frame (white+black), cushion, canvas, keychain: front white

  All 20 were re-encoded from PNG/JPG to WebP q82 (9.69 MB -> 0.31 MB).
  The originals are kept in assets-src/mockups/ - regenerate from those,
  never from the shipped WebP.

PHOTO SPECS:
  - Portrait 42:50 ratio (e.g. 840 x 1000 px), product centered, blank
  - Plain light background. Save as WebP q82 - target under ~80 KB.
    (None of the current mockups use transparency.)

PRINT-AREA ALIGNMENT:
  Tune per product/view/side in src/App.jsx -> PHOTO_AREAS, or live with
  the "Adjust print area" gear panel in the editor.
