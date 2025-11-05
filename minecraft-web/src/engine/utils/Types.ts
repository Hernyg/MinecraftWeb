export type FaceKey = "px" | "nx" | "py" | "ny" | "pz" | "nz";

export type ChunkDims = readonly [number, number, number];

export interface MeshBuffers {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

export interface MeshResult {
  opaque: MeshBuffers;
  translucent: MeshBuffers;
}

export type NeighborChunks = Partial<Record<FaceKey, Uint16Array>>;
