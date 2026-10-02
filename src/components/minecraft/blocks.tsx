"use client";
// Reusable voxel pieces: blocks, blinking lamps, chests, floating books,
// XP orbs and the animated nether-portal shader plane.
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getBlockMaterials, getBoxGeometry, type BlockType } from "@/lib/textures";

interface BlockProps {
  type: BlockType;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function Block({ type, position, rotation, scale = 1 }: BlockProps) {
  const material = useMemo(() => getBlockMaterials(type), [type]);
  return (
    <mesh
      geometry={getBoxGeometry()}
      material={material}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

/** Redstone lamp with an independently animated glow. */
export function RedstoneLamp({
  position,
  phase = 0,
  speed = 1.4,
}: {
  position: [number, number, number];
  phase?: number;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => {
    const base = getBlockMaterials("redstone_lamp") as THREE.MeshLambertMaterial;
    return base.clone();
  }, []);
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime * speed + phase;
    const mat = mesh.material as THREE.MeshLambertMaterial;
    mat.emissiveIntensity = 0.25 + 0.85 * (0.5 + 0.5 * Math.sin(t));
  });
  return (
    <mesh ref={meshRef} geometry={getBoxGeometry()} material={material} position={position} />
  );
}

/** A stack of server rack blocks. */
export function ServerRack({
  position,
  height = 3,
}: {
  position: [number, number, number];
  height?: number;
}) {
  return (
    <group>
      {Array.from({ length: height }, (_, i) => (
        <Block
          key={i}
          type="server_rack"
          position={[position[0], position[1] + i, position[2]]}
        />
      ))}
    </group>
  );
}

/** Small floating book that orbits around a center point. */
export function OrbitingBook({
  center,
  radius,
  angleOffset,
  height,
  speed = 0.6,
}: {
  center: [number, number, number];
  radius: number;
  angleOffset: number;
  height: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime * speed + angleOffset;
    g.position.set(
      center[0] + Math.cos(t) * radius,
      height + Math.sin(t * 1.7) * 0.25,
      center[2] + Math.sin(t) * radius
    );
    g.rotation.y = -t;
    g.rotation.z = Math.sin(t * 2) * 0.2;
  });
  const color = useMemo(
    () => ["#e8dcc0", "#d9c9a8", "#c8b890", "#e8d0b0"][Math.floor(angleOffset * 10) % 4],
    [angleOffset]
  );
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.4, 0.28, 0.3]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0.21, 0, 0]}>
        <boxGeometry args={[0.02, 0.3, 0.32]} />
        <meshLambertMaterial color="#8a5fc4" emissive="#8a5fc4" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/** Glowing XP-orb style sphere. */
export function XpOrb({
  position,
  radius = 0.09,
  color = "#7fff4f",
  speed = 1,
  phase = 0,
}: {
  position: [number, number, number];
  radius?: number;
  color?: string;
  speed?: number;
  phase?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const baseY = position[1];
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime * speed + phase;
    m.position.y = baseY + Math.sin(t) * 0.4;
    const s = 0.85 + 0.3 * Math.abs(Math.sin(t * 2.3));
    m.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[radius, 1]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/** Animated nether-portal plane with a swirl shader. */
const portalVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const portalFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float swirl = sin(a * 3.0 + r * 7.0 - uTime * 1.8);
    float fine  = sin(a * 9.0 - r * 14.0 + uTime * 3.2) * 0.25;
    float glow = smoothstep(1.05, 0.15, r);
    vec3 deep = vec3(0.16, 0.03, 0.30);
    vec3 mid  = vec3(0.48, 0.12, 0.72);
    vec3 hot  = vec3(0.85, 0.55, 1.0);
    vec3 col = mix(deep, mid, swirl * 0.5 + 0.5 + fine);
    col += hot * pow(max(0.0, 1.0 - r), 3.0) * (0.6 + 0.4 * sin(uTime * 2.4));
    gl_FragColor = vec4(col, glow * 0.95);
  }
`;

export function PortalSurface({
  position,
  width = 2,
  height = 3,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={portalVertex}
        fragmentShader={portalFragment}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
