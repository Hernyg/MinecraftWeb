import { isOpaque } from "./Block";
import type { ChunkDimensions, MeshResult, NeighborChunks, FaceKey } from "../utils/Types";

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

const uvTemplate = [1, 1, 1, 0, 0, 0, 0, 1];

const sampleIndex = (dims: ChunkDimensions, x: number, y: number, z: number): number =>
  y + dims.y * (x + dims.x * z);

const getNeighborBlock = (
  neighbors: NeighborChunks,
  dims: ChunkDimensions,
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
      return neighbor[sampleIndex(dims, dims.x - 1, y, z)] ?? 0;
    case "py":
      return neighbor[sampleIndex(dims, x, 0, z)] ?? 0;
    case "ny":
      return neighbor[sampleIndex(dims, x, dims.y - 1, z)] ?? 0;
    case "pz":
      return neighbor[sampleIndex(dims, x, y, 0)] ?? 0;
    case "nz":
      return neighbor[sampleIndex(dims, x, y, dims.z - 1)] ?? 0;
    default:
      return 0;
  }
};

export const meshChunk = (
  blocks: Uint16Array,
  dims: ChunkDimensions,
  neighbors: NeighborChunks = {},
): MeshResult => {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let x = 0; x < dims.x; x += 1) {
    for (let y = 0; y < dims.y; y += 1) {
      for (let z = 0; z < dims.z; z += 1) {
        const block = blocks[sampleIndex(dims, x, y, z)];
        if (block === 0) {
          continue;
        }
        for (const face of FACES) {
          let neighborId: number;
          switch (face.key) {
            case "px":
              neighborId = x === dims.x - 1 ? getNeighborBlock(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x + 1, y, z)];
              break;
            case "nx":
              neighborId = x === 0 ? getNeighborBlock(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x - 1, y, z)];
              break;
            case "py":
              neighborId = y === dims.y - 1 ? getNeighborBlock(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x, y + 1, z)];
              break;
            case "ny":
              neighborId = y === 0 ? getNeighborBlock(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x, y - 1, z)];
              break;
            case "pz":
              neighborId = z === dims.z - 1 ? getNeighborBlock(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x, y, z + 1)];
              break;
            case "nz":
              neighborId = z === 0 ? getNeighborBlock(neighbors, dims, face.key, x, y, z) : blocks[sampleIndex(dims, x, y, z - 1)];
              break;
            default:
              neighborId = 0;
          }
          if (neighborId !== 0 && isOpaque(neighborId)) {
            continue;
          }
          const vertBase = positions.length / 3;
          for (let i = 0; i < 4; i += 1) {
            const corner = face.corners[i];
            positions.push(x + corner[0], y + corner[1], z + corner[2]);
            normals.push(face.normal[0], face.normal[1], face.normal[2]);
            uvs.push(uvTemplate[i * 2], uvTemplate[i * 2 + 1]);
          }
          indices.push(
            vertBase,
            vertBase + 1,
            vertBase + 2,
            vertBase,
            vertBase + 2,
            vertBase + 3,
          );
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  };
};
