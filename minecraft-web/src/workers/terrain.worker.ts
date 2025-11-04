import { expose, transfer } from "comlink";
import { generateTerrainChunk } from "../engine/world/TerrainGen";
import type { ChunkCoords } from "../engine/utils/ChunkKey";

const api = {
  generate(coords: ChunkCoords) {
    const data = generateTerrainChunk(coords);
    return transfer(data.buffer, [data.buffer]);
  },
};

export type TerrainWorkerApi = typeof api;

expose(api);
