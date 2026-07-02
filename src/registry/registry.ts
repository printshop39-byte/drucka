/* ── Product Registry ──────────────────────────────────────────────
   ONE source of truth for everything about a product. The catalogue in
   src/designer/data.js IS the registry; this module adds strong types and
   derived selectors so consumers stop maintaining parallel arrays.

   Commit 1 (foundation): types + selectors + dev validation only. NOTHING is
   switched yet — the legacy arrays in App.jsx / editorFlags still drive the
   app. Later commits point each consumer at a selector, one at a time, each
   proven byte-identical first.

   Adding a product = add ONE entry to PRODUCTS with these declarative fields;
   catalog cards, shell routing, pricing family, upload caps, etc. all derive. */

// @ts-expect-error — data.js is plain JS; typed via the cast below.
import { PRODUCTS, capsOf as rawCapsOf } from "../designer/data";

export type PricingFamily = "designer" | "collage" | "mini";

/** curated shop-catalog card fields (marketing art, not the editor mockup) */
export interface CatalogConfig {
  order: number;   // display order in the shop grid
  title: string;
  price: number;   // "from" price shown on the card
  img: string;
}

/** which editor a product opens in, and its pricing family */
export interface EditorConfig {
  shell: boolean;         // true → new ProductEditorShell; false → classic
  family: PricingFamily;
}

/** per-product upload rules (validation stays centralized in the upload service) */
export interface UploadConfig {
  maxBytes?: number;
  allowSvg?: boolean;
  sanitizeSvg?: boolean;
}

export interface ProductCaps {
  allowText?: boolean;
  allowImage?: boolean;
  maxUploadBytes?: number;
  printAreaShape?: "rect" | "curved";
}

/** A registry entry. Existing product fields are tolerated via the index
    signature; the declarative sub-configs below are what the selectors read. */
export interface ProductRegistryEntry {
  productId: string;
  qikinkId: string;
  category: string;
  productName: string;
  basePrice: number;
  caps?: ProductCaps;
  catalog?: CatalogConfig;
  editor?: EditorConfig;
  pricing?: { family: PricingFamily };
  upload?: UploadConfig;
  [key: string]: unknown;
}

const REGISTRY = PRODUCTS as ProductRegistryEntry[];

/* ── lookups ── */
export const registry = (): ProductRegistryEntry[] => REGISTRY;
export const registryById = (id: string): ProductRegistryEntry | undefined =>
  REGISTRY.find((p) => p.productId === id);

/* ── derived selectors (replace the hand-maintained arrays) ── */

/** shop catalog cards — mirrors today's CATALOG_CARDS shape + order */
export function getCatalogCards(): Array<{ productId: string; title: string; price: number; img: string }> {
  return REGISTRY
    .filter((p): p is ProductRegistryEntry & { catalog: CatalogConfig } => !!p.catalog)
    .slice()
    .sort((a, b) => a.catalog.order - b.catalog.order)
    .map((p) => ({ productId: p.productId, title: p.catalog.title, price: p.catalog.price, img: p.catalog.img }));
}

/** product ids that open the new shell — mirrors NEW_SHELL_PRODUCTS */
export function getShellProductIds(): Set<string> {
  return new Set(REGISTRY.filter((p) => p.editor?.shell).map((p) => p.productId));
}

/** pricing family for a product (all catalogue products are "designer") */
export const pricingFamilyOf = (id: string): PricingFamily =>
  registryById(id)?.pricing?.family ?? registryById(id)?.editor?.family ?? "designer";

/** upload caps for a product (delegates to the existing capsOf resolver) */
export const capsOf = (product: ProductRegistryEntry | undefined) => rawCapsOf(product);

/* ── dev-time validation (Vite has no tsc step, so guard at runtime) ──
   Throws in dev if a product is missing a required field or has a malformed
   declarative config. Tree-shaken out of production. */
export function validateRegistry(): void {
  for (const p of REGISTRY) {
    if (!p.productId || !p.productName || typeof p.basePrice !== "number") {
      throw new Error(`[registry] product "${p.productId ?? "?"}" is missing productId/productName/basePrice`);
    }
    if (p.catalog && (typeof p.catalog.order !== "number" || !p.catalog.title || typeof p.catalog.price !== "number" || !p.catalog.img)) {
      throw new Error(`[registry] product "${p.productId}" has an invalid catalog config`);
    }
    if (p.editor && (typeof p.editor.shell !== "boolean" || !p.editor.family)) {
      throw new Error(`[registry] product "${p.productId}" has an invalid editor config`);
    }
  }
}
