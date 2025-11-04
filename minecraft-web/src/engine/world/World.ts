import { RENDER_DIST } from "../../data/config";
import { type ChunkCoords, worldToChunk } from "../utils/ChunkKey";
import { Chunk } from "./Chunk";
import { ChunkStore } from "./ChunkStore";
import { generateTerrainChunk } from "./TerrainGen";

export class World {
  private readonly store = new ChunkStore();

  ensureChunk(cx: number, cz: number): Chunk {
    const coords: ChunkCoords = { x: cx, z: cz };
    const existing = this.store.get(coords);
    if (existing) {
      return existing;
    }
    const chunk = new Chunk(coords, generateTerrainChunk(coords));
    this.store.set(chunk);
    return chunk;
  }

  updateAround(x: number, z: number): void {
    const { x: cx, z: cz } = worldToChunk(x, z);
    for (let dx = -RENDER_DIST.chunks; dx <= RENDER_DIST.chunks; dx += 1) {
      for (let dz = -RENDER_DIST.chunks; dz <= RENDER_DIST.chunks; dz += 1) {
        this.ensureChunk(cx + dx, cz + dz);
      }
    }
  }

  requestMesh(_chunk: Chunk): void {
    // TODO: hook meshing worker and schedule rendering upload.
  }

  entries(): IterableIterator<[string, Chunk]> {
    return this.store.entries();
  }

  get(coords: ChunkCoords): Chunk | undefined {
    return this.store.get(coords);
  }
}
