import fetch, { Headers, RequestInit, Response } from "node-fetch";
import { ApiAuth } from "./ApiAuth";
import { ApiCache } from "./ApiCache";
import { ApiRateLimit } from "./ApiRateLimit";

export interface ApiClientOptions {
  baseUrl: string;
  auth?: ApiAuth;
  headers?: Record<string, string>;
  timeout?: number;
  cache?: ApiCache;
  rateLimit?: ApiRateLimit;
}

export interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  ok: boolean;
}

export class ApiClient {
  private options: ApiClientOptions;
  private middlewares: Array<(config: RequestInit) => RequestInit> = [];

  constructor(options: ApiClientOptions) {
    this.options = {
      timeout: 30000,
      ...options,
    };
  }

  async get<T = any>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, { params });
  }

  async post<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, { body: data });
  }

  async put<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, { body: data });
  }

  async patch<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, { body: data });
  }

  async delete<T = any>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path);
  }

  async request<T>(method: string, path: string, opts: { params?: Record<string, string>; body?: any } = {}): Promise<ApiResponse<T>> {
    const url = new URL(path, this.options.baseUrl);

    if (opts.params) {
      Object.entries(opts.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const cacheKey = this.options.cache ? `${method}:${url.toString()}` : undefined;
    if (cacheKey && this.options.cache) {
      const cached = this.options.cache.get(cacheKey);
      if (cached) return cached;
    }

    if (this.options.rateLimit) {
      await this.options.rateLimit.wait();
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      ...this.options.headers,
      ...this.options.auth?.getHeaders(),
    });

    const requestConfig: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.options.timeout!),
    };

    if (opts.body && method !== "GET") {
      requestConfig.body = JSON.stringify(opts.body);
    }

    const finalConfig = this.middlewares.reduce((cfg, mw) => mw(cfg), requestConfig);

    try {
      const response: Response = await fetch(url.toString(), finalConfig);
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: T;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json() as T;
      } else {
        data = await response.text() as unknown as T;
      }

      const result: ApiResponse<T> = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        ok: response.ok,
      };

      if (cacheKey && this.options.cache && response.ok) {
        this.options.cache.set(cacheKey, result);
      }

      return result;
    } catch (error: any) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  use(middleware: (config: RequestInit) => RequestInit): void {
    this.middlewares.push(middleware);
  }

  setAuth(auth: ApiAuth): void {
    this.options.auth = auth;
  }

  getBaseUrl(): string {
    return this.options.baseUrl;
  }
}
