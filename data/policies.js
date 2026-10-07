/* ── Policy pages — plain data, rendered by scripts/build.mjs ──
   Carried over from the policies Drucka already published, with everything about the
   old online checkout (Razorpay, Supabase, Cloudinary, Qikink, Meta Pixel, order
   tracking page, uploads) removed because this site has none of those.

   NOT shown, because they have not been confirmed (an incomplete policy is better than
   a confidently wrong one): registered legal entity name, GSTIN, grievance officer
   details, refund method for cash payments, how long photos are kept after an order. */
import { CONTACT, DELIVERY, RETURN_WINDOW_DAYS, CUSTOM_REPORT_HOURS } from "./catalog.js";

const inr = (n) => `₹${n.toLocaleString("en-IN")}`;

export const POLICIES = [
  {
    slug: "shipping-policy",
    label: "Shipping & Delivery",
    title: "Shipping & Delivery Policy | Drucka",
    description:
      "How Drucka prints and delivers wallpaper, photo décor, photo prints, canvas prints and photo frames across India: dispatch time, delivery charges and tracking.",
    intro:
      "Every Drucka order is printed to order in our Kolhapur studio. This page explains how long that takes, what delivery costs and how you hear about your parcel.",
    sections: [
      {
        h: "Processing time",
        p: `Orders are normally dispatched within ${DELIVERY.dispatch} and order details on WhatsApp. For large commercial, school or hospital projects the timeline depends on the quantity; we tell you the expected date before we print.`,
      },
      {
        h: "Delivery time",
        p: `Delivery normally takes ${DELIVERY.days}, ${DELIVERY.daysNote}. Remote PIN codes and public holidays can add time.`,
      },
      {
        h: "Delivery charges",
        p: `Photo prints, mini prints and photo frames: delivery starts at ${inr(DELIVERY.from)} and varies with weight, size and destination, and is free on orders of ${inr(DELIVERY.freeOver)} and above. Wallpaper, photo décor, canvas prints and commercial, school or hospital work ship in tubes or large parcels, so their delivery is charged separately, based on size, weight and destination. In every case we tell you the exact charge on WhatsApp before you confirm your order.`,
      },
      {
        h: "Tracking",
        p: "Once your parcel is dispatched we send the courier tracking link on WhatsApp.",
      },
      {
        h: "Studio pickup",
        p: `You can collect your order from our studio at ${CONTACT.studio} instead of paying for delivery. Tell us on WhatsApp and we will confirm when it is ready.`,
      },
      {
        h: "Incorrect or incomplete addresses",
        p: "Please check your delivery address before confirming. If a parcel is returned to us because the address was wrong or nobody was available, we will contact you to arrange redelivery; the second delivery charge is payable by you.",
      },
    ],
  },
  {
    slug: "returns-policy",
    label: "Returns & Replacement",
    title: "Returns & Replacement Policy | Drucka",
    description: `Custom-made products are not returnable for change of mind; defects, wrong items and transit damage reported within ${CUSTOM_REPORT_HOURS} hours are verified and resolved. Photo prints and frames: free replacement within ${RETURN_WINDOW_DAYS} days.`,
    intro:
      "Everything we make is printed to order, so this policy covers quality problems rather than change of mind. The rule depends on the product, as set out below.",
    sections: [
      {
        h: "Custom-made products",
        p: `Custom wallpaper, photo décor (including photo wallpaper and mobile back covers), canvas prints and other made-to-size work, such as commercial, school and hospital graphics, are made for you and are not returnable for change of mind. If we send the wrong design, if the size is wrong because of our production, if there is a printing defect, or if the item is damaged in transit, tell us within ${CUSTOM_REPORT_HOURS} hours of delivery with photos or a video. After checking it, we replace or reprint the item or offer another suitable resolution.`,
      },
      {
        h: `Photo prints, mini prints and photo frames: free replacement within ${RETURN_WINDOW_DAYS} days`,
        p: `If your photo prints, mini prints or photo frame arrive damaged, defective or misprinted, message us on WhatsApp at ${CONTACT.whatsappDisplay} within ${RETURN_WINDOW_DAYS} days of delivery with a photo of the problem. We reprint and reship it free, or refund you in full — your choice. There is no charge to you and you do not need to send the original item back unless we ask.`,
      },
      {
        h: "What is covered",
        p: "Print defects such as banding, smudging, wrong colours or wrong crop; items that arrive cracked, scratched, torn or broken; the wrong item, design, size or quantity; and orders that never arrive.",
      },
      {
        h: "What is not covered",
        p: "Change of mind, because a personalised or made-to-size item cannot be resold. Also: mistakes in a design, photo, size or details you approved before printing, wall measurements you supplied, and low resolution in a photo you supplied. Before production we review the photo you send for suitability at your chosen size, and for wallpaper and other custom-made products we send you a digital preview on WhatsApp and print only after you approve it.",
      },
      {
        h: "Refunds",
        p: "Approved refunds are returned to the payment method you used within 5–7 working days of approval.",
      },
      {
        h: "Cancelling an order",
        p: "You can cancel free any time before we start printing. Once printing has started we cannot cancel, because the item is already made for you.",
      },
      {
        h: "How to raise a request",
        p: `Message ${CONTACT.whatsappDisplay} on WhatsApp, or email ${CONTACT.email}, with photos or a video of the issue and your order details. We reply during business hours.`,
      },
    ],
  },
  {
    slug: "privacy-policy",
    label: "Privacy",
    title: "Privacy Policy | Drucka",
    description:
      "How Drucka handles the photos and contact details you send us on WhatsApp, and what this website does and does not collect.",
    intro:
      "Drucka is a printing studio, so you trust us with personal photographs. This page sets out what we collect, what we do with it and who else touches it.",
    sections: [
      {
        h: "This website",
        p: "This website is an information site. It has no accounts, no order forms, no photo uploads and no online payment, and it does not use analytics or advertising cookies. Our hosting provider (Vercel) may keep standard server logs, such as IP addresses, for security and reliability. Links to WhatsApp open WhatsApp, whose own privacy policy then applies.",
      },
      {
        h: "Photos you send us",
        p: "You send your photos to us on WhatsApp or by e-mail when you place an order, and we use them only to produce your order. We do not sell your images, share them for advertising, or use them in our own marketing without asking you first and getting your agreement.",
      },
      {
        h: "Information we collect",
        p: "Your name, delivery address, phone number and, if you give it, your email — the details needed to print and deliver an order — plus whatever else you choose to send us in the chat.",
      },
      {
        h: "Payments",
        p: "Payment is arranged with us directly on WhatsApp. This website does not process payments.",
      },
      {
        h: "Who else receives your details",
        p: "WhatsApp (Meta) carries our conversations. The courier that delivers your parcel receives your name, delivery address and phone number. We do not give your details to anyone else.",
      },
      {
        h: "How long we keep things",
        p: "Order details are kept as long as needed for accounting and tax obligations. Photos you send us are kept while your order is being made. We have not set a fixed period for how long they are kept after that; you can ask us to delete yours (see Your choices).",
      },
      {
        h: "Your choices",
        p: `To get a copy of what we hold about you, correct it, or ask us to delete photos you sent, message ${CONTACT.whatsappDisplay} on WhatsApp or email ${CONTACT.email}. We act on deletion requests once any open order is complete.`,
      },
      {
        h: "Children",
        p: "Drucka is intended for adults. We do not knowingly collect personal information from children. If you believe a child has sent us personal data, contact us and we will delete it.",
      },
      {
        h: "Contact",
        p: `Drucka, ${CONTACT.studio}. WhatsApp ${CONTACT.whatsappDisplay} · ${CONTACT.email}`,
      },
    ],
  },
];
