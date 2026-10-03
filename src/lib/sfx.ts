// Tiny synthesized Minecraft-ish sound effects via WebAudio — no asset files.
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function env(g: GainNode, t0: number, peak: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

function tone(type: OscillatorType, f0: number, f1: number, dur: number, peak = 0.06) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  const t = a.currentTime;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  env(g, t, peak, dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, peak: number, filterFreq: number) {
  const a = ac();
  if (!a) return;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filterFreq;
  const g = a.createGain();
  env(g, a.currentTime, peak, dur);
  src.connect(f);
  f.connect(g);
  g.connect(a.destination);
  src.start();
}

export const playPop = () => tone("square", 320, 140, 0.09, 0.04);
export const playBoom = () => {
  noise(0.5, 0.15, 900);
  tone("sine", 120, 40, 0.45, 0.09);
};
export const playDing = () => {
  tone("sine", 660, 660, 0.12, 0.045);
  window.setTimeout(() => tone("sine", 880, 880, 0.16, 0.045), 90);
};
export const playSparkle = () => tone("triangle", 900, 1500, 0.1, 0.03);
export const playSplash = () => noise(0.25, 0.06, 1600);
export const playTeleport = () => tone("sine", 280, 1100, 0.14, 0.045);
export const playSqueak = () => tone("square", 500, 900, 0.12, 0.045);
export const playHiss = () => noise(0.9, 0.045, 5000);
