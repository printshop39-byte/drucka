/* ── The one place that knows how a Qikink SKU is spelled ──
   Imported by BOTH order paths, which is the point:

     admin "Send to Qikink"  → src/App.jsx buildQikinkOrderPayload
     Razorpay auto-send      → api/_lib/fulfill.js

   They used to carry separate colour tables. The frontend's had ten colours,
   this side's had five and matched on the palette id while the cart stores the
   LABEL — so an auto-sent Navy Blue tee went to Qikink as "MRnHs-Navy Blue-M".
   Six of the ten colours were broken on that path.

   Pure data and pure functions, no imports, so it is safe on both a Vercel
   function and in the browser bundle.

   Every code here is taken from Qikink's sku_descriptions export and verified
   against it — see the SKU checks in the PRs that introduced them. */

/* Drucka palette → the code Qikink puts in its SKUs. Aliases cover the id and
   every label spelling either side might hand us. */
export const QIKINK_COLORS = [
  { id: "white", code: "Wh", aliases: ["white"] },
  { id: "black", code: "Bk", aliases: ["black"] },
  { id: "navy", code: "Nb", aliases: ["navy", "navy blue"] },
  { id: "red", code: "Rd", aliases: ["red"] },
  { id: "royal-blue", code: "Rb", aliases: ["royal-blue", "royal blue"] },
  { id: "bottle-green", code: "Gn", aliases: ["bottle-green", "bottle green"] },
  { id: "maroon", code: "Mn", aliases: ["maroon"] },
  { id: "yellow", code: "Yl", aliases: ["yellow"] },
  { id: "lavender", code: "Lv", aliases: ["lavender"] },
  { id: "baby-pink", code: "LBp", aliases: ["baby-pink", "baby pink", "light baby pink"] },
];

const BY_ALIAS = new Map();
for (const c of QIKINK_COLORS) {
  BY_ALIAS.set(c.id, c);
  BY_ALIAS.set(c.code.toLowerCase(), c); // already-normalised SKUs pass through
  for (const a of c.aliases) BY_ALIAS.set(a, c);
}

const key = (v) => String(v ?? "").trim().toLowerCase();
export const resolveQikinkColor = (v) => BY_ALIAS.get(key(v)) ?? null;
export const qikinkColorCode = (v) => resolveQikinkColor(v)?.code ?? null;
export const colorIdOf = (v) => resolveQikinkColor(v)?.id ?? null;

/* Print area → Qikink's placement_sku. Keyed by the print-area IDS the app
   uses as well as the human labels: Drucka says "pocket" where Qikink says
   "chest" for the same spot on the garment. */
export const PLACEMENT_SKU = {
  front: "fr", center: "fr", wrap: "fr",
  back: "bk",
  "left-pocket": "lc", "left pocket": "lc", "left chest": "lc",
  "right-pocket": "rc", "right pocket": "rc", "right chest": "rc",
};
export const placementSku = (p) => PLACEMENT_SKU[key(p)] ?? "fr";

/* Qikink's size tokens are not a pattern — "A4 Frame poster", "12x18pos",
   "24x36 pos", "8X12" — and "A3" means a different token on a framed poster
   than on a plain one, so they are keyed by SKU stem. Apparel and mugs use
   the size verbatim and are absent here. */
export const SKU_SIZE_TOKEN = {
  UFPos: { A4: "A4 Frame poster", A3: "A3 Frame poster" },
  UPoster: { A3: "A3 poster", '12×18"': "12x18pos", '24×36"': "24x36 pos" },
  UCanvas: { '8×8"': "8x8", '8×12"': "8X12", '16×20"': "16X20", '20×30"': "20X30" },
  UAcryKyChnUV: { Standard: "sqr" },
};
export const sizeTokenFor = (stem, size) => SKU_SIZE_TOKEN[stem]?.[size] ?? size ?? "";

/* Repair a SKU built anywhere in the system. The auto-send path assembles its
   own from the database mapping with the raw colour label and the raw size, so
   this is the last chance to make it something Qikink has actually issued. */
export const normalizeSku = (sku) => {
  const parts = String(sku ?? "").split("-");
  if (parts.length < 2) return String(sku ?? "");
  const [stem, colour, ...rest] = parts;
  const size = rest.join("-"); // sizes may contain a dash of their own
  const code = qikinkColorCode(colour) ?? colour;
  const token = size ? sizeTokenFor(stem, size) : "";
  return size ? `${stem}-${code}-${token}` : `${stem}-${code}`;
};
