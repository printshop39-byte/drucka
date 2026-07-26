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
export const colorIdOf = (v) => resolveQikinkColor(v)?.id ?? null;

/* Per-stem colour codes.

   The table above is not universal — Qikink names and codes its colours per
   product, and two stems can disagree about the same shade:

     baby pink   BRnHs → "Light Baby Pink" LBp     KHd → "Baby Pink" BPk
     yellow      KHd   → "Yellow" Yl               BRnHs has no plain Yellow
                                                   at all, only New / Golden /
                                                   Mustard

   So a code is only correct with respect to a stem. Anything not listed here
   falls through to QIKINK_COLORS, which covers the adult stems the catalogue
   started with. Add a stem here the moment its export disagrees — a wrong
   code produces a SKU Qikink has never issued, which is the failure that
   silently ate three sandbox orders. */
export const STEM_COLOR_CODE = {
  BRnHs: { yellow: "NYl" },   // kids tee — New Yellow
  GRnHs: { yellow: "NYl" },   // girls' tee, same family
  KHd:   { "baby-pink": "BPk" }, // kids hoodie
};

/* code for `v` on `stem`; stem is optional, and omitting it keeps the old
   global behaviour for callers that have no stem to hand */
export const qikinkColorCode = (v, stem = null) => {
  const id = colorIdOf(v);
  const override = stem && STEM_COLOR_CODE[stem]?.[id ?? key(v)];
  if (override) return override;
  return resolveQikinkColor(v)?.code ?? null;
};

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

/* Kids sizes, shared by the tee and hoodie stems. Customer-facing label →
   Qikink's token. */
export const KIDS_SIZE_TOKEN = {
  "0–12M": "0_12", "12–23M": "12_23", "24–35M": "24_35", "36–47M": "36_47",
  "5Y": "5Yrs", "7Y": "7Yrs", "9Y": "9Yrs", "11Y": "11Yrs", "13Y": "13Yrs",
};
export const KIDS_SIZES = Object.keys(KIDS_SIZE_TOKEN);

/* Qikink's size tokens are not a pattern — "A4 Frame poster", "12x18pos",
   "24x36 pos", "8X12" — and "A3" means a different token on a framed poster
   than on a plain one, so they are keyed by SKU stem. Apparel and mugs use
   the size verbatim and are absent here. */
export const SKU_SIZE_TOKEN = {
  UFPos: { A4: "A4 Frame poster", A3: "A3 Frame poster" },
  UPoster: { A3: "A3 poster", '12×18"': "12x18pos", '24×36"': "24x36 pos" },
  UCanvas: { '8×8"': "8x8", '8×12"': "8X12", '16×20"': "16X20", '20×30"': "20X30" },
  UAcryKyChnUV: { Standard: "sqr" },
  /* Kids apparel. Qikink runs infants in months and children in years, and
     writes both with an underscore or a "Yrs" suffix — neither is a label to
     show a customer, hence the split. Both kids stems use the same list. */
  BRnHs: KIDS_SIZE_TOKEN,
  GRnHs: KIDS_SIZE_TOKEN,
  KHd: KIDS_SIZE_TOKEN,
  /* AOP cushion cover — Qikink makes 16x16 and 24x24 only */
  UAopCuCvr: { '16"': "16x16", '24"': "24x24" },
  /* die-cut stickers: the catalogue shows ×, Qikink's token uses a plain x */
  UStickers: { '2×2"': "2x2", '3×3"': "3x3", '4×4"': "4x4", '6×6"': "6x6", '8×8"': "8x8" },
  UGrtCr: { A5: "A5" },
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
  const code = qikinkColorCode(colour, stem) ?? colour;
  const token = size ? sizeTokenFor(stem, size) : "";
  return size ? `${stem}-${code}-${token}` : `${stem}-${code}`;
};
