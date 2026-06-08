// lib/orders.ts
//
// Order persistence helpers built on the null-safe Supabase client.
// Every function degrades gracefully when Supabase isn't configured:
//   - saveOrder    -> { ok:false, skipped:true } (caller still opens WhatsApp)
//   - getOrders    -> null  (caller falls back to sample data)
//   - getOrderByRef-> { found:false, configured:false }

import { getSupabase, isSupabaseConfigured } from "./supabase";

export type OrderStatus =
  | "New"
  | "In Design Review"
  | "Printing"
  | "Ready to Ship"
  | "Delivered";

// One line item as stored in the `items` jsonb column.
export interface OrderItem {
  id: string;
  name: string;
  size?: string;
  qty: number;
  price: number;
  meta?: string;
  designImageUrl?: string | null; // Cloudinary public URL (if uploaded)
  rotation?: number;
  designSize?: number;
  position?: string;
  text?: string;
}

// Shape we INSERT into the `orders` table.
export interface NewOrder {
  order_ref: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_address: string;
  customer_city: string;
  customer_pincode: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment_method: string;
  whatsapp_sent?: boolean;
}

// Shape we read back (subset used by the UI).
export interface OrderRow extends NewOrder {
  id: string;
  status: OrderStatus;
  created_at: string;
}

/**
 * Save an order. Never throws. If Supabase isn't configured or the insert fails,
 * returns ok:false so the caller can still proceed (e.g. open WhatsApp).
 */
export async function saveOrder(
  order: NewOrder
): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("[orders] Supabase not configured, order not saved");
    return { ok: false, skipped: true };
  }

  try {
    const { error } = await supabase.from("orders").insert(order);
    if (error) {
      console.error("[orders] saveOrder failed:", error.message);
      return { ok: false, skipped: false, error: error.message };
    }
    return { ok: true, skipped: false };
  } catch (e) {
    console.error("[orders] saveOrder threw:", e);
    return { ok: false, skipped: false, error: String(e) };
  }
}

/**
 * Fetch recent orders (newest first). Returns null if Supabase isn't configured
 * or the query fails, so callers can fall back to sample data.
 */
export async function getOrders(limit = 20): Promise<OrderRow[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[orders] getOrders failed:", error.message);
      return null;
    }
    return (data as OrderRow[]) ?? [];
  } catch (e) {
    console.error("[orders] getOrders threw:", e);
    return null;
  }
}

/**
 * Look up a single order by its reference (DRK-YYYYMMDD-XXXX).
 * `configured` tells the caller whether Supabase is even set up.
 */
export async function getOrderByRef(
  ref: string
): Promise<{ configured: boolean; found: boolean; order?: OrderRow }> {
  if (!isSupabaseConfigured()) return { configured: false, found: false };
  const supabase = getSupabase();
  if (!supabase) return { configured: false, found: false };

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_ref", ref.trim())
      .maybeSingle();
    if (error) {
      console.error("[orders] getOrderByRef failed:", error.message);
      return { configured: true, found: false };
    }
    if (!data) return { configured: true, found: false };
    return { configured: true, found: true, order: data as OrderRow };
  } catch (e) {
    console.error("[orders] getOrderByRef threw:", e);
    return { configured: true, found: false };
  }
}
