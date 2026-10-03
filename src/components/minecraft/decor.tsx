"use client";
// Decorative + interactive world dressing: flickering torches, an animated
// waterfall, a beacon beam, cross-plane flowers/grass, clickable TNT (ignites
// & explodes), an orbiting rune ring for the enchant grove and a fake load
// graph monitor for the server room.
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { Block } from "./blocks";
import { Burst } from "./mobs";
import { getBlockMaterials, getBoxGeometry, getRawTexture } from "@/lib/textures";
import { playBoom, playHiss } from "@/lib/sfx";
import { scrollStore } from "@/lib/scrollStore";

/* ---------------- Torch (flickering light) ---------------- */

export function Torch({
  position,
  rotationY = 0,
  intensity = 5,
}: {
  position: [number, number, number];
  rotationY?: number;
  intensity?: number;
}) {
  const light = useRef<THREE.PointLight>(null);
  const tip = useRef<THREE.Mesh>(null);
  const baseColor = useMemo(() => new THREE.Color("#ffd97d"), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 9;
    const flicker = 0.75 + 0.25 * Math.sin(t) * Math.sin(t * 2.7);
    if (light.current) light.current.intensity = intensity * flicker;
    if (tip.current) {
      const mat = tip.current.material as THREE.MeshBasicMaterial;
      mat.color.copy(baseColor).multiplyScalar(0.7 + flicker * 0.35);
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[0.09, 0.48, 0.09]} />
        <meshLambertMaterial color="#6e5630" />
      </mesh>
      <mesh ref={tip} position={[0, 0.52, 0]}>
        <boxGeometry args={[0.13, 0.13, 0.13]} />
        <meshBasicMaterial color="#ffd97d" />
      </mesh>
      <pointLight ref={light} position={[0, 0.62, 0]} color="#ffb84f" intensity={intensity} distance={7} decay={2} />
    </group>
  );
}

/* ---------------- Waterfall (scrolling texture) ---------------- */

export function Waterfall({
  position,
  height = 9,
  width = 1.5,
  rotationY = 0,
}: {
  position: [number, number, number];
  height?: number;
  width?: number;
  rotationY?: number;
}) {
  const tex = useMemo(() => {
    const t = getRawTexture("waterfall").clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.repeat.set(1, Math.max(2, Math.round(height / 2.4)));
    return t;
  }, [height]);

  useFrame((_, dt) => {
    tex.offset.y -= dt * 1.15;
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Sparkles
        count={14}
        scale={[width * 1.6, 1.2, 1.2]}
        position={[0, -height / 2, 0]}
        size={2.4}
        speed={0.7}
        color="#bfe4ff"
        opacity={0.9}
      />
    </group>
  );
}

/* ---------------- Beacon beam ---------------- */

export function BeaconBeam({ position }: { position: [number, number, number] }) {
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 0.16 + 0.07 * Math.sin(t * 1.6);
    if (outer.current) {
      const m = outer.current.material as THREE.MeshBasicMaterial;
      m.opacity = pulse;
    }
    if (inner.current) {
      const m = inner.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.34 + 0.14 * Math.sin(t * 2.3);
    }
  });

  return (
    <group position={position}>
      <mesh ref={outer}>
        <boxGeometry args={[0.4, 60, 0.4]} />
        <meshBasicMaterial color="#a4f3ff" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={inner}>
        <boxGeometry args={[0.16, 60, 0.16]} />
        <meshBasicMaterial color="#e6ffff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

/* ---------------- Flowers & tall grass (crossed planes) ---------------- */

function FlowerCross({
  textureId,
  position,
  scale = 1,
}: {
  textureId: string;
  position: [number, number, number];
  scale?: number;
}) {
  const tex = useMemo(() => getRawTexture(textureId), [textureId]);
  return (
    <group position={position} scale={scale}>
      <mesh>
        <planeGeometry args={[0.62, 0.62]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.62, 0.62]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function FlowerPatch({ cx = 0, cz = 0, spread = 4.6 }: { cx?: number; cz?: number; spread?: number }) {
  const items = useMemo(() => {
    let s = 777;
    const rand = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const kinds = ["tall_grass", "tall_grass", "tall_grass", "flower_red", "flower_yellow"] as const;
    const list: { kind: (typeof kinds)[number]; x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const x = cx + (rand() * 2 - 1) * spread;
      const z = cz + (rand() * 2 - 1) * spread;
      if (Math.hypot(x - cx, z - cz) > spread) continue;
      list.push({ kind: kinds[Math.floor(rand() * kinds.length)], x, z, s: 0.8 + rand() * 0.7 });
    }
    return list;
  }, [cx, cz, spread]);

  return (
    <>
      {items.map((f, i) => (
        <FlowerCross key={i} textureId={f.kind} position={[f.x, 0.82, f.z]} scale={f.s} />
      ))}
    </>
  );
}

/* ---------------- Clickable TNT ---------------- */

interface BurstInst {
  id: number;
  at: [number, number, number];
}

export function TntBlock({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null);
  const [state, setState] = useState<"idle" | "priming" | "gone">("idle");
  const primed = useRef(0);
  const [bursts, setBursts] = useState<BurstInst[]>([]);
  const burstId = useRef(0);
  const respawn = useRef<ReturnType<typeof setTimeout> | null>(null);

  // clone the shared tnt materials so the emissive blink only affects this block
  const materials = useMemo(() => {
    const m = getBlockMaterials("tnt");
    const arr = Array.isArray(m) ? m : [m];
    return arr.map((x) => (x as THREE.MeshLambertMaterial).clone());
  }, []);

  useFrame((_, dt) => {
    if (state !== "priming") return;
    primed.current += dt;
    const flash = 0.5 + 0.5 * Math.sin(primed.current * 26);
    for (const mat of materials) {
      mat.emissive.setScalar(flash);
    }
    const m = mesh.current;
    if (m) m.scale.setScalar(1 + flash * 0.08);
    if (primed.current > 1.5) {
      setState("gone");
      scrollStore.shake = Math.max(scrollStore.shake, 1.2);
      playBoom();
      setBursts((b) => [...b, { id: burstId.current++, at: [position[0], position[1], position[2]] }]);
      for (const mat of materials) mat.emissive.setScalar(0);
      if (respawn.current) clearTimeout(respawn.current);
      respawn.current = setTimeout(() => setState("idle"), 7000);
    }
  });

  const onClick = () => {
    if (state !== "idle") return;
    playHiss();
    primed.current = 0;
    setState("priming");
  };

  if (state === "gone") {
    return (
      <>
        {bursts.map((b) => (
          <Burst
            key={b.id}
            at={b.at}
            colors={["#c73a3a", "#ff9b3d", "#ffd97d", "#8a8a8a", "#ffffff"]}
            count={30}
            power={4.5}
            onDone={() => setBursts((list) => list.filter((x) => x.id !== b.id))}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <mesh
        ref={mesh}
        geometry={getBoxGeometry()}
        material={materials}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      />
      {bursts.map((b) => (
        <Burst
          key={b.id}
          at={b.at}
          colors={["#c73a3a", "#ff9b3d", "#ffd97d", "#8a8a8a", "#ffffff"]}
          count={30}
          power={4.5}
          onDone={() => setBursts((list) => list.filter((x) => x.id !== b.id))}
        />
      ))}
    </>
  );
}

/* ---------------- Rune ring (enchant grove) ---------------- */

export function RuneRing({
  center,
  radius = 2.7,
  height,
  speed = 0.5,
}: {
  center: [number, number, number];
  radius?: number;
  height: number;
  speed?: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y -= dt * speed;
    const t = clock.elapsedTime;
    g.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 1.4 + i * 1.05) * 0.18;
      child.rotation.x = t * (0.6 + (i % 3) * 0.3);
      child.rotation.z = t * 0.4;
    });
  });

  return (
    <group ref={group} position={[center[0], height, center[2]]}>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}>
            <octahedronGeometry args={[0.09, 0]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#d9a7ff" : "#e8d9ff"} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------------- Fake load-graph monitor (server room) ---------------- */

export function MonitorGraph({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const bars = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bars.current.forEach((bar, i) => {
      if (!bar) return;
      const v = 0.25 + 0.75 * Math.abs(Math.sin(t * (0.9 + i * 0.22) + i * 1.7));
      bar.scale.y = v;
      bar.position.y = -0.3 + (v * 0.55) / 2;
      const mat = bar.material as THREE.MeshBasicMaterial;
      mat.color.set(v > 0.85 ? "#ff5252" : v > 0.6 ? "#ffc63d" : "#3dff6e");
    });
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* screen frame */}
      <mesh>
        <boxGeometry args={[1.7, 1.05, 0.07]} />
        <meshLambertMaterial color="#0c0d10" />
      </mesh>
      {/* bars */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            bars.current[i] = m;
          }}
          position={[-0.56 + i * 0.28, -0.1, 0.05]}
        >
          <boxGeometry args={[0.16, 0.55, 0.04]} />
          <meshBasicMaterial color="#3dff6e" />
        </mesh>
      ))}
      {/* scanline */}
      <mesh position={[0, 0.42, 0.05]}>
        <boxGeometry args={[1.5, 0.03, 0.04]} />
        <meshBasicMaterial color="#1d3a26" />
      </mesh>
    </group>
  );
}
