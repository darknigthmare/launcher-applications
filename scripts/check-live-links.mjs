#!/usr/bin/env node
/**
 * Diagnostic réseau des liens publics du launcher.
 * Les statuts 200 ne prouvent pas la fidélité des médias ni la fraîcheur du build.
 * Ne change jamais un alias sur la seule base d'un échec temporaire.
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const html = await readFile(resolve(root, "index.html"), "utf8");
const recentSource = await readFile(resolve(root, "assets/recent-games.js"), "utf8");
const beforeRecent = html.slice(html.indexOf("const starterApps = ["), html.indexOf("starterApps.push(..."));
if (!beforeRecent.startsWith("const starterApps = [")) throw new Error("Catalogue principal introuvable");
const primary = [...beforeRecent.matchAll(/\{\s*id:\s*"([^"]+)"([\s\S]*?)(?=\n\s*\},|\n\s*\];)/g)].map((match) => ({
  id: match[1],
  name: match[2].match(/\bname:\s*"([^"]+)"/)?.[1] || match[1],
  link: match[2].match(/\blink:\s*"([^"]*)"/)?.[1] || ""
}));
const prefix = "window.LAUNCHER_RECENT_GAMES = ";
if (!recentSource.startsWith(prefix)) throw new Error("Catalogue récent introuvable");
const recent = JSON.parse(recentSource.slice(prefix.length).replace(/;\s*$/, "").trim());
const apps = [...primary, ...recent].map(({ id, name, link }) => ({ id, name, link: link || "" }));
if (new Set(apps.map((app) => app.id)).size !== apps.length) throw new Error("IDs dupliqués");
if (!apps.length) throw new Error("Catalogue vide");

async function check(app) {
  if (!app.link) return { ...app, state: "no-link", httpStatus: null };
  const url = new URL(app.link);
  if (url.protocol !== "https:") return { ...app, state: "needs-review", reason: "protocole non HTTPS" };
  let lastError = "";
  for (const method of ["HEAD", "GET"]) {
    try {
      const response = await fetch(url.href, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
        headers: { "user-agent": "LauncherGames-LinkAudit/1.13 (+github.com/darknigthmare/launcher-applications)" }
      });
      await response.body?.cancel();
      if (method === "HEAD" && [405, 501].includes(response.status)) continue;
      const state = response.status >= 200 && response.status < 400
        ? "reachable"
        : [401, 403, 429, 500, 502, 503, 504].includes(response.status)
          ? "needs-review" : "broken";
      return { ...app, state, httpStatus: response.status, effectiveUrl: response.url, checkedAt: new Date().toISOString() };
    } catch (error) {
      lastError = String(error?.message || error);
    }
  }
  return { ...app, state: "needs-review", reason: lastError || "erreur réseau", checkedAt: new Date().toISOString() };
}

const results = new Array(apps.length);
let cursor = 0;
const workers = Array.from({ length: Math.min(6, apps.length) }, async () => {
  while (cursor < apps.length) {
    const index = cursor++;
    results[index] = await check(apps[index]);
  }
});
await Promise.all(workers);
const counts = Object.fromEntries(["reachable", "needs-review", "broken", "no-link"].map((state) => [
  state, results.filter((app) => app.state === state).length
]));
const report = {
  generatedAt: new Date().toISOString(),
  scope: "Contrôle HTTP d'alias publics — ne certifie ni fraîcheur de build ni fidélité 1:1",
  total: results.length,
  counts,
  results
};
await mkdir(resolve(root, ".reports"), { recursive: true });
await writeFile(resolve(root, ".reports/live-link-status.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log("Launcher URLs:", JSON.stringify(counts));
for (const app of results.filter((x) => !["reachable"].includes(x.state))) {
  console.log(app.state + " " + app.id + " " + (app.httpStatus ?? "-") + " " + app.link + " " + (app.reason || ""));
}
if (process.argv.includes("--strict") && counts.broken) process.exitCode = 1;
