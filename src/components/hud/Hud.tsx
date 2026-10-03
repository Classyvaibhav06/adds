"use client";
// Fixed Minecraft-style HUD: hearts, XP progress bar (= scroll depth),
// live coordinates and the current biome name.
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { scrollStore } from "@/lib/scrollStore";

const BIOMES = [
  "The Overworld",
  "Lush Cave",
  "Enchanting Grove",
  "Treasure Vault",
  "Redstone Bunker",
  "Portal Realm",
];

export function Hud() {
  const [seg, setSeg] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeg(scrollStore.progress), 120);
    return () => clearInterval(id);
  }, []);

  const p = Math.min(1, Math.max(0, seg / (BIOMES.length - 1)));
  const x = Math.round(Math.cos(seg * 1.9) * 14);
  const z = Math.round(Math.sin(seg * 1.9) * 14);
  const y = Math.round(64 - p * 144);
  const biome = BIOMES[Math.min(BIOMES.length - 1, Math.round(seg))];

  return (
    <div className="fixed inset-x-0 top-0 z-20 pointer-events-none" role="status" aria-label="Player HUD">
      <div className="flex items-start justify-between p-3 sm:p-4 gap-3">
        {/* Left: hearts + XP */}
        <div className="mc-panel px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-[3px]" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <Heart
                  key={i}
                  size={12}
                  className={i < 9 ? "fill-[#ff4f4f] text-[#7a1f1f]" : "fill-[#3a3a3a] text-[#1a1a1a]"}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="font-pixel text-[8px] text-white/90 text-shadow-mc hidden sm:inline">
              BlockSmith
            </span>
            <span className="font-pixel text-[8px] text-[#7fff4f] text-shadow-mc">Lv.32</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="w-32 sm:w-44 h-3 bg-black/80 border-2 border-black overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7bd34f] to-[#4f9e2f] transition-[width] duration-200"
                style={{ width: `${p * 100}%` }}
              />
            </div>
            <span className="font-pixel text-[7px] text-[#7fff4f]">{Math.round(p * 100)}%</span>
          </div>
        </div>

        {/* Right: coords + biome */}
        <div className="mc-panel px-3 py-2 text-right hidden sm:block">
          <p className="font-pixel text-[8px] text-white/90 text-shadow-mc" aria-label="coordinates">
            XYZ: {x} / {y} / {z}
          </p>
          <p className="font-mc text-base leading-4 text-[#ffd76e] text-shadow-mc mt-0.5">
            {biome}
          </p>
        </div>
      </div>
    </div>
  );
}
