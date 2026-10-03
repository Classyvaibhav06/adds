"use client";
// Voxel mobs built entirely from boxes + procedural textures:
// Creeper (stares, primes & explodes when clicked), Pig & Chicken (wander,
// jump on click), Bat (cave flyer), Enderman (teleports), Ender Dragon
// (orbits the portal realm) and a reusable particle Burst.
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Block } from "./blocks";
import { playBoom, playSqueak, playTeleport } from "@/lib/sfx";
import { scrollStore } from "@/lib/scrollStore";

/* ---------------- helpers ---------------- */

function angleLerp(a: number, b: number, t: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

interface WanderOpts {
  cx: number;
  cz: number;
  half: number;
  speed: number;
  idleChance: number;
  /** set to true while the mob is standing still (used for idle behaviors) */
  idleRef?: React.MutableRefObject<boolean>;
}

/** Moves a group toward random points inside a square area. Writes x/z + yaw only. */
function useWander(ref: React.RefObject<THREE.Group | null>, opts: WanderOpts) {
  const target = useRef(new THREE.Vector3(opts.cx, 0, opts.cz));
  const wait = useRef(0);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;

    if (wait.current > 0) {
      wait.current -= dt;
      if (opts.idleRef) opts.idleRef.current = true;
      return;
    }
    if (opts.idleRef) opts.idleRef.current = false;

    const dx = target.current.x - g.position.x;
    const dz = target.current.z - g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.18) {
      if (Math.random() < opts.idleChance) {
        wait.current = 1 + Math.random() * 2.6;
      }
      target.current.set(
        opts.cx + (Math.random() * 2 - 1) * opts.half,
        0,
        opts.cz + (Math.random() * 2 - 1) * opts.half
      );
      return;
    }
    const step = opts.speed * dt;
    g.position.x += (dx / dist) * step;
    g.position.z += (dz / dist) * step;
    g.rotation.y = angleLerp(g.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 6));
  });
}

function hoverCursor() {
  return {
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
    },
  };
}

/* ---------------- reusable particle burst ---------------- */

export interface BurstProps {
  at: [number, number, number];
  colors: string[];
  count?: number;
  power?: number;
  onDone?: () => void;
}

export function Burst({ at, colors, count = 22, power = 3.4, onDone }: BurstProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const done = useRef(false);
  const pool = useRef(
    Array.from({ length: count }, () => ({
      vel: new THREE.Vector3(),
      life: -Math.random() * 0.08,
      base: 0.4 + Math.random() * 0.8,
    }))
  );
  const materials = useMemo(
    () => colors.map((c) => new THREE.MeshBasicMaterial({ color: c })),
    [colors]
  );

  useFrame((_, dt) => {
    let alive = false;
    for (let i = 0; i < count; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      const p = pool.current[i];
      p.life += dt;
      if (p.life < 0 || p.life > 0.85) {
        mesh.scale.setScalar(0.0001);
        continue;
      }
      alive = true;
      p.vel.y -= 8.5 * dt;
      mesh.position.addScaledVector(p.vel, dt);
      mesh.rotation.x += dt * 6;
      mesh.rotation.z += dt * 5;
      mesh.scale.setScalar(p.base * (1 - p.life / 0.85));
    }
    if (!alive && !done.current) {
      done.current = true;
      onDone?.();
    }
  });

  return (
    <group position={at}>
      {Array.from({ length: count }, (_, i) => {
        const p = pool.current[i];
        const a = Math.random() * Math.PI * 2;
        const up = 1.4 + Math.random() * power;
        p.vel.set(
          Math.cos(a) * power * (0.3 + Math.random()),
          up,
          Math.sin(a) * power * (0.3 + Math.random())
        );
        return (
          <mesh
            key={i}
            ref={(m) => {
              meshRefs.current[i] = m;
            }}
            material={materials[i % materials.length]}
            scale={0.0001}
          >
            <boxGeometry args={[0.17, 0.17, 0.17]} />
          </mesh>
        );
      })}
    </group>
  );
}

interface BurstInst {
  id: number;
  at: [number, number, number];
}

/* ---------------- Creeper ---------------- */

export function Creeper({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const [state, setState] = useState<"idle" | "priming" | "gone">("idle");
  const primed = useRef(0);
  const [bursts, setBursts] = useState<BurstInst[]>([]);
  const burstId = useRef(0);
  const respawn = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRef = useRef(false);
  const wander = useRef({
    cx: position[0],
    cz: position[2],
    half: 4.2,
    speed: 0.85,
    idleChance: 0.55,
    idleRef,
  });
  useWander(group, wander.current);
  const camera = useThree((s) => s.camera);
  const hover = useMemo(hoverCursor, []);

  useEffect(() => {
    return () => {
      if (respawn.current) clearTimeout(respawn.current);
    };
  }, []);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;

    if (state === "priming") {
      primed.current += dt;
      const s = 1 + 0.22 * Math.abs(Math.sin(t * 22));
      g.scale.setScalar(s);
      g.position.y = position[1] + Math.sin(t * 30) * 0.02;
      if (primed.current > 1.35) {
        setState("gone");
        scrollStore.shake = Math.max(scrollStore.shake, 1.15);
        playBoom();
        setBursts((b) => [
          ...b,
          { id: burstId.current++, at: [g.position.x, g.position.y + 0.9, g.position.z] },
        ]);
        if (respawn.current) clearTimeout(respawn.current);
        respawn.current = setTimeout(() => {
          const ng = group.current;
          if (ng) {
            ng.position.set(
              position[0] + (Math.random() * 2 - 1) * 3,
              position[1],
              position[2] + (Math.random() * 2 - 1) * 3
            );
            ng.scale.setScalar(1);
          }
          primed.current = 0;
          setState("idle");
        }, 6500);
      }
    } else if (state === "idle") {
      g.position.y = position[1] + (idleRef.current ? 0 : Math.abs(Math.sin(t * 8)) * 0.045);
      // creepers stare into your soul while standing still
      if (idleRef.current) {
        const dx = camera.position.x - g.position.x;
        const dz = camera.position.z - g.position.z;
        g.rotation.y = angleLerp(g.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 4));
      }
    }
  });

  return (
    <>
      <group
        ref={group}
        position={position}
        visible={state !== "gone"}
        onClick={(e) => {
          e.stopPropagation();
          if (state !== "idle") return;
          primed.current = 0;
          setState("priming");
          document.body.style.cursor = "";
        }}
        {...hover}
      >
        {/* legs */}
        {[
          [-0.16, -0.2],
          [0.16, -0.2],
          [-0.16, 0.2],
          [0.16, 0.2],
        ].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.18, lz]}>
            <boxGeometry args={[0.26, 0.36, 0.26]} />
            <meshLambertMaterial color="#3f8a3f" />
          </mesh>
        ))}
        {/* body */}
        <mesh position={[0, 0.78, 0]}>
          <boxGeometry args={[0.52, 0.8, 0.3]} />
          <meshLambertMaterial color="#4faf4f" />
        </mesh>
        {/* head with face */}
        <Block type="creeper_head" position={[0, 1.45, 0]} scale={0.55} />
      </group>

      {bursts.map((b) => (
        <Burst
          key={b.id}
          at={b.at}
          colors={["#4faf4f", "#3f8a3f", "#8a8a8a", "#ffd97d", "#ff7b2f"]}
          count={26}
          power={4}
          onDone={() => setBursts((list) => list.filter((x) => x.id !== b.id))}
        />
      ))}
    </>
  );
}

/* ---------------- Pig ---------------- */

export function Pig({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const vy = useRef(0);
  const wander = useRef({ cx: position[0], cz: position[2], half: 3.6, speed: 0.6, idleChance: 0.6 });
  useWander(group, wander.current);
  const hover = useMemo(hoverCursor, []);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    if (vy.current !== 0 || g.position.y > position[1] + 0.001) {
      vy.current -= 11 * dt;
      g.position.y += vy.current * dt;
      if (g.position.y <= position[1]) {
        g.position.y = position[1];
        vy.current = 0;
      }
    } else {
      g.position.y = position[1] + Math.abs(Math.sin(t * 6)) * 0.03;
    }
  });

  return (
    <group
      ref={group}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (vy.current === 0) {
          vy.current = 3.4;
          playSqueak();
        }
      }}
      {...hover}
    >
      {/* legs */}
      {[
        [-0.28, -0.18],
        [0.28, -0.18],
        [-0.28, 0.18],
        [0.28, 0.18],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.14, lz]}>
          <boxGeometry args={[0.18, 0.28, 0.18]} />
          <meshLambertMaterial color="#e09393" />
        </mesh>
      ))}
      {/* body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.62, 0.5, 1.0]} />
        <meshLambertMaterial color="#eda3a3" />
      </mesh>
      {/* head (face on +z) */}
      <Block type="pig_head" position={[0, 0.56, 0.66]} scale={0.5} />
      {/* tail */}
      <mesh position={[0, 0.56, -0.54]}>
        <boxGeometry args={[0.08, 0.08, 0.14]} />
        <meshLambertMaterial color="#d88787" />
      </mesh>
    </group>
  );
}

/* ---------------- Chicken ---------------- */

export function Chicken({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const vy = useRef(0);
  const wander = useRef({ cx: position[0], cz: position[2], half: 3.2, speed: 0.5, idleChance: 0.7 });
  useWander(group, wander.current);
  const hover = useMemo(hoverCursor, []);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    if (vy.current !== 0 || g.position.y > position[1] + 0.001) {
      vy.current -= 9 * dt;
      g.position.y += vy.current * dt;
      if (g.position.y <= position[1]) {
        g.position.y = position[1];
        vy.current = 0;
      }
    } else {
      g.position.y = position[1] + Math.abs(Math.sin(t * 10)) * 0.03;
    }
  });

  return (
    <group
      ref={group}
      position={position}
      scale={0.85}
      onClick={(e) => {
        e.stopPropagation();
        if (vy.current === 0) {
          vy.current = 2.6;
          playSqueak();
        }
      }}
      {...hover}
    >
      {/* legs */}
      {[-0.1, 0.1].map((lx, i) => (
        <mesh key={i} position={[lx, 0.12, 0]}>
          <boxGeometry args={[0.05, 0.24, 0.05]} />
          <meshLambertMaterial color="#e0b84f" />
        </mesh>
      ))}
      {/* body */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.4, 0.38, 0.52]} />
        <meshLambertMaterial color="#f2f2f2" />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.66, 0.26]}>
        <boxGeometry args={[0.22, 0.32, 0.22]} />
        <meshLambertMaterial color="#f2f2f2" />
      </mesh>
      {/* beak */}
      <mesh position={[0, 0.64, 0.42]}>
        <boxGeometry args={[0.1, 0.07, 0.12]} />
        <meshLambertMaterial color="#ff9b3d" />
      </mesh>
      {/* wattle */}
      <mesh position={[0, 0.55, 0.38]}>
        <boxGeometry args={[0.07, 0.09, 0.06]} />
        <meshLambertMaterial color="#d8342c" />
      </mesh>
      {/* wings */}
      {[-0.24, 0.24].map((lx, i) => (
        <mesh key={`w${i}`} position={[lx, 0.4, 0]}>
          <boxGeometry args={[0.08, 0.22, 0.36]} />
          <meshLambertMaterial color="#e0e0e0" />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- Bat (cave) ---------------- */

export function Bat({
  center,
  radius,
  height,
  speed,
  phase,
}: {
  center: [number, number, number];
  radius: number;
  height: number;
  speed: number;
  phase: number;
}) {
  const group = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime * speed + phase;
    g.position.set(
      center[0] + Math.cos(t) * radius,
      height + Math.sin(t * 1.7) * 0.5,
      center[2] + Math.sin(t) * radius
    );
    g.rotation.y = -t;
    const flap = Math.sin(clock.elapsedTime * 14 + phase) * 0.75;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });

  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[0.14, 0.14, 0.24]} />
        <meshLambertMaterial color="#3a3238" />
      </mesh>
      <mesh ref={wingL} position={[-0.18, 0.03, 0]}>
        <boxGeometry args={[0.26, 0.02, 0.16]} />
        <meshLambertMaterial color="#4a4048" />
      </mesh>
      <mesh ref={wingR} position={[0.18, 0.03, 0]}>
        <boxGeometry args={[0.26, 0.02, 0.16]} />
        <meshLambertMaterial color="#4a4048" />
      </mesh>
      <mesh position={[0, 0.1, 0.08]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshLambertMaterial color="#3a3238" />
      </mesh>
    </group>
  );
}

/* ---------------- Enderman (teleports) ---------------- */

export function Enderman({
  position,
  radius = 2.4,
}: {
  position: [number, number, number];
  radius?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const nextTeleport = useRef(3 + Math.random() * 4);
  const phase = useRef<"idle" | "out" | "in">("idle");
  const phaseT = useRef(0);
  const [bursts, setBursts] = useState<BurstInst[]>([]);
  const burstId = useRef(0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (phase.current === "idle") {
      nextTeleport.current -= dt;
      g.scale.setX(Math.min(1, g.scale.x + dt * 5));
      g.scale.setY(Math.min(1, g.scale.y + dt * 5));
      g.scale.setZ(Math.min(1, g.scale.z + dt * 5));
      if (nextTeleport.current <= 0) {
        phase.current = "out";
        phaseT.current = 0;
        playTeleport();
        setBursts((b) => [
          ...b,
          { id: burstId.current++, at: [g.position.x, g.position.y + 1, g.position.z] },
        ]);
      }
    } else if (phase.current === "out") {
      phaseT.current += dt;
      const k = Math.max(0.01, 1 - phaseT.current / 0.16);
      g.scale.set(k, k, k);
      if (phaseT.current > 0.16) {
        g.position.set(
          position[0] + (Math.random() * 2 - 1) * radius,
          position[1],
          position[2] + (Math.random() * 2 - 1) * radius
        );
        g.rotation.y = Math.random() * Math.PI * 2;
        phase.current = "in";
        phaseT.current = 0;
      }
    } else {
      phaseT.current += dt;
      const k = Math.min(1, phaseT.current / 0.2);
      g.scale.set(k, k, k);
      if (k >= 1) {
        phase.current = "idle";
        nextTeleport.current = 3.5 + Math.random() * 4.5;
      }
    }
  });

  return (
    <>
      <group ref={group} position={position}>
        {/* legs */}
        {[-0.1, 0.1].map((lx, i) => (
          <mesh key={i} position={[lx, 0.55, 0]}>
            <boxGeometry args={[0.13, 1.1, 0.13]} />
            <meshLambertMaterial color="#101014" />
          </mesh>
        ))}
        {/* body */}
        <mesh position={[0, 1.45, 0]}>
          <boxGeometry args={[0.4, 0.72, 0.24]} />
          <meshLambertMaterial color="#101014" />
        </mesh>
        {/* arms */}
        {[-0.28, 0.28].map((lx, i) => (
          <mesh key={`a${i}`} position={[lx, 1.35, 0]}>
            <boxGeometry args={[0.1, 0.9, 0.1]} />
            <meshLambertMaterial color="#0c0c10" />
          </mesh>
        ))}
        {/* head */}
        <Block type="enderman_head" position={[0, 2.05, 0]} scale={0.46} />
        {/* glowing eyes overlay */}
        {[-0.11, 0.11].map((lx, i) => (
          <mesh key={`e${i}`} position={[lx, 2.1, 0.235]}>
            <boxGeometry args={[0.16, 0.05, 0.01]} />
            <meshBasicMaterial color="#e07bff" />
          </mesh>
        ))}
      </group>
      {bursts.map((b) => (
        <Burst
          key={b.id}
          at={b.at}
          colors={["#d57bff", "#8a3fc4", "#3fe0c8"]}
          count={10}
          power={1.2}
          onDone={() => setBursts((list) => list.filter((x) => x.id !== b.id))}
        />
      ))}
    </>
  );
}

/* ---------------- Ender Dragon (orbits the portal realm) ---------------- */

export function EnderDragon({
  center,
  orbitRadius = 7.5,
  height,
  speed = 0.32,
}: {
  center: [number, number];
  orbitRadius?: number;
  height: number;
  speed?: number;
}) {
  const root = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, dt) => {
    t.current += dt * speed;
    const g = root.current;
    if (!g) return;
    const tt = t.current;
    g.position.set(
      center[0] + Math.cos(tt) * orbitRadius,
      height + Math.sin(tt * 0.8) * 1.1,
      center[1] + Math.sin(tt) * orbitRadius
    );
    g.rotation.y = -tt + Math.PI; // model faces +z
    g.rotation.z = 0.32; // banked turn
    const flap = Math.sin(tt * 4.2) * 0.55;
    if (wingL.current) wingL.current.rotation.z = 0.18 + flap;
    if (wingR.current) wingR.current.rotation.z = -0.18 - flap;
    if (tail.current) tail.current.rotation.x = Math.sin(tt * 2.2) * 0.14;
  });

  const dark = "#141419";
  const dark2 = "#1d1d26";

  return (
    <group ref={root} scale={0.9}>
      {/* body */}
      <mesh>
        <boxGeometry args={[0.7, 0.7, 2.4]} />
        <meshLambertMaterial color={dark} />
      </mesh>
      {/* neck + head */}
      <mesh position={[0, 0.28, 1.6]}>
        <boxGeometry args={[0.45, 0.45, 1.1]} />
        <meshLambertMaterial color={dark2} />
      </mesh>
      <mesh position={[0, 0.42, 2.5]}>
        <boxGeometry args={[0.72, 0.55, 0.9]} />
        <meshLambertMaterial color={dark} />
      </mesh>
      {/* snout */}
      <mesh position={[0, 0.34, 3.05]}>
        <boxGeometry args={[0.4, 0.24, 0.4]} />
        <meshLambertMaterial color={dark2} />
      </mesh>
      {/* horns */}
      {[-0.2, 0.2].map((lx, i) => (
        <mesh key={`h${i}`} position={[lx, 0.78, 2.35]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.34, 0.1]} />
          <meshLambertMaterial color={dark2} />
        </mesh>
      ))}
      {/* eyes */}
      {[-0.26, 0.26].map((lx, i) => (
        <mesh key={`e${i}`} position={[lx, 0.5, 2.72]}>
          <boxGeometry args={[0.12, 0.08, 0.12]} />
          <meshBasicMaterial color="#e07bff" />
        </mesh>
      ))}
      {/* wings */}
      <group ref={wingL} position={[-0.35, 0.32, 0.4]}>
        <mesh position={[-1.5, 0, 0]}>
          <boxGeometry args={[3.0, 0.07, 1.5]} />
          <meshLambertMaterial color={dark2} />
        </mesh>
        <mesh position={[-2.7, 0, -0.5]}>
          <boxGeometry args={[1.4, 0.05, 1.1]} />
          <meshLambertMaterial color={dark} />
        </mesh>
      </group>
      <group ref={wingR} position={[0.35, 0.32, 0.4]}>
        <mesh position={[1.5, 0, 0]}>
          <boxGeometry args={[3.0, 0.07, 1.5]} />
          <meshLambertMaterial color={dark2} />
        </mesh>
        <mesh position={[2.7, 0, -0.5]}>
          <boxGeometry args={[1.4, 0.05, 1.1]} />
          <meshLambertMaterial color={dark} />
        </mesh>
      </group>
      {/* tail */}
      <group ref={tail} position={[0, 0.1, -1.4]}>
        <mesh position={[0, 0, -0.7]}>
          <boxGeometry args={[0.45, 0.45, 1.5]} />
          <meshLambertMaterial color={dark2} />
        </mesh>
        <mesh position={[0, -0.05, -1.9]}>
          <boxGeometry args={[0.3, 0.3, 1.1]} />
          <meshLambertMaterial color={dark} />
        </mesh>
        <mesh position={[0, -0.1, -2.9]}>
          <boxGeometry args={[0.16, 0.16, 1.2]} />
          <meshLambertMaterial color={dark2} />
        </mesh>
      </group>
      {/* legs tucked */}
      {[-0.3, 0.3].map((lx, i) => (
        <mesh key={`l${i}`} position={[lx, -0.45, -0.4]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.16, 0.6, 0.16]} />
          <meshLambertMaterial color={dark} />
        </mesh>
      ))}
    </group>
  );
}
