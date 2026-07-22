import { Compiler, logger } from "@toolbox/core";

export function registerBuildCommands(program: any): void {
  const buildCmd = program.command("build").description("Build/Compile applications");

  buildCmd
    .command("init [name]")
    .description("Initialize a build config (toolbox.json)")
    .action((name?: string) => {
      const compiler = new Compiler();
      compiler.createDefaultConfig(name);
    });

  buildCmd
    .command("project")
    .option("--config <config>", "Path to config file")
    .option("--target <target>", "Build target (node, exe, binary, wasm, python, dll)")
    .option("--mode <mode>", "Build mode (debug, release)")
    .option("--entry <entry>", "Entry file")
    .option("--output <output>", "Output directory")
    .description("Build a project from toolbox.json")
    .action(async (options: any) => {
      const compiler = new Compiler();
      if (options.config) compiler.loadProjectConfig(options.config);

      const buildOptions: any = {};
      if (options.target) buildOptions.target = options.target;
      if (options.mode) buildOptions.mode = options.mode;
      if (options.entry) buildOptions.entry = options.entry;
      if (options.output) buildOptions.output = options.output;

      const result = await compiler.build(buildOptions);
      if (!result.success) process.exit(1);
    });

  buildCmd
    .command("c <file>")
    .option("--output <output>", "Output binary path")
    .option("--flags <flags>", "Compiler flags", "-Wall -O2")
    .description("Compile a C file")
    .action((file: string, options: any) => {
      const { execSync } = require("child_process");
      const output = options.output || file.replace(".c", "");
      try {
        execSync(`gcc "${file}" -o "${output}" ${options.flags}`, { stdio: "inherit" });
        logger.success(`Compiled: ${output}`);
      } catch (error: any) {
        logger.error(`Compilation failed: ${error.message}`);
      }
    });

  buildCmd
    .command("cpp <file>")
    .option("--output <output>", "Output binary path")
    .option("--flags <flags>", "Compiler flags", "-Wall -O2 -std=c++17")
    .description("Compile a C++ file")
    .action((file: string, options: any) => {
      const { execSync } = require("child_process");
      const output = options.output || file.replace(/\.(cpp|cxx|cc)$/, "");
      try {
        execSync(`g++ "${file}" -o "${output}" ${options.flags}`, { stdio: "inherit" });
        logger.success(`Compiled: ${output}`);
      } catch (error: any) {
        logger.error(`Compilation failed: ${error.message}`);
      }
    });

  buildCmd
    .command("rust <file>")
    .option("--output <output>", "Output binary path")
    .option("--release", "Build in release mode")
    .description("Compile a Rust file")
    .action((file: string, options: any) => {
      const { execSync } = require("child_process");
      const output = options.output || file.replace(".rs", "");
      const mode = options.release ? "-O" : "-g";
      try {
        execSync(`rustc "${file}" -o "${output}" ${mode}`, { stdio: "inherit" });
        logger.success(`Compiled: ${output}`);
      } catch (error: any) {
        logger.error(`Compilation failed: ${error.message}`);
      }
    });

  buildCmd
    .command("go <file>")
    .option("--output <output>", "Output binary path")
    .description("Compile a Go file")
    .action((file: string, options: any) => {
      const { execSync } = require("child_process");
      const output = options.output || file.replace(".go", "");
      try {
        execSync(`go build -o "${output}" "${file}"`, { stdio: "inherit" });
        logger.success(`Compiled: ${output}`);
      } catch (error: any) {
        logger.error(`Compilation failed: ${error.message}`);
      }
    });

  buildCmd
    .command("wasm <file>")
    .option("--output <output>", "Output prefix")
    .description("Compile to WebAssembly (requires emscripten)")
    .action((file: string, options: any) => {
      const { execSync } = require("child_process");
      const output = options.output || file.replace(/\.[^.]+$/, "");
      try {
        execSync(`emcc "${file}" -O2 -s WASM=1 -o "${output}.html"`, { stdio: "inherit" });
        logger.success(`WASM built: ${output}.wasm`);
      } catch (error: any) {
        logger.error(`WASM build failed: ${error.message}`);
      }
    });

  buildCmd
    .command("clean")
    .description("Clean build artifacts")
    .action(() => {
      const compiler = new Compiler();
      compiler.clean();
    });
}
