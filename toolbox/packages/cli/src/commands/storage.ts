import { IStorageDriver, logger } from "@toolbox/core";

export function registerStorageCommands(program: any, storage: IStorageDriver): void {
  const storageCmd = program.command("storage").description("Manage storage");

  storageCmd
    .command("init")
    .option("--driver <driver>", "Storage driver (nsql, memory)", "nsql")
    .description("Initialize storage")
    .action(async (options: any) => {
      try {
        await storage.init();
        logger.success(`Storage initialized with driver: ${options.driver}`);
      } catch (error: any) {
        logger.error(`Failed to initialize storage: ${error.message}`);
      }
    });

  storageCmd
    .command("set <key> <value>")
    .option("--encrypt", "Encrypt the value")
    .description("Store a value")
    .action(async (key: string, value: string, options: any) => {
      try {
        await storage.set(key, options.encrypt ? value : value, { encrypt: options.encrypt });
        logger.success(`Set: ${key} = ${options.encrypt ? "***encrypted***" : value}`);
      } catch (error: any) {
        logger.error(`Failed to set value: ${error.message}`);
      }
    });

  storageCmd
    .command("get <key>")
    .description("Get a value")
    .action(async (key: string) => {
      try {
        const value = await storage.get(key);
        if (value === null) {
          logger.warn(`Key not found: ${key}`);
        } else {
          console.log(JSON.stringify(value, null, 2));
        }
      } catch (error: any) {
        logger.error(`Failed to get value: ${error.message}`);
      }
    });

  storageCmd
    .command("delete <key>")
    .description("Delete a key")
    .action(async (key: string) => {
      try {
        const deleted = await storage.delete(key);
        logger.success(deleted ? `Deleted: ${key}` : `Key not found: ${key}`);
      } catch (error: any) {
        logger.error(`Failed to delete: ${error.message}`);
      }
    });

  storageCmd
    .command("query <sql>")
    .description("Execute SQL query")
    .action(async (sql: string) => {
      try {
        const result = await storage.query(sql);
        console.table(result.rows);
        logger.info(`${result.rowCount} rows returned`);
      } catch (error: any) {
        logger.error(`Query failed: ${error.message}`);
      }
    });

  storageCmd
    .command("keys [prefix]")
    .description("List keys")
    .action(async (prefix?: string) => {
      try {
        const keys = await storage.listKeys(prefix);
        keys.forEach(k => console.log(k));
        logger.info(`${keys.length} keys found`);
      } catch (error: any) {
        logger.error(`Failed to list keys: ${error.message}`);
      }
    });

  storageCmd
    .command("backup <path>")
    .option("--format <format>", "Backup format (sql, json, csv)", "json")
    .description("Backup storage")
    .action(async (path: string, options: any) => {
      try {
        await storage.backup(path, { format: options.format });
        logger.success(`Backup saved to: ${path}`);
      } catch (error: any) {
        logger.error(`Backup failed: ${error.message}`);
      }
    });

  storageCmd
    .command("restore <path>")
    .description("Restore from backup")
    .action(async (path: string) => {
      try {
        await storage.restore(path);
        logger.success(`Restored from: ${path}`);
      } catch (error: any) {
        logger.error(`Restore failed: ${error.message}`);
      }
    });
}
