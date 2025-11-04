import { makeNoise2D } from "open-simplex-noise";
import { CHUNK, SEA_LEVEL } from "../../data/config";
import { Chunk } from "./Chunk";
import type { ChunkCoords } from "../utils/ChunkKey";
import { DIRT, GRASS, STONE } from "./Block";

const TERRAIN_SEED = 1337;
const noise2D = makeNoise2D(TERRAIN_SEED);

const getHeight = (worldX: number, worldZ: number): number => {
  const base = noise2D(worldX / 64, worldZ / 64);
  const hills = noise2D(worldX / 128, worldZ / 128) * 0.5;
  const value = (base * 0.5 + hills * 0.5 + 1) * 0.5;
  return Math.floor(value * 32) + SEA_LEVEL - 10;
};

export const generateTerrainChunk = (coords: ChunkCoords): Uint16Array => {
  const data = new Uint16Array(CHUNK.X * CHUNK.Y * CHUNK.Z);
  for (let x = 0; x < CHUNK.X; x += 1) {
    for (let z = 0; z < CHUNK.Z; z += 1) {
      const worldX = coords.x * CHUNK.X + x;
      const worldZ = coords.z * CHUNK.Z + z;
      const height = Math.min(CHUNK.Y - 1, getHeight(worldX, worldZ));
      for (let y = 0; y < CHUNK.Y; y += 1) {
        const idx = y + CHUNK.Y * (x + CHUNK.X * z);
        if (y > height) {
          data[idx] = 0;
        } else if (y === height) {
          data[idx] = GRASS.id;
        } else if (y >= height - 3) {
          data[idx] = DIRT.id;
        } else {
          data[idx] = STONE.id;
        }
      }
    }
  }
  return data;
};

export const populateChunk = (coords: ChunkCoords): Chunk => {
  const chunk = new Chunk(coords);
  chunk.blocks.set(generateTerrainChunk(coords));
  return chunk;
};
