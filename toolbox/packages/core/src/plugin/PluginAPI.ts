import { EventBus, EventBusClass } from "../events/EventBus";
import { IStorageDriver } from "../storage/IStorageDriver";
import { ConfigManager } from "../config/ConfigManager";

export class PluginAPI {
  public readonly events: EventBusClass = EventBus;
  public readonly storage: IStorageDriver | null;
  public readonly config: ConfigManager | null;
  public readonly logger = {
    info: (...args: any[]) => console.log("[INFO]", ...args),
    warn: (...args: any[]) => console.warn("[WARN]", ...args),
    error: (...args: any[]) => console.error("[ERROR]", ...args),
    debug: (...args: any[]) => console.debug("[DEBUG]", ...args),
    success: (...args: any[]) => console.log("[SUCCESS]", ...args),
  };

  constructor(storage?: IStorageDriver, config?: ConfigManager) {
    this.storage = storage || null;
    this.config = config || null;
  }
}
