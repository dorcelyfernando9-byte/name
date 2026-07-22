import { IStorageDriver } from "../storage/IStorageDriver";
import { EventBus } from "../events/EventBus";

interface Migration {
  name: string;
  up: (storage: IStorageDriver) => Promise<void>;
  down: (storage: IStorageDriver) => Promise<void>;
}

export class MigrationManager {
  private migrations: Migration[] = [];
  private storage: IStorageDriver;

  constructor(storage: IStorageDriver) {
    this.storage = storage;
  }

  create(name: string, up: (storage: IStorageDriver) => Promise<void>, down: (storage: IStorageDriver) => Promise<void>): void {
    this.migrations.push({ name, up, down });
  }

  async run(): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const pending = this.migrations.filter(m => !applied.includes(m.name));

    for (const migration of pending) {
      try {
        EventBus.emit("migration:started", { name: migration.name });
        await migration.up(this.storage);
        await this.recordMigration(migration.name);
        EventBus.emit("migration:completed", { name: migration.name });
      } catch (error: any) {
        EventBus.emit("migration:failed", { name: migration.name, error: error.message });
        throw error;
      }
    }
  }

  async rollback(steps: number = 1): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const toRollback = applied.slice(-steps);

    for (const name of toRollback.reverse()) {
      const migration = this.migrations.find(m => m.name === name);
      if (!migration) continue;

      try {
        EventBus.emit("migration:rollingback", { name });
        await migration.down(this.storage);
        await this.removeMigration(name);
        EventBus.emit("migration:rolledback", { name });
      } catch (error: any) {
        EventBus.emit("migration:failed", { name, error: error.message });
        throw error;
      }
    }
  }

  async status(): Promise<{ applied: string[]; pending: string[] }> {
    const applied = await this.getAppliedMigrations();
    const pending = this.migrations.filter(m => !applied.includes(m.name)).map(m => m.name);
    return { applied, pending };
  }

  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const result = await this.storage.get("_migrations");
      return result || [];
    } catch {
      return [];
    }
  }

  private async recordMigration(name: string): Promise<void> {
    const applied = await this.getAppliedMigrations();
    applied.push(name);
    await this.storage.set("_migrations", applied);
  }

  private async removeMigration(name: string): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const filtered = applied.filter((m: string) => m !== name);
    await this.storage.set("_migrations", filtered);
  }
}
