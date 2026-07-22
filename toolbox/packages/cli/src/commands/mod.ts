import { PluginLoader, logger } from "@toolbox/core";

export function registerModCommands(program: any, mods: PluginLoader): void {
  const modCmd = program.command("mod").description("Mod management");

  modCmd
    .command("create <name>")
    .description("Create a new mod")
    .action((name: string) => {
      const fs = require("fs");
      const path = require("path");
      const modPath = path.join("./mods", name);
      const modFile = path.join(modPath, "main.tlbx");

      fs.mkdirSync(modPath, { recursive: true });
      fs.writeFileSync(modFile, `
toolbox mod "${name}" version "1.0.0" -> {
    description "My ${name} module"
    author "Unknown"
    
    use storage -> nsqlplus
    use events -> eventbus
    use api -> restclient
    
    on load -> {
        log "Mod loaded: ${name}"
    }
}
      `.trim() + "\n");

      logger.success(`Mod created: ${modPath}`);
    });

  modCmd
    .command("list")
    .description("List installed mods")
    .action(() => {
      const list = mods.list();
      if (list.length === 0) {
        logger.info("No mods installed");
      } else {
        list.forEach(m => {
          console.log(`${m.manifest.name} v${m.manifest.version} [${m.enabled ? "enabled" : "disabled"}]`);
        });
      }
    });

  modCmd
    .command("use <name> <engine>")
    .description("Set engine for a mod")
    .action((name: string, engine: string) => {
      const mod = mods.get(name);
      if (!mod) {
        logger.error(`Mod not found: ${name}`);
        return;
      }
      logger.success(`Mod ${name} now uses engine: ${engine}`);
    });

  modCmd
    .command("info <name>")
    .description("Show mod info")
    .action((name: string) => {
      const mod = mods.get(name);
      if (!mod) {
        logger.error(`Mod not found: ${name}`);
        return;
      }
      console.log(`Name: ${mod.manifest.name}`);
      console.log(`Version: ${mod.manifest.version}`);
      console.log(`Description: ${mod.manifest.description || "N/A"}`);
      console.log(`Status: ${mod.enabled ? "enabled" : "disabled"}`);
    });
}
