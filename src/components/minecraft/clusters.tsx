"use client";
// The six world clusters the camera visits while you scroll:
// 0 FloatingIsland → 1 CrystalCave → 2 EnchantGrove → 3 LootVault → 4 ServerRoom → 5 PortalRealm
import { useMemo } from "react";
import * as THREE from "three";
import { Float } from "@react-three/drei";
import { Block, OrbitingBook, PortalSurface, RedstoneLamp, ServerRack, XpOrb } from "./blocks";
import { Bat, Chicken, Creeper, EnderDragon, Enderman, Pig } from "./mobs";
import { BeaconBeam, FlowerPatch, MonitorGraph, RuneRing, Torch, TntBlock, Waterfall } from "./decor";
import type { BlockType } from "@/lib/textures";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/* ------------------------------------------------------------------ */
/* 0. HERO — floating grass island with a tree, ores and satellites    */
/* ------------------------------------------------------------------ */
export function FloatingIsland() {
  const blocks = useMemo(() => {
    const rand = rng(1337);
    const list: { type: BlockType; pos: [number, number, number] }[] = [];
    for (let x = -6; x <= 6; x++) {
      for (let z = -6; z <= 6; z++) {
        const r = Math.sqrt(x * x + z * z);
        const edge = 5.4 + (rand() - 0.5) * 1.6;
        if (r > edge) continue;
        list.push({ type: "grass", pos: [x, 0, z] });
        const depth = Math.max(1, Math.round((edge - r) * 1.15 + rand() * 1.6));
        for (let d = 1; d <= depth; d++) {
          let type: BlockType = "dirt";
          if (d >= 3) type = "stone";
          if (d === depth && d >= 3) {
            const roll = rand();
            if (roll < 0.1) type = "diamond_ore";
            else if (roll < 0.22) type = "gold_ore";
            else if (roll < 0.34) type = "redstone_ore";
            else if (roll < 0.46) type = "coal_ore";
            else if (roll < 0.52) type = "emerald_ore";
          }
          list.push({ type, pos: [x, -d, z] });
        }
      }
    }
    return list;
  }, []);

  return (
    <group>
      {blocks.map((b, i) => (
        <Block key={i} type={b.type} position={b.pos} />
      ))}

      {/* Oak tree */}
      {[1, 2, 3].map((y) => (
        <Block key={`t${y}`} type="log" position={[2, y, -2]} />
      ))}
      {[
        [1, 4, -2],
        [2, 4, -2],
        [3, 4, -2],
        [1, 4, -3],
        [2, 4, -3],
        [3, 4, -3],
        [1, 4, -1],
        [2, 4, -1],
        [3, 4, -1],
        [2, 5, -2],
        [1, 5, -2],
        [3, 5, -2],
        [2, 5, -3],
        [2, 5, -1],
      ].map(([x, y, z], i) => (
        <Block key={`l${i}`} type="leaves" position={[x, y, z]} />
      ))}

      {/* Second oak tree, smaller */}
      {[1, 2].map((y) => (
        <Block key={`t2-${y}`} type="log" position={[-4, y, -4]} />
      ))}
      {[
        [-5, 3, -4],
        [-4, 3, -4],
        [-3, 3, -4],
        [-4, 3, -5],
        [-4, 3, -3],
        [-4, 4, -4],
      ].map(([x, y, z], i) => (
        <Block key={`l2-${i}`} type="leaves" position={[x, y, z]} />
      ))}

      {/* Flowers & tall grass */}
      <FlowerPatch cx={0} cz={0} spread={4.6} />

      {/* Passive mobs */}
      <Creeper position={[-2.5, 0.5, 2.5]} />
      <Pig position={[3.5, 0.5, 3]} />
      <Pig position={[-3.5, 0.5, -1.5]} />
      <Chicken position={[0.5, 0.5, -3.5]} />

      {/* Clickable TNT near the front edge */}
      <TntBlock position={[1, 0.5, 4]} />

      {/* Waterfall off the western edge */}
      <Waterfall position={[-5.9, -4.75, 2.5]} height={9} width={1.4} rotationY={Math.PI / 2} />

      {/* Satellite mini islands */}
      {[
        { cx: 11, cy: 2, cz: -7, r: 1.7 },
        { cx: -10, cy: 4, cz: -6, r: 1.4 },
        { cx: -8, cy: 1, cz: 8, r: 1.2 },
      ].map((s, si) => (
        <group key={si}>
          {Array.from({ length: 7 }, (_, xi) => xi - 3).flatMap((dx) =>
            Array.from({ length: 7 }, (_, zi) => zi - 3).map((dz) => {
              const r = Math.sqrt(dx * dx + dz * dz);
              if (r > s.r) return null;
              return (
                <group key={`${dx}/${dz}`}>
                  <Block type="grass" position={[s.cx + dx, s.cy, s.cz + dz]} />
                  {r < s.r * 0.7 && (
                    <>
                      <Block type="dirt" position={[s.cx + dx, s.cy - 1, s.cz + dz]} />
                      <Block type="stone" position={[s.cx + dx, s.cy - 2, s.cz + dz]} />
                    </>
                  )}
                </group>
              );
            })
          )}
        </group>
      ))}

      {/* Floating eye-candy ores */}
      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.4}>
        <Block type="diamond_ore" position={[7.5, 2.2, 2]} />
      </Float>
      <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1.2}>
        <Block type="gold_ore" position={[-6.5, 3.6, 4.5]} />
      </Float>
      <Float speed={2.4} rotationIntensity={0.8} floatIntensity={1.8}>
        <Block type="emerald_ore" position={[4, 4.5, -6.5]} />
      </Float>
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1}>
        <Block type="gold_block" position={[-3.5, -6.5, 1]} scale={0.8} />
      </Float>

      {/* XP orbs hovering above the island */}
      {[
        [3.5, 2.4, 1.5],
        [-4, 3, -2],
        [0.5, 3.4, 3.5],
        [-2, 2, 4.5],
      ].map((p, i) => (
        <XpOrb key={i} position={p as [number, number, number]} phase={i * 1.3} speed={0.9 + i * 0.2} />
      ))}

      {/* Voxel clouds */}
      {[
        [-14, 11, -10, 5],
        [10, 13, -14, 4],
        [16, 10, 4, 6],
        [-18, 14, 6, 3],
        [2, 16, -20, 5],
      ].map(([x, y, z, w], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[w, 0.6, 2.6]} />
            <meshLambertMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
          <mesh position={[w * 0.2, 0.5, 0.4]}>
            <boxGeometry args={[w * 0.5, 0.5, 1.6]} />
            <meshLambertMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 1. ABOUT — crystal cave with ores and amethyst spires              */
/* ------------------------------------------------------------------ */
export function CrystalCave() {
  const blocks = useMemo(() => {
    const rand = rng(4242);
    const list: { type: BlockType; pos: [number, number, number] }[] = [];
    // floor
    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        let type: BlockType = "stone";
        const roll = rand();
        if (roll < 0.06) type = "diamond_ore";
        else if (roll < 0.12) type = "gold_ore";
        else if (roll < 0.18) type = "redstone_ore";
        else if (roll < 0.24) type = "iron_ore";
        else if (roll < 0.28) type = "coal_ore";
        else if (roll < 0.33) type = "cobble";
        else if (roll < 0.36) type = "bedrock";
        list.push({ type, pos: [x, -19, z] });
        // rough walls rising from the ring
        if (Math.abs(x) === 5 || Math.abs(z) === 5) {
          const h = 1 + Math.floor(rand() * 4);
          for (let y = 1; y <= h; y++) {
            const wr = rand();
            const wt: BlockType =
              wr < 0.14
                ? "diamond_ore"
                : wr < 0.24
                  ? "gold_ore"
                  : wr < 0.34
                    ? "redstone_ore"
                    : wr < 0.44
                      ? "iron_ore"
                      : wr < 0.6
                        ? "cobble"
                        : "stone";
            list.push({ type: wt, pos: [x, -19 + y, z] });
          }
        }
      }
    }
    return list;
  }, []);

  return (
    <group>
      {blocks.map((b, i) => (
        <Block key={i} type={b.type} position={b.pos} />
      ))}

      {/* Glowstone lamps */}
      <Block type="glowstone" position={[-4, -16, -4]} />
      <Block type="glowstone" position={[4, -16, 4]} />
      <Block type="glowstone" position={[4, -16, -4]} />

      {/* Amethyst spires */}
      {[
        [-2, -18.4, 1],
        [1.4, -18.2, -2.2],
        [2.6, -18.5, 2.4],
        [-3.2, -18.6, -1.8],
      ].map(([x, y, z], i) => (
        <Float key={i} speed={1.4 + i * 0.3} floatIntensity={0.6} rotationIntensity={0}>
          <group position={[x, y, z]}>
            <mesh>
              <coneGeometry args={[0.28, 1.1 + (i % 3) * 0.4, 5]} />
              <meshLambertMaterial
                color="#8a5fc4"
                emissive="#9a6fe8"
                emissiveIntensity={0.7}
              />
            </mesh>
          </group>
        </Float>
      ))}

      {/* A little mined-out pixel pickaxe left behind: floating stone + ore */}
      <Float speed={1.8} floatIntensity={1.6} rotationIntensity={0.8}>
        <Block type="diamond_ore" position={[0.5, -17.6, 0.5]} scale={0.7} />
      </Float>

      <XpOrb position={[-1.5, -17.2, 2.4]} color="#7be0ff" phase={0.6} />
      <XpOrb position={[2.8, -17.5, -0.8]} color="#7fff4f" phase={2.2} />
      <XpOrb position={[0, -16.6, -3]} color="#7be0ff" phase={4.1} />

      {/* Cave bats */}
      <Bat center={[0, 0, 0]} radius={3} height={-16.4} speed={0.5} phase={0} />
      <Bat center={[1, 0, -1]} radius={2.2} height={-17.2} speed={0.7} phase={2.4} />
      <Bat center={[-2, 0, 1]} radius={2.6} height={-16.8} speed={0.6} phase={4.4} />

      {/* Wall torches */}
      <Torch position={[4.45, -17.7, -3]} rotationY={-Math.PI / 2} />
      <Torch position={[-4.45, -17.7, 3]} rotationY={Math.PI / 2} />

      {/* Minecart rails + cart */}
      <group>
        {[-1.62, -1.38].map((z, i) => (
          <mesh key={i} position={[0, -18.44, z]}>
            <boxGeometry args={[11, 0.05, 0.08]} />
            <meshLambertMaterial color="#9a9a9a" />
          </mesh>
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={`s${i}`} position={[-4.5 + i * 1.15, -18.47, -1.5]}>
            <boxGeometry args={[0.3, 0.05, 0.7]} />
            <meshLambertMaterial color="#6e5630" />
          </mesh>
        ))}
        {/* minecart */}
        <group position={[1.8, -18.25, -1.5]}>
          <mesh>
            <boxGeometry args={[0.72, 0.3, 0.72]} />
            <meshLambertMaterial color="#5a5a5a" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.6, 0.12, 0.6]} />
            <meshLambertMaterial color="#3a3a3a" />
          </mesh>
        </group>
      </group>

      {/* Still water pool */}
      <mesh position={[-2.9, -18.43, 2.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial color="#3f76e4" transparent opacity={0.72} />
      </mesh>

      <pointLight position={[0, -15, 0]} intensity={26} distance={22} color="#9adfff" />
      <pointLight position={[-4, -16, -4]} intensity={10} distance={12} color="#ffd97d" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 2. SKILLS — enchanting grove with orbiting books                    */
/* ------------------------------------------------------------------ */
export function EnchantGrove() {
  const cx = -6;
  const cz = 0;
  const blocks = useMemo(() => {
    const list: { type: BlockType; pos: [number, number, number] }[] = [];
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        list.push({ type: x === 0 && z === 0 ? "obsidian" : "planks", pos: [cx + x, -35, cz + z] });
      }
    }
    return list;
  }, []);

  return (
    <group>
      {blocks.map((b, i) => (
        <Block key={i} type={b.type} position={b.pos} />
      ))}

      {/* Enchanting table (2 blocks tall like the real one) */}
      <Block type="enchant_table" position={[cx, -34, cz]} />
      <Block type="obsidian" position={[cx, -33, cz]} scale={[0.999, 1, 0.999]} />

      {/* Bookshelves */}
      {[
        [cx - 2, cz - 2],
        [cx + 2, cz - 2],
        [cx - 2, cz + 2],
        [cx + 2, cz + 2],
        [cx, cz - 2],
        [cx, cz + 2],
      ].map(([x, z], i) => (
        <Block key={`bs${i}`} type="bookshelf" position={[x, -34, z]} />
      ))}

      {/* Glowstone corners */}
      {[
        [cx - 3, cz - 3],
        [cx + 3, cz - 3],
        [cx - 3, cz + 3],
        [cx + 3, cz + 3],
      ].map(([x, z], i) => (
        <Block key={`g${i}`} type="glowstone" position={[x, -34, z]} />
      ))}

      {/* Orbiting enchanted books */}
      {[0, 1, 2, 3, 4].map((i) => (
        <OrbitingBook
          key={i}
          center={[cx, -33, cz]}
          radius={1.9}
          angleOffset={i * 1.256}
          height={-32.6}
          speed={0.5}
        />
      ))}

      <XpOrb position={[cx + 2.6, -32.4, cz + 1]} color="#d9a7ff" phase={1} />
      <XpOrb position={[cx - 2.2, -32, cz - 1.6]} color="#d9a7ff" phase={3.4} />

      {/* Orbiting rune ring */}
      <RuneRing center={[cx, cz]} radius={2.7} height={-31.4} speed={0.45} />

      <pointLight position={[cx, -30.5, cz + 2]} intensity={24} distance={20} color="#c99aff" />
      <pointLight position={[cx - 3, -33, cz - 3]} intensity={8} distance={10} color="#ffd97d" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 3. PROJECTS — loot vault with chests and treasure                   */
/* ------------------------------------------------------------------ */
export function LootVault() {
  const cx = 6;
  const cz = 0;
  const blocks = useMemo(() => {
    const rand = rng(9091);
    const list: { type: BlockType; pos: [number, number, number] }[] = [];
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        const roll = rand();
        list.push({
          type: roll < 0.15 ? "cobble" : roll < 0.25 ? "bedrock" : "stone",
          pos: [cx + x, -50, cz + z],
        });
      }
    }
    return list;
  }, []);

  const chestSpots: [number, number][] = [
    [-2.5, -2],
    [0, -2],
    [2.5, -2],
    [-2.5, 2],
    [2.5, 2],
  ];

  return (
    <group>
      {blocks.map((b, i) => (
        <Block key={i} type={b.type} position={b.pos} />
      ))}

      {/* Obsidian pillars */}
      {[
        [cx - 3.5, cz - 3.5],
        [cx + 3.5, cz - 3.5],
        [cx - 3.5, cz + 3.5],
        [cx + 3.5, cz + 3.5],
      ].map(([x, z], i) => (
        <group key={`p${i}`}>
          {[0, 1, 2, 3].map((y) => (
            <Block key={y} type="obsidian" position={[x, -49 + y, z]} />
          ))}
          <Block type="glowstone" position={[x, -45, z]} />
        </group>
      ))}

      {/* Chests facing outward from center */}
      {chestSpots.map(([dx, dz], i) => (
        <Float key={`c${i}`} speed={1.2} floatIntensity={0.35} rotationIntensity={0}>
          <Block
            type="chest"
            position={[cx + dx, -49, cz + dz]}
            rotation={[0, Math.atan2(-dx, -dz), 0]}
          />
        </Float>
      ))}

      {/* Treasure pedestals */}
      <Block type="obsidian" position={[cx, -49, cz]} />
      <Float speed={2.2} floatIntensity={1.2} rotationIntensity={0.9}>
        <Block type="diamond_block" position={[cx, -47.8, cz]} scale={0.8} />
      </Float>
      <Float speed={1.6} floatIntensity={1.6} rotationIntensity={0.9}>
        <Block type="gold_block" position={[cx + 1.6, -47.2, cz + 1]} scale={0.55} />
      </Float>
      <Float speed={1.9} floatIntensity={1.8} rotationIntensity={0.9}>
        <Block type="diamond_block" position={[cx - 1.7, -47.4, cz - 0.8]} scale={0.5} />
      </Float>

      {[
        [cx + 1, cz + 2.6],
        [cx - 2.2, cz - 2.8],
      ].map(([x, z], i) => (
        <XpOrb key={`o${i}`} position={[x, -48, z]} color="#ffd76e" phase={i * 2} />
      ))}

      <pointLight position={[cx, -45.5, cz + 3]} intensity={26} distance={24} color="#ffd9a0" />
      <pointLight position={[cx, -47.5, cz]} intensity={10} distance={12} color="#7be0ff" />

      {/* Beacon beam shooting to the sky */}
      <BeaconBeam position={[cx, -17.2, cz]} />

      {/* Gold piles in the corners */}
      <Block type="gold_block" position={[cx - 3.4, -49.5, cz + 3.4]} />
      <Block type="gold_block" position={[cx - 3.4, -49.5, cz + 2.4]} />
      <Block type="gold_block" position={[cx + 3.4, -49.5, cz - 3.4]} />
      <Block type="gold_block" position={[cx + 2.4, -49.5, cz - 3.4]} />

      {/* Clickable TNT in the loot */}
      <TntBlock position={[cx - 3.2, -49.45, cz - 1.2]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 4. INFRA — redstone bunker with server racks and blinking lamps     */
/* ------------------------------------------------------------------ */
export function ServerRoom() {
  const blocks = useMemo(() => {
    const list: { type: BlockType; pos: [number, number, number] }[] = [];
    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        list.push({ type: x === 0 && z === 0 ? "cobble" : "bedrock", pos: [x, -66, z] });
        // back wall
        if (z === -5 && Math.abs(x) <= 5) {
          list.push({ type: "bedrock", pos: [x, -65, z] });
          list.push({ type: "bedrock", pos: [x, -64, z] });
          if (Math.abs(x) <= 3) list.push({ type: "bedrock", pos: [x, -63, z] });
        }
        // side walls
        if (Math.abs(x) === 5 && z < -2) {
          list.push({ type: "bedrock", pos: [x, -65, z] });
          list.push({ type: "bedrock", pos: [x, -64, z] });
        }
      }
    }
    return list;
  }, []);

  const rackXs = [-4, -2.5, -1, 0.5, 2, 3.5];

  return (
    <group>
      {blocks.map((b, i) => (
        <Block key={i} type={b.type} position={b.pos} />
      ))}

      {/* Server racks */}
      {rackXs.map((x, i) => (
        <group key={`r${i}`}>
          <ServerRack position={[x, -65, -2]} height={3} />
          <Block type="iron_ore" position={[x, -66, -2]} />
        </group>
      ))}

      {/* Second row, offset */}
      {rackXs.slice(0, 4).map((x, i) => (
        <ServerRack key={`r2-${i}`} position={[x + 0.75, -65, -4]} height={2} />
      ))}

      {/* Blinking redstone lamps */}
      {[-4, -2.5, -1, 0.5, 2, 3.5].map((x, i) => (
        <group key={`l${i}`}>
          <RedstoneLamp position={[x, -65, 1.5]} phase={i * 2.1} speed={1.2 + (i % 3) * 0.4} />
          <Block type="stone" position={[x, -66, 1.5]} />
        </group>
      ))}

      {/* Command block console */}
      <Block type="command_block" position={[0, -65, 3.2]} />
      <Block type="glowstone" position={[-5, -63, 4]} />
      <Block type="glowstone" position={[5, -63, 4]} />

      {/* Cables */}
      {rackXs.map((x, i) => (
        <mesh key={`cb${i}`} position={[x, -65.78, 0.4]}>
          <boxGeometry args={[0.08, 0.06, 2.4]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
      ))}

      {/* Floating "data cubes" drifting up like packets */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Float key={`d${i}`} speed={1.5 + i * 0.25} floatIntensity={2.4} rotationIntensity={0.6}>
          <mesh position={[-3.4 + i * 1.35, -62.2 + (i % 3) * 0.8, -0.5 + (i % 2) * 1.4]}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshBasicMaterial color={i % 3 === 0 ? "#3dff6e" : "#7fff4f"} />
          </mesh>
        </Float>
      ))}

      <XpOrb position={[-2, -62, 2]} color="#3dff6e" phase={0.4} />
      <XpOrb position={[3, -62.6, 0]} color="#3dff6e" phase={2.8} />

      {/* Wall torches */}
      <Torch position={[-4.45, -64.2, -3.8]} rotationY={Math.PI / 2} />
      <Torch position={[4.45, -64.2, -3.8]} rotationY={-Math.PI / 2} />

      {/* Fake load-graph monitors on the back wall */}
      <MonitorGraph position={[-2.2, -63.6, -4.85]} />
      <MonitorGraph position={[0.4, -63.6, -4.85]} />

      <pointLight position={[0, -61.5, 2]} intensity={22} distance={24} color="#cfe8ff" />
      <pointLight position={[0, -63, -2]} intensity={9} distance={14} color="#3dff6e" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 5. CONTACT — nether portal realm                                    */
/* ------------------------------------------------------------------ */
export function PortalRealm() {
  const cx = -4;
  const blocks = useMemo(() => {
    const rand = rng(7331);
    const list: { type: BlockType; pos: [number, number, number] }[] = [];
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        list.push({
          type: rand() < 0.2 ? "netherrack" : "obsidian",
          pos: [cx + x, -82, z],
        });
      }
    }
    return list;
  }, []);

  // Portal frame: columns at x = cx±1.5, y from -80.5 to -77.5, top row
  const frame: [number, number, number][] = [];
  for (const dx of [-1.5, 1.5]) {
    for (let y = -80.5; y <= -77.5; y += 1) frame.push([cx + dx, y, 0]);
  }
  for (const dx of [-0.5, 0.5]) {
    frame.push([cx + dx, -77.5, 0]);
    frame.push([cx + dx, -80.5, 0]);
  }

  return (
    <group>
      {blocks.map((b, i) => (
        <Block key={i} type={b.type} position={b.pos} />
      ))}
      {frame.map((p, i) => (
        <Block key={`f${i}`} type="obsidian" position={p} />
      ))}

      <PortalSurface position={[cx, -79, 0]} width={2} height={3} />

      {/* Glowstone braziers flanking the portal */}
      <Block type="glowstone" position={[cx - 3.2, -81, 1.6]} />
      <Block type="glowstone" position={[cx + 3.2, -81, 1.6]} />
      <Block type="netherrack" position={[cx - 3.2, -81.6, 1.6]} scale={0.99} />
      <Block type="netherrack" position={[cx + 3.2, -81.6, 1.6]} scale={0.99} />

      {/* Floating debris */}
      <Float speed={1.4} floatIntensity={1.6} rotationIntensity={1}>
        <Block type="obsidian" position={[cx + 4.2, -78.4, -2]} scale={0.45} />
      </Float>
      <Float speed={1.9} floatIntensity={2} rotationIntensity={1.2}>
        <Block type="amethyst" position={[cx - 4.4, -77.8, 2.2]} scale={0.5} />
      </Float>
      <Float speed={2.3} floatIntensity={1.4} rotationIntensity={0.8}>
        <Block type="glowstone" position={[cx + 2.8, -76.2, 2.8]} scale={0.35} />
      </Float>

      <XpOrb position={[cx - 2.4, -78.4, 2.2]} color="#d9a7ff" phase={0.9} />
      <XpOrb position={[cx + 2.2, -79.2, 2.6]} color="#e0b0ff" phase={2.6} />

      {/* THE ENDER DRAGON circles the portal */}
      <EnderDragon center={[cx, 0]} orbitRadius={7.5} height={-75.5} speed={0.3} />

      {/* Endermen teleporting around the realm */}
      <Enderman position={[cx + 3.4, -81.5, 3.2]} radius={2} />
      <Enderman position={[cx - 4, -81.5, -2.6]} radius={1.8} />

      {/* Torch by the portal */}
      <Torch position={[cx + 1.8, -80.4, 1.9]} intensity={4} />

      {/* Floating end-stone islands */}
      <Float speed={1.1} floatIntensity={0.9} rotationIntensity={0.1}>
        <group position={[cx + 6.2, -74.6, -4.2]}>
          <Block type="end_stone" position={[0, 0, 0]} />
          <Block type="end_stone" position={[1, 0, 0]} />
          <Block type="end_stone" position={[0, 0, 1]} />
          <Block type="end_stone" position={[0, -1, 0]} />
        </group>
      </Float>
      <Float speed={1.5} floatIntensity={1.3} rotationIntensity={0.15}>
        <group position={[cx - 6.8, -73.4, 3.4]}>
          <Block type="end_stone" position={[0, 0, 0]} />
          <Block type="end_stone" position={[-1, 0, 0]} />
          <Block type="end_stone" position={[0, -1, 0]} />
          <Block type="end_stone" position={[0, -1, 1]} />
        </group>
      </Float>

      <pointLight position={[cx, -78.5, 3]} intensity={30} distance={22} color="#c26fff" />
      <pointLight position={[cx, -80, -2]} intensity={14} distance={14} color="#8a3fd9" />
    </group>
  );
}
