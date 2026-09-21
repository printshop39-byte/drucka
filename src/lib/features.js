/* ── Launch-phase feature flags ──
   Razorpay stays fully wired in code; these decide what the customer is
   actually offered. Lifted out of App.jsx so the footer, the checkout and the
   product-page payment note all read ONE truth — the audit found the footer
   advertising "Cards · Net Banking" while Razorpay was switched off and the
   copy two sections up said "UPI / COD only". */
export const FEATURES = {
  ENABLE_RAZORPAY: false,   // true → "Pay via Razorpay" returns as primary payment
  ENABLE_COD_TESTING: true, // true → "Place COD Test Order" is the main checkout flow
};

/* What we can honestly say we accept, right now. Order is presentation order. */
export const paymentMethods = () =>
  FEATURES.ENABLE_RAZORPAY
    ? ["UPI", "Cards", "Net Banking", "COD"]
    : ["UPI", "COD"];

/* One sentence, used wherever payment is described in prose. */
export const paymentLine = () =>
  FEATURES.ENABLE_RAZORPAY
    ? "UPI, cards, net banking or Cash on Delivery"
    : "UPI (GPay / PhonePe / Paytm) or Cash on Delivery";
