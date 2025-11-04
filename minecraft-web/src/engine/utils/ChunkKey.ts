import { CHUNK } from "../../data/config";

export interface ChunkCoords {
  x: number;
  z: number;
}

export const chunkKey = (x: number, z: number): string => `${x},${z}`;

export const parseChunkKey = (key: string): ChunkCoords => {
  const [x, z] = key.split(",").map((value) => Number.parseInt(value, 10));
  return { x, z };
};

export const worldToChunk = (x: number, z: number): ChunkCoords => {
  const cx = Math.floor(x / CHUNK.X);
  const cz = Math.floor(z / CHUNK.Z);
  return { x: cx, z: cz };
};

export const localBlockCoords = (x: number, y: number, z: number) => ({
  x: ((x % CHUNK.X) + CHUNK.X) % CHUNK.X,
  y,
  z: ((z % CHUNK.Z) + CHUNK.Z) % CHUNK.Z,
});
