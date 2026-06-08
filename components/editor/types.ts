// Shared types for the T-shirt editor.

export type EditorArea = "front" | "back" | "sleeveLeft" | "sleeveRight" | "neckInner";

export type TshirtColor = "white" | "black" | "grey";
export type TshirtSize = "S" | "M" | "L" | "XL" | "XXL";

export interface EditorLayer {
  id: string;
  type: "image" | "text";
  name: string;
  area: EditorArea;
  src?: string;   // data URL for image layers
  text?: string;  // content for text layers
  x: number;      // 0..100 (% within printable area)
  y: number;      // 0..100
  scale: number;  // % (e.g. 100)
  rotation: number; // degrees
  visible: boolean;
}

export const AREAS: { id: EditorArea; label: string }[] = [
  { id: "front", label: "Front side" },
  { id: "back", label: "Back side" },
  { id: "sleeveLeft", label: "Sleeve left" },
  { id: "sleeveRight", label: "Sleeve right" },
  { id: "neckInner", label: "Neck label inner" },
];

export const COLORS: { id: TshirtColor; label: string; hex: string }[] = [
  { id: "white", label: "White", hex: "#FFFFFF" },
  { id: "black", label: "Black", hex: "#1A1A1A" },
  { id: "grey", label: "Grey", hex: "#9AA0A6" },
];

export const SIZES: TshirtSize[] = ["S", "M", "L", "XL", "XXL"];

// Deterministic-ish unique id, only ever called inside event handlers (never
// during render) — safe for hydration.
export function newLayerId(): string {
  return "ly-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
}
