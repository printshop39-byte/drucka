/* ── The WhatsApp enquiry message for an enquiry-only product ─────────────────
   Builds the text the customer sends when they tap "Enquire on WhatsApp".
   See lib/orderMode.js for why these products are not priced.

   BMP characters only (bullets, dashes, the ellipsis): 4-byte emoji are mangled
   to "?" by WhatsApp Desktop's wa.me handoff on Windows.

   The design cannot travel inside a wa.me link, so the message DESCRIBES it
   and asks the customer to attach the photo or artwork in the chat. That is
   also how the site's other WhatsApp orders already work. Uploading the design
   automatically was considered and left out on purpose: an enquiry is not an
   order, and putting a customer's photo on a public URL for a question they
   may never follow up is a privacy decision that should be made deliberately,
   not as a side effect. */

/* Short, human reference so staff can match the message to the files the
   customer attaches. Not stored anywhere - it exists only in the chat. */
export const newEnquiryRef = () => "ENQ-" + Math.random().toString(36).slice(2, 8).toUpperCase();

const clip = (t, n = 40) => {
  const s = String(t == null ? "" : t).replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};

/* One line per print area that actually has something on it. */
export function summariseDesign(layersByPlacement, printAreas) {
  const labelOf = (id) => (printAreas || []).find((p) => p.id === id)?.label ?? id;
  const out = [];
  Object.entries(layersByPlacement || {}).forEach(([id, layers]) => {
    const visible = (layers || []).filter((l) => l && l.visible !== false);
    if (!visible.length) return;
    const bits = visible.slice(0, 5).map((l) =>
      l.type === "text" ? `text "${clip(l.text)}"` : `image ${clip(l.name, 24)}`);
    if (visible.length > 5) bits.push(`+${visible.length - 5} more`);
    out.push(`${labelOf(id)}: ${bits.join(", ")}`);
  });
  return out;
}

export function enquiryText({
  productName, size, colour, print, placements, qty, layersByPlacement, printAreas, ref,
}) {
  const design = summariseDesign(layersByPlacement, printAreas);
  const lines = [
    "Hi Drucka! I'd like a price for a custom product.",
    "",
    `Product: ${productName}`,
  ];
  if (size) lines.push(`Size: ${size}`);
  if (colour) lines.push(`Colour: ${colour}`);
  if (print) lines.push(`Print: ${print}${placements ? " · " + placements : ""}`);
  lines.push(`Quantity: ${qty || 1}`);
  lines.push(`Design ref: ${ref}`);
  if (design.length) {
    lines.push("Design:");
    design.forEach((d) => lines.push("  " + d));
  } else {
    lines.push("Design: not started yet");
  }
  lines.push("", "Please share the price and delivery time. I'll send my photo or artwork in this chat.");
  return lines.join("\n");
}
