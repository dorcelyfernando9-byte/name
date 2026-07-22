export { IStorageDriver } from "./IStorageDriver";
export type { StorageOptions, SetOptions, QueryResult, BackupOptions, CollectionSchema } from "./IStorageDriver";
export { NSQLPlus } from "./nsql/NSQLPlus";
export { MemoryDriver } from "./memory/MemoryDriver";
export { CryptoEngine } from "./nsql/crypto";

import { IStorageDriver } from "./IStorageDriver";
import { NSQLPlus } from "./nsql/NSQLPlus";
import { MemoryDriver } from "./memory/MemoryDriver";

export function createStorage(driver: "nsql" | "memory" = "nsql", masterKey?: string): IStorageDriver {
  switch (driver) {
    case "nsql":
      return new NSQLPlus(masterKey);
    case "memory":
      return new MemoryDriver(masterKey);
    default:
      throw new Error(`Unknown storage driver: ${driver}`);
  }
}
