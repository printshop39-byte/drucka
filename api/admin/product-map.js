/* /api/admin/product-map — Supabase-backed Qikink product mapping.
   GET : public (contains no secrets — the frontend payload builder needs it)
   PUT : replace all mappings — ADMIN ONLY (x-admin-secret). */
import { sb } from "../_lib/supabase.js";
import { withCors } from "../_lib/cors.js";

const isAdmin = (req) =>
  !!process.env.ADMIN_SECRET && req.headers["x-admin-secret"] === process.env.ADMIN_SECRET;

const FIELDS = ["drucka_id", "product_name", "qikink_product_id", "sku_pattern", "print_method", "colors", "sizes", "base_cost", "shipping_cost", "print_areas", "active"];

async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await sb("product_map?select=*&order=drucka_id");
      return res.json({ ok: true, map: rows });
    }
    if (req.method === "PUT") {
      if (!isAdmin(req)) return res.status(401).json({ ok: false, error: "Admin secret required" });
      const map = req.body?.map;
      if (!Array.isArray(map) || !map.length)
        return res.status(400).json({ ok: false, error: "map array required" });
      const rows = map.map((m) => Object.fromEntries(FIELDS.map((f) => [f, m[f] ?? null])));
      for (const r of rows)
        if (!r.drucka_id || !r.qikink_product_id || !r.sku_pattern)
          return res.status(400).json({ ok: false, error: `Mapping ${r.drucka_id ?? "?"} missing required fields` });
      await sb("product_map?on_conflict=drucka_id", {
        method: "POST",
        body: rows,
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      });
      return res.json({ ok: true, saved: rows.length });
    }
    res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
