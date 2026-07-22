import { readFileSync } from "fs";
import { SyntaxParser, logger } from "@toolbox/core";

export function registerRunCommand(program: any): void {
  program
    .command("run <file>")
    .description("Run a .tlbx script")
    .action((file: string) => {
      try {
        const code = readFileSync(file, "utf-8");
        const parser = new SyntaxParser();
        const ast = parser.parse(code);
        logger.success(`Parsed ${file}: ${ast.length} statements`);
        console.log(JSON.stringify(ast, null, 2));
      } catch (error: any) {
        logger.error(`Failed to run ${file}: ${error.message}`);
      }
    });
}
