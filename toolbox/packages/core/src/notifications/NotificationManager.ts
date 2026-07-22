interface DiscordWebhookOptions {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: any[];
}

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

type NotificationHandler = (options: any) => Promise<void>;

export class NotificationManager {
  private handlers: Map<string, NotificationHandler> = new Map();

  constructor() {
    this.registerHandler("log", async (options) => {
      console.log("[NOTIFICATION]", options);
    });
  }

  registerHandler(type: string, handler: NotificationHandler): void {
    this.handlers.set(type, handler);
  }

  async send(type: string, options: any): Promise<void> {
    const handler = this.handlers.get(type);
    if (!handler) throw new Error(`No handler registered for notification type: ${type}`);

    try {
      await handler(options);
    } catch (error: any) {
      throw new Error(`Failed to send ${type} notification: ${error.message}`);
    }
  }

  async discord(webhookUrl: string, options: DiscordWebhookOptions): Promise<void> {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.statusText}`);
    }
  }

  async email(options: EmailOptions): Promise<void> {
    console.log("[EMAIL]", options);
  }

  listHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const notificationManager = new NotificationManager();
