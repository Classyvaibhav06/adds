// Shared scroll state — mutated by a window listener, read inside useFrame.
// Kept outside React to avoid re-renders at 60fps.
export const scrollStore = {
  /** Camera segment target 0..(SECTION_COUNT-1), derived from real section offsets */
  target: 0,
  /** Damped segment progress used by the camera */
  progress: 0,
  /** Camera shake impulse from block punches (decays in the rig) */
  shake: 0,
  /** Measured offsetTop of each scene section (index 0..N-1) */
  offsets: [] as number[],
};

/** Total number of scroll sections (drives camera keyframe mapping). */
export const SECTION_COUNT = 6;
