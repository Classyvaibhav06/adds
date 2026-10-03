"use client";
// Classic 9-slot Minecraft hotbar. Keys 1-9 (or click) select an item; the
// selection changes the click-to-punch particle effect in the 3D scene.
// Icons are 16x16 pixel paintings converted to data URLs (client-only).
import { useEffect, useRef, useState } from "react";
import { ITEMS } from "@/lib/items";
import { getItemIcon } from "@/lib/textures";
import { scrollStore } from "@/lib/scrollStore";
import { playPop } from "@/lib/sfx";

export function Hotbar() {
  const [selected, setSelected] = useState("pickaxe");
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [label, setLabel] = useState<string | null>(null);
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // icons need the DOM canvas → build client-side after mount
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const item of ITEMS) {
      try {
        map[item.id] = getItemIcon(item.id);
      } catch {
        /* skip unknown icon */
      }
    }
    setIcons(map);
  }, []);

  const select = (id: string, name: string) => {
    scrollStore.selectedItem = id;
    setSelected(id);
    setLabel(name);
    playPop();
    if (labelTimer.current) clearTimeout(labelTimer.current);
    labelTimer.current = setTimeout(() => setLabel(null), 1600);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= ITEMS.length) {
        const item = ITEMS[n - 1];
        select(item.id, item.name);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (labelTimer.current) clearTimeout(labelTimer.current);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pointer-events-none">
      {/* item name label (like Minecraft) */}
      <div
        className={`font-mc text-lg leading-5 text-white text-shadow-mc transition-opacity duration-300 ${
          label ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        {label ?? "\u00A0"}
      </div>

      <div
        className="flex gap-[3px] bg-black/70 border-3 border-black p-[3px] shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
        role="toolbar"
        aria-label="Item hotbar — press 1 to 9"
      >
        {ITEMS.map((item, i) => {
          const isSel = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => select(item.id, item.name)}
              aria-label={`${item.name} (slot ${i + 1})`}
              aria-pressed={isSel}
              className={`mc-slot relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center pointer-events-auto transition-transform duration-100 ${
                isSel ? "scale-110 z-10 outline-3 outline-white shadow-[0_0_0_3px_#ffffff,0_0_12px_rgba(255,255,255,0.5)]" : ""
              }`}
            >
              {icons[item.id] ? (
                <img
                  src={icons[item.id]}
                  alt=""
                  className="w-7 h-7 sm:w-8 sm:h-8 [image-rendering:pixelated] pointer-events-none"
                  draggable={false}
                />
              ) : (
                <span className="w-7 h-7" />
              )}
              <span className="absolute bottom-0 right-0.5 font-pixel text-[6px] text-white/90 text-shadow-mc">
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
