"use client";
// Bridges real DOM scroll position (per-section offsets) into the 3D scene's
// scroll store. Offsets are re-measured on every scroll frame so the camera
// stays perfectly aligned with each section even after fonts/images settle.
import { useEffect } from "react";
import { scrollStore } from "@/lib/scrollStore";

export function ScrollBridge() {
  useEffect(() => {
    let raf = 0;

    const measure = () => {
      const sections = document.querySelectorAll<HTMLElement>("[data-scene]");
      const next: number[] = [];
      sections.forEach((el) => {
        next.push(el.getBoundingClientRect().top + window.scrollY);
      });
      scrollStore.offsets = next;
    };

    const update = () => {
      measure();
      const { offsets } = scrollStore;
      if (offsets.length < 2) return;
      const y = window.scrollY;
      let i = 0;
      for (let j = 0; j < offsets.length - 1; j++) {
        if (y >= offsets[j]) i = j;
      }
      const span = offsets[i + 1] - offsets[i];
      const within = span > 0 ? (y - offsets[i]) / span : 0;
      scrollStore.target = i + Math.min(1, Math.max(0, within));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(onScroll).catch(() => {});
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
