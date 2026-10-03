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
  /* ---- mobs ---- */
  creeper_skin: (ctx, rng) => {
    noiseFill(ctx, rng, "#4faf4f", 0.28);
    for (let i = 0; i < 12; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 2, "#2f7a2f");
    for (let i = 0; i < 8; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#7fd47f");
  },
  creeper_face: (ctx, rng) => {
    painters.creeper_skin(ctx, rng);
    const black = "#101410";
    px(ctx, 3, 4, 2, 2, black); // eyes
    px(ctx, 11, 4, 2, 2, black);
    px(ctx, 6, 7, 4, 3, black); // mouth
    px(ctx, 5, 9, 1, 3, black);
    px(ctx, 10, 9, 1, 3, black);
  },
  pig_skin: (ctx, rng) => {
    noiseFill(ctx, rng, "#eda3a3", 0.12);
    for (let i = 0; i < 6; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#d88787");
  },
  pig_face: (ctx, rng) => {
    painters.pig_skin(ctx, rng);
    px(ctx, 3, 5, 1, 2, "#ffffff"); // eyes
    px(ctx, 4, 5, 1, 2, "#1a1a2a");
    px(ctx, 11, 5, 1, 2, "#1a1a2a");
    px(ctx, 12, 5, 1, 2, "#ffffff");
    px(ctx, 5, 8, 6, 4, "#f2b5b5"); // snout
    px(ctx, 5, 8, 6, 1, "#d88787");
    px(ctx, 6, 10, 1, 1, "#7a3a3a"); // nostrils
    px(ctx, 9, 10, 1, 1, "#7a3a3a");
  },
  enderman_skin: (ctx, rng) => {
    noiseFill(ctx, rng, "#101014", 0.5);
  },
  enderman_face: (ctx, rng) => {
    painters.enderman_skin(ctx, rng);
    px(ctx, 2, 5, 5, 2, "#d57bff"); // glowing eyes
    px(ctx, 9, 5, 5, 2, "#d57bff");
    px(ctx, 3, 6, 2, 1, "#8a3fc4");
    px(ctx, 10, 6, 2, 1, "#8a3fc4");
  },
  end_stone: (ctx, rng) => {
    noiseFill(ctx, rng, "#dde0a0", 0.1);
    for (let i = 0; i < 8; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#c2c688");
    for (let i = 0; i < 5; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#f0f2c0");
  },
  /* ---- tnt ---- */
  tnt_side: (ctx, rng) => {
    noiseFill(ctx, rng, "#c73a3a", 0.12);
    px(ctx, 0, 0, SIZE, 1, "#7a1f1f");
    px(ctx, 0, 15, SIZE, 1, "#7a1f1f");
    px(ctx, 0, 6, SIZE, 5, "#e8e0d0"); // white band
    px(ctx, 0, 6, SIZE, 1, "#b8b0a0");
    // TNT letters
    px(ctx, 2, 7, 3, 1, "#1a1a1a");
    px(ctx, 3, 8, 1, 2, "#1a1a1a");
    px(ctx, 6, 7, 1, 3, "#1a1a1a");
    px(ctx, 9, 7, 1, 3, "#1a1a1a");
    px(ctx, 8, 8, 1, 1, "#1a1a1a");
    px(ctx, 11, 7, 3, 1, "#1a1a1a");
    px(ctx, 12, 8, 1, 2, "#1a1a1a");
  },
  tnt_top: (ctx, rng) => {
    noiseFill(ctx, rng, "#c73a3a", 0.1);
    px(ctx, 4, 4, 8, 8, "#d8cfc0");
    px(ctx, 4, 4, 8, 1, "#b8b0a0");
    px(ctx, 7, 7, 2, 2, "#1a1a1a");
  },
  /* ---- environment ---- */
  waterfall: (ctx, rng) => {
    noiseFill(ctx, rng, "#3f76e4", 0.14);
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(rng() * 16);
      const y = Math.floor(rng() * 8);
      px(ctx, x, y, 1, 16 - y, "#9bd4ff");
    }
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(rng() * 16);
      px(ctx, x, Math.floor(rng() * 6), 1, 10 + Math.floor(rng() * 6), "#2a56c4");
    }
    for (let i = 0; i < 5; i++) px(ctx, Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, "#ffffff");
  },
  flower_red: (ctx) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    px(ctx, 7, 8, 1, 8, "#3e7a24"); // stem
    px(ctx, 5, 11, 2, 1, "#3e7a24"); // leaves
    px(ctx, 8, 12, 2, 1, "#3e7a24");
    px(ctx, 6, 3, 3, 5, "#d8342c"); // petals
    px(ctx, 5, 4, 5, 3, "#d8342c");
    px(ctx, 7, 4, 1, 2, "#1a1a1a"); // center
  },
  flower_yellow: (ctx) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    px(ctx, 7, 8, 1, 8, "#3e7a24");
    px(ctx, 6, 10, 1, 1, "#3e7a24");
    px(ctx, 6, 3, 4, 4, "#f8d33e");
    px(ctx, 7, 4, 2, 2, "#ffef9e");
    px(ctx, 5, 4, 1, 2, "#f8d33e");
    px(ctx, 10, 4, 1, 2, "#f8d33e");
  },
  tall_grass: (ctx, rng) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 7; i++) {
      const x = 2 + Math.floor(rng() * 12);
      const h = 5 + Math.floor(rng() * 7);
      px(ctx, x, SIZE - h, 1, h, pick(rng, ["#4c8a2a", "#5fa334", "#6faf3e"]));
    }
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
  | "amethyst"
  | "tnt"
  | "creeper_skin"
  | "creeper_head"
  | "pig_skin"
  | "pig_head"
  | "enderman_skin"
  | "enderman_head"
  | "end_stone";

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
    case "creeper_head":
      mat = [
        lambert("creeper_skin"),
        lambert("creeper_skin"),
        lambert("creeper_skin"),
        lambert("creeper_skin"),
        lambert("creeper_face"),
        lambert("creeper_skin"),
      ];
      break;
    case "pig_head":
      mat = [
        lambert("pig_skin"),
        lambert("pig_skin"),
        lambert("pig_skin"),
        lambert("pig_skin"),
        lambert("pig_face"),
        lambert("pig_skin"),
      ];
      break;
    case "enderman_head":
      mat = [
        lambert("enderman_skin"),
        lambert("enderman_skin"),
        lambert("enderman_skin"),
        lambert("enderman_skin"),
        lambert("enderman_face"),
        lambert("enderman_skin"),
      ];
      break;
    case "tnt":
      mat = [
        lambert("tnt_side"),
        lambert("tnt_side"),
        lambert("tnt_top"),
        lambert("tnt_top"),
        lambert("tnt_side"),
        lambert("tnt_side"),
      ];
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

/** Access a cached texture directly (e.g. to clone for animated offsets). */
export function getRawTexture(id: string): THREE.CanvasTexture {
  return getTexture(id);
}

/* ============ 16x16 item icons for the HUD hotbar (painted → data URL) ============ */

const iconPainters: Record<string, (ctx: CanvasRenderingContext2D, rng: Rng) => void> = {
  pickaxe: (ctx) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 7; i++) px(ctx, 4 + i, 10 - i, 2, 2, "#8a5f38"); // handle
    const head: [number, number][] = [
      [4, 4], [5, 3], [6, 2], [7, 2], [8, 2], [9, 2], [10, 3], [11, 4], [12, 5],
    ];
    for (const [x, y] of head) px(ctx, x, y, 2, 2, "#9a9a9a");
    for (const [x, y] of head) px(ctx, x, y + 2, 2, 1, "#6d6d6d");
  },
  sword: (ctx) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 8; i++) px(ctx, 11 - i, 2 + i, 2, 2, "#4aedd9"); // blade
    for (let i = 0; i < 8; i++) px(ctx, 12 - i, 2 + i, 1, 1, "#c8fff8"); // edge shine
    px(ctx, 3, 9, 4, 1, "#2a5a54"); // guard
    px(ctx, 5, 9, 1, 1, "#2a5a54");
    px(ctx, 3, 10, 1, 1, "#2a5a54");
    for (let i = 0; i < 3; i++) px(ctx, 2 + i, 10 + i, 2, 2, "#6e5630"); // handle
  },
  torch: (ctx) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    px(ctx, 7, 6, 2, 9, "#6e5630"); // stick
    px(ctx, 6, 2, 4, 4, "#ffd97d"); // flame
    px(ctx, 7, 3, 2, 2, "#fff2b0");
    px(ctx, 6, 5, 4, 1, "#ff7b2f");
  },
  tnt: (ctx, rng) => {
    painters.tnt_side(ctx, rng);
  },
  bucket: (ctx) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 4; i++) px(ctx, 3, 3 + i, 1, 1, "#9a9a9a"); // handle
    for (let i = 0; i < 4; i++) px(ctx, 12, 3 + i, 1, 1, "#9a9a9a");
    px(ctx, 3, 3, 10, 1, "#9a9a9a");
    px(ctx, 4, 6, 9, 2, "#3f76e4"); // water
    for (let i = 0; i < 6; i++) px(ctx, 4 + i, 8 + i, 9 - i * 2, 1, "#8a8a8a");
    for (let i = 0; i < 6; i++) px(ctx, 4, 8 + i, 9 - i * 2, 1, "#b8b8b8");
    px(ctx, 4, 13, 9, 1, "#6d6d6d");
  },
  pearl: (ctx) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const d = Math.hypot(x - 7.5, y - 7.5);
        if (d < 6) px(ctx, x, y, 1, 1, d < 5 ? "#0f4f45" : "#083a34");
      }
    }
    px(ctx, 5, 5, 3, 2, "#3fe0c8");
    px(ctx, 9, 9, 2, 2, "#1a7a6a");
  },
  gapple: (ctx) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const d = Math.hypot(x - 7.5, y - 9);
        if (d < 5.5) px(ctx, x, y, 1, 1, d < 4.5 ? "#f8d33e" : "#c9a52c");
      }
    }
    px(ctx, 7, 2, 2, 2, "#6e5630"); // stem
    px(ctx, 9, 3, 3, 2, "#4c8a2a"); // leaf
    px(ctx, 5, 6, 2, 2, "#ffef9e"); // shine
  },
  diamond: (ctx) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = Math.abs(x - 7.5);
        const dy = Math.abs(y - 7.5);
        if (dx + dy < 6) px(ctx, x, y, 1, 1, dx + dy < 5 ? "#4aedd9" : "#2aa79b");
      }
    }
    px(ctx, 5, 4, 3, 2, "#d4fff8");
    px(ctx, 8, 8, 2, 2, "#8af0e4");
  },
  book: (ctx, rng) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    px(ctx, 3, 3, 10, 11, "#7a3fc4");
    px(ctx, 3, 3, 2, 11, "#5c2f96"); // spine
    px(ctx, 12, 4, 1, 9, "#e8dcc0"); // pages
    px(ctx, 5, 5, 3, 1, "#b48ae8");
    px(ctx, 9, 7, 2, 1, "#e8d9ff");
    for (let i = 0; i < 4; i++) px(ctx, 4 + Math.floor(rng() * 8), 8 + Math.floor(rng() * 5), 1, 1, "#d9a7ff");
  },
};

const iconCache = new Map<string, string>();

/** Painted 16x16 pixel item icon as a data URL (for the HUD hotbar). */
export function getItemIcon(id: string): string {
  const hit = iconCache.get(id);
  if (hit) return hit;
  const painter = iconPainters[id];
  if (!painter) throw new Error(`Unknown item icon: ${id}`);
  const url = paint(`icon-${id}`, painter).toDataURL();
  iconCache.set(id, url);
  return url;
}
