import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync } from "fs";
import { join, extname, basename, relative } from "path";
import { logger } from "../logging/Logger";
import { EventBus } from "../events/EventBus";

type BuildTarget = "exe" | "dll" | "wasm" | "node" | "python" | "binary" | "javascript" | "typescript";
type BuildMode = "debug" | "release";
type ProjectType = "executable" | "library" | "module" | "discord-bot";

interface BuildOptions {
  target: BuildTarget;
  mode: BuildMode;
  output?: string;
  entry?: string;
  sourceDir?: string;
  minify?: boolean;
  optimize?: boolean;
  include?: string[];
  flags?: string[];
}

interface ProjectConfig {
  name: string;
  version: string;
  type: ProjectType;
  language: string;
  entry: string;
  output: string;
  build: BuildOptions;
  dependencies?: Record<string, string>;
}

export class Compiler {
  private config: ProjectConfig;
  private buildDir: string;

  constructor(config?: Partial<ProjectConfig>) {
    this.config = {
      name: "toolbox-app",
      version: "1.0.0",
      type: "executable",
      language: "typescript",
      entry: "index.ts",
      output: "build",
      build: {
        target: "node",
        mode: "release",
        output: "dist",
        minify: false,
        optimize: true,
      },
      ...config,
    };
    this.buildDir = join(process.cwd(), this.config.output || "build");
  }

  async build(options?: Partial<BuildOptions>): Promise<{ success: boolean; output: string; duration: number }> {
    const start = Date.now();
    const buildConfig = { ...this.config.build, ...options };
    const outputDir = buildConfig.output || "build";
    const fullOutputPath = join(process.cwd(), outputDir);

    EventBus.emit("build:started", {
      project: this.config.name,
      target: buildConfig.target,
      mode: buildConfig.mode,
    });

    logger.info(`Building ${this.config.name} v${this.config.version}...`);
    logger.info(`Target: ${buildConfig.target} | Mode: ${buildConfig.mode}`);

    try {
      if (!existsSync(fullOutputPath)) {
        mkdirSync(fullOutputPath, { recursive: true });
      }

      switch (buildConfig.target) {
        case "node":
          await this.buildNode(fullOutputPath, buildConfig);
          break;
        case "exe":
          await this.buildExecutable(fullOutputPath, buildConfig);
          break;
        case "binary":
          await this.buildBinary(fullOutputPath, buildConfig);
          break;
        case "dll":
          await this.buildLibrary(fullOutputPath, buildConfig);
          break;
        case "wasm":
          await this.buildWebAssembly(fullOutputPath, buildConfig);
          break;
        case "python":
          await this.buildPython(fullOutputPath, buildConfig);
          break;
        case "javascript":
          await this.buildJavaScript(fullOutputPath, buildConfig);
          break;
        case "typescript":
          await this.buildTypeScript(fullOutputPath, buildConfig);
          break;
        default:
          throw new Error(`Unsupported build target: ${buildConfig.target}`);
      }

      const duration = Date.now() - start;
      logger.success(`Build completed in ${duration}ms`);
      logger.info(`Output: ${fullOutputPath}`);

      EventBus.emit("build:completed", {
        project: this.config.name,
        output: fullOutputPath,
        duration,
      });

      return { success: true, output: fullOutputPath, duration };
    } catch (error: any) {
      const duration = Date.now() - start;
      logger.error(`Build failed: ${error.message}`);

      EventBus.emit("build:failed", {
        project: this.config.name,
        error: error.message,
        duration,
      });

      return { success: false, output: "", duration };
    }
  }

  private async buildNode(outputDir: string, config: BuildOptions): Promise<void> {
    const sourceDir = config.sourceDir || "src";
    const sourcePath = join(process.cwd(), sourceDir);

    if (config.minify) {
      try {
        execSync("npx terser --version", { stdio: "ignore" });
        const entryFile = config.entry || this.config.entry;
        const entryPath = join(sourcePath, entryFile);
        if (existsSync(entryPath)) {
          const outName = basename(entryFile, extname(entryFile)) + ".min.js";
          execSync(`npx terser "${entryPath}" -o "${join(outputDir, outName)}" --compress --mangle`, {
            stdio: "inherit",
          });
          return;
        }
      } catch {
        logger.warn("terser not available, skipping minification");
      }
    }

    if (existsSync(sourcePath)) {
      this.copyDirectory(sourcePath, outputDir);
    }

    const entryFile = config.entry || this.config.entry;
    const entryContent = `
const { ToolboxCore } = require("toolbox");
const app = new ToolboxCore();
app.init().then(() => {
  require("./${entryFile.replace(/\.(ts|js)$/, "")}");
});
    `.trim();
    writeFileSync(join(outputDir, "bootstrap.js"), entryContent);
  }

  private async buildExecutable(outputDir: string, config: BuildOptions): Promise<void> {
    try {
      execSync("pkg --version", { stdio: "ignore" });

      const entryFile = config.entry || this.config.entry;
      const target = process.platform === "win32" ? "node18-win-x64"
        : process.platform === "darwin" ? "node18-macos-x64"
        : "node18-linux-x64";

      const cmd = `npx pkg "${entryFile}" --targets "${target}" --output "${join(outputDir, this.config.name)}"`;
      execSync(cmd, { stdio: "inherit" });
      logger.success(`Executable created: ${join(outputDir, this.config.name)}`);
    } catch {
      logger.warn("pkg not available. Creating bundled script instead.");
      this.bundleScript(join(outputDir, `${this.config.name}.bundle.js`), config);
    }
  }

  private async buildBinary(outputDir: string, config: BuildOptions): Promise<void> {
    const language = this.config.language;

    try {
      switch (language) {
        case "c":
        case "c11": {
          const compiler = this.findCompiler(["gcc", "clang", "tcc"]);
          if (!compiler) throw new Error("No C compiler found");
          const entryFile = config.entry || "main.c";
          const entryPath = join(process.cwd(), entryFile);
          const flags = config.flags?.join(" ") || "-Wall -O2";
          execSync(`${compiler} "${entryPath}" -o "${join(outputDir, this.config.name)}" ${flags}`, {
            stdio: "inherit",
          });
          break;
        }
        case "cpp":
        case "c++": {
          const compiler = this.findCompiler(["g++", "clang++"]);
          if (!compiler) throw new Error("No C++ compiler found");
          const entryFile = config.entry || "main.cpp";
          const entryPath = join(process.cwd(), entryFile);
          const flags = config.flags?.join(" ") || "-Wall -O2 -std=c++17";
          execSync(`${compiler} "${entryPath}" -o "${join(outputDir, this.config.name)}" ${flags}`, {
            stdio: "inherit",
          });
          break;
        }
        case "rust": {
          execSync(`rustc "${config.entry || 'main.rs'}" -o "${join(outputDir, this.config.name)}" -O`, {
            stdio: "inherit",
          });
          break;
        }
        case "go": {
          const entryFile = config.entry || "main.go";
          execSync(`go build -o "${join(outputDir, this.config.name)}" "${entryFile}"`, {
            stdio: "inherit",
          });
          break;
        }
        default:
          throw new Error(`Binary build not supported for language: ${language}`);
      }
      logger.success(`Binary created: ${join(outputDir, this.config.name)}`);
    } catch (error: any) {
      throw new Error(`Binary build failed: ${error.message}`);
    }
  }

  private async buildLibrary(outputDir: string, config: BuildOptions): Promise<void> {
    const language = this.config.language;
    const entryFile = config.entry || this.config.entry;

    switch (language) {
      case "c":
      case "cpp": {
        const compiler = language === "c" ? "gcc" : "g++";
        const std = language === "c" ? "c11" : "c++17";
        execSync(
          `${compiler} -shared -fPIC "${entryFile}" -o "${join(outputDir, `${this.config.name}.so`)}" -std=${std} -Wall -O2`,
          { stdio: "inherit" }
        );
        break;
      }
      case "rust": {
        execSync(
          `rustc --crate-type dylib "${entryFile}" -o "${join(outputDir, `lib${this.config.name}.so`)}" -O`,
          { stdio: "inherit" }
        );
        break;
      }
      case "typescript":
      case "javascript": {
        this.bundleScript(join(outputDir, `${this.config.name}.js`), config);
        break;
      }
      default:
        throw new Error(`Library build not supported for: ${language}`);
    }
  }

  private async buildWebAssembly(outputDir: string, config: BuildOptions): Promise<void> {
    try {
      execSync("emcc --version", { stdio: "ignore" });

      const entryFile = config.entry || this.config.entry;
      const flags = [
        "-O2",
        "-s WASM=1",
        `-s EXPORTED_FUNCTIONS=['_main']`,
        "-s ALLOW_MEMORY_GROWTH=1",
      ].join(" ");

      execSync(`emcc "${entryFile}" ${flags} -o "${join(outputDir, `${this.config.name}.html`)}"`, {
        stdio: "inherit",
      });
      logger.success(`WASM created: ${join(outputDir, this.config.name)}.wasm`);
    } catch {
      throw new Error("emscripten (emcc) not available for WASM builds");
    }
  }

  private async buildPython(outputDir: string, _config: BuildOptions): Promise<void> {
    try {
      execSync("pyinstaller --version", { stdio: "ignore" });
      const entryFile = _config.entry || this.config.entry;
      execSync(
        `pyinstaller --onefile --distpath "${outputDir}" "${entryFile}"`,
        { stdio: "inherit" }
      );
      logger.success(`Python executable created in: ${outputDir}`);
    } catch {
      execSync(`python -m zipapp "${_config.sourceDir || 'src'}" -o "${join(outputDir, `${this.config.name}.pyz`)}"`, {
        stdio: "inherit",
      });
    }
  }

  async clean(): Promise<void> {
    if (existsSync(this.buildDir)) {
      rmSync(this.buildDir, { recursive: true, force: true });
      logger.info(`Cleaned: ${this.buildDir}`);
    }
  }

  async run(options?: Partial<BuildOptions>): Promise<void> {
    const result = await this.build(options);
    if (result.success) {
      const target = options?.target || this.config.build.target;
      const outputFile = join(result.output, this.config.name);

      switch (target) {
        case "node":
        case "javascript":
          execSync(`node "${outputFile}.js"`, { stdio: "inherit" });
          break;
        case "binary":
        case "exe":
          execSync(`"${outputFile}"`, { stdio: "inherit" });
          break;
        case "python":
          execSync(`python "${outputFile}.pyz"`, { stdio: "inherit" });
          break;
        default:
          logger.info(`Build output at: ${result.output}`);
      }
    }
  }

  loadProjectConfig(configPath?: string): void {
    const path = configPath || join(process.cwd(), "toolbox.json");
    if (!existsSync(path)) {
      logger.warn(`No config found at ${path}, using defaults`);
      return;
    }
    const data = JSON.parse(readFileSync(path, "utf-8"));
    this.config = { ...this.config, ...data, build: { ...this.config.build, ...data.build } };
    logger.info(`Loaded project config: ${path}`);
  }

  createDefaultConfig(projectName?: string): void {
    const name = projectName || this.config.name;
    const config: Partial<ProjectConfig> = {
      name,
      version: "1.0.0",
      type: "executable",
      language: "typescript",
      entry: "src/index.ts",
      output: "build",
      build: {
        target: "node",
        mode: "release",
        output: "dist",
        minify: false,
        optimize: true,
      },
    };
    writeFileSync(join(process.cwd(), "toolbox.json"), JSON.stringify(config, null, 2));
    logger.success(`Created toolbox.json for project: ${name}`);
  }

  /**
   * Build target: javascript
   * Bundles .js source files. Uses esbuild when available; falls back to the
   * internal bundler that concatenates files and optionally minifies via
   * simple whitespace stripping.
   */
  private async buildJavaScript(outputDir: string, config: BuildOptions): Promise<void> {
    const entryFile = config.entry || this.config.entry || "src/index.js";
    const entryPath = join(process.cwd(), entryFile);
    const outName = basename(entryFile, extname(entryFile)) + (config.minify ? ".min.js" : ".js");
    const outFile = join(outputDir, outName);

    const esbuildAvailable = this.commandAvailable("esbuild");

    if (esbuildAvailable) {
      const flags = [
        `--bundle`,
        `--platform=node`,
        config.mode === "release" && config.optimize ? "--minify" : "",
        config.mode === "debug" ? "--sourcemap" : "",
        `--outfile="${outFile}"`,
      ].filter(Boolean).join(" ");

      execSync(`npx esbuild "${entryPath}" ${flags}`, { stdio: "inherit" });
      logger.success(`JavaScript bundle: ${outFile}`);
    } else {
      logger.warn("esbuild not found — using internal bundler");
      this.bundleScript(outFile, { ...config, entry: entryFile });
      logger.success(`JavaScript bundle (internal): ${outFile}`);
    }
  }

  /**
   * Build target: typescript
   * Transpiles TypeScript. Tries esbuild first (fast), then tsc, and finally
   * falls back to the internal bundler that strips type annotations via a
   * simple regex pass so the output at least runs.
   */
  private async buildTypeScript(outputDir: string, config: BuildOptions): Promise<void> {
    const entryFile = config.entry || this.config.entry || "src/index.ts";
    const entryPath = join(process.cwd(), entryFile);
    const outName = basename(entryFile, extname(entryFile)) + ".js";
    const outFile = join(outputDir, outName);

    const esbuildAvailable = this.commandAvailable("esbuild");
    const tscAvailable = this.commandAvailable("tsc");

    if (esbuildAvailable) {
      const flags = [
        `--bundle`,
        `--platform=node`,
        `--format=cjs`,
        config.mode === "release" && config.optimize ? "--minify" : "",
        config.mode === "debug" ? "--sourcemap" : "",
        `--outfile="${outFile}"`,
      ].filter(Boolean).join(" ");

      execSync(`npx esbuild "${entryPath}" ${flags}`, { stdio: "inherit" });
      logger.success(`TypeScript bundle via esbuild: ${outFile}`);
      return;
    }

    if (tscAvailable) {
      const tsconfigPath = join(process.cwd(), "tsconfig.json");
      const tsArgs = [
        "--outDir", `"${outputDir}"`,
        "--module", "commonjs",
        "--target", "ES2022",
        "--esModuleInterop",
        "--skipLibCheck",
        config.mode === "debug" ? "--sourceMap" : "",
        `"${entryPath}"`,
      ].filter(Boolean).join(" ");

      if (existsSync(tsconfigPath)) {
        execSync(`npx tsc --project "${tsconfigPath}" --outDir "${outputDir}"`, { stdio: "inherit" });
      } else {
        execSync(`npx tsc ${tsArgs}`, { stdio: "inherit" });
      }
      logger.success(`TypeScript compiled via tsc: ${outputDir}`);
      return;
    }

    // Last resort: basic TS → JS transpilation (strips type annotations)
    logger.warn("Neither esbuild nor tsc found — using basic TypeScript stripper");
    const tsFiles = this.collectFiles(join(process.cwd(), config.sourceDir || "src"), [".ts"]);
    for (const tsFile of tsFiles) {
      const src = readFileSync(tsFile, "utf-8");
      const js = this.stripTypeScript(src);
      const relPath = relative(join(process.cwd(), config.sourceDir || "src"), tsFile);
      const jsOut = join(outputDir, relPath.replace(/\.ts$/, ".js"));
      mkdirSync(join(jsOut, ".."), { recursive: true });
      writeFileSync(jsOut, js);
    }
    logger.success(`TypeScript stripped (basic) → ${outputDir}`);
  }

  /**
   * Very basic TypeScript → JavaScript stripper used as a last resort when
   * neither esbuild nor tsc is installed. It removes import/export type
   * declarations, interface/type blocks, and inline type annotations well
   * enough for most simple files to run under Node.
   */
  private stripTypeScript(src: string): string {
    return src
      // Remove single-line type/interface declarations
      .replace(/^export\s+(type|interface)\s+[^\n]+(\{[^}]*\})?;?\s*$/gm, "")
      .replace(/^(type|interface)\s+[^\n]+(\{[^}]*\})?;?\s*$/gm, "")
      // Remove inline type annotations: `: Type`, `<Type>`, `as Type`
      .replace(/:\s*[A-Z][A-Za-z0-9<>|&\[\], ]*(?=[,)\s=])/g, "")
      .replace(/<[A-Za-z][A-Za-z0-9, ]*>/g, "")
      .replace(/\s+as\s+[A-Za-z][A-Za-z0-9<>|&\[\], ]*/g, "")
      // Remove visibility modifiers
      .replace(/\b(private|protected|public|readonly|abstract|override)\b\s*/g, "")
      // Remove declare keywords
      .replace(/\bdeclare\s+/g, "")
      // Replace import type with nothing
      .replace(/^import\s+type\s+[^\n]+;\s*$/gm, "")
      // Convert import { X } from "Y" → const { X } = require("Y")
      .replace(
        /^import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?\s*$/gm,
        (_, names, mod) => `const {${names}} = require("${mod}");`
      )
      // Convert import X from "Y" → const X = require("Y")
      .replace(
        /^import\s+(\w+)\s+from\s+["']([^"']+)["'];?\s*$/gm,
        (_, name, mod) => `const ${name} = require("${mod}");`
      )
      // Convert export default → module.exports =
      .replace(/^export\s+default\s+/gm, "module.exports = ")
      // Convert export const/function/class → plain declaration
      .replace(/^export\s+(const|let|var|function|class)\s+/gm, "$1 ");
  }

  /**
   * Returns a structured description of everything the compiler supports:
   * targets, languages, available system tools, and current project config.
   */
  describe(): {
    name: string;
    version: string;
    projectType: string;
    language: string;
    targets: Array<{ target: string; description: string; tool: string; available: boolean }>;
    binaryLanguages: Array<{ language: string; tool: string; available: boolean }>;
    currentConfig: Partial<ProjectConfig>;
  } {
    const targets: Array<{ target: string; description: string; tool: string; available: boolean }> = [
      {
        target: "node",
        description: "Bundle as a Node.js script (copies sources + bootstrap shim)",
        tool: "node",
        available: this.commandAvailable("node"),
      },
      {
        target: "javascript",
        description: "Bundle JavaScript sources into a single file",
        tool: "esbuild (or internal bundler)",
        available: true,
      },
      {
        target: "typescript",
        description: "Transpile TypeScript to JavaScript",
        tool: "esbuild / tsc / basic stripper",
        available: true,
      },
      {
        target: "exe",
        description: "Pack into a self-contained executable via pkg",
        tool: "pkg",
        available: this.commandAvailable("pkg") || this.commandAvailable("npx"),
      },
      {
        target: "binary",
        description: "Compile to a native binary (C, C++, Rust, Go)",
        tool: "gcc / g++ / rustc / go",
        available: ["gcc", "g++", "rustc", "go"].some(t => this.commandAvailable(t)),
      },
      {
        target: "dll",
        description: "Compile as a shared library (.so / .dylib / .dll)",
        tool: "gcc / g++ / rustc",
        available: ["gcc", "g++", "rustc"].some(t => this.commandAvailable(t)),
      },
      {
        target: "wasm",
        description: "Compile to WebAssembly via Emscripten",
        tool: "emcc",
        available: this.commandAvailable("emcc"),
      },
      {
        target: "python",
        description: "Package as a Python executable via PyInstaller or zipapp",
        tool: "pyinstaller / python -m zipapp",
        available: this.commandAvailable("python") || this.commandAvailable("python3"),
      },
    ];

    const binaryLanguages: Array<{ language: string; tool: string; available: boolean }> = [
      { language: "c",      tool: "gcc / clang / tcc", available: ["gcc", "clang", "tcc"].some(t => this.commandAvailable(t)) },
      { language: "cpp",    tool: "g++ / clang++",     available: ["g++", "clang++"].some(t => this.commandAvailable(t)) },
      { language: "rust",   tool: "rustc",             available: this.commandAvailable("rustc") },
      { language: "go",     tool: "go",                available: this.commandAvailable("go") },
    ];

    return {
      name: this.config.name,
      version: this.config.version,
      projectType: this.config.type,
      language: this.config.language,
      targets,
      binaryLanguages,
      currentConfig: {
        name: this.config.name,
        version: this.config.version,
        type: this.config.type,
        language: this.config.language,
        entry: this.config.entry,
        output: this.config.output,
        build: this.config.build,
      },
    };
  }

  /** Check if a command is available on PATH without throwing. */
  private commandAvailable(cmd: string): boolean {
    try {
      execSync(`${cmd} --version`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  private bundleScript(outputPath: string, config: BuildOptions): void {
    const sourceDir = config.sourceDir || "src";
    const sourcePath = join(process.cwd(), sourceDir);
    const files = this.collectFiles(sourcePath, [".js", ".ts"]);

    let bundle = `// ${this.config.name} v${this.config.version}\n`;
    bundle += `// Built with Toolbox Compiler\n`;
    bundle += `// Mode: ${config.mode}\n\n`;

    for (const file of files) {
      const relative = file.replace(sourcePath, "");
      const content = readFileSync(file, "utf-8");
      bundle += `// --- ${relative} ---\n`;
      if (config.minify) {
        bundle += content.replace(/\/\/.*$/gm, "").replace(/\s+/g, " ") + "\n";
      } else {
        bundle += content + "\n";
      }
    }

    writeFileSync(outputPath, bundle);
  }

  private copyDirectory(src: string, dest: string): void {
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      if (entry.isDirectory()) {
        mkdirSync(destPath, { recursive: true });
        this.copyDirectory(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  }

  private collectFiles(dir: string, extensions: string[], result: string[] = []): string[] {
    if (!existsSync(dir)) return result;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        this.collectFiles(fullPath, extensions, result);
      } else if (extensions.includes(extname(entry.name))) {
        result.push(fullPath);
      }
    }
    return result;
  }

  private findCompiler(names: string[]): string | null {
    for (const name of names) {
      try {
        execSync(`${name} --version`, { stdio: "ignore" });
        return name;
      } catch {
        continue;
      }
    }
    return null;
  }
}
