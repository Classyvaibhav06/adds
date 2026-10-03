"use client";
// Live Minecraft chat feed (bottom-left) + advancement toasts when you reach
// a new biome by scrolling. Also plays the classic "achievement" ding.
import { useEffect, useRef, useState } from "react";
import { scrollStore } from "@/lib/scrollStore";
import { BIOMES } from "@/lib/biomes";
import { useToast } from "@/hooks/use-toast";
import { playDing } from "@/lib/sfx";

interface ChatLine {
  id: number;
  text: string;
  tone: "join" | "server" | "reach" | "mob";
}

const ACHIEVEMENTS: Record<number, string> = {
  1: "Getting an Upgrade",
  2: "Enchanter",
  3: "Treasure Hunter",
  4: "Server Admin",
  5: "The End?",
};

const AMBIENT: { text: string; tone: ChatLine["tone"] }[] = [
  { text: "[Server thread/INFO]: Health check passed in 12ms", tone: "server" },
  { text: "<Creeper> ssssss…", tone: "mob" },
  { text: "[Backup] World saved in 342ms", tone: "server" },
  { text: "Notch joined the game", tone: "join" },
  { text: "<Pig> oink!", tone: "mob" },
  { text: "[Deploy] v8.1.4 rolled out to 12 nodes", tone: "server" },
  { text: "<Enderman> …", tone: "mob" },
  { text: "[Cache] Redis hit-rate 99.2%", tone: "server" },
];

const MAX_LINES = 6;
const LINE_TTL = 7000;

export function LiveFeed() {
  const { toast } = useToast();
  const [lines, setLines] = useState<ChatLine[]>([]);
  const idRef = useRef(0);
  const seenRef = useRef<Set<number>>(new Set());
  const lastSegRef = useRef(0);
  const ambientIdx = useRef(0);

  const push = (text: string, tone: ChatLine["tone"]) => {
    const id = idRef.current++;
    setLines((ls) => [...ls.slice(-(MAX_LINES - 1)), { id, text, tone }]);
    setTimeout(() => {
      setLines((ls) => ls.filter((l) => l.id !== id));
    }, LINE_TTL);
  };

  // welcome messages
  useEffect(() => {
    const t1 = setTimeout(() => push("BlockSmith joined the game", "join"), 900);
    const t2 = setTimeout(
      () => push("[Server thread/INFO]: Done (2.314s)! For help, type /help", "server"),
      2600
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll milestones → advancement toast + chat line
  useEffect(() => {
    const id = setInterval(() => {
      const seg = Math.min(BIOMES.length - 1, Math.max(0, Math.round(scrollStore.progress)));
      if (seg !== lastSegRef.current) {
        lastSegRef.current = seg;
        if (!seenRef.current.has(seg)) {
          seenRef.current.add(seg);
          if (seg > 0) {
            push(`BlockSmith reached the ${BIOMES[seg]}`, "reach");
            const name = ACHIEVEMENTS[seg];
            if (name) {
              playDing();
              toast({ title: `${name}!`, description: "Advancement get — keep mining." });
            }
          }
        }
      }
    }, 180);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ambient chatter
  useEffect(() => {
    const id = setInterval(() => {
      const next = AMBIENT[ambientIdx.current % AMBIENT.length];
      ambientIdx.current++;
      push(next.text, next.tone);
    }, 16000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toneColor: Record<ChatLine["tone"], string> = {
    join: "text-[#7fff4f]",
    server: "text-white/70",
    reach: "text-[#ffd76e]",
    mob: "text-[#d9a7ff]",
  };

  return (
    <div
      className="fixed left-2 sm:left-3 bottom-24 sm:bottom-28 z-20 pointer-events-none flex flex-col gap-0.5 max-w-[92vw]"
      aria-live="polite"
      aria-label="Chat feed"
    >
      {lines.map((l) => (
        <p
          key={l.id}
          className={`w-max max-w-full truncate bg-black/55 px-2 py-0.5 font-mc text-base leading-5 ${toneColor[l.tone]}`}
          style={{ animation: "enchant-shimmer 0s", textShadow: "2px 2px 0 rgba(0,0,0,0.8)" }}
        >
          {l.text}
        </p>
      ))}
    </div>
  );
}
