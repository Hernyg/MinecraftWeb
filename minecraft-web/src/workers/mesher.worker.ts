import { expose, transfer } from "comlink";
import { BlockById } from "../data/blocks";
import type { ChunkDims, MeshResult, NeighborChunks, FaceKey, MeshBuffers } from "../engine/utils/Types";
import { loadUVAtlas, uvRect } from "../engine/render/UVMapper";
import type { UVRect } from "../engine/render/UVMapper";

interface MaskCell {
  id: number;
  face: FaceKey;
  texture: string;
  normal: [number, number, number];
  translucent: boolean;
  greedy: boolean;
}

interface MeshAccumulator {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

const createAccumulator = (): MeshAccumulator => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
});

const FACE_NORMALS: Record<FaceKey, [number, number, number]> = {
  px: [1, 0, 0],
  nx: [-1, 0, 0],
  py: [0, 1, 0],
  ny: [0, -1, 0],
  pz: [0, 0, 1],
  nz: [0, 0, -1],
};

const shouldRenderFace = (blockId: number, neighborId: number): boolean => {
  if (blockId === 0) {
    return false;
  }
  if (neighborId === 0) {
    return true;
  }
  if (blockId === neighborId) {
    return false;
  }
  const neighborDef = BlockById.get(neighborId);
  if (!neighborDef) {
    return true;
  }
  return !neighborDef.opaque;
};

const FACE_MAP: readonly {
  axis: 0 | 1 | 2;
  positive: FaceKey;
  negative: FaceKey;
}[] = [
  { axis: 0, positive: "px", negative: "nx" },
  { axis: 1, positive: "py", negative: "ny" },
  { axis: 2, positive: "pz", negative: "nz" },
];

const PADDING_PX = 0.5;

const sampleIndex = (dims: ChunkDims, x: number, y: number, z: number): number => y + dims[1] * (x + dims[0] * z);

const ensureAtlas = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (!promise) {
      promise = loadUVAtlas();
    }
    return promise;
  };
})();

const uvCache = new Map<string, UVRect>();

const getUV = (texture: string): UVRect => {
  const cached = uvCache.get(texture);
  if (cached) {
    return cached;
  }
  const rect = uvRect(texture, PADDING_PX);
  uvCache.set(texture, rect);
  return rect;
};

const sampleBlock = (
  dims: ChunkDims,
  blocks: Uint16Array,
  neighbors: NeighborChunks,
  x: number,
  y: number,
  z: number,
): number => {
  const [sx, sy, sz] = dims;
  if (y < 0 || y >= sy) {
    return 0;
  }
  if (x >= 0 && x < sx && z >= 0 && z < sz) {
    return blocks[sampleIndex(dims, x, y, z)];
  }
  if (x < 0 && z >= 0 && z < sz) {
    const neighbor = neighbors.nx;
    if (!neighbor) {
      return 0;
    }
    return neighbor[sampleIndex(dims, sx - 1, y, z)];
  }
  if (x >= sx && z >= 0 && z < sz) {
    const neighbor = neighbors.px;
    if (!neighbor) {
      return 0;
    }
    return neighbor[sampleIndex(dims, 0, y, z)];
  }
  if (z < 0 && x >= 0 && x < sx) {
    const neighbor = neighbors.nz;
    if (!neighbor) {
      return 0;
    }
    return neighbor[sampleIndex(dims, x, y, sz - 1)];
  }
  if (z >= sz && x >= 0 && x < sx) {
    const neighbor = neighbors.pz;
    if (!neighbor) {
      return 0;
    }
    return neighbor[sampleIndex(dims, x, y, 0)];
  }
  return 0;
};

const pushVertex = (out: number[], vertex: [number, number, number]) => {
  out.push(vertex[0], vertex[1], vertex[2]);
};

const addVec = (a: [number, number, number], b: [number, number, number]): [number, number, number] => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];

const emitQuad = (
  target: MeshAccumulator,
  base: [number, number, number],
  du: [number, number, number],
  dv: [number, number, number],
  normal: [number, number, number],
  rect: UVRect,
) => {
  const vertBase = target.positions.length / 3;

  let vertices: [number, number, number][];
  if (normal[0] > 0 || normal[1] > 0 || normal[2] > 0) {
    vertices = [base, addVec(base, dv), addVec(addVec(base, du), dv), addVec(base, du)];
  } else {
    vertices = [base, addVec(base, du), addVec(addVec(base, du), dv), addVec(base, dv)];
  }

  for (const vertex of vertices) {
    pushVertex(target.positions, vertex);
    target.normals.push(normal[0], normal[1], normal[2]);
  }

  const { u0, v0, u1, v1 } = rect;
  target.uvs.push(u1, v1, u1, v0, u0, v0, u0, v1);

  target.indices.push(vertBase, vertBase + 2, vertBase + 1, vertBase, vertBase + 3, vertBase + 2);
};

const mesh = async (
  blocks: Uint16Array,
  dims: ChunkDims,
  neighbors: NeighborChunks,
): Promise<MeshResult> => {
  await ensureAtlas();

  const opaque = createAccumulator();
  const cutout = createAccumulator();
  const water = createAccumulator();

  const x: [number, number, number] = [0, 0, 0];
  const q: [number, number, number] = [0, 0, 0];

  for (const face of FACE_MAP) {
    const axis = face.axis;
    const u = (axis + 1) % 3;
    const v = (axis + 2) % 3;
    const duVec: [number, number, number] = [0, 0, 0];
    const dvVec: [number, number, number] = [0, 0, 0];
    const dimsU = dims[u];
    const dimsV = dims[v];
    const mask: (MaskCell | null)[] = new Array(dimsU * dimsV);

    q[0] = q[1] = q[2] = 0;
    q[axis] = 1;

    for (x[axis] = -1; x[axis] < dims[axis]; ) {
      let n = 0;
      for (x[v] = 0; x[v] < dimsV; x[v] += 1) {
        for (x[u] = 0; x[u] < dimsU; x[u] += 1, n += 1) {
          const a = sampleBlock(dims, blocks, neighbors, x[0], x[1], x[2]);
          const b = sampleBlock(dims, blocks, neighbors, x[0] + q[0], x[1] + q[1], x[2] + q[2]);

          let cell: MaskCell | null = null;

          if (a !== 0) {
            const def = BlockById.get(a);
            if (def && shouldRenderFace(a, b)) {
              const faceKey = face.positive;
              cell = {
                id: a,
                face: faceKey,
                texture: def.faces[faceKey],
                normal: FACE_NORMALS[faceKey],
                translucent: Boolean(def.translucent),
                greedy: Boolean(def.opaque),
              };
            }
          }

          if (!cell && b !== 0) {
            const def = BlockById.get(b);
            if (def && shouldRenderFace(b, a)) {
              const faceKey = face.negative;
              cell = {
                id: b,
                face: faceKey,
                texture: def.faces[faceKey],
                normal: FACE_NORMALS[faceKey],
                translucent: Boolean(def.translucent),
                greedy: Boolean(def.opaque),
              };
            }
          }

          mask[n] = cell;
        }
      }

      x[axis] += 1;
      const plane = x[axis];

      for (let j = 0; j < dimsV; j += 1) {
        for (let i = 0; i < dimsU; ) {
          const cell = mask[i + j * dimsU];
          if (!cell) {
            i += 1;
            continue;
          }

          let width = 1;
          if (cell.greedy) {
            while (
              i + width < dimsU &&
              mask[i + width + j * dimsU] &&
              mask[i + width + j * dimsU]?.face === cell.face &&
              mask[i + width + j * dimsU]?.texture === cell.texture &&
              mask[i + width + j * dimsU]?.id === cell.id &&
              mask[i + width + j * dimsU]?.greedy === cell.greedy
            ) {
              width += 1;
            }
          }

          let height = 1;
          if (cell.greedy) {
            outer: while (j + height < dimsV) {
              for (let k = 0; k < width; k += 1) {
                const next = mask[i + k + (j + height) * dimsU];
                if (
                  !next ||
                  next.face !== cell.face ||
                  next.texture !== cell.texture ||
                  next.id !== cell.id ||
                  next.greedy !== cell.greedy
                ) {
                  break outer;
                }
              }
              height += 1;
            }
          }

          const base: [number, number, number] = [0, 0, 0];
          base[axis] = plane;
          base[u] = i;
          base[v] = j;

          duVec[0] = duVec[1] = duVec[2] = 0;
          dvVec[0] = dvVec[1] = dvVec[2] = 0;
          duVec[u] = width;
          dvVec[v] = height;

          const rect = getUV(cell.texture);
          const target =
            cell.material === "water" ? water : cell.material === "cutout" ? cutout : opaque;
          emitQuad(target, base, duVec, dvVec, cell.normal, rect);

          for (let y = 0; y < height; y += 1) {
            for (let xw = 0; xw < width; xw += 1) {
              mask[i + xw + (j + y) * dimsU] = null;
            }
          }

          i += width;
        }
      }
    }
  }

  const buildBuffers = (acc: MeshAccumulator): MeshBuffers => ({
    positions: new Float32Array(acc.positions),
    normals: new Float32Array(acc.normals),
    uvs: new Float32Array(acc.uvs),
    indices: new Uint32Array(acc.indices),
  });

  const result: MeshResult = {
    opaque: buildBuffers(opaque),
    cutout: buildBuffers(cutout),
    water: buildBuffers(water),
  };

  return transfer(result, [
    result.opaque.positions.buffer,
    result.opaque.normals.buffer,
    result.opaque.uvs.buffer,
    result.opaque.indices.buffer,
    result.cutout.positions.buffer,
    result.cutout.normals.buffer,
    result.cutout.uvs.buffer,
    result.cutout.indices.buffer,
    result.water.positions.buffer,
    result.water.normals.buffer,
    result.water.uvs.buffer,
    result.water.indices.buffer,
  ]);
};

const api = {
  async mesh(blocks: Uint16Array, dims: ChunkDims, neighbors: NeighborChunks): Promise<MeshResult> {
    return mesh(blocks, dims, neighbors);
  },
};

export type MesherWorkerApi = typeof api;

expose(api);
