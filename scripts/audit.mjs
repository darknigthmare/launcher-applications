import { access, readFile, readdir, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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

const packageDocument = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const html = await readFile(path.join(root, "index.html"), "utf8");
const scriptMatches = [...html.matchAll(/<script(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/script>/gi)]
  .map((match) => ({
    body: match.groups?.body || "",
    src: match.groups?.attributes?.match(/\bsrc=["']([^"']+)["']/i)?.[1] || ""
  }));
const inlineScripts = scriptMatches.filter((script) => !script.src);
const externalScripts = scriptMatches.filter((script) => script.src);
assert(inlineScripts.length === 1, "un seul script applicatif intégré est présent");
const externalScriptSources = externalScripts.map((script) => script.src);
assert(
  externalScriptSources.length === 3
    && externalScriptSources.includes("assets/recent-games.js")
    && externalScriptSources.includes("assets/catalogue-updates.js")
    && externalScriptSources.includes("assets/social-features.js"),
  "les modules catalogue, mises à jour et social sont les trois scripts externes attendus"
);
assert(
  html.indexOf('src="assets/recent-games.js"') < html.indexOf("const starterApps"),
  "le catalogue récent est chargé avant le catalogue applicatif"
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
  inlineScriptBody.includes("window.LAUNCHER_RECENT_GAMES"),
  "le catalogue applicatif intègre les jeux de assets/recent-games.js"
);
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
assert(
  /id=["'][^"']*game[^"']*["'][^>]*role=["']group["']/i.test(html),
  "la taxonomie Jeux forme un groupe accessible"
);
assert(html.includes("Jeux originaux"), "la sous-catégorie Jeux originaux est visible");
assert(html.includes("Fan games"), "la sous-catégorie Fan games est visible");
assert(inlineScriptBody.includes("activeGameKind"), "le type de jeu possède un état de filtre dédié");
assert(inlineScriptBody.includes("data-game-kind"), "les contrôles de taxonomie exposent le type de jeu");
assert(
  inlineScriptBody.includes("gameKindFor(app)") && inlineScriptBody.includes("gameGenreFor(app)"),
  "les types et genres de jeux se combinent aux autres filtres"
);
assert(
  inlineScriptBody.includes("baseGameFor(app)") || inlineScriptBody.includes("gameBaseFor(app)"),
  "la franchise de base des fan-games participe à l'affichage ou à la recherche"
);
assert(
  inlineScriptBody.includes('?.focus({ preventScroll: true });'),
  "le focus reste sur la catégorie après reconstruction de la navigation"
);

assert(
  /id=["']availabilityFilter["'][^>]*role=["']group["'][^>]*aria-label=/i.test(html),
  "le filtre de disponibilité forme un groupe accessible"
);
for (const availability of ["Tous", "Disponible", "En préparation", "Nouveauté"]) {
  assert(inlineScriptBody.includes('"' + availability + '"'), "option de disponibilité présente: " + availability);
}
for (const helper of ["availabilityFor", "isNewApp", "visibleTags", "renderAvailabilityFilters"]) {
  assert(inlineScriptBody.includes("function " + helper), "helper UI présent: " + helper);
}
assert(
  inlineScriptBody.includes('activeAvailability === "Nouveauté" ? isNewApp(app)'),
  "le filtre Nouveauté se combine aux autres filtres"
);
assert(
  (inlineScriptBody.match(/activeAvailability = "Tous"/g) || []).length >= 3,
  "le filtre de disponibilité est réinitialisé au démarrage, au reset et après ajout"
);
for (const control of ["updatesButton", "healthButton"]) {
  assert(
    new RegExp("<button\\b(?=[^>]*\\bid=[\"']" + control + "[\"'])(?=[^>]*\\baria-haspopup=[\"']dialog[\"'])[^>]*>", "i").test(html),
    "bouton de dialogue accessible: " + control
  );
}
for (const dialog of ["updatesDialog", "healthDialog"]) {
  assert(
    new RegExp("<dialog\\b(?=[^>]*\\bid=[\"']" + dialog + "[\"'])(?=[^>]*\\baria-labelledby=[\"'][^\"']+[\"'])[^>]*>", "i").test(html),
    "dialogue accessible: " + dialog
  );
}
for (const id of ["updatesBody", "closeUpdatesButton", "healthBody", "closeHealthButton"]) {
  assert(html.includes('id="' + id + '"'), "surface UI présente: " + id);
}
assert(inlineScriptBody.includes("window.LAUNCHER_RELEASES"), "le journal consomme LAUNCHER_RELEASES");
for (const helper of ["renderUpdates", "checkMediaHealth", "healthSnapshot", "renderHealthDashboard", "refreshHealthDashboard"]) {
  assert(inlineScriptBody.includes("function " + helper), "helper de suivi présent: " + helper);
}
assert(inlineScriptBody.includes('role="list"'), "le journal expose une liste sémantique");
assert(inlineScriptBody.includes('id="refreshHealthButton"'), "le tableau de santé propose une actualisation");
assert(inlineScriptBody.includes("const NEW_APP_WINDOW_DAYS = 45;"), "la fenêtre Nouveauté est bornée à 45 jours");
assert(inlineScriptBody.includes('const LEGACY_ADDED_AT = "1970-01-01T00:00:00.000Z";'), "les anciennes entrées ne deviennent pas artificiellement nouvelles");
assert(
  inlineScriptBody.includes('const OFFICIAL_SYNC_FIELDS = ["link", "status", "releaseState", "addedAt"];'),
  "la migration locale synchronise les champs de publication officiels"
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
const gameGenreMatch = html.match(/const GAME_GENRE_GROUPS = (\[[\s\S]*?\n\s*\]);/);
assert(Boolean(gameGenreMatch), "la taxonomie des genres de jeux est détectable");

let apps = [];
if (catalogueMatch) {
  try {
    apps = vm.runInNewContext(`(${catalogueMatch[1]})`, Object.create(null), { timeout: 1000 });
  } catch (error) {
    failures.push(`catalogue illisible: ${error.message}`);
  }
}

let recentApps = [];
if (await exists("assets/recent-games.js")) {
  try {
    const recentCatalogueSandbox = { window: {} };
    recentCatalogueSandbox.globalThis = recentCatalogueSandbox.window;
    recentCatalogueSandbox.self = recentCatalogueSandbox.window;
    vm.runInNewContext(
      await readFile(path.join(root, "assets", "recent-games.js"), "utf8"),
      recentCatalogueSandbox,
      { filename: "assets/recent-games.js", timeout: 1000 }
    );
    recentApps = recentCatalogueSandbox.window.LAUNCHER_RECENT_GAMES;
    assert(Array.isArray(recentApps), "assets/recent-games.js expose un tableau LAUNCHER_RECENT_GAMES");
    if (!Array.isArray(recentApps)) recentApps = [];
  } catch (error) {
    failures.push(`catalogue récent illisible: ${error.message}`);
  }
}
assert(recentApps.length >= 72, "le catalogue récent contient au moins les 72 jeux de référence");
apps = [...apps, ...recentApps];
let releases = [];
if (await exists("assets/catalogue-updates.js")) {
  try {
    const releaseSandbox = { window: {} };
    releaseSandbox.globalThis = releaseSandbox.window;
    releaseSandbox.self = releaseSandbox.window;
    vm.runInNewContext(
      await readFile(path.join(root, "assets", "catalogue-updates.js"), "utf8"),
      releaseSandbox,
      { filename: "assets/catalogue-updates.js", timeout: 1000 }
    );
    releases = releaseSandbox.window.LAUNCHER_RELEASES;
    assert(Array.isArray(releases) && releases.length > 0, "le journal expose au moins une version");
    if (!Array.isArray(releases)) releases = [];
  } catch (error) {
    failures.push("journal des versions illisible: " + error.message);
  }
}
const semverPattern = /^\d+\.\d+\.\d+$/;
for (let index = 0; index < releases.length; index += 1) {
  const release = releases[index];
  assert(semverPattern.test(String(release?.version || "")), "version SemVer valide dans le journal: " + (release?.version || "inconnue"));
  const date = Date.parse(release?.date || "");
  assert(Number.isFinite(date), "date valide pour la version " + (release?.version || "inconnue"));
  if (index > 0) {
    assert(Date.parse(releases[index - 1]?.date || "") >= date, "journal trié par date décroissante");
  }
  assert(Array.isArray(release?.highlights) && release.highlights.length > 0, "notes présentes pour la version " + (release?.version || "inconnue"));
}
assert(releases[0]?.version === packageDocument.version, "la dernière version du journal correspond à package.json");

let gameGenreGroups = [];
if (gameGenreMatch) {
  try {
    gameGenreGroups = vm.runInNewContext(`(${gameGenreMatch[1]})`, Object.create(null), { timeout: 1000 });
  } catch (error) {
    failures.push(`taxonomie des genres illisible: ${error.message}`);
  }
}

assert(apps.length >= 118, "le catalogue contient au moins 118 applications");
assert(apps.filter((app) => app?.category === "Jeux").length >= 105, "le catalogue contient au moins 105 jeux");
assert(gameGenreGroups.length === 8, "la navigation Jeux contient huit genres principaux");

const starterGameIds = new Set(
  apps.filter((app) => app?.category === "Jeux").map((app) => app.id)
);
const mappedGameIds = new Map();
const genreNames = new Set();
for (const group of gameGenreGroups) {
  assert(Boolean(group?.name), "chaque genre possède un nom");
  assert(!genreNames.has(group?.name), `genre unique: ${group?.name || "inconnu"}`);
  genreNames.add(group?.name);
  assert(Array.isArray(group?.ids) && group.ids.length > 0, `genre non vide: ${group?.name || "inconnu"}`);

  for (const id of group?.ids || []) {
    assert(starterGameIds.has(id), `le genre ${group.name} référence un jeu historique: ${id}`);
    assert(!mappedGameIds.has(id), `genre principal unique pour ${id}`);
    mappedGameIds.set(id, group.name);
  }
}
for (const id of starterGameIds) {
  const app = apps.find((entry) => entry.id === id);
  const genre = app?.genre || mappedGameIds.get(id);
  assert(genreNames.has(genre), `genre principal valide pour ${id}`);
}

const recentGameIds = new Set(recentApps.filter((app) => app?.category === "Jeux").map((app) => app.id));
for (const app of recentApps) {
  assert(app?.category === "Jeux", `le jeu récent reste dans Jeux: ${app?.id || "entrée inconnue"}`);
  assert(genreNames.has(app?.genre), `genre récent parmi les huit genres pour ${app?.id || "entrée inconnue"}`);
}

const validGameKinds = new Set(["Jeux originaux", "Fan games"]);
const legacyFanGameBases = new Map([
  ["shadow-codec-ops", "Metal Gear Solid"],
  ["hellbound-hotel-manager", "Hazbin Hotel"],
  ["hive-ascension", "Alien"],
  ["yautja-la-longue-chasse", "Predator"],
  ["hive-ascension-cycle", "Alien"],
  ["kc-holographics", "Yu-Gi-Oh!"],
  ["cells-at-work-immune-alert", "Cells at Work!"],
  ["yautja-hive-warriors", "Alien vs. Predator"],
  ["yautja-apex-hunt", "Predator"]
]);
for (const app of apps.filter((entry) => entry?.category === "Jeux")) {
  const gameKind = app.gameKind || (legacyFanGameBases.has(app.id) ? "Fan games" : "Jeux originaux");
  const baseGame = app.baseGame || legacyFanGameBases.get(app.id) || "";
  assert(validGameKinds.has(gameKind), `type de jeu valide pour ${app.id}`);
  if (recentGameIds.has(app.id)) {
    assert(validGameKinds.has(app.gameKind), `type explicite du jeu récent ${app.id}`);
  }
  if (gameKind === "Fan games") {
    assert(Boolean(String(baseGame).trim()), `jeu ou franchise de base renseigné pour le fan-game ${app.id}`);
  }
}
assert(
  apps.filter((app) => app?.category === "Jeux").every((app) => genreNames.has(app.genre || mappedGameIds.get(app.id))),
  "la taxonomie couvre tous les jeux du catalogue"
);

const anotherDay = apps.find((app) => app?.id === "another-day-z");
assert(Boolean(anotherDay), "AnotherDay original entry is present");
assert((anotherDay?.gameKind || (legacyFanGameBases.has(anotherDay?.id) ? "Fan games" : "Jeux originaux")) === "Jeux originaux", "AnotherDay is an original game");
assert(!String(anotherDay?.baseGame || legacyFanGameBases.get(anotherDay?.id) || "").trim(), "AnotherDay has no base game");

for (const release of releases) {
  assert(Array.isArray(release?.appIds), "appIds est un tableau pour la version " + (release?.version || "inconnue"));
  for (const id of release?.appIds || []) {
    assert(apps.some((app) => app.id === id), "application du journal connue: " + id);
  }
}
const trackedWaveIds = new Set([
  "intravore",
  "nexus-of-torment",
  "jawa-the-duskmen",
  "mecha-overdrive",
  "spermatozoid-kart-omega",
  "riff-rush"
]);
for (const id of trackedWaveIds) {
  const app = apps.find((entry) => entry?.id === id);
  assert(Boolean(app), "jeu suivi présent: " + id);
  if (!app) continue;
  assert(["upcoming", "published"].includes(app.releaseState), "état de publication explicite pour " + id);
  assert(Number.isFinite(Date.parse(app.addedAt)), "date d'ajout ISO valide pour " + id);
  if (app.releaseState === "upcoming") {
    assert(!app.link, "le jeu à venir " + id + " n'invente aucun lien public");
  } else {
    assert(Boolean(app.link), "le jeu publié " + id + " possède un lien public");
  }
}
const resolvedGameKinds = apps.filter((app) => app?.category === "Jeux").map((app) => app.gameKind || (legacyFanGameBases.has(app.id) ? "Fan games" : "Jeux originaux"));
assert(resolvedGameKinds.includes("Jeux originaux"), "le catalogue contient des jeux originaux");
assert(resolvedGameKinds.includes("Fan games"), "le catalogue contient des fan-games");
const ids = new Set();
const images = new Set();
const presentations = new Set();
for (const app of apps) {
  assert(Boolean(app?.id && app?.name && app?.category && app?.description), `champs obligatoires présents pour ${app?.id || "entrée inconnue"}`);
  assert(!ids.has(app.id), `identifiant unique: ${app.id}`);
  ids.add(app.id);

  const releaseState = app.releaseState || (app.link ? "published" : "upcoming");
  assert(["published", "upcoming"].includes(releaseState), "releaseState valide pour " + app.id);
  assert(!app.addedAt || Number.isFinite(Date.parse(app.addedAt)), "addedAt ISO valide lorsqu il est renseigné pour " + app.id);
  if (!app.link) {
    assert(releaseState === "upcoming", "absence de lien réservée à une entrée upcoming pour " + app.id);
  } else {
    assert(releaseState === "published", "entrée avec lien marquée published pour " + app.id);
    try {
      const url = new URL(app.link);
      assert(["https:", "http:", "steam:", "file:"].includes(url.protocol), `protocole autorisé pour ${app.id}`);
    } catch {
      failures.push(`lien invalide pour ${app.id}: ${app.link}`);
    }
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

const openAiArtPath = "assets/openai-art-manifest.json";
assert(await exists(openAiArtPath), "le manifeste des illustrations OpenAI existe");
let openAiArt = null;
if (await exists(openAiArtPath)) {
  try {
    openAiArt = JSON.parse(await readFile(path.join(root, openAiArtPath), "utf8"));
  } catch (error) {
    failures.push("manifeste OpenAI illisible: " + error.message);
  }
}
assert(openAiArt?.provider === "OpenAI", "le manifeste déclare OpenAI comme fournisseur");
assert(openAiArt?.generator === "image_gen", "le manifeste déclare image_gen comme générateur");
assert(Array.isArray(openAiArt?.apps), "le manifeste OpenAI expose une liste d'applications");
const openAiEntries = Array.isArray(openAiArt?.apps) ? openAiArt.apps : [];
assert(openAiEntries.length === apps.length, "une provenance OpenAI exactement par application");
assert(new Set(openAiEntries.map((entry) => entry?.id)).size === apps.length, "les provenances OpenAI ont des IDs uniques");
for (const app of apps) {
  const entry = openAiEntries.find((candidate) => candidate?.id === app.id);
  assert(Boolean(entry), `provenance OpenAI présente pour ${app.id}`);
  if (!entry) continue;
  assert(entry.provider === "OpenAI" && entry.generator === "image_gen", `générateur OpenAI valide pour ${app.id}`);
  assert(entry.asset === app.presentation, `illustration OpenAI utilisée comme présentation pour ${app.id}`);
  assert(Boolean(String(entry.generationRef || "").trim()), `référence de génération présente pour ${app.id}`);
  assert(/^[a-f0-9]{64}$/.test(String(entry.sha256 || "")), `SHA-256 valide pour ${app.id}`);
  if (await exists(entry.asset)) {
    const digest = createHash("sha256").update(await readFile(path.join(root, entry.asset))).digest("hex");
    assert(digest === entry.sha256, `SHA-256 fidèle pour ${app.id}`);
  }
}
for (const entry of openAiEntries) {
  assert(ids.has(entry?.id), `provenance OpenAI attribuée à une application connue: ${entry?.id || "inconnue"}`);
}

const galleryDocument = JSON.parse(await readFile(path.join(root, "assets", "app-gallery.json"), "utf8"));
const galleryMap = galleryDocument.galleries || galleryDocument.apps || galleryDocument;
const galleryPaths = new Set();
const previousPresentationPaths = new Set();
const previousPresentationHashes = new Set();
const appsWithoutPreviousPresentation = new Set([
  "elyra-grand-pas",
  "intravore",
  "nexus-of-torment",
  "jawa-the-duskmen",
  "mecha-overdrive",
  "spermatozoid-kart-omega",
  "riff-rush"
]);
for (const app of apps) {
  const entry = galleryMap[app.id];
  const gallery = Array.isArray(entry) ? entry : entry?.images;
  const previousPresentation = Array.isArray(entry) ? "" : String(entry?.previousPresentation || "").replaceAll("\\", "/");
  assert(Array.isArray(gallery) && gallery.length >= 5, `galerie complète pour ${app.id}`);

  if (appsWithoutPreviousPresentation.has(app.id)) {
    assert(!previousPresentation, `absence historique explicitement autorisée pour ${app.id}`);
  } else {
    assert(Boolean(previousPresentation), `illustration précédente renseignée pour ${app.id}`);
    if (previousPresentation) {
      assert(
        previousPresentation.startsWith("assets/presentations/previous/"),
        `illustration précédente rangée dans le répertoire historique pour ${app.id}`
      );
      assert(!previousPresentationPaths.has(previousPresentation), `chemin d'illustration précédente unique pour ${app.id}`);
      previousPresentationPaths.add(previousPresentation);
      assert(previousPresentation !== app.presentation, `illustration précédente distincte de la présentation OpenAI pour ${app.id}`);
      assert(previousPresentation !== app.image, `illustration précédente distincte de l'aperçu pour ${app.id}`);
      assert(!gallery?.includes(previousPresentation), `illustration précédente séparée des captures pour ${app.id}`);
      const previousPresentationExists = await exists(previousPresentation);
      assert(previousPresentationExists, `illustration précédente présente pour ${app.id}`);
      if (previousPresentationExists) {
        await assertRasterFormat(previousPresentation);
        const previousBytes = await readFile(path.join(root, previousPresentation));
        const previousDigest = createHash("sha256").update(previousBytes).digest("hex");
        assert(!previousPresentationHashes.has(previousDigest), `contenu d'illustration précédente unique pour ${app.id}`);
        previousPresentationHashes.add(previousDigest);
        if (await exists(app.presentation)) {
          const currentDigest = createHash("sha256").update(await readFile(path.join(root, app.presentation))).digest("hex");
          assert(previousDigest !== currentDigest, `ancien visuel réellement distinct de l'illustration OpenAI pour ${app.id}`);
        }
      }
    }
  }

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

let previousPresentationFiles = [];
const previousPresentationDirectory = "assets/presentations/previous";
const previousPresentationDirectoryExists = await exists(previousPresentationDirectory);
assert(previousPresentationDirectoryExists, "le répertoire des illustrations précédentes existe");
if (previousPresentationDirectoryExists) {
  previousPresentationFiles = (await readdir(path.join(root, previousPresentationDirectory)))
    .filter((name) => rasterExtensionPattern.test(name))
    .map((name) => `${previousPresentationDirectory}/${name}`);
}
assert(appsWithoutPreviousPresentation.size === 7, "sept applications sans historique explicitement autorisées");
for (const id of appsWithoutPreviousPresentation) {
  assert(ids.has(id), `exception historique attribuée à une application connue: ${id}`);
}
assert(previousPresentationPaths.size === 112, "exactement 112 illustrations précédentes référencées");
assert(previousPresentationHashes.size === 112, "exactement 112 contenus historiques distincts");
assert(
  previousPresentationPaths.size === apps.length - appsWithoutPreviousPresentation.size,
  "toutes les applications antérieures possèdent leur illustration précédente"
);
assert(previousPresentationFiles.length === 112, "exactement 112 fichiers historiques présents");
for (const previousPresentationFile of previousPresentationFiles) {
  assert(previousPresentationPaths.has(previousPresentationFile), `illustration précédente référencée: ${previousPresentationFile}`);
  await assertRasterFormat(previousPresentationFile);
}
for (const id of Object.keys(galleryMap).filter((id) => id !== "notes")) {
  assert(ids.has(id), `galerie attribuée à une application connue: ${id}`);
}

assert(images.size === apps.length, "un aperçu exactement par application");
assert(presentations.size === apps.length, "une présentation exactement par application");
assert(
  Object.keys(galleryMap).filter((id) => id !== "notes").length === apps.length,
  "une galerie exactement par application"
);
assert(html.includes("previousPresentation"), "l'interface charge previousPresentation depuis les galeries");
assert(html.includes("sanitizeImageUrl(app.previousPresentation)"), "l'illustration précédente participe au carrousel et au contrôle média");
assert(html.includes("Illustration précédente"), "le libellé Illustration précédente est visible dans l'interface");
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
assert(await exists("assets/upcoming-games.json"), "la configuration upcoming existe");
let upcomingConfig = null;
if (await exists("assets/upcoming-games.json")) {
  try {
    upcomingConfig = JSON.parse(await readFile(path.join(root, "assets", "upcoming-games.json"), "utf8"));
  } catch (error) {
    failures.push("configuration upcoming illisible: " + error.message);
  }
}
assert(Boolean(String(upcomingConfig?.owner || "").trim()), "la configuration upcoming déclare un propriétaire GitHub");
assert(Array.isArray(upcomingConfig?.games) && upcomingConfig.games.length > 0, "la configuration upcoming suit au moins un jeu");
const configuredUpcomingIds = new Set();
for (const game of upcomingConfig?.games || []) {
  assert(Boolean(game?.id) && !configuredUpcomingIds.has(game.id), "jeu upcoming configuré une seule fois: " + (game?.id || "inconnu"));
  configuredUpcomingIds.add(game?.id);
  assert(trackedWaveIds.has(game?.id), "jeu upcoming limité à la vague suivie: " + (game?.id || "inconnu"));
  assert(Array.isArray(game?.githubRepos) && game.githubRepos.length > 0, "candidats GitHub présents pour " + game?.id);
  assert(Array.isArray(game?.vercelProjects) && game.vercelProjects.length > 0, "candidats Vercel présents pour " + game?.id);
  assert(Array.isArray(game?.publicCandidates) && game.publicCandidates.length > 0, "candidats publics présents pour " + game?.id);
  for (const candidate of game?.publicCandidates || []) {
    try {
      assert(new URL(candidate).protocol === "https:", "candidat public HTTPS pour " + game?.id);
    } catch {
      failures.push("candidat public invalide pour " + game?.id + ": " + candidate);
    }
  }
}
assert(
  configuredUpcomingIds.size === trackedWaveIds.size && [...trackedWaveIds].every((id) => configuredUpcomingIds.has(id)),
  "la configuration upcoming couvre exactement les six jeux suivis"
);
assert(await exists("scripts/sync-upcoming-games.mjs"), "le script de synchronisation upcoming existe");
assert(await exists(".github/workflows/sync-upcoming-games.yml"), "le workflow de synchronisation upcoming existe");
if (await exists(".github/workflows/sync-upcoming-games.yml")) {
  const syncWorkflow = await readFile(path.join(root, ".github", "workflows", "sync-upcoming-games.yml"), "utf8");
  assert(/workflow_dispatch\s*:/.test(syncWorkflow), "la synchronisation peut être lancée manuellement");
  assert(/schedule\s*:/.test(syncWorkflow) && /cron\s*:/.test(syncWorkflow), "la synchronisation est planifiée");
  assert(/pull-request|create-pull-request|gh pr create/i.test(syncWorkflow), "la synchronisation publie ses changements par pull request");
}
if (await exists("scripts/sync-upcoming-games.mjs")) {
  const syncScript = await readFile(path.join(root, "scripts", "sync-upcoming-games.mjs"), "utf8");
  assert(
    syncScript.includes('from "node:fs/promises"') && syncScript.includes("main().catch"),
    "scripts/sync-upcoming-games.mjs possède une structure ESM exécutable"
  );
  assert(syncScript.includes("upcoming-games.json"), "le sync consomme sa liste blanche upcoming");
  assert(/--write/.test(syncScript), "le sync sépare vérification et écriture");
  assert(/published/.test(syncScript) && /upcoming/.test(syncScript), "le sync gère les deux états de publication");
}


const serviceWorker = await readFile(path.join(root, "sw.js"), "utf8");
for (const shellAsset of ["assets/recent-games.js", "assets/catalogue-updates.js", "assets/upcoming-games.json", "assets/social-features.css", "assets/social-features.js"]) {
  assert(serviceWorker.includes(`/${shellAsset}`), `asset dynamique préchargé hors ligne: ${shellAsset}`);
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
assert(appShell.includes("/assets/openai-art-manifest.json"), "le manifeste OpenAI fait partie du shell hors ligne");
assert(appShellBytes <= 5 * 1024 * 1024, "le préchargement APP_SHELL reste inférieur à 5 Mo");
assert(serviceWorker.includes('const CACHE_NAME = "launcher-shell-v24"'), "le cache applicatif v1.8 utilise launcher-shell-v24");
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
const mediaFiles = [...previewFiles, ...presentationFiles, ...previousPresentationPaths, ...galleryPaths];
assert(new Set(mediaFiles).size === mediaFiles.length, "le compte total des médias ne contient aucun doublon");
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
    `${presentationFiles.length} présentations, ${previousPresentationPaths.size} illustrations précédentes, ` +
    `${galleryPaths.size} images de galerie, ${mediaFiles.length} médias au total et ` +
    `${Math.round(appShellBytes / 1024)} Ko préchargés.`
  );
}
