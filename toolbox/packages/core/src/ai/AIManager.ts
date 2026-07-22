interface AIModelConfig {
  model: string;
  apiKey?: string;
  endpoint?: string;
}

interface AIProvider {
  generate(prompt: string, config: AIModelConfig): Promise<string>;
  complete(text: string, config: AIModelConfig): Promise<string>;
  embed(text: string, config: AIModelConfig): Promise<number[]>;
}

class OpenAIProvider implements AIProvider {
  async generate(prompt: string, config: AIModelConfig): Promise<string> {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(config.endpoint || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async complete(text: string, config: AIModelConfig): Promise<string> {
    return this.generate(text, config);
  }

  async embed(text: string, config: AIModelConfig): Promise<number[]> {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(config.endpoint || "https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text,
      }),
    });
    const data: any = await response.json();
    return data.data?.[0]?.embedding || [];
  }
}

export class AIManager {
  private currentModel: AIModelConfig = { model: "gpt-3.5-turbo" };
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: AIProvider;

  constructor() {
    const openai = new OpenAIProvider();
    this.providers.set("openai", openai);
    this.currentProvider = openai;
  }

  useModel(model: string): void {
    this.currentModel.model = model;
  }

  setProvider(name: string): void {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`Unknown AI provider: ${name}`);
    this.currentProvider = provider;
  }

  setApiKey(key: string): void {
    this.currentModel.apiKey = key;
  }

  registerProvider(name: string, provider: AIProvider): void {
    this.providers.set(name, provider);
  }

  async generate(prompt: string): Promise<string> {
    return this.currentProvider.generate(prompt, this.currentModel);
  }

  async complete(text: string): Promise<string> {
    return this.currentProvider.complete(text, this.currentModel);
  }

  async embed(text: string): Promise<number[]> {
    return this.currentProvider.embed(text, this.currentModel);
  }

  async ask(prompt: string): Promise<string> {
    return this.generate(prompt);
  }
}

export const aiManager = new AIManager();
