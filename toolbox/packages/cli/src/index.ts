#!/usr/bin/env node

import { Command } from "commander";
import { ToolboxCore, createStorage, SyntaxParser, logger, getLanguageBridge, listAvailableLanguages } from "@toolbox/core";
import { registerStorageCommands } from "./commands/storage";
import { registerConfigCommands } from "./commands/config";
import { registerKeyCommands } from "./commands/key";
import { registerEventCommands } from "./commands/event";
import { registerApiCommands } from "./commands/api";
import { registerPluginCommands } from "./commands/plugin";
import { registerModCommands } from "./commands/mod";
import { registerLanguageCommands } from "./commands/language";
import { registerRunCommand } from "./commands/run";
import { registerObfuscateCommands } from "./commands/obfuscate";
import { registerCryptoCommands } from "./commands/crypto";
import { registerBuildCommands } from "./commands/build";
import { readFileSync } from "fs";

const program = new Command();
const toolbox = new ToolboxCore();

program
  .name("toolbox")
  .description("Toolbox - Motor de desarrollo todo-en-uno")
  .version("1.0.0");

// Init
program
  .command("init")
  .description("Initialize a project with Toolbox")
  .action(async () => {
    await toolbox.init();
    logger.success("Project initialized with Toolbox!");
  });

// New project scaffolding
program
  .command("new <type> <name>")
  .description("Create a new project (discord-bot, api, cli, library, web)")
  .action((type: string, name: string) => {
    const fs = require("fs");
    const path = require("path");
    const projectPath = path.join(process.cwd(), name);

    fs.mkdirSync(projectPath, { recursive: true });

    switch (type) {
      case "discord-bot": {
        fs.writeFileSync(path.join(projectPath, "index.ts"), `
import { Client, GatewayIntentBits } from "discord.js";
import { toolbox } from "toolbox";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  toolbox.logger.success("Bot is ready!");
});

client.login(process.env.DISCORD_TOKEN);
        `.trim());
        break;
      }
      case "api": {
        fs.writeFileSync(path.join(projectPath, "index.ts"), `
import { ApiServer, createStorage } from "toolbox";

const server = new ApiServer({ port: 3000 });
const storage = createStorage("nsql");

server.get("/", async () => ({ body: { message: "Hello from Toolbox API!" } }));

await storage.init();
await server.start();
        `.trim());
        break;
      }
      case "cli": {
        fs.writeFileSync(path.join(projectPath, "index.ts"), `
import { Command } from "commander";

const program = new Command();
program.name("${name}").version("1.0.0");
program.command("hello").action(() => console.log("Hello from ${name}!"));
program.parse();
        `.trim());
        break;
      }
      case "library": {
        fs.writeFileSync(path.join(projectPath, "index.ts"), `
export function hello(): string {
  return "Hello from ${name}!";
}
        `.trim());
        break;
      }
      default:
        logger.error(`Unknown project type: ${type}`);
        return;
    }

    fs.writeFileSync(path.join(projectPath, "package.json"), JSON.stringify({
      name, version: "1.0.0", main: "index.ts",
    }, null, 2));

    logger.success(`Created ${type} project: ${projectPath}`);
  });

// Install
program
  .command("install <package>")
  .description("Install a package")
  .action((pkg: string) => {
    logger.info(`Installing ${pkg}...`);
    const { execSync } = require("child_process");
    try {
      execSync(`npm install ${pkg}`, { stdio: "inherit" });
      logger.success(`Installed: ${pkg}`);
    } catch (error: any) {
      logger.error(`Failed to install: ${error.message}`);
    }
  });

// Shell / REPL
program
  .command("shell")
  .aliases(["repl"])
  .description("Start interactive REPL")
  .action(() => {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "toolbox> ",
    });

    logger.info("Toolbox REPL - Type 'exit' to quit");
    rl.prompt();

    rl.on("line", async (line: string) => {
      const trimmed = line.trim();
      if (trimmed === "exit" || trimmed === "quit") {
        rl.close();
        return;
      }
      if (trimmed === "help") {
        console.log("Available commands: exit, help, <toolbox commands>");
        rl.prompt();
        return;
      }

      try {
        const parser = new SyntaxParser();
        const ast = parser.parse(trimmed);
        console.log(JSON.stringify(ast, null, 2));
      } catch (error: any) {
        logger.error(error.message);
      }

      rl.prompt();
    });

    rl.on("close", () => {
      logger.info("Goodbye!");
      process.exit(0);
    });
  });

// Register subcommands
registerStorageCommands(program, toolbox.storage);
registerConfigCommands(program, toolbox.config);
registerKeyCommands(program);
registerEventCommands(program);
registerApiCommands(program);
registerPluginCommands(program, toolbox.plugins);
registerModCommands(program, toolbox.plugins);
registerLanguageCommands(program);
registerRunCommand(program);
registerObfuscateCommands(program);
registerCryptoCommands(program);
registerBuildCommands(program);

// Help
program
  .command("help")
  .description("Show help")
  .action(() => {
    program.help();
  });

program.parse(process.argv);
