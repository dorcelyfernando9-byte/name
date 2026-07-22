import { EventBus } from "../events/EventBus";

type TaskHandler = () => void | Promise<void>;

interface Task {
  id: string;
  name: string;
  handler: TaskHandler;
  interval?: number;
  cron?: string;
  delay?: number;
  runAt?: Date;
  running: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
}

interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export class TaskScheduler {
  private tasks: Map<string, Task> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  every(interval: string, handler: TaskHandler, name?: string): string {
    const id = name || `task_${Date.now()}`;
    const ms = this.parseInterval(interval);

    const task: Task = {
      id,
      name: name || id,
      handler,
      interval: ms,
      running: false,
      runCount: 0,
    };

    this.tasks.set(id, task);
    this.intervals.set(id, setInterval(() => this.executeTask(id), ms));

    const nextRun = new Date(Date.now() + ms);
    task.nextRun = nextRun;
    EventBus.emit("task:scheduled", { id, name: task.name, nextRun });

    return id;
  }

  cron(expression: string, handler: TaskHandler, name?: string): string {
    const id = name || `task_${Date.now()}`;
    const parts = this.parseCron(expression);

    const task: Task = {
      id,
      name: name || id,
      handler,
      cron: expression,
      running: false,
      runCount: 0,
    };

    this.tasks.set(id, task);
    const ms = this.getNextCronDelay(parts);
    this.scheduleCronTask(id, parts, ms);

    return id;
  }

  once(at: Date | string, handler: TaskHandler, name?: string): string {
    const id = name || `task_${Date.now()}`;
    const runAt = typeof at === "string" ? new Date(at) : at;
    const delay = runAt.getTime() - Date.now();

    if (delay <= 0) {
      handler();
      return id;
    }

    const task: Task = {
      id,
      name: name || id,
      handler,
      runAt,
      running: false,
      runCount: 0,
    };

    this.tasks.set(id, task);
    this.timeouts.set(id, setTimeout(() => this.executeTask(id), delay));

    task.nextRun = runAt;
    EventBus.emit("task:scheduled", { id, name: task.name, nextRun: runAt });

    return id;
  }

  delayed(delay: string, handler: TaskHandler, name?: string): string {
    const id = name || `task_${Date.now()}`;
    const ms = this.parseInterval(delay);

    if (ms <= 0) {
      handler();
      return id;
    }

    const task: Task = {
      id,
      name: name || id,
      handler,
      delay: ms,
      running: false,
      runCount: 0,
    };

    this.tasks.set(id, task);
    this.timeouts.set(id, setTimeout(() => this.executeTask(id), ms));

    const nextRun = new Date(Date.now() + ms);
    task.nextRun = nextRun;
    EventBus.emit("task:scheduled", { id, name: task.name, nextRun });

    return id;
  }

  cancel(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id)!);
      this.intervals.delete(id);
    }

    if (this.timeouts.has(id)) {
      clearTimeout(this.timeouts.get(id)!);
      this.timeouts.delete(id);
    }

    this.tasks.delete(id);
    EventBus.emit("task:cancelled", { id, name: task.name });
    return true;
  }

  list(): Task[] {
    return Array.from(this.tasks.values());
  }

  getStatus(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  pause(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task || !task.running) return false;
    task.running = false;
    this.cancel(id);
    return true;
  }

  stopAll(): void {
    for (const [id] of this.intervals) {
      clearInterval(this.intervals.get(id)!);
    }
    for (const [id] of this.timeouts) {
      clearTimeout(this.timeouts.get(id)!);
    }
    this.intervals.clear();
    this.timeouts.clear();
    this.tasks.clear();
  }

  private async executeTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) return;

    task.running = true;
    task.runCount++;
    task.lastRun = new Date();

    try {
      EventBus.emit("task:started", { id, name: task.name });
      await task.handler();
      EventBus.emit("task:completed", { id, name: task.name });
    } catch (error: any) {
      EventBus.emit("task:failed", { id, name: task.name, error: error.message });
    }

    task.running = false;
  }

  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)\s*(ms|s|m|h|d|w)$/);
    if (!match) throw new Error(`Invalid interval format: ${interval}`);

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "ms": return value;
      case "s": return value * 1000;
      case "m": return value * 60000;
      case "h": return value * 3600000;
      case "d": return value * 86400000;
      case "w": return value * 604800000;
      default: throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  private parseCron(expression: string): CronParts {
    const parts = expression.split(/\s+/);
    if (parts.length !== 5) throw new Error(`Invalid cron expression: ${expression}`);

    return {
      minute: parts[0],
      hour: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4],
    };
  }

  private getNextCronDelay(parts: CronParts): number {
    return 60000;
  }

  private scheduleCronTask(id: string, parts: CronParts, _delay: number): void {
    const check = () => {
      const now = new Date();
      const minute = now.getMinutes().toString();
      const hour = now.getHours().toString();
      const day = now.getDate().toString();
      const month = (now.getMonth() + 1).toString();
      const weekDay = now.getDay().toString();

      if (
        this.matchCronField(parts.minute, minute) &&
        this.matchCronField(parts.hour, hour) &&
        this.matchCronField(parts.dayOfMonth, day) &&
        this.matchCronField(parts.month, month) &&
        this.matchCronField(parts.dayOfWeek, weekDay)
      ) {
        this.executeTask(id);
      }
    };

    this.intervals.set(id, setInterval(check, 60000));
  }

  private matchCronField(pattern: string, value: string): boolean {
    if (pattern === "*") return true;
    if (pattern === value) return true;

    if (pattern.includes(",")) {
      return pattern.split(",").some(p => this.matchCronField(p.trim(), value));
    }

    if (pattern.includes("/")) {
      const [range, step] = pattern.split("/");
      const start = range === "*" ? 0 : parseInt(range);
      return parseInt(value) % parseInt(step) === start;
    }

    if (pattern.includes("-")) {
      const [start, end] = pattern.split("-").map(Number);
      return parseInt(value) >= start && parseInt(value) <= end;
    }

    return false;
  }
}
