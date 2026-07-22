import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse as parseUrl } from "url";
import { EventBus } from "../events/EventBus";
import { ApiAuth } from "./ApiAuth";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

interface RouteHandler {
  (req: ApiRequest): ApiResponseType | Promise<ApiResponseType>;
}

interface ApiRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: any;
  raw: IncomingMessage;
}

interface ApiResponseType {
  status?: number;
  headers?: Record<string, string>;
  body?: any;
}

interface Route {
  method: HttpMethod;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
  middlewares: RouteHandler[];
}

interface ServerOptions {
  port: number;
  host?: string;
  cors?: boolean;
  auth?: ApiAuth;
}

export class ApiServer {
  private routes: Route[] = [];
  private globalMiddlewares: RouteHandler[] = [];
  private server: ReturnType<typeof createServer> | null = null;
  private options: ServerOptions;

  constructor(options: Partial<ServerOptions> = {}) {
    this.options = {
      port: 3000,
      host: "0.0.0.0",
      cors: true,
      ...options,
    };
  }

  before(middleware: RouteHandler): void {
    this.globalMiddlewares.push(middleware);
  }

  after(middleware: RouteHandler): void {
    this.globalMiddlewares.push(middleware);
  }

  endpoint(method: HttpMethod, path: string, handler: RouteHandler): void {
    const paramNames: string[] = [];
    const pattern = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return "([^/]+)";
    });
    const regex = new RegExp(`^${pattern}$`);

    this.routes.push({ method, pattern: regex, paramNames, handler, middlewares: [] });
  }

  get(path: string, handler: RouteHandler): void {
    this.endpoint("GET", path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.endpoint("POST", path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.endpoint("PUT", path, handler);
  }

  patch(path: string, handler: RouteHandler): void {
    this.endpoint("PATCH", path, handler);
  }

  delete(path: string, handler: RouteHandler): void {
    this.endpoint("DELETE", path, handler);
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer(async (req, res) => {
        try {
          await this.handleRequest(req, res);
        } catch (error: any) {
          this.sendResponse(res, 500, { error: error.message });
        }
      });

      this.server.listen(this.options.port, this.options.host, () => {
        EventBus.emit("api:server:started", {
          port: this.options.port,
          host: this.options.host,
        });
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          EventBus.emit("api:server:stopped", {});
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (this.options.cors) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
    }

    const parsedUrl = parseUrl(req.url || "/", true);
    const path = parsedUrl.pathname || "/";

    const route = this.findRoute(req.method as HttpMethod, path);
    if (!route) {
      this.sendResponse(res, 404, { error: "Route not found" });
      return;
    }

    const body = await this.parseBody(req);

    const apiReq: ApiRequest = {
      method: req.method || "GET",
      path,
      params: this.extractParams(route, path),
      query: parsedUrl.query as Record<string, string>,
      headers: req.headers as Record<string, string>,
      body,
      raw: req,
    };

    for (const mw of this.globalMiddlewares) {
      const result = await mw(apiReq);
      if (result?.body !== undefined) {
        this.sendResponse(res, result.status || 200, result.body);
        return;
      }
    }

    for (const mw of route.middlewares) {
      const result = await mw(apiReq);
      if (result?.body !== undefined) {
        this.sendResponse(res, result.status || 200, result.body);
        return;
      }
    }

    const result = await route.handler(apiReq);
    this.sendResponse(res, result.status || 200, result.body);
  }

  private findRoute(method: HttpMethod, path: string): Route | undefined {
    return this.routes.find(
      (r) => r.method === method && r.pattern.test(path)
    );
  }

  private extractParams(route: Route, path: string): Record<string, string> {
    const match = path.match(route.pattern);
    const params: Record<string, string> = {};
    if (match) {
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
    }
    return params;
  }

  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        if (!body) {
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
  }

  private sendResponse(res: ServerResponse, status: number, body: any): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  }
}
