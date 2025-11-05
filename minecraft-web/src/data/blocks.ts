import type { FaceKey } from "../engine/utils/Types";
import {
  BLOCK_REGISTRY,
  type BlockDef as WorldBlockDef,
  type BlockMaterial,
  placeableIds as worldPlaceableIds,
} from "../engine/world/Block";

export type BlockFaceTextures = Record<FaceKey, string>;

export interface BlockDef {
  id: number;
  name: string;
  opaque: boolean;
  faces: BlockFaceTextures;
  collidable: boolean;
  gravity: boolean;
  greedy: boolean;
  material: BlockMaterial;
}

const convertBlock = (block: WorldBlockDef): BlockDef => ({
  id: block.id,
  name: block.name,
  opaque: block.opaque,
  faces: block.faces,
  collidable: block.collidable,
  gravity: Boolean(block.gravity),
  greedy: Boolean(block.greedy ?? block.opaque),
  material: block.material ?? "opaque",
});

export const Blocks: BlockDef[] = Array.from(BLOCK_REGISTRY.values()).map(convertBlock);

export const BlockById = new Map<number, BlockDef>(Blocks.map((block) => [block.id, block]));

export const isOpaque = (id: number): boolean => BlockById.get(id)?.opaque ?? false;

export const isCollidable = (id: number): boolean => BlockById.get(id)?.collidable ?? false;

export const hasGravity = (id: number): boolean => BlockById.get(id)?.gravity ?? false;

export const placeableIds: number[] = [...worldPlaceableIds];

export type { BlockMaterial };
