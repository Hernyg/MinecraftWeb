import { expose, transfer } from "comlink";
import { makeNoise2D } from "open-simplex-noise";
import { SEA_LEVEL } from "../data/config";
import type { ChunkDims } from "../engine/utils/Types";

const SEED = 1337;
const lowNoise = makeNoise2D(SEED);
const detailNoise = makeNoise2D(SEED + 1);

const hash = (x: number, z: number, salt: number): number => {
  let n = x * 374761393 + z * 668265263 + salt * 1446648777;
  n = (n ^ (n >> 13)) * 1274126177;
  n ^= n >> 16;
  return (n >>> 0) / 0xffffffff;
};

const heightAt = (x: number, z: number): number => {
  const low = lowNoise(x * 0.008, z * 0.008) * 18;
  const detail = detailNoise(x * 0.04, z * 0.04) * 4;
  const height = SEA_LEVEL + low + detail;
  return Math.floor(Math.max(1, height));
};

const indexOf = (dims: ChunkDims, x: number, y: number, z: number): number => y + dims[1] * (x + dims[0] * z);

const tryPlaceTree = (
  blocks: Uint16Array,
  dims: ChunkDims,
  cx: number,
  cz: number,
  lx: number,
  lz: number,
  worldX: number,
  worldZ: number,
  surfaceY: number,
) => {
  const [sx, sy, sz] = dims;
  const chance = hash(worldX, worldZ, SEED + 2);
  if (chance > 0.015) {
    return;
  }

  const baseIndex = indexOf(dims, lx, surfaceY, lz);
  if (blocks[baseIndex] !== 1) {
    return;
  }

  const trunkBase = surfaceY + 1;
  if (trunkBase >= sy) {
    return;
  }

  const trunkHeight = 4 + Math.floor(hash(worldX, worldZ, SEED + 3) * 3);
  const trunkTop = trunkBase + trunkHeight - 1;
  const leavesTop = trunkTop + 2;
  if (leavesTop >= sy) {
    return;
  }

  const radius = 2;
  if (lx - radius < 0 || lx + radius >= sx || lz - radius < 0 || lz + radius >= sz) {
    return;
  }

  for (let h = 0; h < trunkHeight; h += 1) {
    const y = trunkBase + h;
    const idx = indexOf(dims, lx, y, lz);
    blocks[idx] = 4;
  }

  const leafCenterY = trunkTop;
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dz = -radius; dz <= radius; dz += 1) {
        if (dx * dx + dy * dy + dz * dz > radius * radius + 1) {
          continue;
        }
        const x = lx + dx;
        const y = leafCenterY + dy;
        const z = lz + dz;
        if (x < 0 || x >= sx || y < 0 || y >= sy || z < 0 || z >= sz) {
          continue;
        }
        if (dx === 0 && dz === 0 && dy === 0) {
          continue;
        }
        const idx = indexOf(dims, x, y, z);
        if (blocks[idx] === 0) {
          blocks[idx] = 5;
        }
      }
    }
  }
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
        const idx = indexOf(dims, x, y, z);
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

      tryPlaceTree(blocks, dims, cx, cz, x, z, worldX, worldZ, height);
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
