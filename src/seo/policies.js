/* ── Drucka policy pages — SINGLE SOURCE OF TRUTH ──────────────────
   Imported by the React app (routing + rendering) and by the build-time
   prerender script. Plain ESM data — no TS syntax.

   ⚠ BEFORE THIS GOES LIVE, CONFIRM THE ITEMS IN `TODO_CONFIRM` BELOW.
   Everything else on this page is derived from facts already published
   elsewhere on the site (delivery windows, pricing, studio address,
   payment methods, the processors named in vercel.json's CSP). Nothing
   here was invented.                                                    */

/* ═══ THE RETURN RULE ═══════════════════════════════════════════════
   The site previously shipped TWO contradictory claims:
     • Features.tsx      "7 Days Replacement … no questions asked"
     • TrustPolicies.tsx "send a photo on WhatsApp within 48 hours"

   Resolved to ONE rule, chosen as follows:
     - 7 days matches what Indian shoppers already expect from Amazon /
       Flipkart, so it reads as normal rather than restrictive.
     - 48 hours is unusually tight for India, where delivery timing varies
       and parcels are often opened days later. It generates disputes.
     - "No questions asked" is dropped: for personalised, made-to-order
       goods that is not sustainable, and it conflicts with the
       change-of-mind exclusion below.
     - Change-of-mind returns are excluded because a personalised print
       cannot be resold. This is the standard position for custom goods.

   Change the window in ONE place — this constant. Every string on the
   site derives from it.                                                */
export const RETURN_WINDOW_DAYS = 7;

/* ═══ THE DELIVERY RULE ══════════════════════════════════════════════
   Set by Drucka on 2026-07-25. Previously the order summary hardcoded
   "FREE · 2–4 days" for EVERY order, contradicting the announcement bar
   and the shipping policy on the same screen.

   NEVER hardcode "FREE" again — derive it from deliveryLabel() so the
   cart, order summary, product page and this policy page cannot drift.  */
export const FREE_DELIVERY_MIN = 2999;   // ₹ subtotal at or above which delivery is free
export const DELIVERY_FROM = 49;         // ₹ starting charge below that

/** The one string the UI shows for delivery, given a subtotal in ₹. */
export const deliveryLabel = (subtotal) =>
  Number(subtotal) >= FREE_DELIVERY_MIN
    ? 'FREE · 2–4 days'
    : `Delivery calculated on WhatsApp · from ₹${DELIVERY_FROM}`;

/** Same rule, phrased for the plain-text WhatsApp order message. */
export const deliveryLine = (subtotal) =>
  Number(subtotal) >= FREE_DELIVERY_MIN
    ? 'Delivery: FREE (2-4 days)'
    : `Delivery: from ₹${DELIVERY_FROM}, exact charge confirmed here on WhatsApp`;

/** Threshold formatted for display, e.g. "2,999". */
export const FREE_DELIVERY_MIN_LABEL = FREE_DELIVERY_MIN.toLocaleString('en-IN');

/** The rule itself, for surfaces with no cart subtotal (product page, footers). */
export const DELIVERY_RULE_SHORT =
  `Free delivery over ₹${FREE_DELIVERY_MIN_LABEL} · below that from ₹${DELIVERY_FROM}, confirmed on WhatsApp`;

/* Items that need Drucka's authoritative answer before publishing.
   Deliberately NOT rendered on the page — an incomplete policy is better
   than a confidently wrong one. */
export const TODO_CONFIRM = [
  'Registered legal entity name and address (currently shown as "Drucka, Kolhapur").',
  'GSTIN, if registered — Indian invoices usually display it.',
  'Grievance Officer name + contact. Required under the IT Rules 2021 for the privacy policy.',
  'Whether COD orders are refunded by UPI transfer or store credit.',
  'Data retention period for uploaded artwork after an order completes.',
];

const CONTACT = {
  whatsapp: '+91 70838 11355',
  email: 'hello@drucka.in',
  studio: 'Kolhapur, Maharashtra 416001, India',
};

export const POLICIES = {
  'shipping-policy': {
    slug: 'shipping-policy',
    label: 'Shipping & Delivery',
    title: 'Shipping & Delivery Policy | Drucka',
    description:
      'How Drucka prints and delivers custom photo prints, frames and gifts across India — dispatch times, delivery charges, free-shipping threshold and tracking.',
    intro:
      'Every Drucka order is printed to order in our Kolhapur studio. This page explains how long that takes, what delivery costs, and how to track your parcel.',
    sections: [
      {
        h: 'Processing time',
        p: 'Orders are printed within 24 hours of your design being confirmed on WhatsApp. Personalised and bulk orders may take longer; we tell you the expected date in chat before we print.',
      },
      {
        h: 'Delivery time',
        p: 'Most orders are delivered within 2–4 working days across India after dispatch. Remote PIN codes and public holidays can add time.',
      },
      {
        h: 'Delivery charges',
        p: `Delivery starts at ₹${DELIVERY_FROM} and varies with weight, size and destination. The exact charge is confirmed on WhatsApp before you pay. Delivery is free on orders of ₹${FREE_DELIVERY_MIN.toLocaleString('en-IN')} and above.`,
      },
      {
        h: 'Tracking',
        p: 'Once your parcel is dispatched we send the courier tracking link on WhatsApp. You can also use Track Order on this site with your order ID and phone number.',
      },
      {
        h: 'Studio pickup',
        p: `You can collect your order from our studio at ${CONTACT.studio} instead of paying for delivery. Tell us on WhatsApp and we will confirm when it is ready.`,
      },
      {
        h: 'Incorrect or incomplete addresses',
        p: 'Please check your delivery address before confirming. If a parcel is returned to us because the address was wrong or nobody was available, we will contact you to arrange redelivery; the second delivery charge is payable by you.',
      },
    ],
  },

  'returns-policy': {
    slug: 'returns-policy',
    label: 'Returns & Replacement',
    title: 'Returns & Replacement Policy | Drucka',
    description:
      'Drucka replaces damaged, defective or misprinted custom orders free within 7 days of delivery. Read what is covered, what is not, and how to raise a request.',
    intro:
      `Everything we make is printed to order from your photo or design. That means we cannot resell a returned item, so our policy covers quality problems rather than change of mind. If we got it wrong, we fix it free.`,
    sections: [
      {
        h: `Free replacement within ${RETURN_WINDOW_DAYS} days`,
        p: `If your order arrives damaged, defective or misprinted, message us on WhatsApp at ${CONTACT.whatsapp} within ${RETURN_WINDOW_DAYS} days of delivery with your order ID and a photo of the problem. We reprint and reship it free, or refund you in full — your choice. There is no charge to you and you do not need to send the original item back unless we ask.`,
      },
      {
        h: 'What is covered',
        p: 'Print defects such as banding, smudging, wrong colours or wrong crop; frames or products that arrive cracked, scratched or broken; the wrong item, size or quantity; and orders that never arrive.',
      },
      {
        h: 'What is not covered',
        p: 'Change of mind, because a personalised item cannot be resold. Also: spelling, layout or photo-choice mistakes in artwork you approved before printing, and low resolution in a photo you supplied. We always show you a preview and confirm on WhatsApp before we print — please check it carefully, as that preview is what we produce.',
      },
      {
        h: 'Refunds',
        p: 'Approved refunds are issued to the original payment method within 5–7 working days of approval. UPI and card refunds usually land sooner than that; the timing after we send it depends on your bank.',
      },
      {
        h: 'Cancelling an order',
        p: 'You can cancel free any time before we start printing — usually within a few hours of ordering. Once printing has started we cannot cancel, because the item is already personalised to you.',
      },
      {
        h: 'How to raise a request',
        p: `Message ${CONTACT.whatsapp} on WhatsApp, or email ${CONTACT.email}, with your order ID and a photo of the issue. We reply during business hours and aim to resolve replacement requests the same day.`,
      },
    ],
  },

  'privacy-policy': {
    slug: 'privacy-policy',
    label: 'Privacy',
    title: 'Privacy Policy | Drucka',
    description:
      'How Drucka handles your photos, contact details and payment information — what we collect, who processes it, and how to ask for deletion.',
    intro:
      'Drucka is a custom-printing studio, so you trust us with personal photographs. This page sets out exactly what we collect, what we do with it, and who else touches it.',
    sections: [
      {
        h: 'Photos and artwork you upload',
        p: 'Your images are used only to produce your order. We do not sell them, share them for advertising, or use them in our own marketing without asking you first and getting your agreement.',
      },
      {
        h: 'Information we collect',
        p: 'Your name, delivery address, phone number and email — the details needed to print, invoice and deliver an order. If you only message us on WhatsApp, we hold whatever you send us there.',
      },
      {
        h: 'Payments',
        p: 'Card, UPI and net-banking payments are processed by Razorpay. Drucka never sees or stores your full card number, UPI PIN or bank credentials. We only receive confirmation that a payment succeeded.',
      },
      {
        h: 'Service providers who process your data',
        p: 'We use Razorpay for payments, Cloudinary to store artwork files for printing, Supabase to store order records, and Qikink for production and fulfilment of some products. Each receives only what it needs to do its job.',
      },
      {
        h: 'Analytics and advertising',
        p: 'This site uses the Meta (Facebook) Pixel to measure how our advertising performs. It sets cookies and reports events such as page views, searches and purchases back to Meta, which may link them to a Facebook or Instagram account. You can limit this in your Meta ad settings or by blocking third-party cookies in your browser.',
      },
      {
        h: 'How long we keep things',
        p: 'Order records are retained as long as needed for accounting and tax obligations. Uploaded artwork is retained while your order is in production and for a reprint window afterwards, then removed.',
      },
      {
        h: 'Your choices',
        p: `To get a copy of what we hold about you, correct it, or ask us to delete your uploaded photos, message ${CONTACT.whatsapp} on WhatsApp or email ${CONTACT.email}. We act on deletion requests once any open order is complete.`,
      },
      {
        h: 'Children',
        p: 'Drucka is intended for adults. We do not knowingly collect personal information from children. If you believe a child has sent us personal data, contact us and we will delete it.',
      },
      {
        h: 'Contact',
        p: `Drucka, ${CONTACT.studio}. WhatsApp ${CONTACT.whatsapp} · ${CONTACT.email}`,
      },
    ],
  },
};

/* Short strings the rest of the UI derives from the rule above, so the
   homepage trust block and the policy page can never drift apart. */
export const RETURN_SHORT = `Damaged or misprinted? Tell us within ${RETURN_WINDOW_DAYS} days and we reprint or refund it free.`;
