import { CHUNK } from "../../data/config";
import type { ChunkCoords } from "../utils/ChunkKey";

const SIZE = CHUNK.X * CHUNK.Y * CHUNK.Z;

export class Chunk {
  readonly position: ChunkCoords;
  readonly blocks: Uint16Array;

  constructor(position: ChunkCoords, data?: Uint16Array) {
    this.position = position;
    this.blocks = data ? new Uint16Array(data) : new Uint16Array(SIZE);
  }

  index(x: number, y: number, z: number): number {
    return y + CHUNK.Y * (x + CHUNK.X * z);
  }

  get(x: number, y: number, z: number): number {
    return this.blocks[this.index(x, y, z)];
  }

  set(x: number, y: number, z: number, id: number): void {
    this.blocks[this.index(x, y, z)] = id;
  }
}
