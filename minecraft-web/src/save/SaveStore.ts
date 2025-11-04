export class SaveStore {
  private readonly cache = new Map<string, ArrayBuffer>();

  async putChunk(key: string, data: ArrayBuffer): Promise<void> {
    this.cache.set(key, data);
  }

  async getChunk(key: string): Promise<ArrayBuffer | undefined> {
    return this.cache.get(key);
  }
}
