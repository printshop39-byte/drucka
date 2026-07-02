/* Strangler-fig rollout control for the new ProductEditorShell.

   The classic Designer flow is the default for EVERY product and is never
   touched — the new shell is opt-in per product id below. Two independent
   rollback levers, both zero-downtime:

     1. Code kill-switch — remove a product from NEW_SHELL_PRODUCTS and
        redeploy. Global, affects all users.
     2. Runtime escape hatch — the "Switch to classic editor" button inside
        the shell sets a localStorage flag; that browser immediately falls
        back to the classic editor, no deploy needed. */

/* Products the new shell handles. Everything else uses the classic flow.
   Phase-3 migration order: mug → tshirt → frame → canvas → poster (each verified). */
export const NEW_SHELL_PRODUCTS = new Set(["mug", "tshirt", "frame", "canvas", "poster"]);

const CLASSIC_KEY = "drucka-force-classic-editor";

/* runtime kill-switch — when set, every product uses the classic editor */
export const forceClassicEditor = () => {
  try { return localStorage.getItem(CLASSIC_KEY) === "1"; } catch { return false; }
};
export const setForceClassicEditor = (on) => {
  try {
    if (on) localStorage.setItem(CLASSIC_KEY, "1");
    else localStorage.removeItem(CLASSIC_KEY);
  } catch { /* private mode — default to classic anyway */ }
};

/* the one decision function App.jsx calls */
export const usesNewShell = (productId) =>
  NEW_SHELL_PRODUCTS.has(productId) && !forceClassicEditor();
