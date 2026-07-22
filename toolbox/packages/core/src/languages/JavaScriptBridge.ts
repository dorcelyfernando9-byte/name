import { execSync, spawn } from "child_process";
import { ILanguageBridge, RunResult } from "./interface";

export class JavaScriptBridge implements ILanguageBridge {
  readonly name = "javascript";
  readonly version = "node";

  isAvailable(): boolean {
    try {
      execSync("node --version", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  async run(file: string, args?: string[]): Promise<RunResult> {
    return new Promise((resolve, reject) => {
      try {
        const { execSync } = require("child_process");
        const cmd = `node ${file} ${(args || []).join(" ")}`;
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
    try {
      const result = execSync(`node -e "${code.replace(/"/g, '\\"')}"`, {
        encoding: "utf-8",
      });
      return result.trim();
    } catch (error: any) {
      throw new Error(`JS eval error: ${error.message}`);
    }
  }

  async repl(): Promise<void> {
    spawn("node", { stdio: "inherit" });
  }
}
