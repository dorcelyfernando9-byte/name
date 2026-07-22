export * from "./events";
export * from "./storage";
export * from "./api";
export * from "./config";
export * from "./plugin";
export * from "./tasks";
export * from "./logging";
export * from "./testing";
export * from "./validation";
export * from "./templates";
export * from "./migrations";
export * from "./notifications";
export * from "./ai";
export * from "./queue";
export * from "./secrets";
export * from "./discord";
export * from "./streams";
export * from "./security";
export * from "./languages";
export * from "./colors";
export * from "./responses";
export * from "./animations";
export * from "./obfuscator";
export * from "./crypto";
export * from "./compiler";

import { EventBus } from "./events/EventBus";
import { logger } from "./logging/Logger";
import { templateEngine } from "./templates/TemplateEngine";
import { notificationManager } from "./notifications/NotificationManager";
import { aiManager } from "./ai/AIManager";
import { queueManager } from "./queue/QueueManager";
import { TaskScheduler } from "./tasks/TaskScheduler";
import { ConfigManager } from "./config/ConfigManager";
import { IStorageDriver } from "./storage/IStorageDriver";
import { PluginLoader } from "./plugin/PluginLoader";

export class ToolboxCore {
  readonly events = EventBus;
  readonly logger = logger;
  readonly templates = templateEngine;
  readonly notifications = notificationManager;
  readonly ai = aiManager;
  readonly queues = queueManager;
  readonly tasks: TaskScheduler;
  readonly config: ConfigManager;
  readonly plugins: PluginLoader;
  storage!: IStorageDriver;

  constructor() {
    this.tasks = new TaskScheduler();
    this.config = new ConfigManager();
    this.plugins = new PluginLoader();
  }

  async init(): Promise<void> {
    await this.config.init();
    logger.info("Toolbox initialized");
    EventBus.emit("toolbox:ready", {});
  }
}

export const toolbox = new ToolboxCore();
