export class ApiCache {
  private store: Map<string, { data: any; expiresAt: number }> = new Map();
  private defaultTTL: number;

  constructor(ttlSeconds: number = 300) {
    this.defaultTTL = ttlSeconds * 1000;
  }

  get(key: string): any | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttl ? ttl * 1000 : this.defaultTTL),
    });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}
