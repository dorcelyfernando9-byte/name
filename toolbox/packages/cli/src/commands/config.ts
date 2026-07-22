import { ConfigManager, logger } from "@toolbox/core";

export function registerConfigCommands(program: any, config: ConfigManager): void {
  const configCmd = program.command("config").description("Manage configuration");

  configCmd
    .command("set <key> <value>")
    .description("Set a config value")
    .action(async (key: string, value: string) => {
      try {
        const parsedValue = parseValue(value);
        config.set(key, parsedValue);
        logger.success(`Config set: ${key} = ${JSON.stringify(parsedValue)}`);
      } catch (error: any) {
        logger.error(`Failed to set config: ${error.message}`);
      }
    });

  configCmd
    .command("get <key>")
    .description("Get a config value")
    .action((key: string) => {
      const value = config.get(key);
      if (value === null) {
        logger.warn(`Config key not found: ${key}`);
      } else {
        console.log(JSON.stringify(value, null, 2));
      }
    });

  configCmd
    .command("list")
    .description("List all config values")
    .action(() => {
      const all = config.list();
      console.log(JSON.stringify(all, null, 2));
    });

  configCmd
    .command("reset <key>")
    .description("Reset a config key")
    .action((key: string) => {
      config.reset(key);
      logger.success(`Config reset: ${key}`);
    });

  configCmd
    .command("import <file>")
    .description("Import config from file")
    .action((file: string) => {
      try {
        config.importConfig(file);
        logger.success(`Config imported from: ${file}`);
      } catch (error: any) {
        logger.error(`Import failed: ${error.message}`);
      }
    });

  configCmd
    .command("export <file>")
    .description("Export config to file")
    .action((file: string) => {
      try {
        config.exportConfig(file);
        logger.success(`Config exported to: ${file}`);
      } catch (error: any) {
        logger.error(`Export failed: ${error.message}`);
      }
    });
}

function parseValue(value: string): any {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+$/.test(value)) return parseInt(value);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
