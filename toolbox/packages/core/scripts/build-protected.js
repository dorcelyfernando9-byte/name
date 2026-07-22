const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PROTECTED_DIR = path.join(ROOT, "protected");
const KEY = process.env.TOOLBOX_BUILD_KEY || process.env.TOOLBOX_KEY || "toolbox-default-key";

function bin(name) {
  const p = path.join(ROOT, "..", "..", "node_modules", ".bin", name);
  if (fs.existsSync(p)) return p;
  return path.join(ROOT, "..", "node_modules", ".bin", name);
}

async function buildProtected() {
  console.log(`[build:protected] Building @toolbox/core...`);
  execSync(`"${bin("tsc")}"`, { cwd: ROOT, stdio: "inherit", timeout: 120000 });

  const entryPoint = path.join(DIST, "index.js");
  if (!fs.existsSync(entryPoint)) {
    throw new Error(`Build output not found at ${entryPoint}. Run 'npm run build:core' first.`);
  }

  console.log(`[build:protected] Bundling with esbuild...`);
  const bundlePath = path.join(DIST, "bundle.js");
  execSync(
    `"${bin("esbuild")}" ${entryPoint} --bundle --platform=node --target=node18 --outfile=${bundlePath} ` +
    `--external:better-sqlite3 --external:./node_modules/* --external:../node_modules/* --allow-overwrite`,
    { cwd: ROOT, stdio: "inherit", timeout: 120000 }
  );

  const sourceCode = fs.readFileSync(bundlePath, "utf8");
  console.log(`[build:protected] Source size: ${sourceCode.length} bytes`);

  const salt = crypto.randomBytes(16).toString("hex");
  const fullKey = crypto.createHash("sha256").update(KEY + salt).digest("hex");
  const obfuscated = obfuscate(sourceCode, fullKey);
  const integrity = crypto.createHash("sha256").update(sourceCode).digest("hex");

  fs.mkdirSync(PROTECTED_DIR, { recursive: true });
  const pkgPath = path.join(PROTECTED_DIR, "toolbox-core.pkg");
  const meta = { salt, integrity, level: "extreme", encoding: "hex" };
  const pkgData = JSON.stringify(meta) + "\n" + obfuscated;
  fs.writeFileSync(pkgPath, pkgData, "utf8");
  console.log(`[build:protected] Package written: ${pkgPath} (${pkgData.length} bytes)`);

  const loaderPath = path.join(PROTECTED_DIR, "index.js");
  fs.writeFileSync(loaderPath, generateLoader(meta), "utf8");
  console.log(`[build:protected] Loader written: ${loaderPath}`);

  const packageJson = path.join(PROTECTED_DIR, "package.json");
  fs.writeFileSync(packageJson, JSON.stringify({
    name: "@toolbox/core-protected",
    version: "1.0.0",
    description: "Protected build of @toolbox/core",
    main: "index.js",
    type: "commonjs",
    license: "MIT"
  }, null, 2));
  console.log(`[build:protected] Done!`);
  console.log(`[build:protected] Use: TOOLBOX_KEY="${KEY}" node protected/index.js`);
}

function seededShuffle(arr, seed) {
  const copy = [...arr];
  let rng = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    const j = rng % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function obfuscate(data, key) {
  let buf = Buffer.from(data, "utf8");
  const seed = parseInt(key.slice(0, 8), 16);
  const perm = seededShuffle(Array.from({ length: buf.length }, (_, i) => i), seed);
  const shuffled = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    shuffled[perm[i]] = buf[i];
  }
  const keyBytes = Buffer.from(key, "hex");
  for (let i = 0; i < shuffled.length; i++) {
    shuffled[i] = shuffled[i] ^ keyBytes[i % keyBytes.length];
  }
  const reversed = Buffer.alloc(shuffled.length);
  for (let i = 0; i < shuffled.length; i++) {
    reversed[i] = shuffled[shuffled.length - 1 - i];
  }
  return reversed.toString("hex");
}

function deobfuscate(hexData, key) {
  let buf = Buffer.from(hexData, "hex");
  const reversed = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    reversed[i] = buf[buf.length - 1 - i];
  }
  const keyBytes = Buffer.from(key, "hex");
  for (let i = 0; i < reversed.length; i++) {
    reversed[i] = reversed[i] ^ keyBytes[i % keyBytes.length];
  }
  const seed = parseInt(key.slice(0, 8), 16);
  const perm = seededShuffle(Array.from({ length: reversed.length }, (_, i) => i), seed);
  const unshuffled = Buffer.alloc(reversed.length);
  for (let i = 0; i < reversed.length; i++) {
    unshuffled[i] = reversed[perm[i]];
  }
  return unshuffled.toString("utf8");
}

function generateLoader(meta) {
  return `#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const KEY = process.env.TOOLBOX_KEY;
if (!KEY) {
  console.error("[toolbox-core] ERROR: TOOLBOX_KEY environment variable is required");
  process.exit(1);
}

const pkgPath = path.join(__dirname, "toolbox-core.pkg");
const pkgContent = fs.readFileSync(pkgPath, "utf8");
const newlineIdx = pkgContent.indexOf("\\n");
const meta = JSON.parse(pkgContent.slice(0, newlineIdx));
const obfuscated = pkgContent.slice(newlineIdx + 1);

function seededShuffle(arr, seed) {
  const copy = [...arr];
  let rng = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    const j = rng % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function deobfuscate(hexData, key) {
  const keyHash = crypto.createHash("sha256").update(key + meta.salt).digest("hex");
  let buf = Buffer.from(hexData, "hex");
  const reversed = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    reversed[i] = buf[buf.length - 1 - i];
  }
  const keyBytes = Buffer.from(keyHash, "hex");
  for (let i = 0; i < reversed.length; i++) {
    reversed[i] = reversed[i] ^ keyBytes[i % keyBytes.length];
  }
  const seed = parseInt(keyHash.slice(0, 8), 16);
  const perm = seededShuffle(Array.from({ length: reversed.length }, (_, i) => i), seed);
  const unshuffled = Buffer.alloc(reversed.length);
  for (let i = 0; i < reversed.length; i++) {
    unshuffled[i] = reversed[perm[i]];
  }
  const decoded = unshuffled.toString("utf8");
  const integrity = crypto.createHash("sha256").update(decoded).digest("hex");
  if (integrity !== meta.integrity) {
    console.error("[toolbox-core] ERROR: Integrity check failed - invalid key or corrupted package");
    process.exit(1);
  }
  return decoded;
}

try {
  const source = deobfuscate(obfuscated, KEY);
  const fn = new Function("require", "module", "exports", "__dirname", "__filename", source);
  fn(require, module, exports, __dirname, __filename);
} catch (err) {
  console.error("[toolbox-core] Failed to load protected package:", err.message);
  process.exit(1);
}
`;
}

buildProtected().catch(err => {
  console.error("[build:protected] Failed:", err);
  process.exit(1);
});
