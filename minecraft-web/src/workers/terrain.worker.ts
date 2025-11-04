import { expose, transfer } from "comlink";
import { makeNoise2D } from "open-simplex-noise";
import { SEA_LEVEL } from "../data/config";
import type { ChunkDims } from "../engine/utils/Types";

const SEED = 12345;
const noise = makeNoise2D(SEED);

const heightAt = (x: number, z: number): number => {
  const scale1 = 1 / 128;
  const scale2 = 1 / 32;
  const scale3 = 1 / 8;
  const h1 = noise(x * scale1, z * scale1) * 12;
  const h2 = noise(x * scale2, z * scale2) * 6;
  const h3 = noise(x * scale3, z * scale3) * 2;
  const height = SEA_LEVEL + h1 + h2 + h3;
  return Math.floor(Math.max(1, height));
};

const fillChunk = (cx: number, cz: number, dims: ChunkDims): Uint16Array => {
  const [sx, sy, sz] = dims;
  const blocks = new Uint16Array(sx * sy * sz);
  for (let x = 0; x < sx; x += 1) {
    for (let z = 0; z < sz; z += 1) {
      const worldX = cx * sx + x;
      const worldZ = cz * sz + z;
      const height = Math.min(sy - 1, heightAt(worldX, worldZ));
      for (let y = 0; y < sy; y += 1) {
        const idx = y + sy * (x + sx * z);
        if (y > height) {
          blocks[idx] = 0;
        } else if (y === height) {
          blocks[idx] = 1;
        } else if (y >= height - 3) {
          blocks[idx] = 2;
        } else {
          blocks[idx] = 3;
        }
      }
    }
  }
  return blocks;
};

const api = {
  generate(cx: number, cz: number, dims: ChunkDims): Uint16Array {
    const chunk = fillChunk(cx, cz, dims);
    return transfer(chunk, [chunk.buffer]);
  },
};

export type TerrainWorkerApi = typeof api;

expose(api);
