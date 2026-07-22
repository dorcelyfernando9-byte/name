import { existsSync, readFileSync, readdirSync } from "fs";
import { join, extname } from "path";
import { PluginAPI } from "./PluginAPI";
import { EventBus } from "../events/EventBus";
import { SyntaxParser } from "../config/SyntaxParser";

interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  main?: string;
  engines?: Record<string, string>;
}

interface Plugin {
  manifest: PluginManifest;
  api: PluginAPI;
  enabled: boolean;
  path: string;
}

export class PluginLoader {
  private plugins: Map<string, Plugin> = new Map();
  private parser: SyntaxParser;
  private basePath: string;

  constructor(basePath: string = "./mods") {
    this.parser = new SyntaxParser();
    this.basePath = basePath;
  }

  async loadAll(): Promise<void> {
    if (!existsSync(this.basePath)) return;

    const entries = readdirSync(this.basePath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await this.loadFromDirectory(join(this.basePath, entry.name));
      } else if (entry.isFile() && extname(entry.name) === ".tlbx") {
        await this.loadFromFile(join(this.basePath, entry.name));
      }
    }
  }

  async loadFromDirectory(dirPath: string): Promise<Plugin | null> {
    const manifestPath = join(dirPath, "plugin.json");
    if (!existsSync(manifestPath)) return null;

    const manifest: PluginManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const mainFile = manifest.main || "main.tlbx";
    const mainPath = join(dirPath, mainFile);

    if (!existsSync(mainPath)) return null;

    return this.loadPlugin(mainPath, manifest);
  }

  async loadFromFile(filePath: string): Promise<Plugin | null> {
    const manifest: PluginManifest = {
      name: filePath.split("/").pop()?.replace(".tlbx", "") || "unknown",
      version: "1.0.0",
    };
    return this.loadPlugin(filePath, manifest);
  }

  private async loadPlugin(filePath: string, manifest: PluginManifest): Promise<Plugin> {
    const plugin: Plugin = {
      manifest,
      api: new PluginAPI(),
      enabled: true,
      path: filePath,
    };

    this.plugins.set(manifest.name, plugin);
    EventBus.emit("plugin:loaded", { name: manifest.name, version: manifest.version });

    return plugin;
  }

  enable(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    plugin.enabled = true;
    EventBus.emit("plugin:enabled", { name });
    return true;
  }

  disable(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    plugin.enabled = false;
    EventBus.emit("plugin:disabled", { name });
    return true;
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  remove(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    EventBus.emit("plugin:removed", { name });
    return this.plugins.delete(name);
  }
}
