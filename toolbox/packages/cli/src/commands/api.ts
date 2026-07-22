import { ApiClient, ApiAuth, ApiCache, ApiServer, logger } from "@toolbox/core";

export function registerApiCommands(program: any): void {
  const apiCmd = program.command("api").description("API management");

  apiCmd
    .command("get <url>")
    .option("--auth <type>", "Auth type (bearer, basic, apikey)")
    .option("--token <token>", "Auth token")
    .option("--header <headers>", "Additional headers (JSON)")
    .description("GET request")
    .action(async (url: string, options: any) => {
      try {
        const auth = createAuth(options);
        const client = new ApiClient({ baseUrl: url, auth });
        const response = await client.get("");
        console.log(JSON.stringify(response, null, 2));
      } catch (error: any) {
        logger.error(`GET failed: ${error.message}`);
      }
    });

  apiCmd
    .command("post <url> [data]")
    .option("--auth <type>", "Auth type")
    .option("--token <token>", "Auth token")
    .description("POST request")
    .action(async (url: string, data: string, options: any) => {
      try {
        const auth = createAuth(options);
        const client = new ApiClient({ baseUrl: url, auth });
        const payload = data ? JSON.parse(data) : {};
        const response = await client.post("", payload);
        console.log(JSON.stringify(response, null, 2));
      } catch (error: any) {
        logger.error(`POST failed: ${error.message}`);
      }
    });

  apiCmd
    .command("connect <url>")
    .option("--auth <type>", "Auth type")
    .option("--token <token>", "Auth token")
    .description("Connect to an API")
    .action(async (url: string, options: any) => {
      try {
        const auth = createAuth(options);
        const client = new ApiClient({ baseUrl: url, auth });
        const response = await client.get("");
        logger.success(`Connected to ${url}`);
        console.log(JSON.stringify(response, null, 2));
      } catch (error: any) {
        logger.error(`Connection failed: ${error.message}`);
      }
    });

  apiCmd
    .command("serve")
    .option("--port <port>", "Server port", "3000")
    .option("--host <host>", "Server host", "0.0.0.0")
    .description("Start API server")
    .action(async (options: any) => {
      const server = new ApiServer({
        port: parseInt(options.port),
        host: options.host,
      });

      server.get("/health", async () => ({ body: { status: "ok", timestamp: Date.now() } }));

      await server.start();
      logger.success(`API server running on http://${options.host}:${options.port}`);
    });

  apiCmd
    .command("cache clear")
    .description("Clear API cache")
    .action(() => {
      const cache = new ApiCache();
      cache.clear();
      logger.success("API cache cleared");
    });
}

function createAuth(options: any): ApiAuth | undefined {
  if (!options.auth && !options.token) return undefined;

  const auth = new ApiAuth();
  switch (options.auth) {
    case "bearer":
      auth.setToken(options.token);
      break;
    case "basic":
      const [user, pass] = options.token?.split(":") || [];
      auth.setBasic(user, pass);
      break;
    case "apikey":
      auth.setApiKey(options.token);
      break;
    default:
      if (options.token) auth.setToken(options.token);
  }
  return auth;
}
