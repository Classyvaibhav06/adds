"use client";
// Scroll-triggered content sections layered above the 3D world.
// The wrapper is pointer-events-none; interactive cards re-enable events.
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  Cloud,
  Coffee,
  Container,
  Database,
  Hexagon,
  MemoryStick,
  Workflow,
  Zap,
  ChevronDown,
} from "lucide-react";
import { profile, skills, projects, serverStats, consoleLog, socials, type Skill } from "@/lib/profile";
import { useToast } from "@/hooks/use-toast";

/* ---------------- shared bits ---------------- */

function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-scene
      className={`relative min-h-screen w-full flex items-center justify-center px-4 py-24 sm:px-8 ${className}`}
    >
      {children}
    </section>
  );
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <Reveal className="text-center mb-10">
      <h2 className="font-pixel text-xl sm:text-3xl text-white text-shadow-pixel-lg">{children}</h2>
      {sub && <p className="font-mc text-xl text-[#7fff4f] text-shadow-mc mt-3">{sub}</p>}
    </Reveal>
  );
}

/** 8x8 pixel-art avatar drawn with a div grid. */
function PixelAvatar() {
  const hair = "#4a3120";
  const skin = "#c68e5f";
  const eyeW = "#ffffff";
  const eyeB = "#2f2418";
  const mouth = "#7a4a2e";
  const shirt = "#3c8527";
  const rows = [
    [hair, hair, hair, hair, hair, hair, hair, hair],
    [hair, hair, hair, hair, hair, hair, hair, hair],
    [skin, skin, skin, skin, skin, skin, skin, skin],
    [skin, eyeW, eyeB, skin, skin, eyeW, eyeB, skin],
    [skin, skin, skin, skin, skin, skin, skin, skin],
    [skin, skin, mouth, mouth, mouth, skin, skin, skin],
    [skin, skin, skin, skin, skin, skin, skin, skin],
    [shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt],
  ];
  return (
    <div
      className="grid grid-cols-8 w-20 h-20 shrink-0 border-3 border-black shadow-[3px_3px_0_rgba(0,0,0,0.5)]"
      style={{ imageRendering: "pixelated" }}
      role="img"
      aria-label="Pixel avatar"
    >
      {rows.flatMap((row, y) =>
        row.map((c, x) => (
          <div key={`${x}-${y}`} style={{ backgroundColor: c }} />
        ))
      )}
    </div>
  );
}

const skillIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Java: Coffee,
  Go: Zap,
  "Node.js": Hexagon,
  PostgreSQL: Database,
  Redis: MemoryStick,
  Kafka: Workflow,
  Docker: Container,
  Kubernetes: Boxes,
  AWS: Cloud,
};

/* ---------------- 0. HERO ---------------- */

export function HeroSection() {
  return (
    <Section id="hero" className="flex-col">
      <Reveal className="flex flex-col items-center text-center max-w-4xl">
        <div className="mc-panel px-4 py-2 mb-8 pointer-events-auto">
          <span className="font-pixel text-[9px] text-[#7fff4f]">{"// SERVER-SIDE SPECIALIST"}</span>
        </div>
        <h1
          className="font-pixel text-shadow-pixel-lg leading-[1.15]"
          style={{ fontSize: "clamp(1.9rem, 8vw, 5rem)" }}
        >
          BLOCK<span className="text-[#7fff4f]">SMITH</span>
          <span className="blink-caret text-[#7fff4f]">_</span>
        </h1>
        <p className="font-mc text-2xl sm:text-3xl text-white/90 mt-6 max-w-2xl text-shadow-mc">
          Backend developer crafting APIs, databases &amp; real-time systems —{" "}
          <span className="text-[#ffd76e]">one block at a time.</span>
        </p>
        <div className="flex gap-3 mt-8 flex-wrap justify-center">
          {profile.stats.map((s) => (
            <div key={s.label} className="mc-panel-light px-3 py-2 text-center pointer-events-auto">
              <p className="font-pixel text-[11px] text-[#7fff4f]">{s.value}</p>
              <p className="font-mc text-base text-white/70 leading-5">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
      <motion.div
        className="absolute bottom-8 flex flex-col items-center gap-2"
        animate={{ y: [0, 9, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
      >
        <span className="font-pixel text-[9px] text-white/75 text-shadow-mc">SCROLL TO MINE</span>
        <ChevronDown size={20} className="text-[#7fff4f]" />
      </motion.div>
    </Section>
  );
}

/* ---------------- 1. ABOUT / PLAYER STATS ---------------- */

export function AboutSection() {
  return (
    <Section id="about">
      <div className="max-w-5xl w-full">
        <SectionTitle sub="who is this guy digging through my world?">PLAYER STATS</SectionTitle>
        <div className="grid md:grid-cols-2 gap-5 items-start">
          <Reveal delay={0.05}>
            <div className="mc-panel p-6 pointer-events-auto">
              <div className="flex items-center gap-4">
                <PixelAvatar />
                <div>
                  <p className="font-pixel text-sm text-white text-shadow-mc">{profile.handle}</p>
                  <p className="font-mc text-lg text-[#7fff4f] leading-6">{profile.role}</p>
                  <p className="font-mc text-base text-white/60 leading-5">{profile.location}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mc text-lg text-white/80 w-20">Health</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 ${i < 9 ? "bg-[#ff4f4f]" : "bg-[#3a3a3a]"}`}
                        style={{ boxShadow: "1px 1px 0 rgba(0,0,0,0.6)" }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mc text-lg text-white/80 w-20">Coffee</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-2.5 bg-[#8a5f38]"
                        style={{ boxShadow: "1px 1px 0 rgba(0,0,0,0.6)" }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mc text-lg text-white/80 w-20">Sleep</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 ${i < 3 ? "bg-[#7bd4ff]" : "bg-[#3a3a3a]"}`}
                        style={{ boxShadow: "1px 1px 0 rgba(0,0,0,0.6)" }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between font-mc text-base text-white/70">
                  <span>XP — commits mined</span>
                  <span className="text-[#7fff4f]">{profile.xpCommits}</span>
                </div>
                <div className="mt-1 h-3.5 bg-black/80 border-2 border-black overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#7bd34f] to-[#4f9e2f]"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "86%" }}
                    viewport={{ once: false }}
                    transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mc-panel p-6 pointer-events-auto">
              <p className="font-pixel text-[10px] text-[#ffd76e] mb-4">ACHIEVEMENTS GET!</p>
              <div className="space-y-4">
                {profile.achievements.map((a) => (
                  <div key={a.title} className="flex gap-3">
                    <span className="text-[#ffd76e] text-xl leading-6" aria-hidden="true">
                      🏆
                    </span>
                    <div>
                      <p className="font-mc text-lg text-[#ffd76e] leading-6">{a.title}</p>
                      <p className="font-mc text-base text-white/70 leading-5">{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- 2. SKILLS / ENCHANTMENTS ---------------- */

function SkillSlot({ skill, index }: { skill: Skill; index: number }) {
  const Icon = skillIcons[skill.name] ?? Boxes;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-8% 0px" }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className="group relative mc-slot aspect-square flex flex-col items-center justify-center gap-1 p-1.5 pointer-events-auto transition-transform duration-150 hover:-translate-y-1.5"
      style={{ maxWidth: "84px" }}
    >
      <Icon size={26} style={{ color: skill.glow, filter: `drop-shadow(0 0 6px ${skill.glow})` }} />
      <span className="font-pixel text-[6.5px] text-black text-center leading-tight">{skill.name}</span>
      {/* tooltip */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 w-max max-w-[160px]">
        <div className="mc-panel px-2.5 py-1.5 text-center">
          <p className="font-mc text-base enchant-text leading-5">
            {skill.enchant} {skill.level}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

const enchantFlavor = [
  { name: "Sharpness X", detail: "API design that cuts through complexity" },
  { name: "Efficiency VIII", detail: "Query optimization, caching & zero N+1s" },
  { name: "Unbreaking VII", detail: "Systems that survive production traffic" },
  { name: "Mending IX", detail: "Legacy code restoration & refactoring" },
];

export function SkillsSection() {
  return (
    <Section id="skills">
      <div className="max-w-4xl w-full">
        <SectionTitle sub="tools enchanted to the max">ENCHANTMENTS</SectionTitle>
        <Reveal>
          <div className="mc-panel p-4 sm:p-6 pointer-events-auto">
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 justify-center">
              {skills.map((s, i) => (
                <SkillSlot key={s.name} skill={s} index={i} />
              ))}
            </div>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          {enchantFlavor.map((e, i) => (
            <Reveal key={e.name} delay={0.08 * i}>
              <div className="mc-panel px-4 py-3 flex items-center gap-3 pointer-events-auto">
                <span className="font-mc text-lg enchant-text whitespace-nowrap">{e.name}</span>
                <span className="font-mc text-base text-white/70 leading-5">— {e.detail}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- 3. PROJECTS / LOOT CHESTS ---------------- */

export function ProjectsSection() {
  return (
    <Section id="projects">
      <div className="max-w-5xl w-full">
        <SectionTitle sub="left-click to claim the loot">LOOT CHESTS</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={0.07 * i}>
              <article className="mc-panel group pointer-events-auto transition-transform duration-150 hover:-translate-y-1.5 hover:shadow-[0_0_0_3px_rgba(217,167,255,0.25),0_14px_44px_rgba(0,0,0,0.6)]">
                <header className="flex items-center justify-between bg-[#3a3a44] border-b-3 border-black px-4 py-2.5">
                  <span className="font-pixel text-[10px] text-white text-shadow-mc">
                    <span className="text-[#ffd76e] mr-2" aria-hidden="true">
                      {p.icon}
                    </span>
                    {p.name}
                  </span>
                  <span className="font-mc text-sm text-white/60">Chest</span>
                </header>
                <div className="p-5">
                  <p className="font-mc text-lg text-white/80 leading-6">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {p.stack.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-black/50 border-2 border-black font-mc text-sm text-[#7fff4f]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="font-pixel text-[8px] text-[#ffd76e] mt-4 text-shadow-mc">
                    LOOT: {p.loot}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- 4. INFRA / SERVER ROOM ---------------- */

function TypewriterConsole() {
  const [li, setLi] = useState(0);
  const [ci, setCi] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;
    const line = consoleLog[li] ?? "";

    const step = () => {
      if (cancelled) return;
      if (ci < line.length) {
        setCi(ci + 1);
        t = setTimeout(step, 22);
      } else if (li < consoleLog.length - 1) {
        setLi(li + 1);
        setCi(0);
        t = setTimeout(step, 240);
      } else {
        // all lines done — pause, then restart the boot sequence
        t = setTimeout(() => {
          if (!cancelled) {
            setLi(0);
            setCi(0);
          }
        }, 3200);
      }
    };

    t = setTimeout(step, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [li, ci]);

  const text = [...consoleLog.slice(0, li), li < consoleLog.length ? consoleLog[li].slice(0, ci) : ""]
    .join("\n")
    .replace(/^\n/, "");

  return (
    <div className="mc-panel p-4 sm:p-5 bg-black/90 pointer-events-auto" aria-label="Server console">
      <div className="flex gap-1.5 mb-3" aria-hidden="true">
        <span className="w-2.5 h-2.5 bg-[#ff5f56] rounded-none" />
        <span className="w-2.5 h-2.5 bg-[#ffbd2e] rounded-none" />
        <span className="w-2.5 h-2.5 bg-[#27c93f] rounded-none" />
      </div>
      <pre className="font-mc text-base sm:text-lg leading-6 text-[#a8e890] whitespace-pre-wrap min-h-[13rem]">
        {text}
        <span className="blink-caret text-white">▌</span>
      </pre>
    </div>
  );
}

export function InfraSection() {
  return (
    <Section id="infra">
      <div className="max-w-5xl w-full">
        <SectionTitle sub="where the redstone actually happens">THE SERVER ROOM</SectionTitle>
        <div className="grid md:grid-cols-2 gap-5 items-stretch">
          <Reveal delay={0.05} className="h-full">
            <TypewriterConsole />
          </Reveal>
          <Reveal delay={0.15}>
            <div className="grid grid-cols-2 gap-3 h-full">
              {serverStats.map((s) => (
                <div key={s.label} className="mc-panel-light p-4 flex flex-col justify-center pointer-events-auto">
                  <p className="font-pixel text-base sm:text-lg text-[#7fff4f] text-shadow-mc">{s.value}</p>
                  <p className="font-mc text-base text-white/70 leading-5">{s.label}</p>
                </div>
              ))}
              <div className="mc-panel-light p-4 col-span-2 pointer-events-auto">
                <p className="font-pixel text-[9px] text-white/80 mb-2.5">REDSTONE STATUS</p>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => (
                    <span
                      key={i}
                      className={`w-3 h-3 ${i % 2 === 0 ? "bg-[#3dff6e] lamp-blink" : "bg-[#ffc63d] lamp-blink-delay"}`}
                      style={{ boxShadow: "0 0 8px currentColor" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- 5. CONTACT / PORTAL ---------------- */

function ContactForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ title: "Missing items", description: "Fill every slot of the offering first." });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast({
        title: "Achievement Get! — Message Sent",
        description: "Your message flew through the portal. I'll reply soon.",
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast({ title: "Portal hiccup", description: "The portal coughed. Try again in a moment." });
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full bg-black/60 border-3 border-black px-3 py-2.5 font-mc text-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#7fff4f] shadow-[inset_2px_2px_0_rgba(0,0,0,0.6)] rounded-none";

  return (
    <form onSubmit={submit} className="mc-panel p-5 sm:p-6 pointer-events-auto">
      <p className="font-mc text-lg text-[#7fff4f] mb-4">
        /msg &lt;name&gt; &lt;email&gt; &lt;message&gt;
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="sr-only">Name</span>
          <input
            className={inputCls}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="sr-only">Email</span>
          <input
            className={inputCls}
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            autoComplete="email"
          />
        </label>
      </div>
      <label className="block mt-3">
        <span className="sr-only">Message</span>
        <textarea
          className={`${inputCls} min-h-28 resize-y`}
          placeholder="Tell me about your project, your server, or your favorite mob…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
        />
      </label>
      <button type="submit" disabled={sending} className="mc-btn w-full mt-4 px-6 py-3.5 text-[10px]">
        {sending ? "THROWING INTO PORTAL…" : "THROW INTO PORTAL"}
      </button>
    </form>
  );
}

export function ContactSection() {
  return (
    <Section id="contact" className="flex-col">
      <div className="max-w-2xl w-full">
        <SectionTitle sub="got a project? open a portal.">SEND A MESSAGE</SectionTitle>
        <Reveal delay={0.05}>
          <ContactForm />
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {socials.map((s, i) => (
            <Reveal key={s.label} delay={0.06 * i}>
              <a
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="mc-panel block px-3 py-2.5 pointer-events-auto transition-transform duration-150 hover:-translate-y-1 hover:text-[#7fff4f] group"
              >
                <span className="font-mc text-lg leading-5 block group-hover:text-[#7fff4f] transition-colors">
                  {s.label}
                </span>
                <span className="font-mc text-sm text-white/50 leading-4 block truncate">{s.hint}</span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Sticky-at-bottom footer (last section pushes it to page end) */}
      <footer className="w-full mt-auto pt-16 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-5xl mx-auto border-t-3 border-black/70 bg-black/40 backdrop-blur-sm px-4 py-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <p className="font-mc text-base text-white/60">
            © {new Date().getFullYear()} {profile.handle} — built with Next.js, Three.js &amp; too much coffee
          </p>
          <p className="font-mc text-sm text-white/40">
            Not affiliated with Mojang or Microsoft. Blocks were harmed in the making of this site.
          </p>
        </div>
      </footer>
    </Section>
  );
}
