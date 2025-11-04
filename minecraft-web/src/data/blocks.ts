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
  textures: BlockFaceTextures;
}

const convertBlock = (block: WorldBlockDef): BlockDef => ({
  id: block.id,
  name: block.name,
  opaque: block.opaque,
  textures: block.faces,
});

export const Blocks: BlockDef[] = Array.from(BLOCK_REGISTRY.values()).map(convertBlock);

export const BlockById = new Map<number, BlockDef>(Blocks.map((block) => [block.id, block]));

export const isOpaque = (id: number): boolean => BlockById.get(id)?.opaque ?? false;

export const placeableIds: number[] = [...worldPlaceableIds];
