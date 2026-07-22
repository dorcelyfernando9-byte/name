import { IStorageDriver, StorageOptions, SetOptions, QueryResult, BackupOptions, CollectionSchema } from "../IStorageDriver";
import { CryptoEngine } from "./crypto";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import type { Database as DatabaseType } from "better-sqlite3";

interface InternalRow {
  key: string;
  value: string;
  collection: string;
  encrypted: number;
  created_at: number;
  updated_at: number;
  expires_at: number | null;
}

export class NSQLPlus implements IStorageDriver {
  readonly name = "nsql-plus";
  private db!: DatabaseType;
  private crypto: CryptoEngine;
  private path: string = "./toolbox_data";
  private initialized = false;

  constructor(masterKey?: string) {
    this.crypto = new CryptoEngine(masterKey);
  }

  async init(options?: StorageOptions): Promise<void> {
    if (options?.path) this.path = options.path;

    const dir = dirname(this.path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const dbPath = join(this.path, "nsql.db");
    const Database = require("better-sqlite3");
    this.db = new Database(dbPath);

    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _nsql_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        collection TEXT NOT NULL DEFAULT 'default',
        encrypted INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_collection ON _nsql_store(collection);
      CREATE INDEX IF NOT EXISTS idx_expires ON _nsql_store(expires_at);

      CREATE TABLE IF NOT EXISTS _nsql_schema (
        name TEXT PRIMARY KEY,
        schema TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS _nsql_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    this.initialized = true;
  }

  async get(key: string): Promise<any> {
    this.ensureInitialized();
    const row = this.db.prepare(
      "SELECT value, encrypted, expires_at FROM _nsql_store WHERE key = ?"
    ).get(key) as InternalRow | undefined;

    if (!row) return null;
    if (row.expires_at && row.expires_at < Date.now()) {
      this.delete(key);
      return null;
    }

    let value = row.value;
    if (row.encrypted) {
      value = this.crypto.decrypt(value);
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async set(key: string, value: any, options?: SetOptions): Promise<void> {
    this.ensureInitialized();
    const now = Date.now();
    let stringValue = typeof value === "string" ? value : JSON.stringify(value);
    let encrypted = options?.encrypt || false;

    if (encrypted) {
      stringValue = this.encryptWithObfuscation(stringValue);
    }

    const expiresAt = options?.ttl ? now + options.ttl * 1000 : null;

    this.db.prepare(`
      INSERT INTO _nsql_store (key, value, collection, encrypted, created_at, updated_at, expires_at)
      VALUES (?, ?, 'default', ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        encrypted = excluded.encrypted,
        updated_at = excluded.updated_at,
        expires_at = excluded.expires_at
    `).run(key, stringValue, encrypted ? 1 : 0, now, now, expiresAt);
  }

  async delete(key: string): Promise<boolean> {
    this.ensureInitialized();
    const result = this.db.prepare("DELETE FROM _nsql_store WHERE key = ?").run(key);
    return result.changes > 0;
  }

  async has(key: string): Promise<boolean> {
    this.ensureInitialized();
    const row = this.db.prepare(
      "SELECT 1 FROM _nsql_store WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)"
    ).get(key, Date.now());
    return !!row;
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    this.ensureInitialized();
    const stmt = this.db.prepare(sql);
    const rows = params ? stmt.all(...params) : stmt.all();
    const columns = stmt.columns().map(c => c.name);

    const processedRows = rows.map((row: any) => {
      const processed: any = {};
      for (const col of columns) {
        if (col === "value" && row.encrypted) {
          try {
            processed[col] = JSON.parse(this.crypto.decrypt(row[col]));
          } catch {
            processed[col] = row[col];
          }
        } else {
          processed[col] = row[col];
        }
      }
      return processed;
    });

    return {
      rows: processedRows,
      columns,
      rowCount: processedRows.length,
    };
  }

  async createCollection(schema: CollectionSchema): Promise<void> {
    this.ensureInitialized();
    this.db.prepare(`
      INSERT INTO _nsql_schema (name, schema, created_at)
      VALUES (?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET schema = excluded.schema
    `).run(schema.name, JSON.stringify(schema), Date.now());
  }

  async dropCollection(name: string): Promise<void> {
    this.ensureInitialized();
    this.db.prepare("DELETE FROM _nsql_store WHERE collection = ?").run(name);
    this.db.prepare("DELETE FROM _nsql_schema WHERE name = ?").run(name);
  }

  async listCollections(): Promise<string[]> {
    this.ensureInitialized();
    const rows = this.db.prepare("SELECT name FROM _nsql_schema").all() as { name: string }[];
    const collections = this.db.prepare(
      "SELECT DISTINCT collection FROM _nsql_store"
    ).all() as { collection: string }[];

    const names = new Set<string>();
    rows.forEach(r => names.add(r.name));
    collections.forEach(r => names.add(r.collection));
    return Array.from(names);
  }

  async listKeys(prefix?: string): Promise<string[]> {
    this.ensureInitialized();
    const now = Date.now();
    if (prefix) {
      const rows = this.db.prepare(
        "SELECT key FROM _nsql_store WHERE key LIKE ? AND (expires_at IS NULL OR expires_at > ?)"
      ).all(`${prefix}%`, now) as { key: string }[];
      return rows.map(r => r.key);
    }
    const rows = this.db.prepare(
      "SELECT key FROM _nsql_store WHERE (expires_at IS NULL OR expires_at > ?)"
    ).all(now) as { key: string }[];
    return rows.map(r => r.key);
  }

  async clear(): Promise<void> {
    this.ensureInitialized();
    this.db.exec("DELETE FROM _nsql_store");
  }

  async backup(path: string, options?: BackupOptions): Promise<void> {
    this.ensureInitialized();
    const format = options?.format || "sql";

    if (format === "sql") {
      this.db.backup(path);
      return;
    }

    const rows = this.db.prepare("SELECT * FROM _nsql_store").all() as InternalRow[];
    const data = rows.map(row => ({
      ...row,
      value: row.encrypted ? this.crypto.decrypt(row.value) : row.value,
    }));

    if (format === "json") {
      writeFileSync(path, JSON.stringify(data, null, 2));
    } else if (format === "csv") {
      const csv = [
        "key,value,collection,created_at,updated_at,expires_at",
        ...data.map(r =>
          `"${r.key}","${r.value.replace(/"/g, '""')}","${r.collection}",${r.created_at},${r.updated_at},${r.expires_at || ""}`
        ),
      ].join("\n");
      writeFileSync(path, csv);
    }
  }

  async restore(path: string): Promise<void> {
    this.ensureInitialized();
    if (path.endsWith(".sql")) {
      const sql = readFileSync(path, "utf-8");
      this.db.exec(sql);
      return;
    }

    const content = readFileSync(path, "utf-8");
    const data: InternalRow[] = JSON.parse(content);

    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO _nsql_store (key, value, collection, encrypted, created_at, updated_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((rows: InternalRow[]) => {
      for (const row of rows) {
        insert.run(row.key, row.value, row.collection, row.encrypted, row.created_at, row.updated_at, row.expires_at);
      }
    });

    transaction(data);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
    }
  }

  private encryptWithObfuscation(data: string): string {
    const encrypted = this.crypto.encrypt(data);
    return this.crypto.obfuscate(encrypted);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("NSQLPlus not initialized. Call init() first.");
    }
  }
}
