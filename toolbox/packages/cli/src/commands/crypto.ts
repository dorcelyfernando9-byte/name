import { CryptoEngineAdvanced, logger } from "@toolbox/core";

export function registerCryptoCommands(program: any): void {
  const cryptoCmd = program.command("crypto").description("Encryption/Decryption tools");

  cryptoCmd
    .command("encrypt <data>")
    .option("--password <password>", "Encryption password")
    .option("--algorithm <algo>", "Algorithm (aes-256-gcm, aes-256-cbc)", "aes-256-gcm")
    .option("--encoding <enc>", "Output encoding (hex, base64)", "hex")
    .description("Encrypt data")
    .action((data: string, options: any) => {
      const engine = new CryptoEngineAdvanced(options.password, {
        symmetric: options.algorithm,
        encoding: options.encoding,
      });
      const result = engine.encrypt(data, options.password);
      console.log(result.data);
      logger.info(`Algorithm: ${result.algorithm} | Integrity: ${result.integrity.slice(0, 16)}...`);
    });

  cryptoCmd
    .command("decrypt <data>")
    .option("--password <password>", "Decryption password")
    .option("--algorithm <algo>", "Algorithm", "aes-256-gcm")
    .option("--encoding <enc>", "Input encoding", "hex")
    .description("Decrypt data")
    .action((data: string, options: any) => {
      const engine = new CryptoEngineAdvanced(options.password, {
        symmetric: options.algorithm,
        encoding: options.encoding,
      });
      const result = engine.decrypt(data, options.password);
      if (result.success) {
        console.log(result.data);
        logger.success("Decryption successful");
      } else {
        logger.error("Decryption failed");
      }
    });

  cryptoCmd
    .command("hash <data>")
    .option("--algorithm <algo>", "Hash algorithm (sha256, sha512, md5)", "sha512")
    .description("Hash data")
    .action((data: string, options: any) => {
      const engine = new CryptoEngineAdvanced(undefined, { hash: options.algorithm });
      const hash = engine.hash(data);
      console.log(hash);
      logger.info(`Hash algorithm: ${options.algorithm} | Length: ${hash.length}`);
    });

  cryptoCmd
    .command("keypair")
    .option("--type <type>", "Key type (rsa-2048, rsa-4096)", "rsa-4096")
    .description("Generate a key pair")
    .action((options: any) => {
      const engine = new CryptoEngineAdvanced();
      const pair = engine.generateKeyPair(options.type);
      console.log("=== PUBLIC KEY ===");
      console.log(pair.publicKey);
      console.log("\n=== PRIVATE KEY ===");
      console.log(pair.privateKey);
    });

  cryptoCmd
    .command("sign <data>")
    .option("--key <key>", "Private key path")
    .description("Sign data with private key")
    .action((data: string, options: any) => {
      const { readFileSync } = require("fs");
      const privateKey = options.key ? readFileSync(options.key, "utf-8") : "";
      if (!privateKey) { logger.error("Private key required"); return; }
      const engine = new CryptoEngineAdvanced();
      const signature = engine.sign(data, privateKey);
      console.log(signature);
    });

  cryptoCmd
    .command("verify <data> <signature>")
    .option("--key <key>", "Public key path")
    .description("Verify data signature with public key")
    .action((data: string, signature: string, options: any) => {
      const { readFileSync } = require("fs");
      const publicKey = options.key ? readFileSync(options.key, "utf-8") : "";
      if (!publicKey) { logger.error("Public key required"); return; }
      const engine = new CryptoEngineAdvanced();
      const valid = engine.verify(data, signature, publicKey);
      if (valid) logger.success("Signature valid");
      else logger.error("Signature invalid");
    });
}
