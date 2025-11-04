import { chunkKey, type ChunkCoords } from "../utils/ChunkKey";
import { Chunk } from "./Chunk";

export class ChunkStore {
  private readonly chunks = new Map<string, Chunk>();

  get(coords: ChunkCoords): Chunk | undefined {
    return this.chunks.get(chunkKey(coords.x, coords.z));
  }

  set(chunk: Chunk): void {
    this.chunks.set(chunkKey(chunk.position.x, chunk.position.z), chunk);
  }

  has(coords: ChunkCoords): boolean {
    return this.chunks.has(chunkKey(coords.x, coords.z));
  }

  entries(): IterableIterator<[string, Chunk]> {
    return this.chunks.entries();
  }
}
