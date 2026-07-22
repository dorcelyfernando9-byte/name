import { execSync, spawn } from "child_process";
import { ILanguageBridge, RunResult } from "./interface";
import { existsSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export class CPPBridge implements ILanguageBridge {
  readonly name = "cpp";
  readonly version = "c++17";

  private getCompiler(): string {
    try {
      execSync("g++ --version", { stdio: "ignore" });
      return "g++";
    } catch {
      try {
        execSync("clang++ --version", { stdio: "ignore" });
        return "clang++";
      } catch {
        return "";
      }
    }
  }

  isAvailable(): boolean {
    return this.getCompiler() !== "";
  }

  async run(file: string, args?: string[]): Promise<RunResult> {
    const compiler = this.getCompiler();
    if (!compiler) {
      return { stdout: "", stderr: "No C++ compiler found (g++/clang++)", exitCode: 1, output: null };
    }

    const tmpDir = mkdtempSync(join(tmpdir(), "toolbox-cpp-"));
    const binary = join(tmpDir, "a.out");

    try {
      execSync(`${compiler} -x c++ "${file}" -o "${binary}" -std=c++17 -Wall 2>&1`, {
        encoding: "utf-8",
        timeout: 30000,
      });
    } catch (compileError: any) {
      rmSync(tmpDir, { recursive: true, force: true });
      return {
        stdout: "",
        stderr: `Compilation failed: ${compileError.stderr || compileError.message}`,
        exitCode: 1,
        output: null,
      };
    }

    try {
      const stdout = execSync(`"${binary}" ${(args || []).map(a => `"${a}"`).join(" ")}`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      rmSync(tmpDir, { recursive: true, force: true });
      return { stdout: stdout.trim(), stderr: "", exitCode: 0, output: stdout.trim() };
    } catch (runError: any) {
      rmSync(tmpDir, { recursive: true, force: true });
      return {
        stdout: runError.stdout?.toString() || "",
        stderr: runError.stderr?.toString() || runError.message,
        exitCode: runError.status || 1,
        output: null,
      };
    }
  }

  async runSource(code: string, args?: string[]): Promise<RunResult> {
    const compiler = this.getCompiler();
    if (!compiler) {
      return { stdout: "", stderr: "No C++ compiler found", exitCode: 1, output: null };
    }

    const tmpDir = mkdtempSync(join(tmpdir(), "toolbox-cpp-"));
    const sourceFile = join(tmpDir, "main.cpp");
    const binary = join(tmpDir, "a.out");

    writeFileSync(sourceFile, code);

    try {
      execSync(`${compiler} "${sourceFile}" -o "${binary}" -std=c++17 -Wall 2>&1`, {
        encoding: "utf-8",
        timeout: 30000,
      });
    } catch (compileError: any) {
      rmSync(tmpDir, { recursive: true, force: true });
      return {
        stdout: "",
        stderr: `Compilation failed: ${compileError.stderr || compileError.message}`,
        exitCode: 1,
        output: null,
      };
    }

    try {
      const stdout = execSync(`"${binary}" ${(args || []).map(a => `"${a}"`).join(" ")}`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      rmSync(tmpDir, { recursive: true, force: true });
      return { stdout: stdout.trim(), stderr: "", exitCode: 0, output: stdout.trim() };
    } catch (runError: any) {
      rmSync(tmpDir, { recursive: true, force: true });
      return {
        stdout: runError.stdout?.toString() || "",
        stderr: runError.stderr?.toString() || runError.message,
        exitCode: runError.status || 1,
        output: null,
      };
    }
  }

  async eval(code: string): Promise<any> {
    const result = await this.runSource(code);
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return result.output;
  }

  async repl(): Promise<void> {
    throw new Error("C++ does not have a REPL. Write a .cpp file and use `toolbox language run cpp file.cpp`");
  }
}
