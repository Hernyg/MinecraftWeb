export type BlockCollision = "solid" | "none";

export interface BlockFaces {
  top?: string;
  bottom?: string;
  sides?: string;
}

export interface BlockDef {
  id: number;
  name: string;
  opaque: boolean;
  faces: BlockFaces;
  collision: BlockCollision;
}

const registry = new Map<number, BlockDef>();

const register = (def: BlockDef): BlockDef => {
  registry.set(def.id, def);
  return def;
};

export const AIR = register({
  id: 0,
  name: "air",
  opaque: false,
  faces: {},
  collision: "none",
});

export const GRASS = register({
  id: 1,
  name: "grass",
  opaque: true,
  faces: { top: "grass_top", bottom: "dirt", sides: "grass_side" },
  collision: "solid",
});

export const DIRT = register({
  id: 2,
  name: "dirt",
  opaque: true,
  faces: { sides: "dirt", top: "dirt", bottom: "dirt" },
  collision: "solid",
});

export const STONE = register({
  id: 3,
  name: "stone",
  opaque: true,
  faces: { sides: "stone", top: "stone", bottom: "stone" },
  collision: "solid",
});

export const BLOCK_REGISTRY = registry;

export const getBlock = (id: number): BlockDef => registry.get(id) ?? AIR;

export const isOpaque = (id: number): boolean => getBlock(id).opaque;
