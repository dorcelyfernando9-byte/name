import { IStorageDriver, StorageOptions, SetOptions, QueryResult, CollectionSchema } from "../IStorageDriver";
import { CryptoEngine } from "../nsql/crypto";

interface MemoryEntry {
  value: any;
  collection: string;
  encrypted: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
}

interface SchemaEntry {
  name: string;
  schema: CollectionSchema;
  createdAt: number;
}

export class MemoryDriver implements IStorageDriver {
  readonly name = "memory";
  private store: Map<string, MemoryEntry> = new Map();
  private schemas: Map<string, SchemaEntry> = new Map();
  private crypto: CryptoEngine;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(masterKey?: string) {
    this.crypto = new CryptoEngine(masterKey);
    this.startCleanup();
  }

  async init(_options?: StorageOptions): Promise<void> {}

  async get(key: string): Promise<any> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    let value = entry.value;
    if (entry.encrypted && typeof value === "string") {
      value = this.crypto.decrypt(value);
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async set(key: string, value: any, options?: SetOptions): Promise<void> {
    const now = Date.now();
    let stringValue = typeof value === "string" ? value : JSON.stringify(value);
    let encrypted = options?.encrypt || false;

    if (encrypted) {
      stringValue = this.crypto.encrypt(stringValue);
    }

    this.store.set(key, {
      value: stringValue,
      collection: "default",
      encrypted,
      createdAt: now,
      updatedAt: now,
      expiresAt: options?.ttl ? now + options.ttl * 1000 : null,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async query(_sql: string, _params?: any[]): Promise<QueryResult> {
    const rows = Array.from(this.store.entries()).map(([key, entry]) => ({
      key,
      ...entry,
      value: entry.encrypted ? this.crypto.decrypt(entry.value) : entry.value,
    }));
    return {
      rows,
      columns: ["key", "value", "collection", "createdAt", "updatedAt", "expiresAt"],
      rowCount: rows.length,
    };
  }

  async createCollection(schema: CollectionSchema): Promise<void> {
    this.schemas.set(schema.name, {
      name: schema.name,
      schema,
      createdAt: Date.now(),
    });
  }

  async dropCollection(name: string): Promise<void> {
    this.schemas.delete(name);
    for (const [key, entry] of this.store.entries()) {
      if (entry.collection === name) {
        this.store.delete(key);
      }
    }
  }

  async listCollections(): Promise<string[]> {
    const names = new Set<string>();
    this.schemas.forEach((_, key) => names.add(key));
    this.store.forEach(entry => names.add(entry.collection));
    return Array.from(names);
  }

  async listKeys(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.store.keys());
    if (prefix) {
      return keys.filter(k => k.startsWith(prefix));
    }
    return keys;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.schemas.clear();
  }

  async backup(path: string): Promise<void> {
    const fs = await import("fs");
    const data = Array.from(this.store.entries()).map(([key, entry]) => ({
      key,
      ...entry,
      value: entry.encrypted ? this.crypto.decrypt(entry.value) : entry.value,
    }));
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  }

  async restore(path: string): Promise<void> {
    const fs = await import("fs");
    const content = fs.readFileSync(path, "utf-8");
    const data: any[] = JSON.parse(content);
    for (const item of data) {
      this.store.set(item.key, {
        value: item.value,
        collection: item.collection,
        encrypted: item.encrypted,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        expiresAt: item.expiresAt,
      });
    }
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
    this.schemas.clear();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }
}
