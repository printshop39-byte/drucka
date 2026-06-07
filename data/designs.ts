// Central design/template data for Drucka.
// These represent ready-made design ideas/templates a user can apply.
// Local for now; later this becomes a DB/CMS-backed "design range".

export type DesignCategory =
  | "birthday"
  | "anniversary"
  | "festival"
  | "office"
  | "baby"
  | "friendship";

export interface Design {
  id: string;
  name: string;
  category: DesignCategory;
  preview: string;          // emoji or image path used as a thumbnail
  compatibleProducts: string[]; // product ids this design works on
}

export const designs: Design[] = [
  {
    id: "bday-collage",
    name: "Birthday Photo Collage",
    category: "birthday",
    preview: "🎂",
    compatibleProducts: ["mug", "frame", "cushion"],
  },
  {
    id: "anniv-forever",
    name: "Forever & Always",
    category: "anniversary",
    preview: "💞",
    compatibleProducts: ["frame", "canvas", "cushion"],
  },
  {
    id: "office-quote",
    name: "Minimal Quote",
    category: "office",
    preview: "💼",
    compatibleProducts: ["tshirt", "mug"],
  },
  {
    id: "festival-rangoli",
    name: "Rangoli Greeting",
    category: "festival",
    preview: "🪔",
    compatibleProducts: ["cushion", "mug", "frame"],
  },
  {
    id: "baby-pastel",
    name: "Baby Pastel Frame",
    category: "baby",
    preview: "🍼",
    compatibleProducts: ["frame", "canvas"],
  },
  {
    id: "friends-caricature",
    name: "Friendship Caricature",
    category: "friendship",
    preview: "🤝",
    compatibleProducts: ["mug", "tshirt", "keychain"],
  },
];

// --- Accessors ---
export function getDesigns(): Design[] {
  return designs;
}
export function getDesignsForProduct(productId: string): Design[] {
  return designs.filter((d) => d.compatibleProducts.includes(productId));
}
