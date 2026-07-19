import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const checks = [];

function assert(condition, message) {
  if (condition) checks.push(message);
  else failures.push(message);
}

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

const html = await readFile(path.join(root, "index.html"), "utf8");
const scriptMatches = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scriptMatches.length === 1, "un seul script applicatif est présent");

if (scriptMatches[0]) {
  try {
    new vm.Script(scriptMatches[0][1], { filename: "index-inline.js" });
    checks.push("la syntaxe JavaScript intégrée est valide");
  } catch (error) {
    failures.push(`syntaxe JavaScript invalide: ${error.message}`);
  }
}

const catalogueMatch = html.match(/const starterApps = (\[[\s\S]*?\n\s*\]);/);
assert(Boolean(catalogueMatch), "le catalogue starterApps est détectable");

let apps = [];
if (catalogueMatch) {
  try {
    apps = vm.runInNewContext(`(${catalogueMatch[1]})`, Object.create(null), { timeout: 1000 });
  } catch (error) {
    failures.push(`catalogue illisible: ${error.message}`);
  }
}

assert(apps.length >= 20, "le catalogue contient au moins 20 applications");
const ids = new Set();
const images = new Set();
for (const app of apps) {
  assert(Boolean(app?.id && app?.name && app?.category && app?.description), `champs obligatoires présents pour ${app?.id || "entrée inconnue"}`);
  assert(!ids.has(app.id), `identifiant unique: ${app.id}`);
  ids.add(app.id);

  try {
    const url = new URL(app.link);
    assert(["https:", "http:", "steam:", "file:"].includes(url.protocol), `protocole autorisé pour ${app.id}`);
  } catch {
    failures.push(`lien invalide pour ${app.id}: ${app.link}`);
  }

  if (app.image) {
    images.add(app.image.replaceAll("\\", "/"));
    assert(await exists(app.image), `aperçu présent pour ${app.id}`);
  }
}

const previewFiles = (await readdir(path.join(root, "assets", "previews")))
  .filter((name) => name.toLowerCase().endsWith(".png"))
  .map((name) => `assets/previews/${name}`);
for (const preview of previewFiles) {
  assert(images.has(preview), `aperçu référencé: ${preview}`);
}

assert(html.includes('name="description"'), "la description SEO est présente");
assert(html.includes('rel="manifest"'), "le manifeste PWA est relié");
assert(!html.includes('role="button" tabindex="0"'), "les cartes n'imitent plus un bouton non sémantique");
assert(!html.includes("--card-image: ${cssImage(app)}"), "les URL d'images ne sont pas injectées dans un attribut HTML");
assert(await exists("manifest.webmanifest"), "le manifeste PWA existe");
assert(await exists("sw.js"), "le service worker existe");

const serviceWorker = await readFile(path.join(root, "sw.js"), "utf8");
for (const preview of previewFiles) {
  assert(serviceWorker.includes(`/${preview}`), `aperçu préchargé hors ligne: ${preview}`);
}

const manifest = JSON.parse(await readFile(path.join(root, "manifest.webmanifest"), "utf8"));
for (const icon of manifest.icons || []) {
  assert(await exists(String(icon.src || "").replace(/^\//, "")), `icône PWA présente: ${icon.src}`);
}

for (const file of ["sw.js", "manifest.webmanifest"]) {
  if (!(await exists(file))) continue;
  const content = await readFile(path.join(root, file), "utf8");
  try {
    if (file.endsWith(".json") || file.endsWith(".webmanifest")) JSON.parse(content);
    else new vm.Script(content, { filename: file });
    checks.push(`${file} est syntaxiquement valide`);
  } catch (error) {
    failures.push(`${file} est invalide: ${error.message}`);
  }
}

if (failures.length) {
  console.error(`Audit échoué (${failures.length} erreur${failures.length > 1 ? "s" : ""})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Audit réussi: ${checks.length} contrôles, ${apps.length} applications, ${previewFiles.length} aperçus.`);
}
