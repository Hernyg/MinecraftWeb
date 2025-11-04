import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "minecraft-web";
const STORE_NAME = "chunks";

export class SaveStore {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private async getDb(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
    }
    return this.dbPromise;
  }

  async putChunk(key: string, data: ArrayBuffer): Promise<void> {
    const db = await this.getDb();
    // TODO: Hook into chunk save pipeline to persist edited chunks.
    await db.put(STORE_NAME, data, key);
  }

  async getChunk(key: string): Promise<ArrayBuffer | undefined> {
    const db = await this.getDb();
    const result = await db.get(STORE_NAME, key);
    // TODO: Deserialize chunk metadata when saves include more information.
    return result as ArrayBuffer | undefined;
  }
}
