import { transfer, wrap } from "comlink";
import type { ChunkDims, MeshResult, NeighborChunks } from "../utils/Types";
import type { MesherWorkerApi } from "../../workers/mesher.worker";

const worker = new Worker(new URL("../../workers/mesher.worker.ts", import.meta.url), {
  type: "module",
});

const api = wrap<MesherWorkerApi>(worker);

interface Task {
  blocks: Uint16Array;
  dims: ChunkDims;
  neighbors: NeighborChunks;
  resolve: (result: MeshResult) => void;
  reject: (error: unknown) => void;
}

const queue: Task[] = [];
let running = false;

const pumpQueue = async () => {
  if (running) {
    return;
  }
  running = true;
  try {
    while (queue.length > 0) {
      const task = queue.shift()!;
      try {
        const result = await api.mesh(
          transfer(task.blocks, [task.blocks.buffer]),
          task.dims,
          task.neighbors,
        );
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }
    }
  } finally {
    running = false;
  }
};

export const meshChunk = (blocks: Uint16Array, dims: ChunkDims, neighbors: NeighborChunks): Promise<MeshResult> =>
  new Promise((resolve, reject) => {
    queue.push({ blocks, dims, neighbors, resolve, reject });
    void pumpQueue();
  });
