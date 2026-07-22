import { logger } from "@toolbox/core";

const GITHUB_API = "https://api.github.com";

interface SearchOptions {
  query: string;
  type: "repositories" | "issues" | "users" | "code";
  max: number;
  sort?: string;
  order?: "asc" | "desc";
  token?: string;
}

interface GitHubItem {
  full_name?: string;
  name?: string;
  login?: string;
  html_url: string;
  description?: string;
  stargazers_count?: number;
  language?: string;
  updated_at?: string;
  score?: number;
  owner?: { login: string; avatar_url: string };
}

export function registerGhCommand(program: any): void {
  const ghCmd = program.command("gh").description("GitHub Searcher - busca hasta 70 resultados");

  ghCmd
    .command("search <query>")
    .option("-t, --type <type>", "Tipo: repositories, issues, users, code", "repositories")
    .option("-m, --max <n>", "Máximo de resultados (max 70)", "70")
    .option("--sort <field>", "Ordenar por: stars, forks, updated, etc.")
    .option("--token <token>", "GitHub token (opcional, más rate limit)")
    .description("Buscar en GitHub")
    .action(async (query: string, options: any) => {
      const max = Math.min(parseInt(options.max) || 70, 70);
      const type = options.type || "repositories";

      logger.info(`🔍 Buscando "${query}" en ${type} (max ${max})...`);

      try {
        const results = await searchGitHub({
          query,
          type,
          max,
          sort: options.sort,
          token: options.token,
        });

        if (results.length === 0) {
          logger.warn("Sin resultados");
          return;
        }

        logger.success(`Encontrados ${results.length} resultados:\n`);

        results.forEach((item, i) => {
          const n = (i + 1).toString().padStart(2, " ");
          if (type === "repositories") {
            const stars = item.stargazers_count ? `⭐ ${item.stargazers_count}` : "";
            const lang = item.language ? `[${item.language}]` : "";
            console.log(`${n}. ${item.full_name} ${stars} ${lang}`);
            if (item.description) console.log(`   ${item.description.slice(0, 100)}`);
            console.log(`   ${item.html_url}\n`);
          } else if (type === "users") {
            console.log(`${n}. ${item.login} — ${item.html_url}\n`);
          } else if (type === "issues") {
            console.log(`${n}. ${item.full_name || item.html_url}`);
            if (item.description) console.log(`   ${item.description.slice(0, 100)}`);
            console.log(`   ${item.html_url}\n`);
          } else {
            console.log(`${n}. ${item.html_url}\n`);
          }
        });
      } catch (error: any) {
        logger.error(`Error: ${error.message}`);
      }
    });

  ghCmd
    .command("repo <owner/repo>")
    .description("Mostrar info de un repositorio")
    .action(async (repo: string) => {
      try {
        const res = await fetch(`${GITHUB_API}/repos/${repo}`, {
          headers: { "User-Agent": "toolbox-cli", Accept: "application/vnd.github.v3+json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: any = await res.json();
        console.log(`\n📦 ${data.full_name}`);
        console.log(`   ${data.description || ""}`);
        console.log(`   ⭐ ${data.stargazers_count}  🍴 ${data.forks_count}  ⚠ ${data.open_issues_count}`);
        console.log(`   ${data.language || "N/A"}  |  ${data.license?.spdx_id || "Sin licencia"}`);
        console.log(`   ${data.html_url}\n`);
      } catch (error: any) {
        logger.error(`Error: ${error.message}`);
      }
    });
}

async function searchGitHub(opts: SearchOptions): Promise<GitHubItem[]> {
  const results: GitHubItem[] = [];
  const perPage = Math.min(opts.max, 100);
  const pages = Math.ceil(opts.max / perPage);

  const headers: Record<string, string> = {
    "User-Agent": "toolbox-cli",
    Accept: "application/vnd.github.v3+json",
  };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  for (let page = 1; page <= pages && results.length < opts.max; page++) {
    const params = new URLSearchParams({
      q: opts.query,
      per_page: String(perPage),
      page: String(page),
    });
    if (opts.sort) params.set("sort", opts.sort);
    if (opts.order) params.set("order", opts.order);

    const url = `${GITHUB_API}/search/${opts.type}?${params}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const retryAfter = res.headers.get("Retry-After");
      if (res.status === 403 && retryAfter) {
        logger.warn(`Rate limit, esperando ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, parseInt(retryAfter) * 1000));
        continue;
      }
      throw new Error(`GitHub API error: HTTP ${res.status} — ${res.statusText}`);
    }

    const body: any = await res.json();
    const items: GitHubItem[] = body.items || [];

    for (const item of items) {
      if (results.length >= opts.max) break;
      results.push(item);
    }

    if (items.length < perPage) break;

    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (remaining === "0") {
      const reset = parseInt(res.headers.get("X-RateLimit-Reset") || "0");
      const wait = Math.max(reset - Math.floor(Date.now() / 1000), 0);
      if (results.length < opts.max) {
        logger.warn(`Rate limit agotado, esperando ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
      }
    }
  }

  return results.slice(0, opts.max);
}
