#!/usr/bin/env node
/**
 * Diagnostic réseau des liens publics du launcher.
 * Les statuts 200 ne prouvent pas la fidélité des médias ni la fraîcheur du build.
 * Ne change jamais un alias sur la seule base d'un échec temporaire.
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { classifyLinkDestination } from "./link-destination-classifier.mjs";

const root = process.cwd();
const html = await readFile(resolve(root, "index.html"), "utf8");
const recentSource = await readFile(resolve(root, "assets/recent-games.js"), "utf8");
// Keep the identity of the exact catalogue strings checked, even if another
// task updates a file while the network requests are still in progress.
const inputSha256 = Object.fromEntries([
  ["index.html", html],
  ["assets/recent-games.js", recentSource],
  ["scripts/check-live-links.mjs", await readFile(new URL(import.meta.url), "utf8")],
  ["scripts/link-destination-classifier.mjs", await readFile(new URL("./link-destination-classifier.mjs", import.meta.url), "utf8")]
].map(([file, source]) => [file, createHash("sha256").update(source).digest("hex")]));
const beforeRecent = html.slice(html.indexOf("const starterApps = ["), html.indexOf("starterApps.push(..."));
if (!beforeRecent.startsWith("const starterApps = [")) throw new Error("Catalogue principal introuvable");
const primary = [...beforeRecent.matchAll(/\{\s*id:\s*"([^"]+)"([\s\S]*?)(?=\n\s*\},|\n\s*\];)/g)].map((match) => ({
  id: match[1],
  name: match[2].match(/\bname:\s*"([^"]+)"/)?.[1] || match[1],
  link: match[2].match(/\blink:\s*"([^"]*)"/)?.[1] || "",
  accessPolicy: match[2].match(/\baccessPolicy:\s*"([^"]*)"/)?.[1] || ""
}));
const prefix = "window.LAUNCHER_RECENT_GAMES = ";
if (!recentSource.startsWith(prefix)) throw new Error("Catalogue récent introuvable");
const recent = JSON.parse(recentSource.slice(prefix.length).replace(/;\s*$/, "").trim());
const apps = [...primary, ...recent].map(({ id, name, link, accessPolicy }) => ({ id, name, link: link || "", accessPolicy: accessPolicy || "" }));
if (new Set(apps.map((app) => app.id)).size !== apps.length) throw new Error("IDs dupliqués");
if (!apps.length) throw new Error("Catalogue vide");

async function check(app) {
  if (!app.link) return { ...app, state: "no-link", httpStatus: null };
  const url = new URL(app.link);
  if (url.protocol !== "https:") return { ...app, state: "needs-review", reason: "protocole non HTTPS" };
  let lastError = "";
  // GET observes the actual authentication page too: HEAD alone can report 200
  // while the same URL serves a Vercel gate rather than the game document.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url.href, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
        headers: { "user-agent": "LauncherGames-LinkAudit (+github.com/darknigthmare/launcher-applications)" }
      });
      let body = "";
      // Inspect only the document head; avoid downloading complete game bundles
      // or holding an unbounded response in the audit process.
      if (response.body && /text\/html/i.test(response.headers.get("content-type") || "")) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let bytesRead = 0;
        try {
          while (bytesRead < 65536) {
            const { value, done } = await reader.read();
            if (done) break;
            const remaining = 65536 - bytesRead;
            body += decoder.decode(value.subarray(0, remaining), { stream: true });
            bytesRead += value.length;
            if (/<\/head\s*>/i.test(body)) break;
          }
        } finally {
          await reader.cancel();
        }
      } else {
        await response.body?.cancel();
      }
      const classification = classifyLinkDestination({
        requestedUrl: app.link,
        effectiveUrl: response.url,
        status: response.status,
        headers: response.headers,
        body
      });
      const result = app.accessPolicy === "local-download" && classification.state === "reachable"
        ? { state:"download-available", reason:"Dépôt GitHub accessible : téléchargement/installation locale, pas un jeu hébergé" }
        : classification;
      return { ...app, ...result, httpStatus: response.status, effectiveUrl: response.url,
        checkedAt: new Date().toISOString() };
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
const counts = Object.fromEntries(["reachable", "download-available", "auth-required", "needs-review", "broken", "no-link"].map((state) => [
  state, results.filter((app) => app.state === state).length
]));
const report = {
  generatedAt: new Date().toISOString(),
  scope: "Contrôle des URLs publiques, dépôts à télécharger et redirections Vercel SSO — réponse HTTP non suffisante pour certifier le gameplay",
  method: "GET, redirects followed, first 64 KiB of HTML document head inspected for Vercel Authentication; at most 6 concurrent requests; no HTTP body stored",
  inputSha256,
  total: results.length,
  counts,
  results
};
await mkdir(resolve(root, ".reports"), { recursive: true });
await writeFile(resolve(root, ".reports/live-link-status.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log("Launcher URLs:", JSON.stringify(counts));
for (const app of results.filter((x) => !["reachable", "download-available"].includes(x.state))) {
  console.log(app.state + " " + app.id + " " + (app.httpStatus ?? "-") + " " + app.link + " " + (app.reason || ""));
}
if (process.argv.includes("--strict") && (counts.broken || counts["auth-required"])) process.exitCode = 1;
