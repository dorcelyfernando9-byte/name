import { getLanguageBridge, listAvailableLanguages, logger } from "@toolbox/core";
import type { LanguageType } from "@toolbox/core";

export function registerLanguageCommands(program: any): void {
  const langCmd = program.command("language").aliases(["lang"]).description("Language management");

  langCmd
    .command("list")
    .description("List available languages")
    .action(async () => {
      const languages = await listAvailableLanguages();
      console.log("Available languages:");
      languages.forEach((l: any) => {
        console.log(`  ${l.name} ${l.available ? "✓" : "✗ (not installed)"}`);
      });
    });

  langCmd
    .command("run <language> <file> [args...]")
    .description("Run a file in a specific language")
    .action(async (language: string, file: string, args: string[]) => {
      try {
        const bridge = getLanguageBridge(language as LanguageType);
        logger.info(`Running ${file} with ${language}...`);
        const result = await bridge.run(file, args);
        console.log(result.stdout);
        if (result.stderr) {
          logger.error(result.stderr);
        }
        logger.info(`Exit code: ${result.exitCode}`);
      } catch (error: any) {
        logger.error(`Failed to run ${file}: ${error.message}`);
      }
    });

  langCmd
    .command("repl <language>")
    .description("Start a REPL for a language")
    .action(async (language: string) => {
      try {
        const bridge = getLanguageBridge(language as LanguageType);
        logger.info(`Starting ${language} REPL...`);
        await bridge.repl();
      } catch (error: any) {
        logger.error(`REPL failed: ${error.message}`);
      }
    });

  langCmd
    .command("eval <language> <code>")
    .description("Evaluate code in a language")
    .action(async (language: string, code: string) => {
      try {
        const bridge = getLanguageBridge(language as LanguageType);
        const result = await bridge.eval(code);
        console.log(result);
      } catch (error: any) {
        logger.error(`Eval failed: ${error.message}`);
      }
    });
}
