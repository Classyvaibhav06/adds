"use client";
// Minecraft-style F3 debug overlay: FPS, XYZ, chunk, biome, facing, scroll %.
// Toggle with the F3 key or the little F3 chip in the HUD.
import { useEffect, useRef, useState } from "react";
import { scrollStore } from "@/lib/scrollStore";
import { BIOMES } from "@/lib/biomes";

const FACINGS = ["south", "west", "north", "east"];

export function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const [fps, setFps] = useState(60);
  const [tick, setTick] = useState(0);
  const frames = useRef(0);
  const lastFps = useRef(performance.now());

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mc:f3", toggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mc:f3", toggle);
    };
  }, []);

  // fps counter
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      frames.current++;
      const now = performance.now();
      if (now - lastFps.current >= 500) {
        setFps(Math.round((frames.current * 1000) / (now - lastFps.current)));
        frames.current = 0;
        lastFps.current = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // refresh stats ~10x/s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  if (!open) return null;

  void tick;
  const seg = Math.min(BIOMES.length - 1, Math.max(0, Math.round(scrollStore.progress)));
  const p = Math.min(1, Math.max(0, scrollStore.progress / (BIOMES.length - 1)));
  const x = Math.round(Math.cos(scrollStore.progress * 1.9) * 14);
  const y = Math.round(64 - p * 144);
  const z = Math.round(Math.sin(scrollStore.progress * 1.9) * 14);
  const facing = FACINGS[Math.abs(Math.round(scrollStore.progress * 2)) % 4];

  return (
    <div
      className="fixed left-2 top-20 sm:top-24 z-30 pointer-events-none select-none"
      role="status"
      aria-label="Debug overlay"
    >
      <div className="bg-black/60 px-2 py-1.5 font-pixel text-[7px] leading-[1.7] text-white/95 whitespace-pre">
        <p className="text-[#7fff4f]">BlockSmith Portfolio (vanilla)</p>
        <p>{fps} fps &nbsp; TPS: 20.0</p>
        <p>
          XYZ: {x}.000 / {y}.000 / {z}.000
        </p>
        <p>
          Block: {x} {y} {z}
        </p>
        <p>
          Chunk: {Math.floor(x / 16)} {Math.floor(z / 16)}
        </p>
        <p>
          Facing: {facing} (Towards {(facing === "south" && "positive Z") || (facing === "north" && "negative Z") || (facing === "east" && "positive X") || "negative X"})
        </p>
        <p>Biome: {BIOMES[seg]}</p>
        <p className="text-[#7fff4f]">Scroll: {Math.round(p * 100)}%</p>
        <p>E: 1337 &nbsp; Mem: {Math.round(42 + Math.sin(tick / 9) * 7)}%</p>
      </div>
    </div>
  );
}
