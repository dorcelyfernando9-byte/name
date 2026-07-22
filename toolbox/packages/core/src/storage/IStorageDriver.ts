export interface StorageOptions {
  path?: string;
  encrypt?: boolean;
  encryptFields?: string[];
}

export interface SetOptions {
  encrypt?: boolean;
  ttl?: number;
}

export interface QueryResult {
  rows: any[];
  columns: string[];
  rowCount: number;
}

export interface BackupOptions {
  format?: "sql" | "json" | "csv";
  includeEncrypted?: boolean;
}

export interface CollectionSchema {
  name: string;
  fields: Record<string, "string" | "number" | "boolean" | "object" | "any">;
  indices?: string[];
  encrypt?: string[];
}

export interface IStorageDriver {
  readonly name: string;
  init(options?: StorageOptions): Promise<void>;
  get(key: string): Promise<any>;
  set(key: string, value: any, options?: SetOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  query(sql: string, params?: any[]): Promise<QueryResult>;
  createCollection(schema: CollectionSchema): Promise<void>;
  dropCollection(name: string): Promise<void>;
  listCollections(): Promise<string[]>;
  listKeys(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;
  backup(path: string, options?: BackupOptions): Promise<void>;
  restore(path: string): Promise<void>;
  close(): Promise<void>;
}
