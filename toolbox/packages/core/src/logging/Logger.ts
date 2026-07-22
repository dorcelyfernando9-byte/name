import { Color } from "../colors/ColorSystem";

const LEVELS = {
  debug: 0,
  info: 1,
  success: 2,
  warn: 3,
  error: 4,
} as const;

type LogLevel = keyof typeof LEVELS;

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  module?: string;
}

type LogTransport = (entry: LogEntry) => void;

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

export class Logger {
  private minLevel: number = LEVELS.debug;
  private transports: LogTransport[] = [];
  private history: LogEntry[] = [];
  private maxHistory: number = 1000;
  private useColors: boolean = true;
  private moduleName: string = "";

  constructor(moduleName?: string) {
    if (moduleName) this.moduleName = moduleName;
    this.addTransport((entry) => this.defaultTransport(entry));
  }

  private defaultTransport(entry: LogEntry): void {
    if (!this.useColors) {
      const ts = entry.timestamp.toLocaleTimeString();
      const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
      console.log(`[${entry.level.toUpperCase()}] ${ts}: ${entry.message}${dataStr}`);
      return;
    }

    const levelColors: Record<LogLevel, string> = {
      debug: "\x1b[36m",
      info: "\x1b[34m",
      success: "\x1b[32m",
      warn: "\x1b[33m",
      error: "\x1b[31m",
    };

    const bgColors: Record<LogLevel, string> = {
      debug: "\x1b[46m",
      info: "\x1b[44m",
      success: "\x1b[42m",
      warn: "\x1b[43m",
      error: "\x1b[41m",
    };

    const color = levelColors[entry.level];
    const bg = bgColors[entry.level];
    const ts = entry.timestamp.toLocaleTimeString();
    const moduleTag = entry.module ? ` ${DIM}[${entry.module}]${RESET}` : "";
    const levelTag = `${bg}${BOLD} ${entry.level.toUpperCase().padEnd(7)} ${RESET}`;
    const dataStr = entry.data ? ` ${DIM}${JSON.stringify(entry.data)}${RESET}` : "";

    console.log(
      `${color}${DIM}${ts}${RESET} ${levelTag}${moduleTag} ${entry.message}${dataStr}`
    );
  }

  setColors(enabled: boolean): void {
    this.useColors = enabled;
  }

  setLevel(level: LogLevel): void {
    this.minLevel = LEVELS[level];
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (LEVELS[level] < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      module: this.moduleName || undefined,
    };

    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    for (const transport of this.transports) {
      try { transport(entry); } catch {}
    }
  }

  debug(message: string, data?: any): void { this.log("debug", message, data); }
  info(message: string, data?: any): void { this.log("info", message, data); }
  success(message: string, data?: any): void { this.log("success", message, data); }
  warn(message: string, data?: any): void { this.log("warn", message, data); }
  error(message: string, data?: any): void { this.log("error", message, data); }

  getHistory(level?: LogLevel): LogEntry[] {
    if (level) return this.history.filter(e => e.level === level);
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  table(data: any[], columns?: string[]): void {
    console.table(data, columns);
  }

  progress(current: number, total: number, label?: string): void {
    const percent = Math.round((current / total) * 100);
    const barLength = 30;
    const filled = Math.round((current / total) * barLength);
    const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
    const color = percent < 50 ? "\x1b[31m" : percent < 80 ? "\x1b[33m" : "\x1b[32m";
    const labelStr = label ? `${label} ` : "";
    process.stdout.write(`\r${labelStr}${color}${bar}${RESET} ${BOLD}${percent}%${RESET}`);
    if (current >= total) process.stdout.write("\n");
  }

  subLogger(module: string): Logger {
    const child = new Logger(module);
    child.transports = this.transports;
    child.minLevel = this.minLevel;
    child.useColors = this.useColors;
    return child;
  }
}

export const logger = new Logger("Toolbox");
