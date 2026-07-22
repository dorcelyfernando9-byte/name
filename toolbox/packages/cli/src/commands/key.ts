import { CryptoEngine, logger } from "@toolbox/core";

export function registerKeyCommands(program: any): void {
  const keyCmd = program.command("key").description("Key management");

  keyCmd
    .command("generate")
    .option("--type <type>", "Key type (rsa, aes, sha)", "sha")
    .description("Generate a cryptographic key")
    .action((options: any) => {
      const crypto = new CryptoEngine();
      const key = crypto.getMasterKey();
      logger.success(`Generated master key: ${key}`);
    });

  keyCmd
    .command("encrypt <data>")
    .option("--key <key>", "Encryption key")
    .description("Encrypt data")
    .action((data: string, options: any) => {
      const crypto = new CryptoEngine(options.key);
      const encrypted = crypto.encrypt(data);
      const obfuscated = crypto.obfuscate(encrypted);
      console.log(obfuscated);
    });

  keyCmd
    .command("decrypt <data>")
    .option("--key <key>", "Decryption key")
    .description("Decrypt data")
    .action((data: string, options: any) => {
      const crypto = new CryptoEngine(options.key);
      try {
        const deobfuscated = crypto.deobfuscate(data);
        const decrypted = crypto.decrypt(deobfuscated);
        console.log(decrypted);
      } catch {
        const decrypted = crypto.decrypt(data);
        console.log(decrypted);
      }
    });

  keyCmd
    .command("hash <data>")
    .description("Hash data with SHA-512")
    .action((data: string) => {
      const crypto = new CryptoEngine();
      const hash = crypto.hash(data);
      console.log(hash);
    });
}
