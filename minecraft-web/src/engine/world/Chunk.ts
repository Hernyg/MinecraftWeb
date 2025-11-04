import { CHUNK } from "../../data/config";

const SIZE = CHUNK.X * CHUNK.Y * CHUNK.Z;

const indexOf = (x: number, y: number, z: number): number => y + CHUNK.Y * (x + CHUNK.X * z);

export class Chunk {
  readonly cx: number;
  readonly cz: number;
  readonly blocks: Uint16Array;
  readonly edits = new Map<number, number>();
  edited = false;

  constructor(cx: number, cz: number, data?: Uint16Array) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = data ? new Uint16Array(data) : new Uint16Array(SIZE);
  }

  private index(x: number, y: number, z: number): number {
    return indexOf(x, y, z);
  }

  get(x: number, y: number, z: number): number {
    const idx = this.index(x, y, z);
    return this.edits.get(idx) ?? this.blocks[idx];
  }

  set(x: number, y: number, z: number, id: number): void {
    const idx = this.index(x, y, z);
    const base = this.blocks[idx];
    if (id === base) {
      if (this.edits.delete(idx)) {
        this.edited = true;
      }
      return;
    }
    this.edits.set(idx, id);
    this.edited = true;
  }

  toMeshData(): Uint16Array {
    if (this.edits.size === 0) {
      return new Uint16Array(this.blocks);
    }
    const merged = new Uint16Array(this.blocks);
    for (const [idx, value] of this.edits) {
      merged[idx] = value;
    }
    return merged;
  }
}

export const chunkIndex = indexOf;
