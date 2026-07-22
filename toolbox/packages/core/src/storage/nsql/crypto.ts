import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_DERIVATION_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class CryptoEngine {
  private masterKey: Buffer;
  private initialized = false;

  constructor(masterKey?: string) {
    this.masterKey = masterKey
      ? this.deriveKey(masterKey)
      : this.generateKey();
  }

  private generateKey(): Buffer {
    return randomBytes(KEY_LENGTH);
  }

  private deriveKey(password: string): Buffer {
    const salt = randomBytes(16);
    const key = createHash("sha512")
      .update(password)
      .update(salt)
      .digest()
      .slice(0, KEY_LENGTH);
    return key;
  }

  hash(data: string): string {
    return createHash("sha512").update(data).digest("hex");
  }

  hashBuffer(data: Buffer): string {
    return createHash("sha512").update(data).digest("hex");
  }

  obfuscate(data: string): string {
    const half = Math.ceil(data.length / 2);
    const first = data.slice(0, half).split("").reverse().join("");
    const second = data.slice(half).split("").reverse().join("");
    const combined = second + first;
    const obfuscated = Buffer.from(combined).toString("base64");
    const hash = this.hash(obfuscated).slice(0, 16);
    return hash + ":" + obfuscated;
  }

  deobfuscate(obfuscated: string): string {
    const parts = obfuscated.split(":");
    if (parts.length !== 2) throw new Error("Invalid obfuscated data");

    const [hash, data] = parts;
    const computedHash = this.hash(data).slice(0, 16);
    if (hash !== computedHash) throw new Error("Obfuscated data integrity check failed");

    const decoded = Buffer.from(data, "base64").toString();
    const half = Math.ceil(decoded.length / 2);
    const first = decoded.slice(half).split("").reverse().join("");
    const second = decoded.slice(0, half).split("").reverse().join("");

    return first + second;
  }

  encrypt(data: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.masterKey, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag().toString("hex");

    return iv.toString("hex") + ":" + tag + ":" + encrypted;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted data format");

    const [ivHex, tagHex, data] = parts;

    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, this.masterKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  isEncrypted(data: string): boolean {
    return /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/.test(data);
  }

  getMasterKey(): string {
    return this.masterKey.toString("hex");
  }
}
