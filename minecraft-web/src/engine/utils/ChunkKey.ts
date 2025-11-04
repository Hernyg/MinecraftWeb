import { CHUNK } from "../../data/config";

export interface ChunkCoords {
  x: number;
  z: number;
}

const mod = (n: number, size: number): number => ((n % size) + size) % size;

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

export const voxelToLocal = (wx: number, wy: number, wz: number) => {
  const chunk = worldToChunk(wx, wz);
  const local = {
    x: mod(wx, CHUNK.X),
    y: wy,
    z: mod(wz, CHUNK.Z),
  };
  return { chunk, local };
};
