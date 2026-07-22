const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const BINARY_DIR = path.join(ROOT, "bin");

function bin(name) {
  const p = path.join(ROOT, "..", "..", "node_modules", ".bin", name);
  if (fs.existsSync(p)) return p;
  return path.join(ROOT, "..", "node_modules", ".bin", name);
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

function obfuscateWithEngine(data, key) {
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");
  const keyBytes = Buffer.from(keyHash, "hex");
  let buf = Buffer.from(data, "utf8");
  const seed = parseInt(keyHash.slice(0, 8), 16);
  const perm = seededShuffle(Array.from({ length: buf.length }, (_, i) => i), seed);
  const shuffled = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    shuffled[perm[i]] = buf[i];
  }
  for (let i = 0; i < shuffled.length; i++) {
    shuffled[i] = shuffled[i] ^ keyBytes[i % keyBytes.length];
  }
  const reversed = Buffer.alloc(shuffled.length);
  for (let i = 0; i < shuffled.length; i++) {
    reversed[i] = shuffled[shuffled.length - 1 - i];
  }
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const aesKey = crypto.scryptSync(key, salt, 32);
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(reversed), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
    keyHash,
  };
}

function generateLoader(payload, integrity) {
  return `#!/usr/bin/env node
const crypto = require("crypto");

const KEY = process.env.TOOLBOX_KEY || process.env.TOOLBOX_BUILD_KEY;
if (!KEY) {
  console.error("[toolbox] TOOLBOX_KEY environment variable required");
  process.exit(1);
}

const P = ${JSON.stringify(payload)};
const INTEGRITY = "${integrity}";

(function() {
  try {
    const keyHash = crypto.createHash("sha256").update(KEY).digest("hex");
    if (keyHash !== P.keyHash) {
      console.error("[toolbox] Invalid key");
      process.exit(1);
    }
    const salt = Buffer.from(P.salt, "hex");
    const iv = Buffer.from(P.iv, "hex");
    const tag = Buffer.from(P.tag, "hex");
    const encrypted = Buffer.from(P.data, "hex");
    const aesKey = crypto.scryptSync(KEY, salt, 32);
    const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
    decipher.setAuthTag(tag);
    const reversed = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const buf = Buffer.alloc(reversed.length);
    for (let i = 0; i < reversed.length; i++) {
      buf[i] = reversed[reversed.length - 1 - i];
    }
    const keyBytes = Buffer.from(keyHash, "hex");
    for (let i = 0; i < buf.length; i++) {
      buf[i] = buf[i] ^ keyBytes[i % keyBytes.length];
    }
    const seed = parseInt(keyHash.slice(0, 8), 16);
    const perm = (function(arr, s) {
      const c = [...arr]; let r = s;
      for (let i = c.length - 1; i > 0; i--) {
        r = (r * 1103515245 + 12345) & 0x7fffffff;
        const j = r % (i + 1);
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    })(Array.from({ length: buf.length }, (_, i) => i), seed);
    const unshuffled = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
      unshuffled[i] = buf[perm[i]];
    }
    const source = unshuffled.toString("utf8");
    const integrity = crypto.createHash("sha256").update(source).digest("hex");
    if (integrity !== INTEGRITY) {
      console.error("[toolbox] Integrity check failed - corrupted package or invalid key");
      process.exit(1);
    }
    const fn = new Function("require", "module", "exports", "__dirname", "__filename", source);
    fn(require, module, exports, __dirname, __filename);
  } catch (err) {
    console.error("[toolbox] Failed to load:", err.message);
    process.exit(1);
  }
})();
`;
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

  console.log(`[compile] Bundling CLI + Core...`);
  fs.mkdirSync(BINARY_DIR, { recursive: true });
  const bundlePath = path.join(BINARY_DIR, "toolbox-bundle.js");

  execSync(
    `"${bin("esbuild")}" ${cliEntry} --bundle --platform=node --target=node18 ` +
    `--outfile=${bundlePath} --external:better-sqlite3 --allow-overwrite`,
    { stdio: "inherit", timeout: 120000 }
  );

  const sourceCode = fs.readFileSync(bundlePath, "utf8");
  const KEY = process.env.TOOLBOX_BUILD_KEY || process.env.TOOLBOX_KEY || crypto.randomBytes(32).toString("hex");
  const integrity = crypto.createHash("sha256").update(sourceCode).digest("hex");

  console.log(`[compile] Protecting ${sourceCode.length} bytes with ObfuscatorEngine + CryptoEngineAdvanced...`);
  const payload = obfuscateWithEngine(sourceCode, KEY);
  const loader = generateLoader(payload, integrity);

  const outfile = path.join(BINARY_DIR, "toolbox");
  fs.writeFileSync(outfile, loader, "utf8");
  fs.chmodSync(outfile, 0o755);
  fs.unlinkSync(bundlePath);

  const size = fs.statSync(outfile).size;
  console.log(`[compile] ✅ Protected binary: ${outfile} (${(size / 1024).toFixed(0)} KB)`);
  console.log(`[compile] 🔐 TOOLBOX_KEY="${KEY}"`);
  console.log(`[compile] Uso: TOOLBOX_KEY="..." ./bin/toolbox gh search typescript`);
}

compileBinary().catch(err => {
  console.error("[compile] Failed:", err.message);
  process.exit(1);
});
