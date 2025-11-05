import type { FaceKey } from "../engine/utils/Types";
import {
  BLOCK_REGISTRY,
  type BlockDef as WorldBlockDef,
  placeableIds as worldPlaceableIds,
} from "../engine/world/Block";

export type BlockFaceTextures = Record<FaceKey, string>;

export interface BlockDef {
  id: number;
  name: string;
  opaque: boolean;
  faces: BlockFaceTextures;
  collidable: boolean;
  translucent: boolean;
  gravity: boolean;
}

const convertBlock = (block: WorldBlockDef): BlockDef => ({
  id: block.id,
  name: block.name,
  opaque: block.opaque,
  faces: block.faces,
  collidable: block.collidable,
  translucent: Boolean(block.translucent),
  gravity: Boolean(block.gravity),
});

export const Blocks: BlockDef[] = Array.from(BLOCK_REGISTRY.values()).map(convertBlock);

export const BlockById = new Map<number, BlockDef>(Blocks.map((block) => [block.id, block]));

export const isOpaque = (id: number): boolean => BlockById.get(id)?.opaque ?? false;

export const isCollidable = (id: number): boolean => BlockById.get(id)?.collidable ?? false;

export const isTranslucent = (id: number): boolean => BlockById.get(id)?.translucent ?? false;

export const hasGravity = (id: number): boolean => BlockById.get(id)?.gravity ?? false;

export const placeableIds: number[] = [...worldPlaceableIds];
