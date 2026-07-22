import { EventBus } from "../events/EventBus";

interface DiscordCommandConfig {
  name: string;
  description: string;
  options?: DiscordCommandOption[];
  permissions?: string[];
  handler: (ctx: DiscordCommandContext) => void | Promise<void>;
}

interface DiscordCommandOption {
  name: string;
  type: "string" | "integer" | "boolean" | "user" | "channel" | "role";
  description: string;
  required?: boolean;
}

interface DiscordCommandContext {
  command: string;
  options: Record<string, any>;
  author: any;
  channel: any;
  guild: any;
  reply: (content: any) => Promise<void>;
  defer: () => Promise<void>;
}

interface DiscordEventConfig {
  event: string;
  handler: (data: any) => void | Promise<void>;
}

interface SlashCommandConfig {
  name: string;
  description: string;
  options?: DiscordCommandOption[];
  permissions?: string[];
  handler: (ctx: DiscordCommandContext) => void | Promise<void>;
}

interface DiscordEmbedConfig {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string | { text: string; iconURL?: string };
  timestamp?: Date | number;
  image?: string;
  thumbnail?: string;
  author?: { name: string; iconURL?: string; url?: string };
  url?: string;
}

export class DiscordBotBuilder {
  private commands: DiscordCommandConfig[] = [];
  private slashCommands: SlashCommandConfig[] = [];
  private events: DiscordEventConfig[] = [];

  command(config: DiscordCommandConfig): void {
    this.commands.push(config);
    EventBus.on(`discord:command:${config.name}`, async (ctx) => {
      await config.handler(ctx);
    });
  }

  on(event: string, handler: (data: any) => void | Promise<void>): void {
    this.events.push({ event, handler });
    EventBus.on(`discord:${event}`, handler);
  }

  slash(config: SlashCommandConfig): void {
    this.slashCommands.push(config);
    EventBus.on(`discord:slash:${config.name}`, async (ctx) => {
      await config.handler(ctx);
    });
  }

  embed(config: DiscordEmbedConfig): any {
    const embed: any = {
      type: "rich",
    };

    if (config.title) embed.title = config.title;
    if (config.description) embed.description = config.description;
    if (config.color) embed.color = config.color;
    if (config.url) embed.url = config.url;
    if (config.timestamp) embed.timestamp = config.timestamp instanceof Date ? config.timestamp.toISOString() : config.timestamp;
    if (config.image) embed.image = { url: config.image };
    if (config.thumbnail) embed.thumbnail = { url: config.thumbnail };

    if (config.fields) {
      embed.fields = config.fields.map(f => ({
        name: f.name,
        value: f.value,
        inline: f.inline || false,
      }));
    }

    if (config.footer) {
      embed.footer = typeof config.footer === "string"
        ? { text: config.footer }
        : config.footer;
    }

    if (config.author) {
      embed.author = config.author;
    }

    return embed;
  }

  getCommands(): DiscordCommandConfig[] {
    return this.commands;
  }

  getSlashCommands(): SlashCommandConfig[] {
    return this.slashCommands;
  }

  getEvents(): DiscordEventConfig[] {
    return this.events;
  }

  generateSlashCommandsJSON(): any[] {
    return this.slashCommands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options?.map(opt => ({
        name: opt.name,
        description: opt.description,
        type: this.getOptionType(opt.type),
        required: opt.required || false,
      })) || [],
      default_member_permissions: cmd.permissions?.join(",") || undefined,
    }));
  }

  private getOptionType(type: string): number {
    const types: Record<string, number> = {
      string: 3,
      integer: 4,
      boolean: 5,
      user: 6,
      channel: 7,
      role: 8,
    };
    return types[type] || 3;
  }
}
