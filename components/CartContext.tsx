"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartLine {
  id: string;        // product id
  name: string;
  price: number;
  image: string;
  fallbackEmoji: string;
  size?: string;
  meta?: string;     // e.g. "Custom design"
  qty: number;
}

interface CartContextValue {
  items: CartLine[];
  addItem: (line: Omit<CartLine, "qty">, qty?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "drucka_cart_v1";

// Seed sample items so the cart page is populated on first visit (demo).
const SEED: CartLine[] = [
  { id: "tshirt", name: "Premium T-Shirt", price: 599, image: "/assets/tshirt-mockup.png", fallbackEmoji: "👕", size: "M", meta: "Custom design", qty: 1 },
  { id: "mug", name: "Photo Mug", price: 299, image: "/assets/mug-mockup.png", fallbackEmoji: "☕", meta: "Custom photo", qty: 1 },
];

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
        setItems(JSON.parse(raw));
      }
    } catch {
      setItems(SEED);
    }
    setLoaded(true);
  }, []);

  // persist
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const addItem: CartContextValue["addItem"] = (line, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === line.id && i.size === line.size);
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...line, qty }];
    });
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const setQty = (id: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
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
