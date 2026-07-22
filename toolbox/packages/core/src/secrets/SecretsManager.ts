import { CryptoEngine } from "../storage/nsql/crypto";

export class SecretsManager {
  private crypto: CryptoEngine;
  private secrets: Map<string, string> = new Map();

  constructor(masterKey?: string) {
    this.crypto = new CryptoEngine(masterKey);
  }

  set(key: string, value: string): void {
    const encrypted = this.crypto.encrypt(value);
    this.secrets.set(key, encrypted);
  }

  get(key: string): string | null {
    const encrypted = this.secrets.get(key);
    if (!encrypted) return null;
    return this.crypto.decrypt(encrypted);
  }

  delete(key: string): boolean {
    return this.secrets.delete(key);
  }

  has(key: string): boolean {
    return this.secrets.has(key);
  }

  list(): string[] {
    return Array.from(this.secrets.keys());
  }

  clear(): void {
    this.secrets.clear();
  }

  loadFromEnv(prefix: string = "TOOLBOX_"): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        const name = key.slice(prefix.length).toLowerCase();
        this.set(name, value || "");
      }
    }
  }

  loadFromFile(filePath: string): void {
    const fs = require("fs");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      this.set(key, value);
    }
  }
}

export const secretsManager = new SecretsManager();
