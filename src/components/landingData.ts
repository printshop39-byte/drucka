/* ── SEO product/service landing pages ──
   One entry per clean URL (e.g. /custom-tshirts). Rendered by ProductLanding,
   wired into the SPA router in App.jsx. Each page gets a unique title/meta,
   English + Marathi content, a starting price, FAQs and Product + FAQ JSON-LD. */

export interface LandingFaq { q: string; a: string }

export type LandingAction = 'mini' | 'frame' | 'tshirt' | 'mug' | 'whatsapp';

export interface Landing {
  slug: string;
  title: string;          // <title>
  description: string;     // meta description
  eyebrow: string;
  h1: string;
  introEn: string;
  introMr: string;         // Marathi (Devanagari)
  image: string;          // /images/...
  imageAlt: string;
  fromPrice: number;       // INR
  priceNote?: string;
  ctaLabel: string;
  action: LandingAction;
  waText: string;          // pre-filled WhatsApp message
  highlights: string[];
  faqs: LandingFaq[];
  schemaName: string;
}

export const LANDINGS: Record<string, Landing> = {
  'mini-prints': {
    slug: 'mini-prints',
    title: 'Mini Photo Prints Online — 2×3, 3×3, 4×3 inch from ₹190 | Drucka',
    description: 'Order premium mini photo prints online — wallet 2×3, Instagram 3×3 & scrapbook 4×3 sizes with captions & borders. Delivered across India. मराठीत WhatsApp सपोर्ट.',
    eyebrow: 'Mini Photo Prints',
    h1: 'Mini Photo Prints, Printed Premium',
    introEn: 'Turn your favourite photos into handy mini prints — perfect for wallets, journaling, scrapbooks and gifting. Upload, pick a size and border, and order in minutes.',
    introMr: 'तुमचे आवडते फोटो छोट्या प्रीमियम प्रिंट्समध्ये — wallet, scrapbook, journaling आणि gifting साठी परफेक्ट. फोटो अपलोड करा, साइज व बॉर्डर निवडा आणि काही मिनिटांत ऑर्डर करा.',
    image: '/images/mini/mini-3x3.jpg',
    imageAlt: 'Mini photo prints in 2×3, 3×3 and 4×3 inch sizes by Drucka',
    fromPrice: 190,
    priceNote: 'delivery from ₹49 (variable) · 2–4 day delivery',
    ctaLabel: 'Create your mini prints',
    action: 'mini',
    waText: "Hi Drucka! I'd like to order Mini Photo Prints. Here are my photos:",
    highlights: ['2×3, 3×3 & 4×3 inch sizes', 'Polaroid, gold, black & dashed borders', 'Add captions, date stamps & stickers', 'Premium photo paper, true-to-photo colour', 'Delivered across India in 2–4 days'],
    faqs: [
      { q: 'What sizes are available?', a: '2×3 inch (wallet & gift inserts), 3×3 inch (Instagram square) and 4×3 inch (memory & scrapbook prints).' },
      { q: 'किंमत किती असते? (What is the price?)', a: 'Mini prints start from ₹190, with delivery from ₹49 (varies by quantity). मिनी प्रिंट्स ₹190 पासून, डिलिव्हरी ₹49 पासून.' },
      { q: 'How do I order?', a: 'Upload your photos in the editor, choose a size and border, then confirm on WhatsApp — we print and deliver across India.' },
      { q: 'How long does delivery take?', a: 'Most orders are printed and delivered within 2–4 days across India.' },
    ],
    schemaName: 'Custom Mini Photo Prints',
  },

  'photo-frames': {
    slug: 'photo-frames',
    title: 'Custom Photo Frames Online from ₹899 — Gold, Black, Wood | Drucka',
    description: 'Custom photo frames online — gold, black, wooden & minimal styles built around your photo. Premium, termite-resistant. Delivered across India. मराठीत सपोर्ट.',
    eyebrow: 'Custom Photo Frames',
    h1: 'Custom Photo Frames, Built Around Your Photo',
    introEn: 'Premium framed prints in gold, black, wood and minimal styles. Upload your photo, preview it inside the frame live, and order — crafted with termite-resistant material and delivered ready to hang.',
    introMr: 'सोनेरी, काळ्या, लाकडी आणि मिनिमल स्टाइलमधील प्रीमियम फ्रेम्स. तुमचा फोटो अपलोड करा, फ्रेममध्ये लाइव्ह प्रिव्ह्यू बघा आणि ऑर्डर करा — termite-resistant material, थेट भिंतीवर लावायला तयार.',
    image: '/images/frames/premium-golden-live.jpg',
    imageAlt: 'Custom premium golden photo frame with a personal photo by Drucka',
    fromPrice: 899,
    priceNote: 'free HD photo print with every frame · 2–4 day delivery',
    ctaLabel: 'Customize your frame',
    action: 'frame',
    waText: "Hi Drucka! I'd like a Custom Photo Frame. Here's my photo:",
    highlights: ['Gold, black, wooden & minimal styles', 'Live in-frame preview before you order', 'Premium, termite-resistant material', 'Free HD photo print with every frame', 'Delivered ready to hang in 2–4 days'],
    faqs: [
      { q: 'What frame styles are available?', a: 'Classic black, premium golden, wooden brown, white minimal, designer black-gold and traditional ornate.' },
      { q: 'फ्रेमची किंमत किती? (What does a frame cost?)', a: 'Custom photo frames start from ₹899, and every frame includes a free HD photo print. फ्रेम ₹899 पासून, प्रत्येक फ्रेमसोबत मोफत HD फोटो प्रिंट.' },
      { q: 'Can I see my photo in the frame first?', a: 'Yes — upload your photo and the customizer shows a live preview inside the chosen frame before you order.' },
      { q: 'Is the frame durable?', a: 'Frames use premium, termite-resistant material so your photos stay vibrant and safe for years.' },
    ],
    schemaName: 'Custom Photo Frame',
  },

  'custom-tshirts': {
    slug: 'custom-tshirts',
    title: 'Custom Printed T-Shirts Online from ₹599 — Your Design | Drucka',
    description: 'Design custom printed t-shirts online — upload your photo, art or logo, preview front & back live, and order. Premium cotton, full-colour print, delivered across India.',
    eyebrow: 'Custom T-Shirts',
    h1: 'Custom Printed T-Shirts, Your Design',
    introEn: 'Soft premium-cotton tees printed in full colour with your photo, artwork, text or logo. Design front and back in the studio, preview live, and order — no minimum.',
    introMr: 'तुमचा फोटो, आर्टवर्क, मजकूर किंवा लोगो — मऊ प्रीमियम कॉटन टी-शर्टवर फुल-कलर प्रिंट. स्टुडिओमध्ये पुढे-मागे डिझाइन करा, लाइव्ह प्रिव्ह्यू बघा आणि ऑर्डर करा — किमान ऑर्डर नाही.',
    image: '/images/tshirt.jpg',
    imageAlt: 'Custom printed t-shirt with a personal design by Drucka',
    fromPrice: 599,
    priceNote: 'no minimum order · 2–4 day delivery',
    ctaLabel: 'Design your t-shirt',
    action: 'tshirt',
    waText: "Hi Drucka! I'd like to order a Custom Printed T-Shirt. Here's my design idea:",
    highlights: ['Soft premium cotton, full-colour print', 'Add photos, text, graphics or your logo', 'Design front & back with a live preview', 'No minimum order — one piece is fine', 'Delivered across India in 2–4 days'],
    faqs: [
      { q: 'Is there a minimum order?', a: 'No — you can order a single custom t-shirt, or hundreds for events and teams.' },
      { q: 'टी-शर्टची किंमत किती? (What is the t-shirt price?)', a: 'Custom printed t-shirts start from ₹599. कस्टम टी-शर्ट ₹599 पासून.' },
      { q: 'Can I print my own photo or logo?', a: 'Yes — upload any photo, artwork or logo (JPG/PNG), position it in the print area and preview before ordering.' },
      { q: 'Do you print front and back?', a: 'Yes, you can design and print both the front and back of the t-shirt.' },
    ],
    schemaName: 'Custom Printed T-Shirt',
  },

  'custom-mugs': {
    slug: 'custom-mugs',
    title: 'Custom Photo Mugs Online from ₹299 — Personalised | Drucka',
    description: 'Personalised photo mugs online — print your photo, name or message on a premium ceramic mug. Great gifts. Delivered across India in 2–4 days. मराठीत सपोर्ट.',
    eyebrow: 'Custom Photo Mugs',
    h1: 'Custom Photo Mugs, Personalised for You',
    introEn: 'Print your favourite photo, name or message on a premium ceramic mug. A thoughtful everyday gift for birthdays, anniversaries and offices — upload, preview and order.',
    introMr: 'तुमचा आवडता फोटो, नाव किंवा मेसेज प्रीमियम सिरॅमिक मगवर प्रिंट करा. वाढदिवस, अॅनिव्हर्सरी आणि ऑफिससाठी सुंदर भेट — अपलोड करा, प्रिव्ह्यू बघा आणि ऑर्डर करा.',
    image: '/images/mug.jpg',
    imageAlt: 'Custom personalised photo mug by Drucka',
    fromPrice: 299,
    priceNote: 'perfect for gifting · 2–4 day delivery',
    ctaLabel: 'Design your mug',
    action: 'mug',
    waText: "Hi Drucka! I'd like to order a Custom Photo Mug. Here's my photo:",
    highlights: ['Premium 325 ml ceramic mug', 'Print photos, names & messages', 'Dishwasher-friendly sublimation print', 'Perfect personalised gift', 'Delivered across India in 2–4 days'],
    faqs: [
      { q: 'What can I print on the mug?', a: 'Any photo, name, date or message — wrap-around print on a premium white ceramic mug.' },
      { q: 'मगची किंमत किती? (What is the mug price?)', a: 'Custom photo mugs start from ₹299. कस्टम फोटो मग ₹299 पासून.' },
      { q: 'Is the print long-lasting?', a: 'Mugs use sublimation printing for a smooth, durable, dishwasher-friendly finish.' },
      { q: 'Are mugs good for bulk gifting?', a: 'Yes — mugs are popular for corporate and event gifting with volume pricing on bulk orders.' },
    ],
    schemaName: 'Custom Photo Mug',
  },

  'corporate-gifting': {
    slug: 'corporate-gifting',
    title: 'Corporate & Bulk Gifting in India — Custom Branded Gifts | Drucka',
    description: 'Custom corporate & bulk gifting — branded mugs, t-shirts, frames, keychains & more for events, weddings and offices. Volume pricing, delivered across India. मराठीत सपोर्ट.',
    eyebrow: 'Bulk & Corporate Gifting',
    h1: 'Corporate & Bulk Gifting, Beautifully Done',
    introEn: 'Personalised, branded gifts at scale — mugs, t-shirts, frames, keychains and more for weddings, events, return gifts and office gifting. Volume pricing and a dedicated point of contact.',
    introMr: 'मोठ्या प्रमाणात पर्सनलाइज्ड व ब्रँडेड भेटवस्तू — लग्न, इव्हेंट, रिटर्न गिफ्ट आणि ऑफिस गिफ्टिंगसाठी मग, टी-शर्ट, फ्रेम, कीचेन आणि बरंच काही. व्हॉल्यूम प्रायसिंग आणि समर्पित संपर्क.',
    image: '/images/mug.jpg',
    imageAlt: 'Custom branded corporate gifts by Drucka',
    fromPrice: 149,
    priceNote: 'volume pricing on 25+ pieces',
    ctaLabel: 'Get a bulk quote on WhatsApp',
    action: 'whatsapp',
    waText: "Hi Drucka! I'd like a bulk / corporate gifting quote. Here are my details (product, quantity, timeline):",
    highlights: ['Weddings, return gifts & events', 'Office & employee gifting', 'Volume pricing on 25+ pieces', 'Branded & personalised at scale', 'Delivered across India'],
    faqs: [
      { q: 'What is the minimum for bulk pricing?', a: 'Volume pricing typically starts at 25+ pieces — share your quantity on WhatsApp for a quote.' },
      { q: 'बल्क ऑर्डरची किंमत किती? (What is bulk pricing?)', a: 'Bulk gifts start from ₹149 per piece with volume discounts. बल्क गिफ्ट ₹149 पासून, प्रमाणानुसार सूट.' },
      { q: 'Can gifts be branded with our logo?', a: 'Yes — we add your logo, names or messages across mugs, t-shirts, frames and keychains.' },
      { q: 'How fast can bulk orders be delivered?', a: 'Timelines depend on quantity — share your event date on WhatsApp and we plan delivery accordingly.' },
    ],
    schemaName: 'Corporate & Bulk Gifting',
  },

  'photo-prints': {
    slug: 'photo-prints',
    title: 'Photo Prints Online from ₹19 — Premium Photo Printing India | Drucka',
    description: 'Order photo prints online from ₹19 — premium paper, true-to-photo colour, captions & borders. Upload your photos and we print & deliver across India. मराठीत सपोर्ट.',
    eyebrow: 'Photo Prints',
    h1: 'Premium Photo Prints, Delivered',
    introEn: 'Print your phone photos beautifully — premium paper, accurate colour, optional captions and borders. Upload your gallery, pick sizes, and we print and deliver across India.',
    introMr: 'तुमच्या मोबाइलमधले फोटो सुंदररित्या प्रिंट करा — प्रीमियम पेपर, अचूक रंग, हवे असल्यास कॅप्शन व बॉर्डर. फोटो अपलोड करा, साइज निवडा आणि आम्ही प्रिंट करून भारतभर डिलिव्हर करतो.',
    image: '/images/prints/print-1.jpg',
    imageAlt: 'Premium photo prints from phone photos by Drucka',
    fromPrice: 19,
    priceNote: 'delivery from ₹49 (variable) · 2–4 day delivery',
    ctaLabel: 'Upload & print your photos',
    action: 'mini',
    waText: "Hi Drucka! I'd like to order Photo Prints. Here are my photos:",
    highlights: ['From ₹19 per print', 'Premium paper, true-to-photo colour', 'Optional captions, borders & date stamps', 'Order from your phone in minutes', 'Delivered across India in 2–4 days'],
    faqs: [
      { q: 'How much do photo prints cost?', a: 'Photo prints start from ₹19 each, with delivery from ₹49 (varies by quantity).' },
      { q: 'फोटो प्रिंट कसे ऑर्डर करायचे? (How to order?)', a: 'Upload your photos, choose sizes and borders, and confirm on WhatsApp. फोटो अपलोड करा, साइज निवडा आणि WhatsApp वर कन्फर्म करा.' },
      { q: 'What paper do you use?', a: 'Prints are made on premium photo paper for sharp detail and accurate, long-lasting colour.' },
      { q: 'How long does delivery take?', a: 'Most orders are printed and delivered within 2–4 days across India.' },
    ],
    schemaName: 'Premium Photo Prints',
  },
};

export const LANDING_SLUGS = Object.keys(LANDINGS);
