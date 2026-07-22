import { PluginLoader, logger } from "@toolbox/core";

export function registerPluginCommands(program: any, plugins: PluginLoader): void {
  const pluginCmd = program.command("plugin").description("Plugin management");

  pluginCmd
    .command("list")
    .description("List installed plugins")
    .action(() => {
      const list = plugins.list();
      if (list.length === 0) {
        logger.info("No plugins installed");
      } else {
        list.forEach(p => {
          console.log(`${p.manifest.name} v${p.manifest.version} [${p.enabled ? "enabled" : "disabled"}]`);
        });
      }
    });

  pluginCmd
    .command("enable <name>")
    .description("Enable a plugin")
    .action((name: string) => {
      if (plugins.enable(name)) {
        logger.success(`Plugin enabled: ${name}`);
      } else {
        logger.error(`Plugin not found: ${name}`);
      }
    });

  pluginCmd
    .command("disable <name>")
    .description("Disable a plugin")
    .action((name: string) => {
      if (plugins.disable(name)) {
        logger.success(`Plugin disabled: ${name}`);
      } else {
        logger.error(`Plugin not found: ${name}`);
      }
    });

  pluginCmd
    .command("info <name>")
    .description("Show plugin info")
    .action((name: string) => {
      const plugin = plugins.get(name);
      if (!plugin) {
        logger.error(`Plugin not found: ${name}`);
        return;
      }
      console.log(`Name: ${plugin.manifest.name}`);
      console.log(`Version: ${plugin.manifest.version}`);
      console.log(`Description: ${plugin.manifest.description || "N/A"}`);
      console.log(`Author: ${plugin.manifest.author || "N/A"}`);
      console.log(`Status: ${plugin.enabled ? "enabled" : "disabled"}`);
      console.log(`Path: ${plugin.path}`);
    });
}
