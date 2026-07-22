const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const BINARY_DIR = path.join(ROOT, "bin");

function bin(name) {
  const p = path.join(ROOT, "..", "..", "node_modules", ".bin", name);
  if (fs.existsSync(p)) return p;
  return path.join(ROOT, "..", "node_modules", ".bin", name);
}

async function compileBinary() {
  console.log(`[compile] Building @toolbox/core...`);
  execSync(`"${bin("tsc")}" -p ${path.join(ROOT, "tsconfig.json")}`, { stdio: "inherit", timeout: 60000 });

  console.log(`[compile] Building @toolbox/cli...`);
  execSync(`"${bin("tsc")}" -p ${path.join(ROOT, "..", "cli", "tsconfig.json")}`, { stdio: "inherit", timeout: 60000 });

  const cliEntry = path.join(ROOT, "..", "cli", "dist", "index.js");
  if (!fs.existsSync(cliEntry)) {
    throw new Error(`CLI entry not found at ${cliEntry}`);
  }

  console.log(`[compile] Bundling CLI + Core into single executable...`);
  fs.mkdirSync(BINARY_DIR, { recursive: true });

  const outfile = path.join(BINARY_DIR, "toolbox");
  execSync(
    `"${bin("esbuild")}" ${cliEntry} --bundle --platform=node --target=node18 ` +
    `--outfile=${outfile} ` +
    `--external:better-sqlite3 --allow-overwrite ` +
    `--banner:js="#!/usr/bin/env node"`,
    { stdio: "inherit", timeout: 120000 }
  );

  fs.chmodSync(outfile, 0o755);
  const size = fs.statSync(outfile).size;
  console.log(`[compile] ✅ Standalone binary: ${outfile} (${(size / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`[compile] Uso: ./bin/toolbox gh search typescript`);
}

compileBinary().catch(err => {
  console.error("[compile] Failed:", err.message);
  process.exit(1);
});
