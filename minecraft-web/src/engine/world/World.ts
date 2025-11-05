import { Mesh, Object3D } from "three";
import { CHUNK, RAYCAST_MAX, RENDER_DIST } from "../../data/config";
import type { ChunkDims, NeighborChunks } from "../utils/Types";
import { chunkKey, parseChunkKey, voxelToLocal, worldToChunk } from "../utils/ChunkKey";
import { Chunk } from "./Chunk";
import { generateChunk } from "./TerrainGen";
import { meshChunk } from "./Mesher";
import { buildChunkMesh } from "../render/ChunkMesh";
import type { Renderer } from "../render/Renderer";
import type { Vec3 } from "../utils/Vec3";
import { voxelRaycast } from "../physics/Raycast";
import type { FaceKey } from "../utils/Types";

interface ChunkState {
  chunk: Chunk;
  mesh: Object3D | null;
  state: "pending" | "meshing" | "ready";
  remeshTimer: number | null;
}

const disposeChunkObject = (object: Object3D): void => {
  if (object instanceof Mesh) {
    object.geometry.dispose();
  }
  const children = (object as { children?: Object3D[] }).children;
  if (children) {
    for (const child of children) {
      disposeChunkObject(child);
    }
  }
};

const dims: ChunkDims = [CHUNK.X, CHUNK.Y, CHUNK.Z];
const neighborOffsets: Record<Exclude<FaceKey, "py" | "ny">, [number, number]> = {
  px: [1, 0],
  nx: [-1, 0],
  pz: [0, 1],
  nz: [0, -1],
};

export class World {
  private readonly chunks = new Map<string, ChunkState>();
  private readonly persistedEdits = new Map<string, Map<number, number>>();

  constructor(private readonly renderer: Renderer) {}

  private getOrCreateChunk(cx: number, cz: number): ChunkState {
    const key = chunkKey(cx, cz);
    const existing = this.chunks.get(key);
    if (existing) {
      return existing;
    }
    const chunk = new Chunk(cx, cz);
    const state: ChunkState = { chunk, mesh: null, state: "pending", remeshTimer: null };
    this.chunks.set(key, state);
    void this.populateChunk(state);
    return state;
  }

  private async populateChunk(state: ChunkState): Promise<void> {
    const key = chunkKey(state.chunk.cx, state.chunk.cz);
    const data = await generateChunk(state.chunk.cx, state.chunk.cz);
    state.chunk.loadBase(data);
    const edits = this.persistedEdits.get(key);
    if (edits) {
      state.chunk.applyEdits(edits);
    }
    state.state = "meshing";
    await this.remeshChunk(state);
  }

  private async remeshChunk(state: ChunkState): Promise<void> {
    const key = chunkKey(state.chunk.cx, state.chunk.cz);
    if (!this.chunks.has(key)) {
      return;
    }
    state.state = "meshing";
    const neighbors = this.collectNeighborData(state.chunk.cx, state.chunk.cz);
    const blocks = state.chunk.toMeshData();
    const meshData = await meshChunk(blocks, dims, neighbors);
    const mesh = await buildChunkMesh(meshData);
    if (!this.chunks.has(key)) {
      return;
    }
    if (state.mesh) {
      this.renderer.removeChunkMesh(key, state.mesh);
      disposeChunkObject(state.mesh);
      state.mesh = null;
    }
    if (mesh) {
      mesh.position.set(state.chunk.cx * CHUNK.X, 0, state.chunk.cz * CHUNK.Z);
      this.renderer.addChunkMesh(key, mesh);
      state.mesh = mesh;
    }
    state.state = "ready";
  }

  private collectNeighborData(cx: number, cz: number): NeighborChunks {
    const neighbors: NeighborChunks = {};
    for (const [face, [dx, dz]] of Object.entries(neighborOffsets)) {
      const neighbor = this.chunks.get(chunkKey(cx + dx, cz + dz));
      if (neighbor && neighbor.state !== "pending") {
        neighbors[face as FaceKey] = neighbor.chunk.toMeshData();
      }
    }
    return neighbors;
  }

  ensureChunk(cx: number, cz: number): void {
    this.getOrCreateChunk(cx, cz);
  }

  updateAround(x: number, z: number): void {
    const { x: cx, z: cz } = worldToChunk(x, z);
    const keep = new Set<string>();
    for (let dx = -RENDER_DIST.chunks; dx <= RENDER_DIST.chunks; dx += 1) {
      for (let dz = -RENDER_DIST.chunks; dz <= RENDER_DIST.chunks; dz += 1) {
        const key = chunkKey(cx + dx, cz + dz);
        keep.add(key);
        this.ensureChunk(cx + dx, cz + dz);
      }
    }
    for (const [key, state] of this.chunks.entries()) {
      if (keep.has(key)) {
        continue;
      }
      const { x: chunkX, z: chunkZ } = parseChunkKey(key);
      const distance = Math.max(Math.abs(chunkX - cx), Math.abs(chunkZ - cz));
      if (distance > RENDER_DIST.chunks + 1) {
        if (state.mesh) {
          this.renderer.removeChunkMesh(key, state.mesh);
          disposeChunkObject(state.mesh);
        }
        this.persistChunkEdits(key, state.chunk);
        this.chunks.delete(key);
      }
    }
  }

  getBlock(wx: number, wy: number, wz: number): number {
    if (!Number.isFinite(wx) || !Number.isFinite(wy) || !Number.isFinite(wz)) {
      return 0;
    }
    if (wy < 0 || wy >= CHUNK.Y) {
      return 0;
    }
    const { chunk, local } = voxelToLocal(Math.floor(wx), Math.floor(wy), Math.floor(wz));
    const state = this.chunks.get(chunkKey(chunk.x, chunk.z));
    if (!state) {
      return 0;
    }
    return state.chunk.get(local.x, local.y, local.z);
  }

  setBlock(wx: number, wy: number, wz: number, id: number): void {
    if (wy < 0 || wy >= CHUNK.Y) {
      return;
    }
    const { chunk, local } = voxelToLocal(Math.floor(wx), Math.floor(wy), Math.floor(wz));
    const key = chunkKey(chunk.x, chunk.z);
    const state = this.getOrCreateChunk(chunk.x, chunk.z);
    state.chunk.set(local.x, local.y, local.z, id);
    this.persistChunkEdits(key, state.chunk);
    this.scheduleRemesh(state);
    if (local.x === 0) this.remeshNeighbor(chunk.x - 1, chunk.z);
    if (local.x === CHUNK.X - 1) this.remeshNeighbor(chunk.x + 1, chunk.z);
    if (local.z === 0) this.remeshNeighbor(chunk.x, chunk.z - 1);
    if (local.z === CHUNK.Z - 1) this.remeshNeighbor(chunk.x, chunk.z + 1);
  }

  private remeshNeighbor(cx: number, cz: number): void {
    const neighbor = this.chunks.get(chunkKey(cx, cz));
    if (neighbor) {
      this.scheduleRemesh(neighbor);
    }
  }

  private scheduleRemesh(state: ChunkState): void {
    if (state.remeshTimer !== null) {
      clearTimeout(state.remeshTimer);
    }
    state.remeshTimer = window.setTimeout(() => {
      state.remeshTimer = null;
      void this.remeshChunk(state);
    }, 50);
  }

  raycastBlock(origin: Vec3, direction: Vec3, maxDist = RAYCAST_MAX) {
    return voxelRaycast(origin, direction, maxDist, (x, y, z) => this.getBlock(x, y, z));
  }

  private persistChunkEdits(key: string, chunk: Chunk): void {
    if (chunk.edits.size > 0) {
      this.persistedEdits.set(key, chunk.snapshotEdits());
    } else {
      this.persistedEdits.delete(key);
    }
  }
}
