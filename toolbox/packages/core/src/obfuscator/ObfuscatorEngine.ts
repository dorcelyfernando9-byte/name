import { createHash, randomBytes } from "crypto";

type ObfuscationLevel = "light" | "medium" | "heavy" | "extreme";
type EncodingMethod = "base64" | "base64url" | "hex" | "binary";

interface ObfuscationConfig {
  level: ObfuscationLevel;
  encoding: EncodingMethod;
  useSalt: boolean;
  usePadding: boolean;
  useInversion: boolean;
  useReversal: boolean;
  useRandomChunks: boolean;
  customCharset?: string;
  passes: number;
}

interface ObfuscationResult {
  data: string;
  method: string;
  level: ObfuscationLevel;
  config: ObfuscationConfig;
  integrity: string;
}

export class ObfuscatorEngine {
  private config: ObfuscationConfig;

  constructor(config?: Partial<ObfuscationConfig>) {
    this.config = {
      level: "medium",
      encoding: "base64",
      useSalt: true,
      usePadding: true,
      useInversion: true,
      useReversal: true,
      useRandomChunks: true,
      passes: 2,
      ...config,
    };
  }

  setLevel(level: ObfuscationLevel): void {
    this.config.level = level;
    switch (level) {
      case "light":
        this.config.passes = 1;
        this.config.useSalt = false;
        this.config.usePadding = false;
        this.config.useInversion = true;
        this.config.useReversal = true;
        this.config.useRandomChunks = false;
        break;
      case "medium":
        this.config.passes = 2;
        this.config.useSalt = true;
        this.config.usePadding = true;
        this.config.useInversion = true;
        this.config.useReversal = true;
        this.config.useRandomChunks = false;
        break;
      case "heavy":
        this.config.passes = 3;
        this.config.useSalt = true;
        this.config.usePadding = true;
        this.config.useInversion = true;
        this.config.useReversal = true;
        this.config.useRandomChunks = true;
        break;
      case "extreme":
        this.config.passes = 5;
        this.config.useSalt = true;
        this.config.usePadding = true;
        this.config.useInversion = true;
        this.config.useReversal = true;
        this.config.useRandomChunks = true;
        break;
    }
  }

  obfuscate(data: string, customKey?: string): ObfuscationResult {
    const salt = this.config.useSalt ? randomBytes(16).toString("hex") : "";
    const key = customKey || randomBytes(8).toString("hex");
    let processed = data;
    const methods: string[] = [];

    if (this.config.useSalt && salt) {
      processed = salt + ":" + processed;
      methods.push("salt");
    }

    for (let pass = 0; pass < this.config.passes; pass++) {
      if (this.config.useReversal) {
        processed = processed.split("").reverse().join("");
        methods.push("reverse");
      }

      if (this.config.useInversion) {
        processed = this.bitInvert(processed);
        methods.push("invert");
      }

      if (this.config.useRandomChunks) {
        processed = this.chunkShuffle(processed, key, pass);
        methods.push("chunk");
      }

      if (this.config.usePadding) {
        processed = this.addPadding(processed, key, pass);
        methods.push("pad");
      }
    }

    const finalData = this.encode(processed);
    const integrity = createHash("sha512").update(finalData).digest("hex");
    const metadata = `${key}:${this.config.passes}:${salt.length ? "salted" : "plain"}`;
    const encoded = Buffer.from(metadata + "||" + finalData).toString("base64");

    return {
      data: encoded,
      method: methods.join("+"),
      level: this.config.level,
      config: { ...this.config },
      integrity,
    };
  }

  deobfuscate(obfuscated: string, customKey?: string): string {
    const decoded = Buffer.from(obfuscated, "base64").toString("utf-8");
    const separator = decoded.indexOf("||");
    if (separator === -1) throw new Error("Invalid obfuscated data format");

    const metadata = decoded.slice(0, separator);
    const payload = decoded.slice(separator + 2);

    const metaParts = metadata.split(":");
    const key = customKey || metaParts[0];
    const passes = parseInt(metaParts[1]) || 1;
    const isSalted = metaParts[2] === "salted";

    let processed = this.decode(payload);

    for (let pass = passes - 1; pass >= 0; pass--) {
      if (this.config.usePadding) {
        processed = this.removePadding(processed);
      }

      if (this.config.useRandomChunks) {
        const origLen = processed.length;
        processed = this.chunkUnshuffle(processed, key, pass, origLen);
      }

      if (this.config.useInversion) {
        processed = this.bitInvert(processed);
      }

      if (this.config.useReversal) {
        processed = processed.split("").reverse().join("");
      }
    }

    if (isSalted) {
      const saltSep = processed.indexOf(":");
      if (saltSep !== -1) {
        processed = processed.slice(saltSep + 1);
      }
    }

    return processed;
  }

  obfuscateFile(path: string): ObfuscationResult {
    const { readFileSync } = require("fs");
    const content = readFileSync(path, "utf-8");
    return this.obfuscate(content);
  }

  deobfuscateFile(path: string, key?: string): string {
    const { readFileSync } = require("fs");
    const content = readFileSync(path, "utf-8").trim();
    return this.deobfuscate(content, key);
  }

  private sprinkleSalt(data: string, salt: string, pass: number): string {
    if (pass % 2 === 0) {
      return salt + ":" + data;
    }
    const mid = Math.floor(data.length / 2);
    return data.slice(0, mid) + ":" + salt + ":" + data.slice(mid);
  }

  private bitInvert(data: string): string {
    const buf = Buffer.from(data, "latin1");
    const inverted = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
      inverted[i] = ~buf[i];
    }
    return inverted.toString("latin1");
  }

  private getChunkSizes(totalLen: number, pass: number): number[] {
    const nChunks = Math.max(2, 4 + pass * 2);
    const chunkSize = Math.ceil(totalLen / nChunks);
    const nActual = Math.ceil(totalLen / chunkSize);
    const sizes = new Array(nActual).fill(chunkSize);
    sizes[nActual - 1] = totalLen - chunkSize * (nActual - 1);
    return sizes;
  }

  private chunkShuffle(data: string, key: string, pass: number): string {
    const sizes = this.getChunkSizes(data.length, pass);
    const chunks: string[] = [];
    let pos = 0;
    for (const s of sizes) {
      chunks.push(data.slice(pos, pos + s));
      pos += s;
    }
    const order = this.shuffleOrder(chunks.length, key, pass, data.length);
    return order.map(i => chunks[i]).join("");
  }

  private chunkUnshuffle(data: string, key: string, pass: number, origLen: number): string {
    const sizes = this.getChunkSizes(origLen, pass);
    const nActual = sizes.length;
    const order = this.shuffleOrder(nActual, key, pass, origLen);

    const chunks: string[] = [];
    let pos = 0;
    for (let i = 0; i < nActual; i++) {
      const chunkIdx = order[i];
      const sz = sizes[chunkIdx];
      chunks.push(data.slice(pos, pos + sz));
      pos += sz;
    }
    const result: string[] = new Array(nActual);
    for (let i = 0; i < nActual; i++) {
      result[order[i]] = chunks[i];
    }
    return result.join("");
  }

  private shuffleOrder(n: number, key: string, pass: number, dataLen: number): number[] {
    const order = Array.from({ length: n }, (_, i) => i);
    const seed = this.hashToNumber(key + pass + dataLen);
    for (let i = order.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  private addPadding(data: string, key: string, pass: number): string {
    const padChar = key[pass % key.length] || "X";
    const padLen = 4 + (pass * 2);
    const pad = padChar.repeat(padLen);
    return `PAD:${padLen}:${padChar}:${pad}${data}${pad}`;
  }

  private removePadding(data: string): string {
    const match = data.match(/^PAD:(\d+):(.):/);
    if (!match) return data;
    const padLen = parseInt(match[1]);
    const content = data.slice(match[0].length);
    return content.slice(padLen, content.length - padLen);
  }

  private encode(data: string): string {
    const buf = Buffer.from(data, "latin1");
    switch (this.config.encoding) {
      case "base64": return buf.toString("base64");
      case "base64url": return buf.toString("base64url");
      case "hex": return buf.toString("hex");
      case "binary":
        return Array.from(buf).map(b => b.toString(2).padStart(8, "0")).join("");
      default: return buf.toString("base64");
    }
  }

  private decode(data: string): string {
    switch (this.config.encoding) {
      case "base64": return Buffer.from(data, "base64").toString("latin1");
      case "base64url": return Buffer.from(data, "base64url").toString("latin1");
      case "hex": return Buffer.from(data, "hex").toString("latin1");
      case "binary": {
        const bytes: number[] = [];
        for (let i = 0; i < data.length; i += 8) {
          bytes.push(parseInt(data.slice(i, i + 8), 2));
        }
        return Buffer.from(bytes).toString("latin1");
      }
      default: return Buffer.from(data, "base64").toString("latin1");
    }
  }

  private hashToNumber(input: string): number {
    return parseInt(createHash("md5").update(input).digest("hex").slice(0, 8), 16);
  }
}

export class Obfuscator {
  static light(key?: string): ObfuscatorEngine {
    const engine = new ObfuscatorEngine();
    engine.setLevel("light");
    return engine;
  }

  static medium(key?: string): ObfuscatorEngine {
    const engine = new ObfuscatorEngine();
    engine.setLevel("medium");
    return engine;
  }

  static heavy(key?: string): ObfuscatorEngine {
    const engine = new ObfuscatorEngine();
    engine.setLevel("heavy");
    return engine;
  }

  static extreme(key?: string): ObfuscatorEngine {
    const engine = new ObfuscatorEngine();
    engine.setLevel("extreme");
    return engine;
  }
}
