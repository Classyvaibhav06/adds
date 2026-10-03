// Hotbar items + how each one modifies the click-to-punch effect.
export interface ItemDef {
  id: string;
  name: string;
}

export const ITEMS: ItemDef[] = [
  { id: "pickaxe", name: "Wooden Pickaxe" },
  { id: "sword", name: "Diamond Sword" },
  { id: "torch", name: "Torch" },
  { id: "tnt", name: "TNT" },
  { id: "bucket", name: "Water Bucket" },
  { id: "pearl", name: "Ender Pearl" },
  { id: "gapple", name: "Golden Apple" },
  { id: "diamond", name: "Diamond" },
  { id: "book", name: "Enchanted Book" },
];

export type SfxName = "pop" | "boom" | "ding" | "sparkle" | "splash" | "teleport";

export interface PunchProfile {
  palette: string[];
  count: number;
  shake: number;
  sfx: SfxName;
}

export const PUNCH_PROFILES: Record<string, PunchProfile> = {
  pickaxe: { palette: ["#8a5f38", "#8a8a8a", "#6faf3e"], count: 10, shake: 0.4, sfx: "pop" },
  sword: { palette: ["#d8d8d8", "#ff5f5f", "#ffffff"], count: 12, shake: 0.5, sfx: "pop" },
  torch: { palette: ["#ffb84f", "#ffd97d", "#ff7b2f"], count: 9, shake: 0.3, sfx: "sparkle" },
  tnt: { palette: ["#c73a3a", "#ff9b3d", "#8a8a8a", "#ffd97d"], count: 26, shake: 1.0, sfx: "boom" },
  bucket: { palette: ["#3f76e4", "#9bd4ff", "#2a56c4"], count: 12, shake: 0.35, sfx: "splash" },
  pearl: { palette: ["#0f4f45", "#3fe0c8", "#e07bff"], count: 10, shake: 0.4, sfx: "teleport" },
  gapple: { palette: ["#f8d33e", "#ffef9e", "#ff5f5f"], count: 12, shake: 0.35, sfx: "ding" },
  diamond: { palette: ["#4aedd9", "#c8fff8", "#2aa79b"], count: 12, shake: 0.4, sfx: "ding" },
  book: { palette: ["#7a3fc4", "#d9a7ff", "#e8d9ff"], count: 12, shake: 0.4, sfx: "teleport" },
};
