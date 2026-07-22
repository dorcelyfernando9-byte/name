import { security, logger } from "@toolbox/core";

export function registerSecurityCommand(program: any): void {
  program
    .command("security")
    .description("Ejecutar checks de seguridad")
    .action(async () => {
      logger.info("Ejecutando checks de seguridad...");
      const ok = await security.runChecks();
      if (ok) {
        logger.success("Todos los checks pasaron");
      } else {
        logger.warn(`Fallaron: ${security.getFailed().join(", ")}`);
      }
    });
}
