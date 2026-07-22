export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  output: any;
}

export interface ILanguageBridge {
  readonly name: string;
  readonly version: string;
  run(file: string, args?: string[]): Promise<RunResult>;
  eval(code: string): Promise<any>;
  repl(): Promise<void>;
  isAvailable(): boolean | Promise<boolean>;
}
