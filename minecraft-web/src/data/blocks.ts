export interface BlockFaceTextures {
  px: string;
  nx: string;
  py: string;
  ny: string;
  pz: string;
  nz: string;
}

export interface BlockDef {
  id: number;
  name: string;
  opaque: boolean;
  textures: BlockFaceTextures;
}

const makeFaces = (top: string, bottom: string, side: string): BlockFaceTextures => ({
  px: side,
  nx: side,
  py: top,
  ny: bottom,
  pz: side,
  nz: side,
});

const registry: BlockDef[] = [
  {
    id: 0,
    name: "air",
    opaque: false,
    textures: makeFaces("air", "air", "air"),
  },
  {
    id: 1,
    name: "grass",
    opaque: true,
    textures: makeFaces("grass_top", "dirt", "grass_side"),
  },
  {
    id: 2,
    name: "dirt",
    opaque: true,
    textures: makeFaces("dirt", "dirt", "dirt"),
  },
  {
    id: 3,
    name: "stone",
    opaque: true,
    textures: makeFaces("stone", "stone", "stone"),
  },
];

export const Blocks = registry;

export const BlockById = new Map<number, BlockDef>(registry.map((block) => [block.id, block]));

export const isOpaque = (id: number): boolean => BlockById.get(id)?.opaque ?? false;

export const placeableIds: number[] = [1, 2, 3];
