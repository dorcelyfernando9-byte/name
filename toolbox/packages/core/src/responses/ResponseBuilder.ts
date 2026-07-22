import { Color } from "../colors/ColorSystem";

interface ResponseOptions {
  status?: number;
  success?: boolean;
  message?: string;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

interface EmbedOptions {
  title?: string;
  description?: string;
  color?: number | string | Color;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string;
  timestamp?: boolean | Date;
  thumbnail?: string;
  image?: string;
  author?: { name: string; icon_url?: string };
  url?: string;
}

export class ResponseBuilder {
  static success(data?: any, message?: string): ResponseOptions {
    return {
      status: 200,
      success: true,
      message: message || "Operation successful",
      data,
    };
  }

  static created(data?: any, message?: string): ResponseOptions {
    return {
      status: 201,
      success: true,
      message: message || "Resource created",
      data,
    };
  }

  static error(message?: string, status?: number, data?: any): ResponseOptions {
    return {
      status: status || 400,
      success: false,
      message: message || "An error occurred",
      error: message,
      data,
    };
  }

  static notFound(message?: string): ResponseOptions {
    return {
      status: 404,
      success: false,
      message: message || "Resource not found",
      error: message || "Resource not found",
    };
  }

  static unauthorized(message?: string): ResponseOptions {
    return {
      status: 401,
      success: false,
      message: message || "Unauthorized",
      error: message || "Unauthorized",
    };
  }

  static forbidden(message?: string): ResponseOptions {
    return {
      status: 403,
      success: false,
      message: message || "Forbidden",
      error: message || "Forbidden",
    };
  }

  static validation(errors: string[]): ResponseOptions {
    return {
      status: 422,
      success: false,
      message: "Validation failed",
      error: "Validation failed",
      data: { errors },
    };
  }

  static paginated(data: any[], total: number, page: number, limit: number): ResponseOptions {
    return {
      status: 200,
      success: true,
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  static embed(options: EmbedOptions): any {
    const embed: any = { type: "rich" };
    if (options.title) embed.title = options.title;
    if (options.description) embed.description = options.description;
    if (options.url) embed.url = options.url;
    if (options.timestamp) {
      embed.timestamp = options.timestamp instanceof Date
        ? options.timestamp.toISOString()
        : new Date().toISOString();
    }
    if (options.thumbnail) embed.thumbnail = { url: options.thumbnail };
    if (options.image) embed.image = { url: options.image };
    if (options.author) embed.author = options.author;

    if (options.color) {
      if (options.color instanceof Color) {
        embed.color = options.color.toDiscord();
      } else if (typeof options.color === "string") {
        embed.color = Color.fromHex(options.color).toDiscord();
      } else {
        embed.color = options.color;
      }
    }

    if (options.fields) {
      embed.fields = options.fields.map(f => ({
        name: f.name,
        value: f.value,
        inline: f.inline || false,
      }));
    }

    if (options.footer) {
      embed.footer = typeof options.footer === "string"
        ? { text: options.footer }
        : options.footer;
    }

    return embed;
  }

  static discordMessage(content: string, embeds?: any[]): any {
    return { content, embeds, allowed_mentions: { parse: [] } };
  }
}
