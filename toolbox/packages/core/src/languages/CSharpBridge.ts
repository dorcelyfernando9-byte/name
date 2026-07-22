import { execSync, spawn } from "child_process";
import { ILanguageBridge, RunResult } from "./interface";

export class CSharpBridge implements ILanguageBridge {
  readonly name = "csharp";
  readonly version = "dotnet";

  private getCommand(): string {
    try {
      execSync("dotnet --version", { stdio: "ignore" });
      return "dotnet";
    } catch {
      return "mono";
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
        const runtime = this.getCommand();
        let cmd: string;
        if (runtime === "dotnet") {
          const dir = file.substring(0, file.lastIndexOf("/") + 1) || ".";
          cmd = `dotnet run --project ${dir} ${(args || []).join(" ")}`;
        } else {
          cmd = `mono ${file} ${(args || []).join(" ")}`;
        }
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
    throw new Error("C# eval not supported. Use run() with a file.");
  }

  async repl(): Promise<void> {
    if (this.getCommand() === "dotnet") {
      spawn("dotnet", ["script"], { stdio: "inherit" });
    } else {
      throw new Error("C# REPL not available with mono");
    }
  }
}
