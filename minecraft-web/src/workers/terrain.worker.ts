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

const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  LOG: 4,
  LEAVES: 5,
  SAND: 8,
  GRAVEL: 9,
  WATER: 10,
  BEDROCK: 11,
} as const;

const TREE_CHANCE = 0.012;
const TREE_RADIUS = 2;

const indexOf = (dims: ChunkDims, x: number, y: number, z: number): number => y + dims[1] * (x + dims[0] * z);

const surfaceBlockId = (height: number, worldX: number, worldZ: number): number => {
  if (height <= SEA_LEVEL - 2) {
    return BLOCK.SAND;
  }
  if (height <= SEA_LEVEL) {
    return hash(worldX, worldZ, SEED + 4) > 0.45 ? BLOCK.SAND : BLOCK.GRAVEL;
  }
  if (height <= SEA_LEVEL + 2) {
    return hash(worldX, worldZ, SEED + 5) > 0.7 ? BLOCK.GRAVEL : BLOCK.GRASS;
  }
  return BLOCK.GRASS;
};

const placeTree = (
  blocks: Uint16Array,
  dims: ChunkDims,
  chunkMinX: number,
  chunkMinZ: number,
  worldX: number,
  worldZ: number,
  surfaceY: number,
) => {
  const [sx, sy, sz] = dims;
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

  const lx = worldX - chunkMinX;
  const lz = worldZ - chunkMinZ;
  if (lx >= 0 && lx < sx && lz >= 0 && lz < sz) {
    for (let h = 0; h < trunkHeight; h += 1) {
      const wy = trunkBase + h;
      if (wy < 0 || wy >= sy) {
        continue;
      }
      const idx = indexOf(dims, lx, wy, lz);
      blocks[idx] = BLOCK.LOG;
    }
  }

  const centerY = trunkTop;
  for (let dy = -TREE_RADIUS; dy <= TREE_RADIUS; dy += 1) {
    for (let dx = -TREE_RADIUS; dx <= TREE_RADIUS; dx += 1) {
      for (let dz = -TREE_RADIUS; dz <= TREE_RADIUS; dz += 1) {
        if (dx === 0 && dy === 0 && dz === 0) {
          continue;
        }
        if (dx * dx + dy * dy + dz * dz > TREE_RADIUS * TREE_RADIUS + 1) {
          continue;
        }
        const wx = worldX + dx;
        const wy = centerY + dy;
        const wz = worldZ + dz;
        if (wy < 0 || wy >= sy) {
          continue;
        }
        if (wx < chunkMinX || wx >= chunkMinX + sx || wz < chunkMinZ || wz >= chunkMinZ + sz) {
          continue;
        }
        const lxLeaf = wx - chunkMinX;
        const lzLeaf = wz - chunkMinZ;
        const idx = indexOf(dims, lxLeaf, wy, lzLeaf);
        const existing = blocks[idx];
        if (existing === BLOCK.AIR || existing === BLOCK.WATER) {
          blocks[idx] = BLOCK.LEAVES;
        }
      }
    }
  }
};

const fillChunk = (cx: number, cz: number, dims: ChunkDims): Uint16Array => {
  const [sx, sy, sz] = dims;
  const blocks = new Uint16Array(sx * sy * sz);
  const chunkMinX = cx * sx;
  const chunkMinZ = cz * sz;
  const chunkMaxX = chunkMinX + sx;
  const chunkMaxZ = chunkMinZ + sz;

  for (let x = 0; x < sx; x += 1) {
    for (let z = 0; z < sz; z += 1) {
      const worldX = chunkMinX + x;
      const worldZ = chunkMinZ + z;
      const columnHeight = Math.min(sy - 2, heightAt(worldX, worldZ));
      const topBlock = surfaceBlockId(columnHeight, worldX, worldZ);

      for (let y = 0; y < sy; y += 1) {
        const idx = indexOf(dims, x, y, z);
        if (y === 0) {
          blocks[idx] = BLOCK.BEDROCK;
          continue;
        }
        if (y > columnHeight) {
          blocks[idx] = y <= SEA_LEVEL ? BLOCK.WATER : BLOCK.AIR;
          continue;
        }
        if (y === columnHeight) {
          blocks[idx] = topBlock;
          continue;
        }
        if (columnHeight - y <= 3) {
          if (topBlock === BLOCK.SAND || topBlock === BLOCK.GRAVEL) {
            blocks[idx] = topBlock;
          } else {
            blocks[idx] = BLOCK.DIRT;
          }
        } else {
          blocks[idx] = BLOCK.STONE;
        }
      }
    }
  }

  for (let worldX = chunkMinX - TREE_RADIUS; worldX < chunkMaxX + TREE_RADIUS; worldX += 1) {
    for (let worldZ = chunkMinZ - TREE_RADIUS; worldZ < chunkMaxZ + TREE_RADIUS; worldZ += 1) {
      if (hash(worldX, worldZ, SEED + 2) > TREE_CHANCE) {
        continue;
      }
      const columnHeight = Math.min(sy - 2, heightAt(worldX, worldZ));
      const topBlock = surfaceBlockId(columnHeight, worldX, worldZ);
      if (topBlock !== BLOCK.GRASS) {
        continue;
      }
      placeTree(blocks, dims, chunkMinX, chunkMinZ, worldX, worldZ, columnHeight);
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
