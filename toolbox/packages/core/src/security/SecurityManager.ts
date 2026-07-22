import { logger } from "../logging/Logger";

export interface SecurityRule {
  name: string;
  check: () => boolean | Promise<boolean>;
  onFail?: "warn" | "error" | "exit";
  message: string;
}

export class SecurityManager {
  private rules: SecurityRule[] = [];
  private failed: string[] = [];

  addRule(rule: SecurityRule): void {
    this.rules.push(rule);
  }

  async runChecks(): Promise<boolean> {
    this.failed = [];
    for (const rule of this.rules) {
      try {
        const passed = await rule.check();
        if (!passed) {
          this.failed.push(rule.name);
          const msg = `[SECURITY] ${rule.message}`;
          switch (rule.onFail || "warn") {
            case "exit":
              logger.error(msg);
              process.exit(1);
            case "error":
              logger.error(msg);
              break;
            default:
              logger.warn(msg);
          }
        }
      } catch (err: any) {
        this.failed.push(rule.name);
        logger.error(`[SECURITY] ${rule.name}: ${err.message}`);
      }
    }
    return this.failed.length === 0;
  }

  getFailed(): string[] {
    return [...this.failed];
  }
}

export const security = new SecurityManager();

security.addRule({
  name: "node-version",
  check: () => {
    const major = parseInt(process.version.slice(1).split(".")[0]);
    return major >= 18;
  },
  onFail: "warn",
  message: "Node.js >= 18 requerido",
});

security.addRule({
  name: "no-env-leak",
  check: () => {
    const sensitive = ["TOOLBOX_KEY", "TOOLBOX_BUILD_KEY", "GH_TOKEN", "GITHUB_TOKEN"];
    const exposed = sensitive.filter(k => process.env[k] && process.argv.join(" ").includes(process.env[k]!));
    return exposed.length === 0;
  },
  onFail: "error",
  message: "Variables de entorno sensibles expuestas en argv",
});

security.addRule({
  name: "no-root",
  check: () => process.getuid?.() !== 0,
  onFail: "warn",
  message: "Ejecutando como root — no recomendado",
});
