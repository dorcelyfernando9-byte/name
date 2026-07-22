import { execSync, spawn } from "child_process";
import { ILanguageBridge, RunResult } from "./interface";

export class PythonBridge implements ILanguageBridge {
  readonly name = "python";
  readonly version = "3";

  private getCommand(): string {
    try {
      execSync("python3 --version", { stdio: "ignore" });
      return "python3";
    } catch {
      return "python";
    }
  }

  isAvailable(): boolean {
    try {
      execSync(`${this.getCommand()} --version`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  async run(file: string, args?: string[]): Promise<RunResult> {
    return new Promise((resolve) => {
      try {
        const python = this.getCommand();
        const cmd = `${python} ${file} ${(args || []).join(" ")}`;
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
      const python = this.getCommand();
      const result = execSync(
        `${python} -c "${code.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`,
        { encoding: "utf-8" }
      );
      return result.trim();
    } catch (error: any) {
      throw new Error(`Python eval error: ${error.message}`);
    }
  }

  async repl(): Promise<void> {
    const python = this.getCommand();
    spawn(python, { stdio: "inherit" });
  }
}
