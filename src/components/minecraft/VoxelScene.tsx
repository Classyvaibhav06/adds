"use client";
// The full-screen fixed 3D scene. A scroll-driven camera flies between six
// world clusters; fog & sky color morph per biome. Click anywhere on empty
// space to punch blocks into particles.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { scrollStore } from "@/lib/scrollStore";
import { FloatingIsland, CrystalCave, EnchantGrove, LootVault, ServerRoom, PortalRealm } from "./clusters";
import { XpOrb } from "./blocks";

/* ---------------- camera keyframes (one per scroll section) ---------------- */
const KEYFRAMES: { pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { pos: new THREE.Vector3(0, 3.5, 20), look: new THREE.Vector3(0, 0.5, 0) }, // hero island
  { pos: new THREE.Vector3(8, -13, 12), look: new THREE.Vector3(0, -17, 0) }, // cave
  { pos: new THREE.Vector3(1, -29.5, 12.5), look: new THREE.Vector3(-6, -33, 0) }, // enchant
  { pos: new THREE.Vector3(13.5, -45.5, 11), look: new THREE.Vector3(6, -48.5, 0) }, // vault
  { pos: new THREE.Vector3(0, -60.5, 13.5), look: new THREE.Vector3(0, -64, 0) }, // server room
  { pos: new THREE.Vector3(-3.5, -77, 13), look: new THREE.Vector3(-4, -79.3, 0) }, // portal
];

const FOG_STOPS = [
  "#7fb8e6", // sky
  "#2a2533", // cave
  "#241b31", // enchant
  "#1d1d24", // vault
  "#121217", // server
  "#170b22", // portal
].map((c) => new THREE.Color(c));

const DWELL = 0.55; // fraction of each section spent orbiting before travelling

function smoother(u: number) {
  return u * u * u * (u * (u * 6 - 15) + 10);
}

function rotY(v: THREE.Vector3, a: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return new THREE.Vector3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}

/* module-scope scratch vectors (never re-created, single canvas instance) */
const SCRATCH_POS = new THREE.Vector3();
const SCRATCH_LOOK = new THREE.Vector3();
const SCRATCH_A = new THREE.Vector3();
const SCRATCH_B = new THREE.Vector3();

/* ---------------- camera rig ---------------- */
function CameraRig() {
  const camera = useThree((s) => s.camera);

  useFrame(({ clock, pointer }, dt) => {
    const s = scrollStore;
    const k = 1 - Math.exp(-3.4 * Math.min(dt, 0.05));
    s.progress += (s.target - s.progress) * k;

    const seg = THREE.MathUtils.clamp(s.progress, 0, KEYFRAMES.length - 1);
    const i = Math.min(KEYFRAMES.length - 1, Math.floor(seg));
    const t = seg - i;
    const kA = KEYFRAMES[i];
    const kB = KEYFRAMES[Math.min(i + 1, KEYFRAMES.length - 1)];

    const offA = SCRATCH_A.copy(kA.pos).sub(kA.look);

    if (t < DWELL || i === KEYFRAMES.length - 1) {
      const u = Math.min(t, DWELL) / DWELL;
      const ang = -0.3 + 0.6 * smoother(u);
      SCRATCH_POS.copy(kA.look).add(rotY(offA, ang));
      SCRATCH_LOOK.copy(kA.look);
    } else {
      const e = smoother((t - DWELL) / (1 - DWELL));
      const from = SCRATCH_POS.copy(kA.look).add(rotY(offA, 0.3));
      const offB = SCRATCH_B.copy(kB.pos).sub(kB.look);
      const to = kB.look.clone().add(rotY(offB, -0.3));
      from.lerp(to, e);
      SCRATCH_LOOK.copy(kA.look).lerp(kB.look, e);
    }

    // idle breathing
    SCRATCH_POS.y += Math.sin(clock.elapsedTime * 0.7) * 0.12;

    // punch shake
    s.shake = Math.max(0, s.shake - dt * 2.4);
    if (s.shake > 0) {
      SCRATCH_POS.x += (Math.random() - 0.5) * s.shake * 0.55;
      SCRATCH_POS.y += (Math.random() - 0.5) * s.shake * 0.55;
    }

    // mouse parallax (moves the gaze, not the body)
    SCRATCH_LOOK.x += pointer.x * 1.1;
    SCRATCH_LOOK.y += pointer.y * 0.7;

    camera.position.copy(SCRATCH_POS);
    camera.lookAt(SCRATCH_LOOK);
  });
  return null;
}

/* ---------------- atmosphere (fog + sky color morphing) ---------------- */
function Atmosphere() {
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const p = THREE.MathUtils.clamp(scrollStore.progress, 0, FOG_STOPS.length - 1);
    const i = Math.min(FOG_STOPS.length - 2, Math.floor(p));
    tmp.copy(FOG_STOPS[i]).lerp(FOG_STOPS[i + 1], smoother(p - i));
    const fog = state.scene.fog as THREE.Fog | null;
    if (fog) fog.color.copy(tmp);
    const bg = state.scene.background as THREE.Color | null;
    if (bg) bg.copy(tmp);
  });
  return null;
}

/* ---------------- click-to-punch particles ---------------- */
const PARTICLE_COUNT = 72;

function PunchParticles({ terrainRef }: { terrainRef: React.RefObject<THREE.Group | null> }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const cursor = useRef(0);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const poolRef = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      vel: new THREE.Vector3(),
      life: 2,
      base: 1,
    }))
  );
  const palette = useMemo(
    () =>
      ["#8a5f38", "#8a8a8a", "#6faf3e", "#4aedd9", "#fcee4b", "#a86fe8"].map(
        (c) => new THREE.MeshBasicMaterial({ color: c })
      ),
    []
  );

  useEffect(() => {
    const ndc = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();
    const fallback = new THREE.Vector3();

    const onDown = (e: PointerEvent) => {
      if (e.target !== gl.domElement) return;
      ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);

      let point: THREE.Vector3 | null = null;
      if (terrainRef.current) {
        const hits = raycaster.intersectObjects(terrainRef.current.children, true);
        if (hits.length > 0 && hits[0].distance < 80) point = hits[0].point;
      }
      if (!point) point = raycaster.ray.at(20, fallback);

      scrollStore.shake = 0.4;
      const pool = poolRef.current;
      for (let k = 0; k < 10; k++) {
        const idx = cursor.current % PARTICLE_COUNT;
        cursor.current++;
        const mesh = meshRefs.current[idx];
        if (!mesh) continue;
        const p = pool[idx];
        p.life = 0;
        p.base = 0.5 + Math.random() * 0.9;
        p.vel.set((Math.random() - 0.5) * 4.5, 2.2 + Math.random() * 3.5, (Math.random() - 0.5) * 4.5);
        mesh.position
          .copy(point)
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.7,
              (Math.random() - 0.5) * 0.7,
              (Math.random() - 0.5) * 0.7
            )
          );
        mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        mesh.material = palette[Math.floor(Math.random() * palette.length)];
        mesh.scale.setScalar(p.base);
      }
    };

    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [camera, gl, raycaster, terrainRef, palette]);

  useFrame((_, dt) => {
    const pool = poolRef.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh || pool[i].life > 0.95) continue;
      const p = pool[i];
      p.life += dt;
      if (p.life > 0.95) {
        mesh.scale.setScalar(0.0001);
        continue;
      }
      p.vel.y -= 7.5 * dt;
      mesh.position.addScaledVector(p.vel, dt);
      mesh.rotation.x += dt * 5;
      mesh.rotation.z += dt * 4;
      mesh.scale.setScalar(p.base * (1 - p.life / 0.95));
    }
  });

  return (
    <group>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshRefs.current[i] = m;
          }}
          scale={0.0001}
        >
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshBasicMaterial color="#8a5f38" />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- XP orbs sprinkled along the whole journey ---------------- */
function JourneyOrbs() {
  const orbs: { pos: [number, number, number]; color: string }[] = [
    { pos: [6, -5, 8], color: "#7fff4f" },
    { pos: [-7, -8, 6], color: "#7fff4f" },
    { pos: [4, -10, -6], color: "#7be0ff" },
    { pos: [-3, -22, -5], color: "#7be0ff" },
    { pos: [5, -26, 4], color: "#d9a7ff" },
    { pos: [1, -38, -6], color: "#d9a7ff" },
    { pos: [-2, -42, 6], color: "#ffd76e" },
    { pos: [4, -56, -4], color: "#3dff6e" },
    { pos: [-4, -58, 5], color: "#3dff6e" },
    { pos: [2, -70, 6], color: "#e0b0ff" },
    { pos: [-8, -73, -4], color: "#e0b0ff" },
  ];
  return (
    <>
      {orbs.map((o, i) => (
        <XpOrb key={i} position={o.pos} color={o.color} phase={i * 1.7} speed={0.8 + (i % 3) * 0.25} />
      ))}
    </>
  );
}

/* ---------------- scene root ---------------- */
export default function VoxelScene() {
  const terrainRef = useRef<THREE.Group>(null);
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 55, near: 0.1, far: 170, position: [0, 4, 21] }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <CameraRig />
        <Atmosphere />
        <fog attach="fog" args={[FOG_STOPS[0].getHex(), 9, 42]} />
        <color attach="background" args={[FOG_STOPS[0].getHex()]} />
        <ambientLight intensity={0.35} />
        {/* warm sun for the surface island */}
        <pointLight position={[5, 17, 9]} intensity={520} decay={2} color="#fff2d9" />

        <group ref={terrainRef}>
          <FloatingIsland />
          <CrystalCave />
          <EnchantGrove />
          <LootVault />
          <ServerRoom />
          <PortalRealm />
        </group>

        <JourneyOrbs />

        {/* ambient particle life per biome */}
        <Sparkles count={140} scale={[90, 30, 60]} position={[0, 26, -30]} size={2} speed={0.15} color="#ffffff" opacity={0.7} />
        <Sparkles count={60} scale={[13, 8, 13]} position={[0, -16, 0]} size={2} speed={0.3} color="#9adfff" opacity={0.8} />
        <Sparkles count={50} scale={[11, 7, 11]} position={[-6, -32, 0]} size={2.4} speed={0.5} color="#d9a7ff" opacity={0.8} />
        <Sparkles count={40} scale={[11, 7, 11]} position={[6, -48, 0]} size={2} speed={0.4} color="#ffd76e" opacity={0.7} />
        <Sparkles count={50} scale={[12, 7, 12]} position={[0, -63, 0]} size={1.6} speed={0.6} color="#3dff6e" opacity={0.7} />
        <Sparkles count={80} scale={[9, 8, 9]} position={[-4, -79, 0]} size={2.6} speed={0.8} color="#d9a7ff" opacity={0.9} />

        <PunchParticles terrainRef={terrainRef} />
      </Canvas>
    </div>
  );
}
