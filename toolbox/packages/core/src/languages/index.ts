export { ILanguageBridge, RunResult } from "./interface";
export { JavaScriptBridge } from "./JavaScriptBridge";
export { PythonBridge } from "./PythonBridge";
export { RustBridge } from "./RustBridge";
export { GoBridge } from "./GoBridge";
export { CSharpBridge } from "./CSharpBridge";
export { CBridge } from "./CBridge";
export { CPPBridge } from "./CPPBridge";

import { ILanguageBridge } from "./interface";
import { JavaScriptBridge } from "./JavaScriptBridge";
import { PythonBridge } from "./PythonBridge";
import { RustBridge } from "./RustBridge";
import { GoBridge } from "./GoBridge";
import { CSharpBridge } from "./CSharpBridge";
import { CBridge } from "./CBridge";
import { CPPBridge } from "./CPPBridge";

export type LanguageType = "javascript" | "python" | "rust" | "go" | "csharp" | "c" | "cpp";

const bridges: Record<string, new () => ILanguageBridge> = {
  javascript: JavaScriptBridge,
  python: PythonBridge,
  rust: RustBridge,
  go: GoBridge,
  csharp: CSharpBridge,
  c: CBridge,
  cpp: CPPBridge,
};

export function getLanguageBridge(language: LanguageType): ILanguageBridge {
  const Bridge = bridges[language];
  if (!Bridge) throw new Error(`Unsupported language: ${language}`);
  return new Bridge();
}

export async function listAvailableLanguages(): Promise<Array<{ name: string; available: boolean }>> {
  return Promise.all(
    Object.entries(bridges).map(async ([name, Bridge]) => {
      const bridge = new Bridge();
      const available = await bridge.isAvailable();
      return { name, available };
    })
  );
}
