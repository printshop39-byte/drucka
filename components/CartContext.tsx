"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartLine {
  lineId: string;    // unique per cart line (stable id for remove/qty)
  id: string;        // product id
  name: string;
  price: number;
  image: string;
  fallbackEmoji: string;
  size?: string;
  meta?: string;     // e.g. "Custom design"
  qty: number;
  // --- optional customization preview (all optional for backward compatibility) ---
  designImage?: string | null;    // user's uploaded image as a base64 data URL (LOCAL preview only)
  designImageUrl?: string | null; // PUBLIC url after upload to storage (Cloudinary/Supabase); null until uploaded
  rotation?: number;              // degrees
  designSize?: number;            // % scale used in the studio
  position?: string;              // POS key (tl, c, br, ...)
  text?: string;                  // overlay text
}

interface CartContextValue {
  items: CartLine[];
  addItem: (line: Omit<CartLine, "qty" | "lineId">, qty?: number) => void;
  removeItem: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "drucka_cart_v1";

// Seed sample items so the cart page is populated on first visit (demo).
const SEED: CartLine[] = [
  { lineId: "seed-tshirt", id: "tshirt", name: "Premium T-Shirt", price: 599, image: "/assets/tshirt-mockup.png", fallbackEmoji: "👕", size: "M", meta: "Custom design", qty: 1 },
  { lineId: "seed-mug", id: "mug", name: "Photo Mug", price: 299, image: "/assets/mug-mockup.png", fallbackEmoji: "☕", meta: "Custom photo", qty: 1 },
];

function makeLineId() {
  return "line-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  // hydrate from localStorage (or seed on first ever visit)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        setItems(SEED);
      } else {
        const parsed: CartLine[] = JSON.parse(raw);
        // migrate legacy items that predate lineId
        setItems(parsed.map((i) => (i.lineId ? i : { ...i, lineId: makeLineId() })));
      }
    } catch {
      setItems(SEED);
    }
    setLoaded(true);
  }, []);

  // persist (guarded: base64 design images can be large and may exceed quota)
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // quota exceeded — persist without the heavy design images so the cart still survives reloads
      try {
        const slim = items.map(({ designImage, ...rest }) => rest);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      } catch {
        /* give up on persistence; in-memory cart still works this session */
      }
    }
  }, [items, loaded]);

  const addItem: CartContextValue["addItem"] = (line, qty = 1) => {
    setItems((prev) => {
      // Customized items (with an uploaded design) are always distinct lines.
      // Only plain items of the same product + size merge their quantity.
      const mergeable = !line.designImage;
      const existing = mergeable
        ? prev.find((i) => i.id === line.id && i.size === line.size && !i.designImage)
        : undefined;
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...line, qty, lineId: makeLineId() }];
    });
  };

  const removeItem = (lineId: string) =>
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const setQty = (lineId: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, qty: Math.max(1, qty) } : i))
    );

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, setQty, clear, count, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
