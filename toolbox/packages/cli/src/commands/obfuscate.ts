import { Obfuscator, logger } from "@toolbox/core";

export function registerObfuscateCommands(program: any): void {
  const obfCmd = program.command("obfuscate").aliases(["obf"]).description("Obfuscation tools");

  obfCmd
    .command("run <data>")
    .option("--level <level>", "Obfuscation level (light, medium, heavy, extreme)", "medium")
    .option("--key <key>", "Custom key for obfuscation")
    .description("Obfuscate data")
    .action((data: string, options: any) => {
      const key = options.key;
      let engine;
      switch (options.level) {
        case "light": engine = Obfuscator.light(key); break;
        case "medium": engine = Obfuscator.medium(key); break;
        case "heavy": engine = Obfuscator.heavy(key); break;
        case "extreme": engine = Obfuscator.extreme(key); break;
        default: engine = Obfuscator.medium(key);
      }
      const result = engine.obfuscate(data);
      console.log(result.data);
      logger.info(`Level: ${result.level} | Method: ${result.method}`);
    });

  obfCmd
    .command("deobfuscate <data>")
    .option("--key <key>", "Custom key for deobfuscation")
    .description("Deobfuscate data")
    .action((data: string, options: any) => {
      try {
        const engine = Obfuscator.medium(options.key);
        const result = engine.deobfuscate(data, options.key);
        console.log(result);
      } catch (error: any) {
        logger.error(`Deobfuscation failed: ${error.message}`);
      }
    });

  obfCmd
    .command("file <path>")
    .option("--level <level>", "Obfuscation level", "medium")
    .option("--output <output>", "Output file path")
    .option("--deobfuscate", "Deobfuscate instead of obfuscate")
    .option("--key <key>", "Custom key")
    .description("Obfuscate/deobfuscate a file")
    .action((path: string, options: any) => {
      const { readFileSync, writeFileSync } = require("fs");
      const data = readFileSync(path, "utf-8").trim();
      const key = options.key;

      if (options.deobfuscate) {
        const engine = Obfuscator.medium(key);
        const result = engine.deobfuscate(data, key);
        const outPath = options.output || path + ".deobf";
        writeFileSync(outPath, result);
        logger.success(`Deobfuscated to: ${outPath}`);
      } else {
        let engine;
        switch (options.level) {
          case "light": engine = Obfuscator.light(key); break;
          case "medium": engine = Obfuscator.medium(key); break;
          case "heavy": engine = Obfuscator.heavy(key); break;
          case "extreme": engine = Obfuscator.extreme(key); break;
          default: engine = Obfuscator.medium(key);
        }
        const result = engine.obfuscate(data);
        const outPath = options.output || path + ".obf";
        writeFileSync(outPath, result.data);
        logger.success(`Obfuscated to: ${outPath}`);
      }
    });
}
