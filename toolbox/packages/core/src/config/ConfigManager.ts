import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { EventBus } from "../events/EventBus";

type ConfigValue = string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };

interface ConfigLayer {
  name: string;
  priority: number;
  data: Record<string, ConfigValue>;
}

interface ConfigOptions {
  basePath?: string;
  autoSave?: boolean;
}

export class ConfigManager {
  private layers: ConfigLayer[] = [];
  private basePath: string;
  private autoSave: boolean;
  private cache: Map<string, ConfigValue> = new Map();

  constructor(options: ConfigOptions = {}) {
    this.basePath = options.basePath || "./config";
    this.autoSave = options.autoSave ?? true;
  }

  async init(): Promise<void> {
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }

    this.loadLayer("default", 0, join(this.basePath, "default.json"));
    this.loadLayer("user", 10, join(this.basePath, "user.json"));
    this.loadLayer("local", 20, join(this.basePath, "local.json"));
    this.loadLayer("module", 5, join(this.basePath, "modules.json"));

    this.rebuildCache();
  }

  private loadLayer(name: string, priority: number, filePath: string): void {
    try {
      if (existsSync(filePath)) {
        const data = JSON.parse(readFileSync(filePath, "utf-8"));
        this.layers.push({ name, priority, data });
      } else {
        this.layers.push({ name, priority, data: {} });
        this.saveLayer(name);
      }
    } catch {
      this.layers.push({ name, priority, data: {} });
    }
  }

  private saveLayer(name: string): void {
    const layer = this.layers.find(l => l.name === name);
    if (!layer) return;
    const filePath = join(this.basePath, `${name}.json`);
    writeFileSync(filePath, JSON.stringify(layer.data, null, 2));
  }

  get(key: string, defaultValue?: ConfigValue): ConfigValue {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;

    for (const layer of [...this.layers].sort((a, b) => b.priority - a.priority)) {
      const value = this.getNestedValue(layer.data, key);
      if (value !== undefined) {
        this.cache.set(key, value);
        return value;
      }
    }

    return defaultValue !== undefined ? defaultValue : null;
  }

  set(key: string, value: ConfigValue, layerName: string = "user"): void {
    let layer = this.layers.find(l => l.name === layerName);
    if (!layer) {
      layer = { name: layerName, priority: 15, data: {} };
      this.layers.push(layer);
    }

    this.setNestedValue(layer.data, key, value);
    this.cache.delete(key);

    if (this.autoSave) {
      this.saveLayer(layerName);
    }

    EventBus.emit("config:changed", { key, value, layer: layerName });
  }

  delete(key: string, layerName?: string): boolean {
    const layers = layerName
      ? this.layers.filter(l => l.name === layerName)
      : this.layers;

    let deleted = false;
    for (const layer of layers) {
      if (this.deleteNestedValue(layer.data, key)) {
        this.cache.delete(key);
        if (this.autoSave) {
          this.saveLayer(layer.name);
        }
        deleted = true;
      }
    }
    return deleted;
  }

  list(layerName?: string): Record<string, ConfigValue> {
    if (layerName) {
      const layer = this.layers.find(l => l.name === layerName);
      return layer ? { ...layer.data } : {};
    }

    const merged: Record<string, ConfigValue> = {};
    for (const layer of [...this.layers].sort((a, b) => a.priority - b.priority)) {
      Object.assign(merged, layer.data);
    }
    return merged;
  }

  clear(layerName?: string): void {
    if (layerName) {
      const layer = this.layers.find(l => l.name === layerName);
      if (layer) {
        layer.data = {};
        this.saveLayer(layerName);
      }
    } else {
      this.layers.forEach(l => {
        l.data = {};
        this.saveLayer(l.name);
      });
    }
    this.cache.clear();
  }

  reset(key: string): void {
    this.cache.delete(key);
    for (const layer of this.layers) {
      this.deleteNestedValue(layer.data, key);
    }
  }

  importConfig(filePath: string): void {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    const layerName = "imported";
    const layer = { name: layerName, priority: 25, data };
    this.layers.push(layer);
    this.saveLayer(layerName);
    this.rebuildCache();
  }

  exportConfig(filePath: string): void {
    const merged = this.list();
    writeFileSync(filePath, JSON.stringify(merged, null, 2));
  }

  private getNestedValue(obj: any, key: string): any {
    return key.split(".").reduce((current, part) => {
      return current && current[part] !== undefined ? current[part] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, key: string, value: any): void {
    const parts = key.split(".");
    const last = parts.pop()!;
    const target = parts.reduce((current, part) => {
      if (!(part in current)) current[part] = {};
      return current[part];
    }, obj);
    target[last] = value;
  }

  private deleteNestedValue(obj: any, key: string): boolean {
    const parts = key.split(".");
    const last = parts.pop()!;
    const target = parts.reduce((current, part) => current?.[part], obj);
    if (target && last in target) {
      delete target[last];
      return true;
    }
    return false;
  }

  private rebuildCache(): void {
    this.cache.clear();
  }
}
