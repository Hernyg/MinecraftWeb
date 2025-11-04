import type { FaceKey } from "../utils/Types";

export type BlockCollision = "solid" | "none";

export type BlockFaceTextures = Record<FaceKey, string>;

export interface BlockDef {
  id: number;
  name: string;
  opaque: boolean;
  faces: BlockFaceTextures;
  collision: BlockCollision;
}

const FACE_KEYS: FaceKey[] = ["px", "nx", "py", "ny", "pz", "nz"];

const registry = new Map<number, BlockDef>();

const register = (def: BlockDef): BlockDef => {
  registry.set(def.id, def);
  return def;
};

const uniformFaces = (texture: string): BlockFaceTextures => ({
  px: texture,
  nx: texture,
  py: texture,
  ny: texture,
  pz: texture,
  nz: texture,
});

const createFaces = (faces: Partial<BlockFaceTextures> & { all?: string }): BlockFaceTextures => {
  const resolved: Partial<BlockFaceTextures> = { ...faces };
  if (faces.all) {
    for (const key of FACE_KEYS) {
      if (!resolved[key]) {
        resolved[key] = faces.all;
      }
    }
  }
  for (const key of FACE_KEYS) {
    const value = resolved[key];
    if (!value) {
      throw new Error(`Missing texture mapping for face '${key}'`);
    }
  }
  return resolved as BlockFaceTextures;
};

export const AIR = register({
  id: 0,
  name: "air",
  opaque: false,
  faces: uniformFaces("air"),
  collision: "none",
});

export const GRASS = register({
  id: 1,
  name: "grass",
  opaque: true,
  faces: createFaces({
    px: "grass_side",
    nx: "grass_side",
    py: "grass_top",
    ny: "dirt",
    pz: "grass_side",
    nz: "grass_side",
  }),
  collision: "solid",
});

export const DIRT = register({
  id: 2,
  name: "dirt",
  opaque: true,
  faces: uniformFaces("dirt"),
  collision: "solid",
});

export const STONE = register({
  id: 3,
  name: "stone",
  opaque: true,
  faces: uniformFaces("stone"),
  collision: "solid",
});

export const LOG = register({
  id: 4,
  name: "log",
  opaque: true,
  faces: uniformFaces("log"),
  collision: "solid",
});

export const LEAVES = register({
  id: 5,
  name: "leaves",
  opaque: true,
  faces: uniformFaces("leaves"),
  collision: "solid",
});

export const BLOCK_REGISTRY = registry;

export const placeableIds: number[] = [1, 2, 3, 4, 5];

export const getBlock = (id: number): BlockDef => registry.get(id) ?? AIR;

export const isOpaque = (id: number): boolean => getBlock(id).opaque;

export const faceTexture = (id: number, face: FaceKey): string => getBlock(id).faces[face];
