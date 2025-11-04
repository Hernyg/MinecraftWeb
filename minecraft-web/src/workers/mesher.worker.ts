import { expose, transfer } from "comlink";
import { BlockById, isOpaque } from "../data/blocks";
import type { ChunkDims, MeshResult, NeighborChunks, FaceKey } from "../engine/utils/Types";

interface FaceDefinition {
  key: FaceKey;
  normal: [number, number, number];
  corners: [number, number, number][];
}

const FACES: FaceDefinition[] = [
  {
    key: "px",
    normal: [1, 0, 0],
    corners: [
      [1, 1, 0],
      [1, 0, 0],
      [1, 0, 1],
      [1, 1, 1],
    ],
  },
  {
    key: "nx",
    normal: [-1, 0, 0],
    corners: [
      [0, 1, 1],
      [0, 0, 1],
      [0, 0, 0],
      [0, 1, 0],
    ],
  },
  {
    key: "py",
    normal: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [0, 1, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    key: "ny",
    normal: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [1, 0, 1],
      [1, 0, 0],
    ],
  },
  {
    key: "pz",
    normal: [0, 0, 1],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  {
    key: "nz",
    normal: [0, 0, -1],
    corners: [
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 0],
      [1, 0, 0],
    ],
  },
];

const sampleIndex = (dims: ChunkDims, x: number, y: number, z: number): number => y + dims[1] * (x + dims[0] * z);

const getNeighbor = (
  neighbors: NeighborChunks,
  dims: ChunkDims,
  face: FaceKey,
  x: number,
  y: number,
  z: number,
): number => {
  const neighbor = neighbors[face];
  if (!neighbor) {
    return 0;
  }
  switch (face) {
    case "px":
      return neighbor[sampleIndex(dims, 0, y, z)] ?? 0;
    case "nx":
      return neighbor[sampleIndex(dims, dims[0] - 1, y, z)] ?? 0;
    case "py":
      return neighbor[sampleIndex(dims, x, 0, z)] ?? 0;
    case "ny":
      return neighbor[sampleIndex(dims, x, dims[1] - 1, z)] ?? 0;
    case "pz":
      return neighbor[sampleIndex(dims, x, y, 0)] ?? 0;
    case "nz":
      return neighbor[sampleIndex(dims, x, y, dims[2] - 1)] ?? 0;
    default:
      return 0;
  }
};

const fetchAtlas = async (): Promise<Record<string, [number, number, number, number]>> => {
  const response = await fetch("/textures/atlas.json");
  const json = await response.json();
  return json.blocks as Record<string, [number, number, number, number]>;
};

let atlasDataPromise: Promise<Record<string, [number, number, number, number]>> | null = null;

const ensureAtlas = (): Promise<Record<string, [number, number, number, number]>> => {
  if (!atlasDataPromise) {
    atlasDataPromise = fetchAtlas();
  }
  return atlasDataPromise;
};

const pushUVs = (uvs: number[], rect: [number, number, number, number]) => {
  const [u0, v0, u1, v1] = rect;
  uvs.push(u1, v1, u1, v0, u0, v0, u0, v1);
};

const mesh = async (
  blocks: Uint16Array,
  dims: ChunkDims,
  neighbors: NeighborChunks,
): Promise<MeshResult> => {
  const atlas = await ensureAtlas();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let x = 0; x < dims[0]; x += 1) {
    for (let y = 0; y < dims[1]; y += 1) {
      for (let z = 0; z < dims[2]; z += 1) {
        const idx = sampleIndex(dims, x, y, z);
        const blockId = blocks[idx];
        if (blockId === 0) {
          continue;
        }
        const def = BlockById.get(blockId);
        if (!def) {
          continue;
        }
        for (const face of FACES) {
          let neighborId: number;
          switch (face.key) {
            case "px":
              neighborId =
                x === dims[0] - 1 ? getNeighbor(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x + 1, y, z)];
              break;
            case "nx":
              neighborId = x === 0 ? getNeighbor(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x - 1, y, z)];
              break;
            case "py":
              neighborId =
                y === dims[1] - 1 ? getNeighbor(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x, y + 1, z)];
              break;
            case "ny":
              neighborId = y === 0 ? getNeighbor(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x, y - 1, z)];
              break;
            case "pz":
              neighborId =
                z === dims[2] - 1 ? getNeighbor(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x, y, z + 1)];
              break;
            case "nz":
              neighborId = z === 0 ? getNeighbor(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x, y, z - 1)];
              break;
            default:
              neighborId = 0;
          }
          if (neighborId !== 0 && isOpaque(neighborId)) {
            continue;
          }
          const vertBase = positions.length / 3;
          for (const corner of face.corners) {
            positions.push(x + corner[0], y + corner[1], z + corner[2]);
            normals.push(face.normal[0], face.normal[1], face.normal[2]);
          }
          const textureKey = def.textures[face.key];
          const rect = atlas[textureKey] ?? atlas["stone"] ?? [0, 0, 1, 1];
          pushUVs(uvs, rect);
          indices.push(vertBase, vertBase + 1, vertBase + 2, vertBase, vertBase + 2, vertBase + 3);
        }
      }
    }
  }

  const result: MeshResult = {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  };

  return transfer(result, [
    result.positions.buffer,
    result.normals.buffer,
    result.uvs.buffer,
    result.indices.buffer,
  ]);
};

const api = {
  async mesh(blocks: Uint16Array, dims: ChunkDims, neighbors: NeighborChunks): Promise<MeshResult> {
    return mesh(blocks, dims, neighbors);
  },
};

export type MesherWorkerApi = typeof api;

expose(api);
