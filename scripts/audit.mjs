import { access, readFile, readdir, stat } from "node:fs/promises";
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

const rasterExtensionPattern = /\.(png|jpe?g|webp)$/i;

function expectedRasterFormat(relativePath) {
  const extension = path.extname(relativePath).toLowerCase();
  if (extension === ".png") return "png";
  if (extension === ".jpg" || extension === ".jpeg") return "jpeg";
  if (extension === ".webp") return "webp";
  return "inconnu";
}

async function assertRasterFormat(relativePath) {
  try {
    const bytes = await readFile(path.join(root, relativePath));
    let actualFormat = "inconnu";
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      actualFormat = "png";
    } else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
      actualFormat = "jpeg";
    } else if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") {
      actualFormat = "webp";
    }
    assert(
      actualFormat === expectedRasterFormat(relativePath),
      `extension fidèle au format binaire: ${relativePath}`
    );
  } catch (error) {
    failures.push(`format binaire illisible pour ${relativePath}: ${error.message}`);
  }
}

async function pngDimensions(relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!isPng || bytes.length < 24) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const html = await readFile(path.join(root, "index.html"), "utf8");
const scriptMatches = [...html.matchAll(/<script(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/script>/gi)]
  .map((match) => ({
    body: match.groups?.body || "",
    src: match.groups?.attributes?.match(/\bsrc=["']([^"']+)["']/i)?.[1] || ""
  }));
const inlineScripts = scriptMatches.filter((script) => !script.src);
const externalScripts = scriptMatches.filter((script) => script.src);
assert(inlineScripts.length === 1, "un seul script applicatif intégré est présent");
assert(
  externalScripts.length === 1 && externalScripts[0].src === "assets/social-features.js",
  "le module social attendu est le seul script externe"
);

if (inlineScripts[0]) {
  try {
    new vm.Script(inlineScripts[0].body, { filename: "index-inline.js" });
    checks.push("la syntaxe JavaScript intégrée est valide");
  } catch (error) {
    failures.push(`syntaxe JavaScript invalide: ${error.message}`);
  }
}

const inlineScriptBody = inlineScripts[0]?.body || "";
assert(
  /<button\b(?=[^>]*\bid=["']popularityButton["'])(?=[^>]*\btype=["']button["'])(?=[^>]*\baria-pressed=["']false["'])[^>]*>/i.test(html),
  "le contrôle de popularité est un bouton accessible"
);
assert(
  inlineScriptBody.includes("const POPULARITY_WORKER_COUNT = 4;"),
  "le chargement de popularité est limité à quatre workers"
);
assert(
  inlineScriptBody.includes("window.LauncherSocial.getVisitCount(appId)"),
  "la popularité utilise les vraies ouvertures partagées"
);
assert(
  inlineScriptBody.includes('sortMode === "popularity"'),
  "le tri par popularité est intégré au catalogue"
);
assert(
  inlineScriptBody.includes('data-popularity="${popularityCount(app.id)}"'),
  "les cartes exposent leur compteur de popularité"
);
assert(
  (inlineScriptBody.match(/\bloadPopularityStats\(\)/g) || []).length === 2,
  "les statistiques de popularité restent chargées à la demande"
);
assert(
  /recordVisit\(appId\)[\s\S]*?popularityById\.set\(/.test(inlineScriptBody),
  "un clic Ouvrir actualise le tri par popularité"
);
assert(
  inlineScriptBody.includes('popularityButton.setAttribute("aria-busy", String(popularityLoading))'),
  "le chargement de popularité est annoncé aux technologies d'assistance"
);

for (const script of externalScripts) {
  assert(await exists(script.src), `script externe présent: ${script.src}`);
  if (!(await exists(script.src))) continue;
  try {
    new vm.Script(await readFile(path.join(root, script.src), "utf8"), { filename: script.src });
    checks.push(`la syntaxe de ${script.src} est valide`);
  } catch (error) {
    failures.push(`${script.src} est invalide: ${error.message}`);
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

assert(apps.length >= 46, "le catalogue contient au moins 46 applications");
const ids = new Set();
const images = new Set();
const presentations = new Set();
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

  assert(Boolean(app.image), `aperçu renseigné pour ${app.id}`);
  if (app.image) {
    images.add(app.image.replaceAll("\\", "/"));
    assert(await exists(app.image), `aperçu présent pour ${app.id}`);
  }

  assert(Boolean(app.presentation), `présentation renseignée pour ${app.id}`);
  if (app.presentation) {
    presentations.add(app.presentation.replaceAll("\\", "/"));
    assert(await exists(app.presentation), `présentation présente pour ${app.id}`);
    assert(app.presentation !== app.image, `présentation distincte de l'aperçu pour ${app.id}`);
  }
}

const previewFiles = (await readdir(path.join(root, "assets", "previews")))
  .filter((name) => rasterExtensionPattern.test(name))
  .map((name) => `assets/previews/${name}`);
for (const preview of previewFiles) {
  assert(images.has(preview), `aperçu référencé: ${preview}`);
  await assertRasterFormat(preview);
}

const presentationFiles = (await readdir(path.join(root, "assets", "presentations")))
  .filter((name) => rasterExtensionPattern.test(name))
  .map((name) => `assets/presentations/${name}`);
for (const presentation of presentationFiles) {
  assert(presentations.has(presentation), `présentation référencée: ${presentation}`);
  await assertRasterFormat(presentation);
}

const galleryDocument = JSON.parse(await readFile(path.join(root, "assets", "app-gallery.json"), "utf8"));
const galleryMap = galleryDocument.galleries || galleryDocument.apps || galleryDocument;
const galleryPaths = new Set();
for (const app of apps) {
  const entry = galleryMap[app.id];
  const gallery = Array.isArray(entry) ? entry : entry?.images;
  assert(Array.isArray(gallery) && gallery.length >= 5, `galerie complète pour ${app.id}`);
  if (!Array.isArray(gallery)) continue;

  assert(new Set(gallery).size === gallery.length, `galerie sans doublon pour ${app.id}`);
  for (const image of gallery) {
    assert(
      typeof image === "string" && image.startsWith(`assets/screenshots/${app.id}/`),
      `chemin de galerie attribué à ${app.id}: ${image}`
    );
    galleryPaths.add(String(image).replaceAll("\\", "/"));
    const galleryImageExists = await exists(image);
    assert(galleryImageExists, `image de galerie présente pour ${app.id}: ${image}`);
    if (galleryImageExists) await assertRasterFormat(image);
  }
}
for (const id of Object.keys(galleryMap).filter((id) => id !== "notes")) {
  assert(ids.has(id), `galerie attribuée à une application connue: ${id}`);
}

const iconSprite = await readFile(path.join(root, "assets", "app-icons.svg"), "utf8");
for (const app of apps) {
  assert(iconSprite.includes(`id="icon-${app.id}"`), `icône SVG présente pour ${app.id}`);
}

assert(html.includes('name="description"'), "la description SEO est présente");
assert(html.includes('rel="manifest"'), "le manifeste PWA est relié");
assert(html.includes('rel="apple-touch-icon"'), "l'icône Apple Touch est reliée");
assert(await exists("assets/apple-touch-icon.png"), "l'icône Apple Touch existe");
const appleTouchDimensions = await pngDimensions("assets/apple-touch-icon.png");
assert(
  appleTouchDimensions?.width === 180 && appleTouchDimensions?.height === 180,
  "l'icône Apple Touch mesure 180x180"
);
assert(html.includes('href="assets/social-features.css"'), "la feuille de style sociale est reliée");
assert(await exists("assets/social-features.css"), "la feuille de style sociale existe");
assert(!html.includes('role="button" tabindex="0"'), "les cartes n'imitent plus un bouton non sémantique");
assert(!html.includes("--card-image: ${cssImage(app)}"), "les URL d'images ne sont pas injectées dans un attribut HTML");
assert(await exists("manifest.webmanifest"), "le manifeste PWA existe");
assert(await exists("sw.js"), "le service worker existe");

const serviceWorker = await readFile(path.join(root, "sw.js"), "utf8");
for (const socialAsset of ["assets/social-features.css", "assets/social-features.js"]) {
  assert(serviceWorker.includes(`/${socialAsset}`), `asset social préchargé hors ligne: ${socialAsset}`);
}

const appShellMatch = serviceWorker.match(/const APP_SHELL = (\[[\s\S]*?\]);/);
assert(Boolean(appShellMatch), "la liste APP_SHELL est détectable");
let appShell = [];
if (appShellMatch) {
  try {
    appShell = vm.runInNewContext(`(${appShellMatch[1]})`, Object.create(null), { timeout: 1000 });
  } catch (error) {
    failures.push(`APP_SHELL illisible: ${error.message}`);
  }
}

let appShellBytes = 0;
for (const asset of appShell) {
  const relativePath = asset === "/" ? "index.html" : String(asset).replace(/^\//, "");
  const assetExists = await exists(relativePath);
  assert(assetExists, `asset APP_SHELL présent: ${asset}`);
  if (assetExists) appShellBytes += (await stat(path.join(root, relativePath))).size;
}
assert(appShellBytes <= 5 * 1024 * 1024, "le préchargement APP_SHELL reste inférieur à 5 Mo");
assert(serviceWorker.includes('const RUNTIME_CACHE = "launcher-media-runtime-v1"'), "le cache média différé est versionné");
assert(serviceWorker.includes("const MAX_RUNTIME_ENTRIES = 120"), "le cache média différé est borné");
assert(
  serviceWorker.includes("/^\\/assets\\/(?:previews|presentations|screenshots)\\//"),
  "les répertoires médias utilisent le cache différé"
);
assert(serviceWorker.includes("key.startsWith(CACHE_PREFIX)"), "l'activation préserve les caches étrangers au launcher");
assert(serviceWorker.includes("!response.redirected"), "les redirections ne sont pas mises en cache");
assert(serviceWorker.includes('response.type === "basic"'), "seules les réponses same-origin sont mises en cache");
assert(serviceWorker.includes('isCacheableResponse(response, "text/html")'), "le fallback de navigation reste un document HTML");
assert(serviceWorker.match(/event\.waitUntil\(updatePromise\)/g)?.length === 2, "les écritures différées prolongent les événements fetch");
const mediaFiles = [...previewFiles, ...presentationFiles, ...galleryPaths];
assert(
  !mediaFiles.some((asset) => serviceWorker.includes(`"/${asset}"`)),
  "les médias lourds ne bloquent pas l'installation hors ligne"
);

const manifest = JSON.parse(await readFile(path.join(root, "manifest.webmanifest"), "utf8"));
for (const icon of manifest.icons || []) {
  assert(await exists(String(icon.src || "").replace(/^\//, "")), `icône PWA présente: ${icon.src}`);
}
for (const size of [192, 512]) {
  const icon = (manifest.icons || []).find(
    (entry) => entry.sizes === `${size}x${size}` && entry.type === "image/png"
  );
  assert(Boolean(icon), `icône PWA PNG déclarée en ${size}x${size}`);
  if (!icon) continue;
  const relativePath = String(icon.src || "").replace(/^\//, "");
  const dimensions = await pngDimensions(relativePath);
  assert(dimensions?.width === size && dimensions?.height === size, `icône PWA mesurée en ${size}x${size}`);
  assert(String(icon.purpose || "").includes("maskable"), `icône PWA maskable en ${size}x${size}`);
}

const vercelConfig = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
const serviceWorkerHeaders = (vercelConfig.headers || [])
  .find((rule) => rule.source === "/sw.js")
  ?.headers || [];
assert(
  serviceWorkerHeaders.some(
    (header) => header.key.toLowerCase() === "cache-control"
      && header.value.includes("max-age=0")
      && header.value.includes("must-revalidate")
  ),
  "le service worker est toujours revalidé par Vercel"
);

for (const file of ["sw.js", "manifest.webmanifest", "vercel.json"]) {
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
  console.log(
    `Audit réussi: ${checks.length} contrôles, ${apps.length} applications, ${previewFiles.length} aperçus, ` +
    `${presentationFiles.length} présentations, ${galleryPaths.size} images de galerie et ` +
    `${Math.round(appShellBytes / 1024)} Ko préchargés.`
  );
}
