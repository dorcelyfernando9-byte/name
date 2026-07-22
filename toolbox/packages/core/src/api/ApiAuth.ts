type AuthType = "none" | "bearer" | "basic" | "oauth2" | "apikey" | "jwt";

interface AuthConfig {
  type: AuthType;
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  clientId?: string;
  clientSecret?: string;
  oauth2Token?: string;
  refreshToken?: string;
}

export class ApiAuth {
  private config: AuthConfig;

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = { type: "none", ...config };
  }

  getHeaders(): Record<string, string> {
    switch (this.config.type) {
      case "bearer":
        return { Authorization: `Bearer ${this.config.token}` };
      case "basic":
        return {
          Authorization: `Basic ${Buffer.from(
            `${this.config.username}:${this.config.password}`
          ).toString("base64")}`,
        };
      case "apikey":
        return {
          [this.config.apiKeyHeader || "X-API-Key"]: this.config.apiKey || "",
        };
      case "oauth2":
        return { Authorization: `Bearer ${this.config.oauth2Token}` };
      case "jwt":
        return { Authorization: `Bearer ${this.config.token}` };
      default:
        return {};
    }
  }

  setToken(token: string): void {
    this.config.token = token;
    this.config.type = "bearer";
  }

  setOAuth2(token: string, refreshToken?: string): void {
    this.config.oauth2Token = token;
    this.config.type = "oauth2";
    if (refreshToken) this.config.refreshToken = refreshToken;
  }

  setApiKey(key: string, header: string = "X-API-Key"): void {
    this.config.apiKey = key;
    this.config.apiKeyHeader = header;
    this.config.type = "apikey";
  }

  setBasic(username: string, password: string): void {
    this.config.username = username;
    this.config.password = password;
    this.config.type = "basic";
  }

  getType(): string {
    return this.config.type;
  }
}
