#!/usr/bin/env node
/**
 * Codex Audit — repo verifier for JS/TS/Next.js/Netlify projects
 * Usage: node scripts/codex-audit.mjs [path-to-repo]
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repo = path.resolve(process.argv[2] || process.cwd());

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function read(p) { try { return fs.readFileSync(p, "utf8"); } catch { return null; } }
function json(p) { try { return JSON.parse(read(p) || "{}"); } catch { return null; } }

function run(cmd) {
  try { return execSync(cmd, { stdio: ["ignore","pipe","ignore"] }).toString().trim(); }
  catch { return null; }
}

function log(section, message) {
  console.log(`\n=== ${section} ===\n${message}`);
}

function warn(msg) { console.log("WARN:", msg); }
function info(msg) { console.log("INFO:", msg); }
function fail(msg) { console.log("FAIL:", msg); fails.push(msg); }

let fails = [];
let warns = [];

// Basic facts
const pkgPath = path.join(repo, "package.json");
const pkg = json(pkgPath);
const netlifyToml = read(path.join(repo, "netlify.toml"));
const nvmrc = read(path.join(repo, ".nvmrc"))?.trim() || null;
const nodeVersionLocal = run("node -v");
const npmVersionLocal  = run("npm -v");
const pnpmLock = exists(path.join(repo, "pnpm-lock.yaml"));
const yarnLock = exists(path.join(repo, "yarn.lock"));
const npmLock  = exists(path.join(repo, "package-lock.json"));

const lockPM = pnpmLock ? "pnpm" : yarnLock ? "yarn" : npmLock ? "npm" : null;

// Detect Netlify node version from netlify.toml
let netlifyNode = null;
if (netlifyToml) {
  const m = netlifyToml.match(/NODE_VERSION\s*=\s*["']?([0-9A-Za-z\.\-v]+)["']?/);
  if (m) netlifyNode = m[1];
}

// Gather declared engine
const engineNode = pkg?.engines?.node || null;

// Gather Next/React versions
const nextVer = (pkg?.dependencies?.next) || (pkg?.devDependencies?.next) || null;
const reactVer = (pkg?.dependencies?.react) || (pkg?.devDependencies?.react) || null;

// Print header
log("Codex Audit", `Repo: ${repo}
Node(local): ${nodeVersionLocal || "N/A"} | npm(local): ${npmVersionLocal || "N/A"}
Package Manager (lockfile): ${lockPM || "N/A"}
Engines.node (package.json): ${engineNode || "N/A"}
.nvmrc: ${nvmrc || "N/A"}
Netlify NODE_VERSION (netlify.toml): ${netlifyNode || "N/A"}
next: ${nextVer || "N/A"} | react: ${reactVer || "N/A"}`);

// 1) Lockfile consistency
if (!lockPM) {
  warns.push("No lockfile found. Commit one of pnpm-lock.yaml, yarn.lock, or package-lock.json.");
} else {
  const conflictLocks = ["pnpm-lock.yaml","yarn.lock","package-lock.json"].filter(f => exists(path.join(repo,f)));
  if (conflictLocks.length > 1) {
    fail(`Multiple lockfiles present (${conflictLocks.join(", ")}). Keep exactly one.`);
  }
}

// 2) Node version consistency
const desiredNode = engineNode || nvmrc || netlifyNode;
if (!desiredNode) {
  warns.push("No Node version pinned (engines.node, .nvmrc, or netlify.toml). Pin one to avoid build drift.");
} else if (nodeVersionLocal && !nodeVersionLocal.includes(desiredNode.replace(/^v/,""))) {
  warns.push(`Local Node ${nodeVersionLocal} differs from desired ${desiredNode}. Use nvs/volta/nvm-windows to align.`);
}

// 3) Netlify build parity
const netlifyCli = run("netlify --version");
if (!netlifyCli) {
  warns.push("Netlify CLI not found. Install with: npm i -g netlify-cli (for local parity).");
}

// 4) Dependency sanity
if (!pkg) {
  fail("package.json not found or invalid JSON.");
} else {
  // duplicate dep between deps/devDeps
  const d = pkg.dependencies || {};
  const dd = pkg.devDependencies || {};
  for (const k of Object.keys(d)) {
    if (dd[k]) warns.push(`Package "${k}" appears in both dependencies and devDependencies.`);
  }
  // scripts presence
  const scripts = pkg.scripts || {};
  const missing = [];
  if (!scripts.build) missing.push("build");
  if (!scripts.dev) missing.push("dev");
  if (!scripts.start) missing.push("start");
  if (missing.length) warns.push(`Missing common scripts in package.json: ${missing.join(", ")}.`);
}

// 5) Next.js "<Html>" misuse check
function listFiles(dir, acc) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules",".git",".next","dist","build",".turbo"].includes(e.name)) continue;
      listFiles(p, acc);
    } else if (/\.(t|j)sx?$/.test(e.name)) {
      acc.push(p);
    }
  }
}

const files = [];
if (exists(repo)) listFiles(repo, files);

const htmlImportRegex = /import\s*\{\s*Html\s*\}\s*from\s*['"]next\/document['"]/;
const badHtml = [];
for (const f of files) {
  const rel = path.relative(repo, f).replace(/\\/g,"/");
  const content = read(f);
  if (!content) continue;
  if (htmlImportRegex.test(content)) {
    const isDocument = /(^|\/)pages\/_document\.(t|j)sx?$/.test(rel);
    if (!isDocument) badHtml.push(rel);
  }
}
if (badHtml.length) {
  fail(`"Html" from next/document imported outside pages/_document: ${badHtml.join(", ")}`);
  info(`Fix: move <Html> usage into pages/_document.{js,tsx} only. See https://nextjs.org/docs/pages/building-your-application/routing/custom-document`);
}

// 6) Env var usage vs .env files
function collectEnvVarsFromCode() {
  const names = new Set();
  const re = /process\.env\.([A-Z0-9_]+)/g;
  for (const f of files) {
    const content = read(f);
    if (!content) continue;
    let m;
    while ((m = re.exec(content)) !== null) names.add(m[1]);
  }
  return names;
}

function collectEnvVarsFromDotenv() {
  const present = new Set();
  const envFiles = [".env", ".env.local", ".env.development", ".env.production"];
  for (const ef of envFiles) {
    const p = path.join(repo, ef);
    if (!exists(p)) continue;
    const txt = read(p);
    if (!txt) continue;
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
      if (m) present.add(m[1]);
    }
  }
  return present;
}

const usedEnv = collectEnvVarsFromCode();
const definedEnv = collectEnvVarsFromDotenv();
const missingEnv = [...usedEnv].filter(k => !definedEnv.has(k));
if (missingEnv.length) {
  warns.push(`Env vars referenced in code but not found in .env* files: ${missingEnv.join(", ")}.`);
}

// 7) TypeScript + ESLint sanity
if (exists(path.join(repo, "tsconfig.json"))) {
  info("Detected tsconfig.json");
}
if (exists(path.join(repo, ".eslintrc")) || exists(path.join(repo, ".eslintrc.js")) || exists(path.join(repo, ".eslintrc.cjs")) || exists(path.join(repo, ".eslintrc.json"))) {
  info("Detected ESLint config");
}

// 8) Attempt dry-run install
if (lockPM === "npm") {
  const out = run(`cd "${repo}" && npm ci --ignore-scripts --dry-run`);
  if (!out) warns.push("npm ci --dry-run failed; dependency tree may be broken.");
} else if (lockPM === "yarn") {
  const out = run(`cd "${repo}" && yarn install --mode=skip-build`);
  if (!out) warns.push("yarn install check failed; dependency tree may be broken.");
} else if (lockPM === "pnpm") {
  const out = run(`cd "${repo}" && pnpm install --frozen-lockfile --reporter=silent`);
  if (!out) warns.push("pnpm install check failed; dependency tree may be broken.");
}

// 9) Summary
console.log("\n--- SUMMARY ----------------------------------------------------");
if (fails.length) {
  console.log("Critical findings:");
  for (const f of fails) console.log(" -", f);
}
if (warns.length) {
  console.log("\nWarnings:");
  for (const w of warns) console.log(" -", w);
}

const exitCode = fails.length ? 2 : 0;
process.exit(exitCode);
