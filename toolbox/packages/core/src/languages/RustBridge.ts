import { execSync, spawn } from "child_process";
import { ILanguageBridge, RunResult } from "./interface";

export class RustBridge implements ILanguageBridge {
  readonly name = "rust";
  readonly version = "rustc";

  isAvailable(): boolean {
    try {
      execSync("rustc --version", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  async run(file: string, args?: string[]): Promise<RunResult> {
    return new Promise((resolve) => {
      try {
        const binaryPath = file.replace(".rs", "");
        execSync(`rustc ${file} -o ${binaryPath} 2>/dev/null`, { stdio: "ignore" });
        const cmd = `${binaryPath} ${(args || []).join(" ")}`;
        const stdout = execSync(cmd, { encoding: "utf-8" });
        resolve({
          stdout: stdout.trim(),
          stderr: "",
          exitCode: 0,
          output: stdout.trim(),
        });
      } catch (error: any) {
        resolve({
          stdout: error.stdout?.toString() || "",
          stderr: error.stderr?.toString() || error.message,
          exitCode: error.status || 1,
          output: null,
        });
      }
    });
  }

  async eval(code: string): Promise<any> {
    throw new Error("Rust eval not supported. Use run() with a file.");
  }

  async repl(): Promise<void> {
    throw new Error("Rust does not have a REPL. Use a file instead.");
  }
}
