import { wrap } from "comlink";
import { CHUNK } from "../../data/config";
import type { ChunkDims } from "../utils/Types";
import type { TerrainWorkerApi } from "../../workers/terrain.worker";

const worker = new Worker(new URL("../../workers/terrain.worker.ts", import.meta.url), {
  type: "module",
});

const api = wrap<TerrainWorkerApi>(worker);

const dims: ChunkDims = [CHUNK.X, CHUNK.Y, CHUNK.Z];

export const generateChunk = (cx: number, cz: number): Promise<Uint16Array> => api.generate(cx, cz, dims);
