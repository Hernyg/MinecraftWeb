import { expose, transfer } from "comlink";
import { meshChunk } from "../engine/world/Mesher";
import type { ChunkDimensions, MeshResult, NeighborChunks } from "../engine/utils/Types";

const api = {
  mesh(blocks: Uint16Array, dims: ChunkDimensions, neighbors: NeighborChunks = {}): MeshResult {
    const result = meshChunk(blocks, dims, neighbors);
    return transfer(result, [
      result.positions.buffer,
      result.normals.buffer,
      result.uvs.buffer,
      result.indices.buffer,
    ]);
  },
};

export type MesherWorkerApi = typeof api;

expose(api);
