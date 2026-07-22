import { execSync, spawn, exec } from "child_process";
import { ILanguageBridge, RunResult } from "./interface";
import { existsSync, writeFileSync, mkdtempSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { v4 as uuid } from "uuid";

export class CBridge implements ILanguageBridge {
  readonly name = "c";
  readonly version = "c11";

  private getCompiler(): string {
    try {
      execSync("gcc --version", { stdio: "ignore" });
      return "gcc";
    } catch {
      try {
        execSync("clang --version", { stdio: "ignore" });
        return "clang";
      } catch {
        try {
          execSync("tcc --version", { stdio: "ignore" });
          return "tcc";
        } catch {
          return "";
        }
      }
    }
  }

  isAvailable(): boolean {
    return this.getCompiler() !== "";
  }

  async run(file: string, args?: string[]): Promise<RunResult> {
    const compiler = this.getCompiler();
    if (!compiler) {
      return { stdout: "", stderr: "No C compiler found (gcc/clang/tcc)", exitCode: 1, output: null };
    }

    const tmpDir = mkdtempSync(join(tmpdir(), "toolbox-c-"));
    const binary = join(tmpDir, "a.out");
    const id = uuid().slice(0, 8);

    try {
      execSync(`${compiler} -x c "${file}" -o "${binary}" -std=c11 -Wall 2>&1`, {
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
      return { stdout: "", stderr: "No C compiler found", exitCode: 1, output: null };
    }

    const tmpDir = mkdtempSync(join(tmpdir(), "toolbox-c-"));
    const sourceFile = join(tmpDir, "main.c");
    const binary = join(tmpDir, "a.out");

    writeFileSync(sourceFile, code);

    try {
      execSync(`${compiler} "${sourceFile}" -o "${binary}" -std=c11 -Wall 2>&1`, {
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
    throw new Error("C does not have a REPL. Write a .c file and use `toolbox language run c file.c`");
  }
}
