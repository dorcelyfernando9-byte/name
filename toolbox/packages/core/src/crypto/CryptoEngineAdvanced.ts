import {
  createCipheriv, createDecipheriv, randomBytes, createHash,
  scryptSync, generateKeyPairSync, publicEncrypt, privateDecrypt,
  createSign, createVerify, constants, CipherGCM, DecipherGCM,
  KeyObject
} from "crypto";
import { readFileSync } from "fs";

export type SymmetricAlgorithm = "aes-256-gcm" | "aes-256-cbc" | "aes-192-gcm" | "aes-128-gcm" | "chacha20" | "des3";
export type AsymmetricAlgorithm = "rsa-2048" | "rsa-4096" | "ecdsa-p256" | "ecdsa-p384";
export type HashAlgorithm = "sha256" | "sha384" | "sha512" | "md5" | "ripemd160";
export type Encoding = "hex" | "base64" | "base64url";

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptResult {
  data: string;
  algorithm: string;
  iv: string;
  tag?: string;
  salt?: string;
  encoding: Encoding;
  integrity: string;
}

export interface DecryptResult {
  data: string;
  algorithm: string;
  success: boolean;
}

export class CryptoEngineAdvanced {
  private symmetricAlgo: SymmetricAlgorithm;
  private asymmetricAlgo: AsymmetricAlgorithm;
  private hashAlgo: HashAlgorithm;
  private encoding: Encoding;
  private masterKey: Buffer;

  constructor(masterKey?: string, options?: {
    symmetric?: SymmetricAlgorithm;
    asymmetric?: AsymmetricAlgorithm;
    hash?: HashAlgorithm;
    encoding?: Encoding;
  }) {
    this.symmetricAlgo = options?.symmetric || "aes-256-gcm";
    this.asymmetricAlgo = options?.asymmetric || "rsa-4096";
    this.hashAlgo = options?.hash || "sha512";
    this.encoding = options?.encoding || "hex";
    const keyLen = this.getKeyLength();
    this.masterKey = masterKey
      ? scryptSync(masterKey, "toolbox-salt", keyLen)
      : randomBytes(keyLen);
  }

  encrypt(data: string, password?: string): EncryptResult {
    const keyLen = this.getKeyLength();
    const key = password ? scryptSync(password, this.getSalt(), keyLen) : this.masterKey;
    const iv = randomBytes(16);
    const algo = this.getNodeCipherName();
    const isGCM = algo.endsWith("gcm");

    const cipher = createCipheriv(algo, key, iv) as any;
    let encrypted = cipher.update(data, "utf8", this.encoding);
    encrypted += cipher.final(this.encoding);

    const tag = isGCM ? (cipher as any).getAuthTag().toString(this.encoding) : undefined;
    const salt = password ? this.getSalt().toString(this.encoding) : undefined;

    const resultData = tag
      ? `${iv.toString(this.encoding)}:${tag}:${encrypted}`
      : `${iv.toString(this.encoding)}:${encrypted}`;

    const integrity = this.hash(resultData);

    return {
      data: resultData,
      algorithm: this.symmetricAlgo,
      iv: iv.toString(this.encoding),
      tag,
      salt,
      encoding: this.encoding,
      integrity,
    };
  }

  decrypt(encrypted: string, password?: string): DecryptResult {
    try {
      const key = password ? scryptSync(password, this.getSalt(), 32) : this.masterKey;
      const algo = this.getNodeCipherName();
      const parts = encrypted.split(":");
      const isGCM = algo.endsWith("gcm");

      let iv: Buffer, tag: Buffer | undefined, data: string;

      if (parts.length === 3 && isGCM) {
        iv = Buffer.from(parts[0], this.encoding);
        tag = Buffer.from(parts[1], this.encoding);
        data = parts[2];
      } else if (parts.length === 2) {
        iv = Buffer.from(parts[0], this.encoding);
        data = parts[1];
      } else {
        throw new Error("Invalid encrypted data format");
      }

      const decipher = createDecipheriv(algo, key, iv) as any;
      if (tag) (decipher as any).setAuthTag(tag);

      let decrypted = decipher.update(data, this.encoding, "utf8");
      decrypted += decipher.final("utf8");

      return { data: decrypted, algorithm: this.symmetricAlgo, success: true };
    } catch {
      return { data: "", algorithm: this.symmetricAlgo, success: false };
    }
  }

  encryptFile(inputPath: string, outputPath: string, password?: string): EncryptResult {
    const data = readFileSync(inputPath, "utf-8");
    const result = this.encrypt(data, password);
    const { writeFileSync } = require("fs");
    writeFileSync(outputPath, result.data);
    return result;
  }

  decryptFile(inputPath: string, outputPath: string, password?: string): DecryptResult {
    const content = readFileSync(inputPath, "utf-8").trim();
    const result = this.decrypt(content, password);
    if (result.success) {
      const { writeFileSync } = require("fs");
      writeFileSync(outputPath, result.data);
    }
    return result;
  }

  encryptWithPublicKey(data: string, publicKey: string): string {
    const buffer = Buffer.from(data, "utf8");
    const encrypted = publicEncrypt(
      { key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING },
      buffer
    );
    return encrypted.toString(this.encoding);
  }

  decryptWithPrivateKey(encrypted: string, privateKey: string): string {
    const buffer = Buffer.from(encrypted, this.encoding);
    const decrypted = privateDecrypt(
      { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING },
      buffer
    );
    return decrypted.toString("utf8");
  }

  generateKeyPair(type: AsymmetricAlgorithm = this.asymmetricAlgo): KeyPair {
    const keySize = type === "rsa-2048" ? 2048 : 4096;
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: keySize,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    return {
      publicKey: publicKey as unknown as string,
      privateKey: privateKey as unknown as string,
    };
  }

  sign(data: string, privateKey: string): string {
    const signer = createSign(`RSA-SHA${this.hashAlgo.slice(3)}`);
    signer.update(data);
    signer.end();
    return signer.sign(privateKey, this.encoding);
  }

  verify(data: string, signature: string, publicKey: string): boolean {
    const verifier = createVerify(`RSA-SHA${this.hashAlgo.slice(3)}`);
    verifier.update(data);
    verifier.end();
    return verifier.verify(publicKey, signature, this.encoding);
  }

  hash(data: string): string {
    const hash = createHash(this.hashAlgo);
    hash.update(data, "utf8");
    return hash.digest(this.encoding);
  }

  hashFile(path: string): string {
    const data = readFileSync(path);
    const hash = createHash(this.hashAlgo);
    hash.update(data);
    return hash.digest(this.encoding);
  }

  pbkdf2(password: string, salt?: string, iterations: number = 100000): string {
    const crypto = require("crypto");
    const saltBuf = salt ? Buffer.from(salt, "utf8") : randomBytes(16);
    const key = crypto.pbkdf2Sync(password, saltBuf, iterations, 32, this.hashAlgo);
    return key.toString(this.encoding);
  }

  generateSalt(length: number = 16): string {
    return randomBytes(length).toString(this.encoding);
  }

  hmac(data: string, key: string): string {
    const hmac = createHash("sha512");
    hmac.update(data);
    hmac.update(key);
    return hmac.digest(this.encoding);
  }

  private getKeyLength(): number {
    const map: Record<string, number> = {
      "aes-256-gcm": 32,
      "aes-256-cbc": 32,
      "aes-192-gcm": 24,
      "aes-128-gcm": 16,
      "chacha20": 32,
      "des3": 24,
    };
    return map[this.symmetricAlgo] || 32;
  }

  private getNodeCipherName(): string {
    const map: Record<string, string> = {
      "aes-256-gcm": "aes-256-gcm",
      "aes-256-cbc": "aes-256-cbc",
      "aes-192-gcm": "aes-192-gcm",
      "aes-128-gcm": "aes-128-gcm",
      "chacha20": "chacha20-poly1305",
      "des3": "des3-cbc",
    };
    return map[this.symmetricAlgo] || "aes-256-gcm";
  }

  private getSalt(): Buffer {
    return Buffer.from("toolbox-crypto-salt-v1", "utf8");
  }
}
