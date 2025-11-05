import type { FaceKey } from "../utils/Types";

export type BlockFaceTextures = Record<FaceKey, string>;

export interface BlockDef {
  id: number;
  name: string;
  opaque: boolean;
  faces: BlockFaceTextures;
  collidable: boolean;
  translucent?: boolean;
  gravity?: boolean;
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
  collidable: false,
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
  collidable: true,
});

export const DIRT = register({
  id: 2,
  name: "dirt",
  opaque: true,
  faces: uniformFaces("dirt"),
  collidable: true,
});

export const STONE = register({
  id: 3,
  name: "stone",
  opaque: true,
  faces: uniformFaces("stone"),
  collidable: true,
});

export const LOG = register({
  id: 4,
  name: "log",
  opaque: true,
  faces: createFaces({
    px: "log_side",
    nx: "log_side",
    py: "log_top",
    ny: "log_top",
    pz: "log_side",
    nz: "log_side",
  }),
  collidable: true,
});

export const LEAVES = register({
  id: 5,
  name: "leaves",
  opaque: false,
  faces: uniformFaces("leaves"),
  collidable: true,
});

export const PLANKS = register({
  id: 6,
  name: "planks",
  opaque: true,
  faces: uniformFaces("planks"),
  collidable: true,
});

export const GLASS = register({
  id: 7,
  name: "glass",
  opaque: false,
  faces: uniformFaces("glass"),
  collidable: true,
  translucent: true,
});

export const SAND = register({
  id: 8,
  name: "sand",
  opaque: true,
  faces: uniformFaces("sand"),
  collidable: true,
  gravity: true,
});

export const GRAVEL = register({
  id: 9,
  name: "gravel",
  opaque: true,
  faces: uniformFaces("gravel"),
  collidable: true,
  gravity: true,
});

export const WATER = register({
  id: 10,
  name: "water",
  opaque: false,
  faces: uniformFaces("water"),
  collidable: false,
  translucent: true,
});

export const BEDROCK = register({
  id: 11,
  name: "bedrock",
  opaque: true,
  faces: uniformFaces("bedrock"),
  collidable: true,
});

export const BLOCK_REGISTRY = registry;

export const placeableIds: number[] = [
  GRASS.id,
  DIRT.id,
  STONE.id,
  LOG.id,
  LEAVES.id,
  PLANKS.id,
  GLASS.id,
  SAND.id,
  GRAVEL.id,
  WATER.id,
  BEDROCK.id,
];

export const getBlock = (id: number): BlockDef => registry.get(id) ?? AIR;

export const isOpaque = (id: number): boolean => getBlock(id).opaque;

export const faceTexture = (id: number, face: FaceKey): string => getBlock(id).faces[face];
