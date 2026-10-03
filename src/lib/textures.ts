// Procedural 16x16 "Minecraft-style" pixel textures painted on canvas.
// No external assets — everything is generated at runtime with a seeded RNG
// so the world looks identical on every load.
import * as THREE from "three";

const SIZE = 16;

/** Deterministic string-hash based RNG */
function makeRng(seed: string) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) & 0x7fffffff;
  }
  if (s === 0) s = 42;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

type Rng = () => number;

function pick<T>(rng: Rng, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Adjust hex color lightness by delta (-1..1) */
function shade(hex: string, delta: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(delta < 0 ? c * (1 + delta) : c + (255 - c) * delta)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function paint(
  seed: string,
  draw: (ctx: CanvasRenderingContext2D, rng: Rng) => void
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx, makeRng(seed));
  return canvas;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Fill with base color + per-pixel noise */
function noiseFill(ctx: CanvasRenderingContext2D, rng: Rng, base: string, variance = 0.14) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      px(ctx, x, y, 1, 1, shade(base, (rng() - 0.5) * 2 * variance));
    }
  }
}

/** Scatter ore blobs onto a stone-like base */
function oreSpots(ctx: CanvasRenderingContext2D, rng: Rng, color: string) {
  const count = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const x = 1 + Math.floor(rng() * 12);
    const y = 1 + Math.floor(rng() * 12);
    // dark outline
    px(ctx, x - 1, y, 3, 1, shade(color, -0.55));
    px(ctx, x, y - 1, 1, 3, shade(color, -0.55));
    // gem body
    px(ctx, x, y, 1, 1, color);
    px(ctx, x + 1, y, 1, 1, shade(color, 0.25));
    px(ctx, x, y + 1, 1, 1, shade(color, -0.2));
  }
}

const painters: Record<string, (ctx: CanvasRenderingContext2D, rng: Rng) => void> = {
  dirt: (ctx, rng) => {
    noiseFill(ctx, rng, "#8a5f38", 0.18);
    for (let i = 0; i < 10; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#5f3f22");
  },
  grass_top: (ctx, rng) => {
    noiseFill(ctx, rng, "#6faf3e", 0.2);
    for (let i = 0; i < 12; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#4c8a2a");
    for (let i = 0; i < 6; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#8cc94f");
  },
  grass_side: (ctx, rng) => {
    painters.dirt(ctx, rng);
    for (let x = 0; x < SIZE; x++) {
      const depth = 2 + Math.floor(rng() * 3); // jagged grass edge
      for (let y = 0; y < depth; y++) {
        px(ctx, x, y, 1, 1, shade("#6faf3e", (rng() - 0.5) * 0.35));
      }
      px(ctx, x, depth, 1, 1, "#4c8a2a");
    }
  },
  stone: (ctx, rng) => {
    noiseFill(ctx, rng, "#8a8a8a", 0.14);
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(rng() * 13);
      const y = Math.floor(rng() * 16);
      px(ctx, x, y, 2 + Math.floor(rng() * 3), 1, "#6d6d6d");
    }
  },
  cobble: (ctx, rng) => {
    noiseFill(ctx, rng, "#7d7d7d", 0.1);
    // chunky stones with dark mortar
    const cells = [0, 4, 8, 12];
    for (const cx of cells) {
      for (const cy of cells) {
        const jx = Math.floor(rng() * 2) - 1;
        px(ctx, cx + jx, cy, 4, 1, "#4f4f4f");
        px(ctx, cx + jx, cy, 1, 4, "#4f4f4f");
        px(ctx, cx + jx + 1, cy + 1, 2, 2, shade("#9a9a9a", (rng() - 0.4) * 0.3));
      }
    }
  },
  bedrock: (ctx, rng) => {
    for (let y = 0; y < SIZE; y += 2) {
      for (let x = 0; x < SIZE; x += 2) {
        const c = pick(rng, ["#1c1c1c", "#3a3a3a", "#575757", "#2a2a2a"]);
        px(ctx, x, y, 2, 2, c);
      }
    }
  },
  oak_planks: (ctx, rng) => {
    noiseFill(ctx, rng, "#9c7f4e", 0.1);
    for (let y = 3; y < SIZE; y += 4) px(ctx, 0, y, SIZE, 1, "#6e5630");
    // staggered vertical seams
    px(ctx, 4, 0, 1, 3, "#6e5630");
    px(ctx, 12, 4, 1, 3, "#6e5630");
    px(ctx, 2, 8, 1, 3, "#6e5630");
    px(ctx, 9, 12, 1, 3, "#6e5630");
    for (let i = 0; i < 6; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#7d6539");
  },
  log_side: (ctx, rng) => {
    for (let x = 0; x < SIZE; x++) {
      const base = pick(rng, ["#6b511f", "#755a24", "#5e4719"]);
      for (let y = 0; y < SIZE; y++) {
        px(ctx, x, y, 1, 1, shade(base, (rng() - 0.5) * 0.15));
      }
    }
  },
  log_top: (ctx, rng) => {
    noiseFill(ctx, rng, "#9c7f4e", 0.08);
    px(ctx, 2, 2, 12, 12, "#6e5630");
    px(ctx, 4, 4, 8, 8, "#9c7f4e");
    px(ctx, 6, 6, 4, 4, "#6e5630");
    px(ctx, 7, 7, 2, 2, "#b09459");
  },
  leaves: (ctx, rng) => {
    noiseFill(ctx, rng, "#3e7a24", 0.3);
    for (let i = 0; i < 14; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#24500f");
    for (let i = 0; i < 8; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#57a334");
  },
  sand: (ctx, rng) => noiseFill(ctx, rng, "#dcd3a0", 0.1),
  obsidian: (ctx, rng) => {
    noiseFill(ctx, rng, "#17111f", 0.35);
    for (let i = 0; i < 6; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#3a2a52");
    for (let i = 0; i < 3; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#241a38");
  },
  netherrack: (ctx, rng) => {
    noiseFill(ctx, rng, "#6e3533", 0.22);
    for (let i = 0; i < 12; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#4a1f1e");
  },
  glowstone: (ctx, rng) => {
    noiseFill(ctx, rng, "#b8873b", 0.18);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(rng() * 15);
      const y = Math.floor(rng() * 15);
      px(ctx, x, y, 2, 2, "#ffd97d");
    }
    for (let i = 0; i < 5; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#ffe9b0");
  },
  iron_ore: (ctx, rng) => {
    painters.stone(ctx, rng);
    oreSpots(ctx, rng, "#d8af93");
  },
  gold_ore: (ctx, rng) => {
    painters.stone(ctx, rng);
    oreSpots(ctx, rng, "#fcee4b");
  },
  diamond_ore: (ctx, rng) => {
    painters.stone(ctx, rng);
    oreSpots(ctx, rng, "#4aedd9");
  },
  redstone_ore: (ctx, rng) => {
    painters.stone(ctx, rng);
    oreSpots(ctx, rng, "#ff3b3b");
  },
  coal_ore: (ctx, rng) => {
    painters.stone(ctx, rng);
    oreSpots(ctx, rng, "#2f2f2f");
  },
  emerald_ore: (ctx, rng) => {
    painters.stone(ctx, rng);
    oreSpots(ctx, rng, "#41f384");
  },
  gold_block: (ctx, rng) => {
    noiseFill(ctx, rng, "#f8d33e", 0.06);
    px(ctx, 0, 0, SIZE, 1, "#c9a52c");
    px(ctx, 0, 0, 1, SIZE, "#c9a52c");
    px(ctx, 15, 0, 1, SIZE, "#c9a52c");
    px(ctx, 0, 15, SIZE, 1, "#c9a52c");
    px(ctx, 3, 3, 2, 2, "#ffef9e");
    px(ctx, 10, 9, 2, 2, "#ffef9e");
  },
  diamond_block: (ctx, rng) => {
    noiseFill(ctx, rng, "#6be8db", 0.07);
    px(ctx, 0, 0, SIZE, 1, "#3fb5aa");
    px(ctx, 0, 15, SIZE, 1, "#3fb5aa");
    px(ctx, 0, 0, 1, SIZE, "#3fb5aa");
    px(ctx, 15, 0, 1, SIZE, "#3fb5aa");
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(rng() * 13) + 1;
      const y = Math.floor(rng() * 13) + 1;
      px(ctx, x, y, 2, 1, "#c8fff8");
      px(ctx, x, y + 1, 1, 1, "#3fb5aa");
    }
  },
  bookshelf: (ctx, rng) => {
    painters.oak_planks(ctx, rng);
    // two shelf rows of book spines
    const spineColors = ["#a03030", "#3f7a3f", "#8a6a3a", "#5f5f7a", "#c4a04a", "#7a4a7a"];
    for (const rowY of [2, 9]) {
      px(ctx, 0, rowY, SIZE, 5, "#241505");
      let x = 0;
      while (x < SIZE) {
        const w = 1 + Math.floor(rng() * 2);
        px(ctx, x, rowY + 1, w, 4, pick(rng, spineColors));
        x += w + (rng() < 0.2 ? 1 : 0);
      }
    }
  },
  chest_front: (ctx, rng) => {
    noiseFill(ctx, rng, "#8a5f2a", 0.12);
    px(ctx, 0, 0, SIZE, 1, "#4e3413");
    px(ctx, 0, 15, SIZE, 1, "#4e3413");
    px(ctx, 0, 0, 1, SIZE, "#4e3413");
    px(ctx, 15, 0, 1, SIZE, "#4e3413");
    px(ctx, 0, 6, SIZE, 1, "#4e3413");
    // latch
    px(ctx, 7, 5, 2, 4, "#9a9a9a");
    px(ctx, 7, 5, 2, 1, "#c8c8c8");
    px(ctx, 7, 7, 1, 1, "#3a3a3a");
  },
  chest_side: (ctx, rng) => {
    noiseFill(ctx, rng, "#8a5f2a", 0.12);
    px(ctx, 0, 0, SIZE, 1, "#4e3413");
    px(ctx, 0, 15, SIZE, 1, "#4e3413");
    px(ctx, 0, 0, 1, SIZE, "#4e3413");
    px(ctx, 15, 0, 1, SIZE, "#4e3413");
    px(ctx, 0, 6, SIZE, 1, "#4e3413");
  },
  chest_top: (ctx, rng) => {
    noiseFill(ctx, rng, "#956832", 0.1);
    px(ctx, 0, 0, SIZE, 1, "#4e3413");
    px(ctx, 0, 15, SIZE, 1, "#4e3413");
    px(ctx, 0, 0, 1, SIZE, "#4e3413");
    px(ctx, 15, 0, 1, SIZE, "#4e3413");
    px(ctx, 7, 1, 2, 14, "#4e3413");
  },
  server_front: (ctx, rng) => {
    noiseFill(ctx, rng, "#1b1c20", 0.15);
    // rack units
    for (let y = 1; y < SIZE; y += 4) {
      px(ctx, 1, y, 11, 1, "#2e3138");
      // LED strip
      const led = pick(rng, ["#3dff6e", "#3dff6e", "#ffc63d", "#ff5252", "#2a2d33"]);
      px(ctx, 13, y + 1, 1, 1, led);
      px(ctx, 14, y + 1, 1, 1, pick(rng, ["#3dff6e", "#2a2d33"]));
      // vents
      px(ctx, 3, y + 2, 6, 1, "#111318");
    }
  },
  server_side: (ctx, rng) => {
    noiseFill(ctx, rng, "#1e1f24", 0.12);
    for (let y = 0; y < SIZE; y += 4) px(ctx, 0, y, SIZE, 1, "#14151a");
  },
  command_block: (ctx, rng) => {
    noiseFill(ctx, rng, "#b0703c", 0.1);
    px(ctx, 0, 0, SIZE, 1, "#7a4a24");
    px(ctx, 0, 15, SIZE, 1, "#7a4a24");
    px(ctx, 0, 0, 1, SIZE, "#7a4a24");
    px(ctx, 15, 0, 1, SIZE, "#7a4a24");
    // pattern dots
    px(ctx, 3, 3, 2, 2, "#5c3418");
    px(ctx, 11, 3, 2, 2, "#5c3418");
    px(ctx, 7, 6, 2, 4, "#5c3418");
    px(ctx, 3, 11, 2, 2, "#5c3418");
    px(ctx, 11, 11, 2, 2, "#5c3418");
  },
  enchant_side: (ctx, rng) => {
    painters.obsidian(ctx, rng);
    // glowing runes
    for (let i = 0; i < 7; i++) {
      px(ctx, Math.floor(rng() * 14) + 1, Math.floor(rng() * 14) + 1, 2, 1, "#e8d9ff");
    }
  },
  enchant_top: (ctx, rng) => {
    noiseFill(ctx, rng, "#2b1b3d", 0.2);
    px(ctx, 5, 5, 6, 6, "#3a2a52");
    px(ctx, 6, 6, 4, 4, "#c94f4f");
    px(ctx, 7, 7, 2, 2, "#ff8f8f");
    px(ctx, 1, 1, 2, 2, "#e8d9ff");
    px(ctx, 13, 1, 2, 2, "#e8d9ff");
    px(ctx, 1, 13, 2, 2, "#e8d9ff");
    px(ctx, 13, 13, 2, 2, "#e8d9ff");
  },
  redstone_lamp: (ctx, rng) => {
    noiseFill(ctx, rng, "#6e3a1e", 0.15);
    for (let y = 2; y < SIZE; y += 4) {
      for (let x = 2; x < SIZE; x += 4) {
        px(ctx, x, y, 2, 2, "#8a4a24");
      }
    }
    px(ctx, 0, 0, SIZE, 1, "#4a2410");
    px(ctx, 0, 15, SIZE, 1, "#4a2410");
  },
  amethyst: (ctx, rng) => {
    noiseFill(ctx, rng, "#8a5fc4", 0.2);
    for (let i = 0; i < 7; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#b48ae8");
    for (let i = 0; i < 5; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#5c3a8a");
  },
};

export type TextureId = keyof typeof painters;

const textureCache = new Map<string, THREE.CanvasTexture>();

function getTexture(id: string): THREE.CanvasTexture {
  const hit = textureCache.get(id);
  if (hit) return hit;
  const painter = painters[id];
  if (!painter) throw new Error(`Unknown texture: ${id}`);
  const tex = new THREE.CanvasTexture(paint(id, painter));
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(id, tex);
  return tex;
}

/** face order for BoxGeometry material array: +x, -x, +y, -y, +z, -z */
export type BlockType =
  | "grass"
  | "dirt"
  | "stone"
  | "cobble"
  | "bedrock"
  | "log"
  | "leaves"
  | "planks"
  | "sand"
  | "obsidian"
  | "netherrack"
  | "glowstone"
  | "iron_ore"
  | "gold_ore"
  | "diamond_ore"
  | "redstone_ore"
  | "coal_ore"
  | "emerald_ore"
  | "gold_block"
  | "diamond_block"
  | "bookshelf"
  | "chest"
  | "server_rack"
  | "command_block"
  | "enchant_table"
  | "redstone_lamp"
  | "amethyst";

const materialCache = new Map<string, THREE.Material | THREE.Material[]>();

function lambert(id: string, emissive = "#000000", intensity = 0): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map: getTexture(id),
    emissive: new THREE.Color(emissive),
    emissiveIntensity: intensity,
  });
}

/** Returns a (possibly shared) material or 6-material array for a block type. */
export function getBlockMaterials(type: BlockType): THREE.Material | THREE.Material[] {
  const hit = materialCache.get(type);
  if (hit) return hit;

  let mat: THREE.Material | THREE.Material[];
  switch (type) {
    case "grass":
      mat = [
        lambert("grass_side"),
        lambert("grass_side"),
        lambert("grass_top"),
        lambert("dirt"),
        lambert("grass_side"),
        lambert("grass_side"),
      ];
      break;
    case "log":
      mat = [
        lambert("log_side"),
        lambert("log_side"),
        lambert("log_top"),
        lambert("log_top"),
        lambert("log_side"),
        lambert("log_side"),
      ];
      break;
    case "bookshelf":
      mat = [
        lambert("bookshelf"),
        lambert("bookshelf"),
        lambert("oak_planks"),
        lambert("oak_planks"),
        lambert("bookshelf"),
        lambert("bookshelf"),
      ];
      break;
    case "chest":
      mat = [
        lambert("chest_side"),
        lambert("chest_side"),
        lambert("chest_top"),
        lambert("chest_top"),
        lambert("chest_front"),
        lambert("chest_side"),
      ];
      break;
    case "server_rack":
      mat = [
        lambert("server_side"),
        lambert("server_side"),
        lambert("server_side"),
        lambert("server_side"),
        lambert("server_front"),
        lambert("server_side"),
      ];
      break;
    case "enchant_table":
      mat = [
        lambert("enchant_side"),
        lambert("enchant_side"),
        lambert("enchant_top"),
        lambert("obsidian"),
        lambert("enchant_side"),
        lambert("enchant_side"),
      ];
      break;
    case "glowstone":
      mat = lambert("glowstone", "#ffc966", 0.55);
      break;
    case "amethyst":
      mat = lambert("amethyst", "#9a5fe8", 0.35);
      break;
    case "diamond_block":
      mat = lambert("diamond_block", "#4ad9cc", 0.18);
      break;
    case "gold_block":
      mat = lambert("gold_block", "#f8d33e", 0.12);
      break;
    case "redstone_lamp":
      mat = lambert("redstone_lamp", "#ff9b3d", 0.0);
      break;
    case "planks":
      mat = lambert("oak_planks");
      break;
    default:
      mat = lambert(type);
  }
  materialCache.set(type, mat);
  return mat;
}

/** Shared unit box geometry for every block. */
let boxGeo: THREE.BoxGeometry | null = null;
export function getBoxGeometry(): THREE.BoxGeometry {
  if (!boxGeo) boxGeo = new THREE.BoxGeometry(1, 1, 1);
  return boxGeo;
}
