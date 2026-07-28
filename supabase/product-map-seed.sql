-- Seed public.product_map from the map the app actually ships with
-- (QIKINK_PRODUCT_MAP in src/App.jsx). Generated - do not hand-edit; regenerate
-- from the app instead, so the automated path and the admin button agree.
--
-- The seed in schema-update.sql is NOT this: it writes REPLACE_ME as every
-- qikink_product_id and carries stale SKU stems, which is worse than an empty
-- table - fulfillFromDb would find a mapping and send Qikink a product id that
-- does not exist. Run schema-update.sql for the DDL, then this for the data.

insert into public.product_map
  (drucka_id, product_name, qikink_product_id, sku_pattern, print_method, colors, sizes, base_cost, shipping_cost, print_areas, active)
values
  ('tshirt', 'Regular T-Shirt', 'MRNHS-180', 'MRnHs-{color}-{size}', 'DTG', '["white","black","navy","red","royal-blue","bottle-green","maroon","yellow","lavender","baby-pink"]', '["S","M","L","XL","XXL","3XL","4XL","5XL","6XL","7XL"]', 359, 49, '["Front","Back","Left chest"]', true),
  ('oversized', 'Oversized T-Shirt', 'UC22', 'UOsMRnHs-{color}-{size}', 'DTF', '["white","black","navy"]', '["S","M","L","XL","XXL"]', 419, 49, '["Front","Back"]', true),
  ('polo', 'Polo T-Shirt', 'MP25', 'MPHs-{color}-{size}', 'Embroidery', '["white","black","navy"]', '["S","M","L","XL","XXL"]', 449, 49, '["Left chest"]', false),
  ('kids-tshirt', 'Kids T-Shirt', 'US21', 'BRnHs-{color}-{size}', 'DTG', '["white","yellow","baby-pink","royal-blue","red"]', '["0–12M","12–23M","24–35M","36–47M","5Y","7Y","9Y","11Y","13Y"]', 329, 49, '["Front","Back"]', true),
  ('kids-hoodie', 'Kids Hoodie', 'KHd', 'KHd-{color}-{size}', 'DTF', '["black","red","yellow","baby-pink"]', '["0–12M","12–23M","24–35M","36–47M","5Y","7Y","9Y","11Y","13Y"]', 495, 49, '["Front","Back"]', true),
  ('hoodie', 'Hoodie', 'UH24', 'UHd-{color}-{size}', 'DTF', '["white","black","navy","maroon","bottle-green"]', '["S","M","L","XL","XXL","3XL"]', 649, 69, '["Front","Back"]', true),
  ('mug', 'Photo Mug', 'UWCM', 'UWCM-{color}-11 OZ', 'Sublimation', '["white"]', '["325 ml"]', 179, 49, '["Wrap"]', true),
  ('frame', 'Framed Print', 'UFPos', 'UFPos-{color}-{size}', 'Sublimation', '["black","white"]', '["A4","A3"]', 350, 49, '["Front"]', true),
  ('poster', 'Poster Print', 'UPoster', 'UPoster-{color}-{size}', 'Sublimation', '["white"]', '["A3","12×18\"","24×36\""]', 80, 49, '["Front"]', true),
  ('canvas', 'Stretched Canvas', 'UCanvas', 'UCanvas-{color}-{size}', 'Sublimation', '["white"]', '["8×8\"","8×12\"","16×20\"","20×30\""]', 300, 49, '["Front"]', true),
  ('stickers', 'Custom Stickers', 'UStickers', 'UStickers-{color}-{size}', 'Sublimation', '["white"]', '["2×2\"","3×3\"","4×4\"","6×6\"","8×8\""]', 25, 49, '["Front"]', true),
  ('cushion', 'Photo Cushion', 'UAopCuCvr', 'UAopCuCvr-{color}-{size}', 'All over', '["white"]', '["16\""]', 140, 49, '["Front"]', true),
  ('invitation-cards', 'Invitation Cards', 'UGrtCr', 'UGrtCr-{color}-{size}', 'Sublimation', '["white"]', '["A5 Print"]', 30, 49, '["Front"]', true),
  ('keychain', 'Acrylic Keychain', 'UAcryKyChnUV', 'UAcryKyChnUV-{color}-{size}', 'Sublimation', '["white"]', '["Standard"]', 60, 49, '["Front"]', true)
on conflict (drucka_id) do update set
  product_name = excluded.product_name,
  qikink_product_id = excluded.qikink_product_id,
  sku_pattern = excluded.sku_pattern,
  print_method = excluded.print_method,
  colors = excluded.colors,
  sizes = excluded.sizes,
  base_cost = excluded.base_cost,
  shipping_cost = excluded.shipping_cost,
  print_areas = excluded.print_areas,
  active = excluded.active,
  updated_at = now();
