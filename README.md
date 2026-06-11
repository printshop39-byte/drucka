# Drucka — Print it. Gift it. Feel it.

Premium custom printing & gifting e-commerce site. React 18 + Vite + Tailwind CSS v4.
No backend, no paid APIs — cart uses localStorage, orders go through WhatsApp.

## Run locally

```bash
npm install
npm run dev      # local dev server → http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Deploy (free)

The `dist/` folder is a fully static site. Drag-and-drop it to **Netlify**, or connect
the repo to **Vercel** / **Cloudflare Pages** (build command `npm run build`,
output directory `dist`). Point `drucka.in` at it via your DNS panel.

## Where to change things

Everything lives in **`src/App.jsx`** — open it and look at the top:

| What | Where |
|---|---|
| **WhatsApp number** | `CONFIG.whatsappNumber` — currently `917083811355` (country code + number, no `+`/spaces) |
| **UPI ID** | `CONFIG.upiId` — currently the placeholder `drucka@upi`. Replace with your real UPI ID; it is quoted in WhatsApp order messages |
| **Instagram** | `CONFIG.instagramUrl` |
| **Email** | `CONFIG.email` |
| **Products & prices** | `PRODUCTS` array — name, price, delivery time, badge, image path |
| **Reviews** | `REVIEWS` array (Reviews section) |
| **FAQ answers** | `FAQS` array (FAQ section) |
| **Gift suggestions logic** | `suggestGift()` function — pure rules, no API |
| **Brand colors / fonts** | `src/index.css` → `@theme` block |

## Replacing product images

Product photos live in **`public/images/`** as `tshirt.jpg`, `mug.jpg`, `frame.jpg`,
`cushion.jpg`, `canvas.jpg`, `keychain.jpg`. Drop in new files with the same names
(or change the `img` paths in the `PRODUCTS` array). Keep them under ~150 KB and
roughly portrait (4:5) for best results — they are lazy-loaded automatically.

## How ordering works

1. Customer customizes a product in the Design Studio (image upload is previewed
   locally with FileReader — nothing is uploaded to a server).
2. "Order on WhatsApp" / "Checkout on WhatsApp" opens wa.me with a pre-filled
   message containing products, quantities, custom text and the total.
3. Customer attaches their photo directly in the WhatsApp chat.
4. You confirm and share a UPI payment link — done.
