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
const syncFieldDeclaration = html.match(/const OFFICIAL_SYNC_FIELDS\s*=\s*(\[[^;]*\]);/);
const officialSyncFields = syncFieldDeclaration
  ? JSON.parse(syncFieldDeclaration[1])
  : [];
assert(
  ["link", "status", "releaseState", "addedAt", "description", "pitch",
    "accessPolicy", "mediaPendingReview"].every((field) => officialSyncFields.includes(field)),
  "la migration locale synchronise les champs de publication officiels"
);
// Execute the real launcher hydration function in isolation with representative
// browser state: old official preview paths must migrate, user overrides must survive.
const migrationMatch = inlineScriptBody.match(/const OFFICIAL_PREVIEW_MIGRATIONS = new Map\((\[[\s\S]*?\])\);/);
const appLoaderStart = inlineScriptBody.indexOf("    function loadApps() {");
const appLoaderEnd = inlineScriptBody.indexOf("    function loadFavorites()", appLoaderStart);
assert(Boolean(migrationMatch && appLoaderStart > 0 && appLoaderEnd > appLoaderStart),
  "migration de preview extraite du véritable module du launcher");
if (migrationMatch && appLoaderStart > 0 && appLoaderEnd > appLoaderStart) {
  try {
    const starterApps = [
      { id: "world-hive-wars", image: "assets/previews/world-hive-wars.jpg" },
      { id: "moustique-the-video-game", image: "assets/previews/moustique-the-video-game.jpg" },
      { id: "custom-game", image: "assets/previews/custom-game.jpg" }
    ];
    const saved = [
      { id: "world-hive-wars", image: "https://launcher-applications.vercel.app/assets/previews/world-hive-wars.webp" },
      { id: "moustique-the-video-game", image: "assets/previews/moustique-the-video-game.webp" },
      { id: "custom-game", image: "https://example.com/custom-illustration.png" }
    ];
    const environment = {
      URL,
      starterApps,
      saved,
      document: { baseURI: "https://launcher-applications.vercel.app/" },
      storeKey: "test-fixture",
      removedStarterIds: new Set(),
      OFFICIAL_SYNC_FIELDS: ["link", "status", "releaseState", "addedAt", "description", "pitch"],
      safeReadArray: () => saved,
      sanitizeImageUrl: (value) => value ? new URL(value, "https://launcher-applications.vercel.app/").href : "",
      normalizeApp: (app) => app
    };
    const expression = `(() => {
      const OFFICIAL_PREVIEW_MIGRATIONS = new Map(${migrationMatch[1]});
      ${inlineScriptBody.slice(appLoaderStart, appLoaderEnd)}
      return loadApps();
    })()`;
    const hydrated = vm.runInNewContext(expression, environment, { timeout: 1200 });
    assert(hydrated.find((app) => app.id === "world-hive-wars")?.image === starterApps[0].image,
      "preview officiel ancien WORLD HIVE WARS corrigé même dans un vieux catalogue local");
    assert(hydrated.find((app) => app.id === "moustique-the-video-game")?.image === starterApps[1].image,
      "preview relatif WebP MOUSTIQUE migré vers JPEG");
    assert(hydrated.find((app) => app.id === "custom-game")?.image === saved[2].image,
      "une illustration volontairement personnalisée n'est pas écrasée par la migration");
  } catch (error) {
    failures.push("Test fonctionnel de migration des aperçus: " + error.message);
  }
}

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
assert(recentApps.length >= 80, "le catalogue récent contient au moins les 80 jeux de référence");
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

const recoveredApps = apps.filter((app) => app.recoveredGame === true);
const establishedApps = apps.filter((app) => app.recoveredGame !== true);
const pendingMediaApps = recoveredApps.filter((app) => app.mediaPendingReview === true);
const recoveredWithNativeMedia = recoveredApps.filter((app) => app.mediaPendingReview !== true);
assert(establishedApps.length === 140, "les 140 applications historiques et leurs assets restent intacts");
assert(recoveredApps.length >= 14 && recoveredApps.length === pendingMediaApps.length + recoveredWithNativeMedia.length,
  "toutes les découvertes, web ou locales, sont suivies sans inventer de média");
assert(new Set(recoveredApps.map((app) => app.id)).size === recoveredApps.length,
  "les nouvelles fiches sont uniques");
assert(apps.length === 140 + recoveredApps.length, "les 140 applications initiales sont complétées par tous les jeux retrouvés");
assert(apps.filter((app) => app?.category === "Jeux").length === 127 + recoveredApps.length,
  "le nombre de jeux intègre les nouvelles fiches vérifiées");
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
  if (app.mediaPendingReview) {
    assert(!app.image && !app.presentation, `aucun visuel synthétique ou non vérifié n'est attribué à ${app.id}`);
    assert(app.category === "Jeux" && releaseState === "published" && Boolean(app.link),
      `jeu sans visuel authentifié avec lien publié et catégorie Jeux: ${app.id}`);
    continue;
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
assert(openAiEntries.length === establishedApps.length, "les 140 provenances d'art historique OpenAI sont conservées");
assert(new Set(openAiEntries.map((entry) => entry?.id)).size === establishedApps.length, "les provenances OpenAI historiques ont des IDs uniques");
for (const app of establishedApps) {
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

const nativeMedia = JSON.parse(await readFile(path.join(root, "assets/source-native-media-manifest.json"), "utf8"));
const nativeEntries = Array.isArray(nativeMedia?.assets) ? nativeMedia.assets : [];
assert(nativeEntries.length === recoveredWithNativeMedia.length,
  "chaque nouveau jeu illustré dispose d'une provenance de capture native distincte de la génération OpenAI");
for (const app of recoveredWithNativeMedia) {
  const source = nativeEntries.find((entry) => entry.id === app.id);
  assert(Boolean(source), `source média du jeu retrouvé ${app.id} vérifiée`);
  assert(source?.presentation === app.presentation && source?.preview === app.image,
    `vues natives documentées pour ${app.id}`);
  assert(source?.captureProof && await exists(source.captureProof),
    `rapport de capture effective du jeu retrouvé ${app.id}`);
  if(source?.sha256 && await exists(source.presentation)) {
    const bytes = await readFile(path.join(root, source.presentation));
    assert(createHash("sha256").update(bytes).digest("hex") === source.sha256,
      `empreinte de la présentation native ${app.id}`);
  }
}
for (const item of nativeEntries) assert(recoveredApps.some((x)=>x.id === item.id),
  `aucune provenance native ne peut être attribuée à un jeu inconnu: ${item.id}`);

const galleryDocument = JSON.parse(await readFile(path.join(root, "assets", "app-gallery.json"), "utf8"));
const galleryMap = galleryDocument.galleries || galleryDocument.apps || galleryDocument;
const archiveDocument = JSON.parse(await readFile(path.join(root, "assets", "app-gallery-admin.json"), "utf8"));
const archiveMap = archiveDocument.previousPresentations || {};
const fidelityMatrix = JSON.parse(await readFile(path.join(root, "docs", "MEDIA_FIDELITY_MATRIX_2026-11-01.json"), "utf8"));
assert(fidelityMatrix.summary?.entries === apps.length, "matrice de fidélité renseignée pour toutes les fiches");
const fidelityItems = new Map((fidelityMatrix.entries || []).map((item) => [item.id, item]));
assert(fidelityItems.size === apps.length, "une seule fiche de revue média par application");
assert(fidelityItems.get("malaise-party")?.accessPolicy === "vercel-sso", "Malaise Party est identifié comme protégé par Vercel SSO");
const verifiedGalleries = [...fidelityItems.values()].filter((item) => item.screenshotCaptureProof);
const verifiedHistoricGalleries = verifiedGalleries.filter((item) => !recoveredApps.some((app) => app.id === item.id));
const verifiedScreenshots = verifiedGalleries.reduce((sum, item) => sum + item.screenshotCount, 0);
const historicVerifiedScreenshots = verifiedHistoricGalleries.reduce((sum, item) => sum + item.screenshotCount, 0);
const previousScreenshots = Object.values(archiveDocument.previousScreenshots || {}).flat();
const previousPreviews = Object.values(archiveDocument.previousPreviews || {});
assert(verifiedGalleries.length >= 5 && verifiedScreenshots === verifiedGalleries.length * 5, "au moins cinq galeries et cinq images par galerie vérifiées par origine");
assert(fidelityMatrix.summary?.recapturedScreenshotCount === verifiedScreenshots, "résumé des captures mises à jour calculé depuis les preuves");
assert(fidelityMatrix.summary?.awaitingRecaptureCount === fidelityMatrix.summary.screenshots - historicVerifiedScreenshots,
  "le reste des 700 captures historiques reste indépendant des nouveaux jeux");
assert(previousScreenshots.length === historicVerifiedScreenshots && fidelityMatrix.summary?.archivedScreenshotCount === previousScreenshots.length,
  "tous les anciens screenshots de fiches existantes sont conservés");
assert(previousPreviews.length === verifiedHistoricGalleries.length && fidelityMatrix.summary?.archivedPreviewCount === previousPreviews.length,
  "un ancien aperçu conservé pour chaque galerie historique renouvelée");
assert(fidelityMatrix.summary?.mediaPendingGames === pendingMediaApps.length,
  "le suivi distingue les nouveaux jeux sans captures des captures natives acceptées");
assert(fidelityMatrix.summary?.missingNewGameScreenshots === pendingMediaApps.length * 5,
  "les slots de capture encore ouverts restent visibles");
assert(fidelityMatrix.summary?.sourceVerifiedGalleries === verifiedGalleries.length, "niveaux de preuves et galeries cohérents");
for (const app of apps) {
  const item = fidelityItems.get(app.id);
  assert(Boolean(item), `fiche média présente pour ${app.id}`);
  if (!item) continue;
  assert(item.productionLink === (app.link || null), `lien officiel suivi pour ${app.id}`);
  assert(item.presentation === app.presentation, `présentation suivie pour ${app.id}`);
  assert(item.preview === app.image, `aperçu suivi pour ${app.id}`);
  assert(item.screenshotCount === (app.mediaPendingReview ? 0 : 5), `nombre de captures cohérent avec la validation média de ${app.id}`);
  if (app.mediaPendingReview) {
    assert(item.screenshotFreshness === "awaiting-first-capture", `jeu retrouvé sans capture artificielle: ${app.id}`);
    assert(!item.screenshotCaptureProof && !item.presentation && !item.preview,
      `aucune référence média fictive n'est ajoutée à ${app.id}`);
  }
  assert(item.historicalIllustrationStored === Boolean(archiveMap[app.id]), `archive suivie pour ${app.id}`);
  assert(item.artFidelity === "not-reviewed", `aucune fidélité 1:1 certifiée sans contrôle visuel pour ${app.id}`);
}
const galleryPaths = new Set();
const previousPresentationPaths = new Set();
const previousPresentationHashes = new Set();
const appsWithoutPreviousPresentation = new Set([
  ...recoveredApps.map((app) => app.id),
  "elyra-grand-pas",
  "intravore",
  "nexus-of-torment",
  "jawa-the-duskmen",
  "mecha-overdrive",
  "spermatozoid-kart-omega",
  "riff-rush",
  "backrooms-liminal-escape",
  "malaise-party",
  "neon-clash-arena-protocol",
  "planck-antimatter-dominion",
  "the-house-of-the-dead-25d",
  "gearstorm-boss-circuit",
  "aliens-tantalus-frontier",
  "jingle-duel",
  "black-case-inventory-protocol",
  "vitrineverse",
  "pip-le-tresor-des-huit-pattes",
  "echo-rift",
  "ombre-geek",
  "son-of-a-legacy-forge",
  "veilbound-les-visages-du-monde-brise",
  "scp-foundation-site-director",
  "soma-massilia",
  "avp-hunt-hive-tcg",
  "echobound",
  "deadwall-last-enclosure",
  "aziz-la-lumiere-dort"
]);
for (const app of apps) {
  const entry = galleryMap[app.id];
  const gallery = Array.isArray(entry) ? entry : entry?.images;
  assert(!entry?.previousPresentation, `le catalogue public ne dévoile pas les archives pour ${app.id}`);
  const previousPresentation = String(archiveMap[app.id] || "").replaceAll("\\", "/");
  assert(Array.isArray(gallery) && (app.mediaPendingReview ? gallery.length === 0 : gallery.length >= 5),
    `galerie conforme au statut de preuve pour ${app.id}`);

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

// Evidence-gated live screenshot replacement for TRIARCHE.
const triarchId = "triarche-ciel-rouge";
const triarchGallery = galleryMap[triarchId];
const triarchProofPath = "docs/media-proof/triarch-gameplay-2026-11-01.json";
assert(await exists(triarchProofPath), "preuve de recapture native TRIARCHE présente");
if (await exists(triarchProofPath)) {
  const proof = JSON.parse(await readFile(path.join(root, triarchProofPath), "utf8"));
  const legacyShots = archiveDocument.previousScreenshots?.[triarchId];
  const legacyPreview = archiveDocument.previousPreviews?.[triarchId];
  assert(proof.notGeneratedArt === true && proof.captureType === "native-browser-gameplay", "TRIARCHE capturé en navigateur, pas illustré artificiellement");
  assert(proof.source === "https://triarche-ciel-rouge.vercel.app/", "captures prises sur la production du jeu");
  assert(proof.runtimeVersion === "1.0.0", "version de gameplay documentée");
  assert(Array.isArray(proof.scenes) && proof.scenes.length === 5, "cinq scènes TRIARCHE vérifiées");
  assert(Array.isArray(legacyShots) && legacyShots.length === 5, "cinq anciens screenshots archivés");
  assert(typeof legacyPreview === "string" && await exists(legacyPreview), "ancien aperçu TRIARCHE archivé");
  assert(Array.isArray(triarchGallery?.labels) && triarchGallery.labels.length === 5, "titres de scènes de la galerie");
  assert(triarchGallery?.captureVersion === proof.runtimeVersion, "version source et galerie raccordées");
  assert(triarchGallery?.captureType === "real-gameplay", "captures identifiées comme gameplay réel");
  for (let i = 0; i < 5; i++) {
    const item = proof.scenes?.[i];
    const imagePath = triarchGallery.images[i];
    const archivePath = legacyShots?.[i];
    assert(item?.verifiedState === "playing", `capture TRIARCHE ${i + 1} faite en jeu`);
    assert(item?.path === imagePath, `capture TRIARCHE ${i + 1} issue de sa preuve`);
    assert(item?.label === triarchGallery.labels[i], `description de capture TRIARCHE ${i + 1} cohérente`);
    assert(await exists(archivePath), `ancien screenshot TRIARCHE ${i + 1} conservé`);
    if (await exists(imagePath)) {
      const shot = await readFile(path.join(root, imagePath));
      assert(createHash("sha256").update(shot).digest("hex") === item?.sha256, `empreinte native TRIARCHE ${i + 1} exacte`);
      assert(shot.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", `capture TRIARCHE ${i + 1} PNG`);
      assert(shot.readUInt32BE(16) === 1280 && shot.readUInt32BE(20) === 720, `capture TRIARCHE ${i + 1} de 1280x720`);
      if (await exists(archivePath)) {
        const archived = await readFile(path.join(root, archivePath));
        assert(!shot.equals(archived), `capture TRIARCHE ${i + 1} différente du menu historique`);
      }
    }
  }
}

// Validate DEADWALL 1.74 as a separate real-browser proof, not inherited menu captures.
const deadwallId = "deadwall-last-enclosure";
const deadwallProofPath = "docs/media-proof/deadwall-gameplay-2026-11-01.json";
assert(await exists(deadwallProofPath), "preuve de gameplay DEADWALL 1.74");
if (await exists(deadwallProofPath)) {
  const evidence = JSON.parse(await readFile(path.join(root, deadwallProofPath), "utf8"));
  const record = galleryMap[deadwallId];
  const oldShots = archiveDocument.previousScreenshots?.[deadwallId] || [];
  const oldPreview = archiveDocument.previousPreviews?.[deadwallId];
  const listed = fidelityMatrix.entries?.find((entry) => entry.id === deadwallId);
  assert(evidence.notGeneratedArt && evidence.captureType === "native-browser-gameplay", "DEADWALL images natives, non synthétiques");
  assert(evidence.source === "https://deadwall-last-enclosure.vercel.app/", "DEADWALL capturé à la source publique officielle");
  assert(evidence.version === "1.74.0" && record.captureVersion === evidence.version, "DEADWALL version source et galerie 1.74");
  assert(evidence.scenario?.actorMotionConfirmed && evidence.scenario?.seed === 17117, "déplacement de l'acteur vérifié en vrai gameplay");
  assert(record.captureType === "real-gameplay", "vues DEADWALL identifiées");
  assert(record.presentationReview === "pending-fidelity", "une présentation artistique non validée n'est pas prise pour le gameplay");
  assert(Array.isArray(evidence.scenes) && evidence.scenes.length === 5, "cinq scènes natives DEADWALL");
  assert(Array.isArray(record.labels) && record.labels.length === 5, "cinq intitulés détaillés DEADWALL");
  assert(oldShots.length === 5, "cinq anciennes vues DEADWALL sauvegardées");
  assert(Boolean(oldPreview) && await exists(oldPreview), "ancien aperçu DEADWALL sauvegardé");
  assert(listed?.screenshotFreshness === "up-to-date" && listed.screenshotCaptureProof === deadwallProofPath, "dossier media DEADWALL mis à jour depuis les preuves");
  for (let index = 0; index < 5; index++) {
    const shot = evidence.scenes[index];
    const pathImage = record.images[index];
    const pathOld = oldShots[index];
    assert(shot.path === pathImage && shot.label === record.labels[index], `label et source DEADWALL ${index+1}`);
    assert(shot.state === "playing" && shot.campaignSeed === 17117, `vraie campagne DEADWALL ${index+1}`);
    assert(await exists(pathOld), `ancienne capture DEADWALL ${index+1} conservée`);
    if (await exists(pathImage)) {
      const bytes = await readFile(path.join(root, pathImage));
      assert(createHash("sha256").update(bytes).digest("hex") === shot.sha256, `empreinte de capture DEADWALL ${index+1} certifiée`);
      assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.readUInt32BE(16) === 1280 && bytes.readUInt32BE(20) === 720, `dimensions 1280×720 de DEADWALL ${index+1}`);
      if (await exists(pathOld)) {
        const older = await readFile(path.join(root, pathOld));
        assert(!older.equals(bytes), `ancienne et nouvelle capture DEADWALL ${index+1} distinctes`);
      }
    }
  }
}

// Verify five native WebGL images and their original backups for Yautja Apex.
const yautjaApexId = "yautja-apex-hunt";
const yautjaApexProofPath = "docs/media-proof/yautja-apex-gameplay-2026-11-01.json";
assert(await exists(yautjaApexProofPath), "preuve WebGL Yautja Apex présente");
if (await exists(yautjaApexProofPath)) {
  const record = galleryMap[yautjaApexId];
  const evidence = JSON.parse(await readFile(path.join(root, yautjaApexProofPath), "utf8"));
  const archiveShots = archiveDocument.previousScreenshots?.[yautjaApexId] || [];
  const archivePreview = archiveDocument.previousPreviews?.[yautjaApexId];
  const tracked = fidelityMatrix.entries?.find((entry) => entry.id === yautjaApexId);
  assert(evidence.notGeneratedArt === true && evidence.captureType === "native-browser-gameplay", "cinq captures Yautja issues du navigateur, non générées");
  assert(evidence.source === "https://yautja-apex-hunt.vercel.app/", "source officielle de la chasse Yautja");
  assert(evidence.releaseRef?.deploymentId === "dpl_3bVUaoiRC2tSoXUeJ6YGUnySwwPu", "source publiée confirmée pour Yautja");
  assert(evidence.releaseRef?.gitCommit === "5e386e0c1efc5c5401fbe66848cbc82130668002", "SHA source identique à Vercel");
  assert(evidence.hubAccessVerified, "croiseur Yautja ouvert dans le vrai jeu");
  assert(record.captureType === "real-gameplay" && record.presentationReview === "pending-fidelity", "captures réelles présentées avant l'illustration non qualifiée");
  assert(record.captureVersion === "1.13.0 (source)", "version de source distinguée de la version runtime");
  assert(tracked?.screenshotCaptureProof === yautjaApexProofPath && tracked?.screenshotFreshness === "up-to-date", "suivi des captures Yautja mis à jour");
  assert(Array.isArray(evidence.scenes) && evidence.scenes.length === 5 && record.labels?.length === 5 && record.images?.length === 5, "cinq scènes Yautja identifiées");
  assert(archiveShots.length === 5 && archivePreview && await exists(archivePreview), "ancien aperçu et captures Yautja archivés");
  assert(evidence.scenes?.[4]?.phase === "HUNT" && evidence.scenes?.[4]?.activeBoss, "dernier screenshot de vraie chasse et boss présent");
  for (let index = 0; index < 5; index++) {
    const shot = evidence.scenes[index];
    const pathImage = record.images[index];
    const pathOld = archiveShots[index];
    assert(shot.path === pathImage && record.labels[index] === shot.label && shot.hasRendered, `screenshot Yautja ${index + 1} rendu et renseigné`);
    assert(index === 4 ? shot.phase === "HUNT" : shot.phase === "HUB", `phase du jeu Yautja ${index + 1} correcte`);
    assert(await exists(pathOld), `ancienne vue Yautja ${index + 1} conservée`);
    if (await exists(pathImage)) {
      const bytes = await readFile(path.join(root, pathImage));
      assert(createHash("sha256").update(bytes).digest("hex") === shot.sha256, `capture Yautja ${index + 1} empreinte exacte`);
      assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.readUInt32BE(16) === 1280 && bytes.readUInt32BE(20) === 720, `capture Yautja ${index + 1} résolution 1280×720`);
      if (await exists(pathOld)) {
        const old = await readFile(path.join(root, pathOld));
        assert(!old.equals(bytes), `capture Yautja ${index + 1} réellement remplacée`);
      }
    }
  }
}

// Validate actual MOUSTIQUE WebGL2 screenshots and explicitly staged QA camera views.
const moustiqueId = "moustique-the-video-game";
const moustiqueProofPath = "docs/media-proof/moustique-webgl2-2026-11-01.json";
assert(await exists(moustiqueProofPath), "preuve des nouvelles captures WebGL2 MOUSTIQUE");
if (await exists(moustiqueProofPath)) {
  const evidence = JSON.parse(await readFile(path.join(root, moustiqueProofPath), "utf8"));
  const record = galleryMap[moustiqueId];
  const archivedShots = archiveDocument.previousScreenshots?.[moustiqueId] || [];
  const archivedPreview = archiveDocument.previousPreviews?.[moustiqueId];
  const row = fidelityMatrix.entries?.find((item) => item.id === moustiqueId);
  const active = apps.find((item) => item.id === moustiqueId);
  assert(evidence.notGeneratedArt === true && evidence.captureType === "real-webgl2-engine", "images MOUSTIQUE générées par le moteur WebGL2, non synthétisées");
  assert(evidence.version === "4.14.1-R11" && evidence.source === "https://moustique-the-video-game.vercel.app/", "version et URL de production MOUSTIQUE");
  assert(String(evidence.rendererMode || "").startsWith("WebGL 2"), "vrai renderer GPU logiciel WebGL2, non logique de repli");
  assert(evidence.stagingDisclosure?.includes("Slots 2-5"), "cadrages de QA annoncés séparément du gameplay");
  assert(record?.captureType === "real-engine-qa" && record.captureVersion === evidence.version, "origine et version du rendu clairement désignées");
  assert(record?.presentationReview === "pending-fidelity", "illustration MOUSTIQUE en attente de fidélité");
  assert(Array.isArray(record?.images) && record.images.length === 5 && record.labels?.length === 5, "cinq images MOUSTIQUE et légendes");
  assert(Array.isArray(evidence.scenes) && evidence.scenes.length === 5, "cinq preuves MOUSTIQUE");
  assert(archivedShots.length === 5 && archivedPreview && await exists(archivedPreview), "les six visuels WebP MOUSTIQUE archivés");
  assert(row?.screenshotCaptureProof === moustiqueProofPath && row?.screenshotFreshness === "up-to-date", "suivi MOUSTIQUE à jour");
  assert(active?.image === evidence.preview?.path && row?.preview === evidence.preview?.path, "aperçu de production et matrice raccordés");
  if (active?.image && await exists(active.image)) {
    const previewBytes = await readFile(path.join(root, active.image));
    assert(createHash("sha256").update(previewBytes).digest("hex") === evidence.preview.sha256, "empreinte de l'aperçu corrigé MOUSTIQUE");
    assert(previewBytes.subarray(0, 3).toString("hex") === "ffd8ff", "aperçu MOUSTIQUE JPEG lisible");
  }
  for (let i = 0; i < 5; i++) {
    const shot = evidence.scenes[i];
    const pathImage = record.images[i];
    const original = archivedShots[i];
    assert(shot.path === pathImage && shot.label === record.labels[i], `MOUSTIQUE capture ${i + 1} bien identifiée`);
    assert(shot.rendererMode === "webgl2" && shot.webgl2, `MOUSTIQUE capture ${i + 1} sur le moteur WebGL2`);
    assert(i === 0 ? shot.kind === "real-gameplay" && shot.state === "playing" : shot.kind === "qa-camera-real-render" && shot.state === "paused", `MOUSTIQUE capture ${i + 1} classifiée honnêtement`);
    assert(await exists(original), `ancienne image WebP MOUSTIQUE ${i + 1} conservée`);
    if (await exists(pathImage)) {
      const bytes = await readFile(path.join(root, pathImage));
      assert(createHash("sha256").update(bytes).digest("hex") === shot.sha256, `MOUSTIQUE screenshot ${i + 1} empreinte fidèle`);
      assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.readUInt32BE(16) === 1280 && bytes.readUInt32BE(20) === 720, `MOUSTIQUE screenshot ${i + 1} dimensions natives correctes`);
    }
  }
}

// WORLD HIVE WARS: authentic first-run campaign UI, without GPS or fabricated saves.
const worldHiveId = "world-hive-wars";
const worldHiveProof = "docs/media-proof/world-hive-045-campaign-2026-11-01.json";
assert(await exists(worldHiveProof), "WORLD HIVE WARS : cinq captures de campagne produites par la version 0.45");
if (await exists(worldHiveProof)) {
  const evidence = JSON.parse(await readFile(path.join(root, worldHiveProof), "utf8"));
  const item = galleryMap[worldHiveId];
  const originals = archiveDocument.previousScreenshots?.[worldHiveId] || [];
  const originalPreview = archiveDocument.previousPreviews?.[worldHiveId];
  const tracked = fidelityMatrix.entries?.find((entry) => entry.id === worldHiveId);
  const app = apps.find((entry) => entry.id === worldHiveId);
  assert(evidence.notGeneratedArt === true && evidence.captureType === "native-browser-campaign-ui", "WORLD HIVE WARS : capture originale, pas montage promotionnel");
  assert(evidence.source === "https://world-hive-wars.vercel.app/" && evidence.sourceRuntimeVersion === "0.45.0", "WORLD HIVE WARS : source et version du rendu");
  assert(evidence.privateSimulation === true && evidence.realOnboarding === true && evidence.saveInjected === false, "WORLD HIVE WARS : onboarding réel, sans sauvegarde ni GPS injectés");
  assert(evidence.initialState?.locationMode === "private" && evidence.initialState?.playerOnboarded && !evidence.initialState?.modalOpen, "WORLD HIVE WARS : campagne privée réellement prête");
  assert(evidence.sourceDeployment?.status === "READY" && evidence.sourceDeployment.gitSha === "80ce99282b12", "WORLD HIVE WARS : révision de production suivie");
  assert(item?.captureType === "real-ui-navigation" && item.captureVersion === "0.45.0", "WORLD HIVE WARS : originage UI distinct des combats CONTACT");
  assert(item?.presentationReview === "pending-fidelity", "WORLD HIVE WARS : art promotionnel non validé réservé au mode édition");
  assert(Array.isArray(item?.images) && item.images.length === 5 && item.labels?.length === 5, "WORLD HIVE WARS : cinq écrans natifs légendés");
  assert(Array.isArray(evidence.scenes) && evidence.scenes.length === 5, "WORLD HIVE WARS : cinq scènes réellement visitées");
  assert(originals.length === 5 && originalPreview && await exists(originalPreview), "WORLD HIVE WARS : les six anciens médias sont archivés");
  assert(tracked?.screenshotCaptureProof === worldHiveProof && tracked?.screenshotFreshness === "up-to-date", "WORLD HIVE WARS : matrice de QA mise à jour");
  assert(app?.image === evidence.preview?.path && tracked?.preview === evidence.preview?.path, "WORLD HIVE WARS : aperçu raccordé au catalogue");
  const screens = ["map", "colony", "defense", "squad", "codex"];
  if (await exists(app?.image || "")) {
    const bytes = await readFile(path.join(root, app.image));
    assert(createHash("sha256").update(bytes).digest("hex") === evidence.preview.sha256, "WORLD HIVE WARS : empreinte de l'aperçu natif");
    assert(bytes.subarray(0, 3).toString("hex") === "ffd8ff", "WORLD HIVE WARS : aperçu JPEG valide");
  }
  for (let i = 0; i < 5; i++) {
    const shot = evidence.scenes[i], url = item.images[i];
    assert(shot.path === url && shot.label === item.labels[i] && shot.kind === "real-campaign-interface", `WORLD HIVE WARS : scène ${i + 1} et sa légende`);
    assert(shot.screen === screens[i] && shot.uiState?.activeScreen === screens[i], `WORLD HIVE WARS : navigation native ${screens[i]}`);
    assert(shot.uiState?.appReady && shot.uiState?.playerOnboarded && shot.uiState.locationMode === "private" && !shot.uiState.modalOpen, `WORLD HIVE WARS : campagne vivante privée ${screens[i]}`);
    assert(await exists(originals[i]), `WORLD HIVE WARS : ancienne capture ${i + 1} sauvegardée`);
    if (await exists(url)) {
      const image = await readFile(path.join(root, url));
      assert(createHash("sha256").update(image).digest("hex") === shot.sha256, `WORLD HIVE WARS : SHA-256 image ${i + 1}`);
      assert(image.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && image.readUInt32BE(16) === 1280 && image.readUInt32BE(20) === 720, `WORLD HIVE WARS : résolution native ${i + 1}`);
    }
  }
}

// Shadow Codec: the verified source Side Ops board replaces an unreadable
// headless canvas; do not claim that a combat frame was captured.
const shadowId = "shadow-codec-ops";
const shadowProofPath = "docs/media-proof/shadow-codec-3100-modules-2026-11-01.json";
assert(await exists(shadowProofPath), "preuve source Shadow Codec 3.10 présente");
if (await exists(shadowProofPath)) {
  const proof = JSON.parse(await readFile(path.join(root, shadowProofPath), "utf8"));
  const entry = galleryMap[shadowId];
  const screen = proof.scenes?.[2];
  const old = archiveDocument.previousScreenshots?.[shadowId] || [];
  assert(proof.version === "3.10.0" && proof.noSyntheticCombat === true, "Shadow Codec 3.10 sans faux combat");
  assert(proof.releaseRef?.gitCommit === "77c830974fa672fc1746a875954af3e9bf39014e", "SHA source du build Shadow déjà vérifié");
  assert(proof.sideOpsGameplayCaptured === false && proof.sideOpsEngineLoaded === true, "moteur chargé mais pas de simulation visuelle trompeuse");
  assert(screen?.kind === "native-sideops-operations" && screen?.module === "sideops", "écran Shadow Side Ops identifié comme tableau d'opérations");
  assert(screen?.appState?.missions >= 4 && screen?.appState?.operationsVisible === true, "vraie liste d'opérations présente et ouverte");
  assert(screen?.sourceRoute === "https://shadow-codec-ops.vercel.app/?module=sideops", "route source Side Ops reconnue");
  assert(entry?.images?.[2] === screen?.path && entry?.labels?.[2] === screen?.label, "galerie Shadow alignée sur la preuve de capture");
  assert(old.length === 5 && await exists(old[2]), "ancienne vue Shadow conservée dans l'archive");
  if (screen?.path && await exists(screen.path)) {
    const bytes = await readFile(path.join(root, screen.path));
    assert(createHash("sha256").update(bytes).digest("hex") === screen.sha256, "nouveau tableau Shadow SHA256 vérifié");
    assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.readUInt32BE(16) === 1280 && bytes.readUInt32BE(20) === 720, "tableau Shadow capture réelle 1280×720");
  }
}

// CainOS: prove first-use calibration, real OS, 14-fighter selection and
// a legible, properly framed native Encore fight instead of a lab-only crop.
const cainosId = "cainos";
const cainosProofPath = "docs/media-proof/cainos-encore-070-2026-11-01.json";
assert(await exists(cainosProofPath), "preuves visuelles réelles CainOS et Encore présentes");
if (await exists(cainosProofPath)) {
  const proof = JSON.parse(await readFile(path.join(root, cainosProofPath), "utf8"));
  const gallery = galleryMap[cainosId];
  const archived = archiveDocument.previousScreenshots?.[cainosId] || [];
  const archivedPreview = archiveDocument.previousPreviews?.[cainosId];
  const tracked = fidelityMatrix.entries?.find((entry) => entry.id === cainosId);
  assert(proof.notGeneratedArt === true && proof.captureType === "native-browser-multi-module-ui", "CainOS affiché par le vrai navigateur");
  assert(proof.source === "https://cainos.vercel.app/" && proof.releaseRef?.gitCommit === "146a68cc87ea088a4dbcf76694115118fc9ed775", "production CainOS authentifiée par le SHA du build Vercel");
  assert(proof.firstUseCalibration?.includes("completed with real OS button"), "entrée CainOS obtenue par calibration naturelle");
  assert(proof.combatPath === "https://cainos.vercel.app/combat/", "combat Encore relié au terminal officiel");
  assert(gallery?.captureType === "real-module-ui" && gallery?.presentationReview === "pending-fidelity", "CainOS sans key art non qualifié en vitrine");
  assert(gallery?.labels?.length === 5 && gallery?.images?.length === 5 && proof.scenes?.length === 5, "cinq scènes CainOS vérifiées");
  assert(tracked?.screenshotCaptureProof === cainosProofPath && tracked?.screenshotFreshness === "up-to-date", "matrice CainOS mise à jour par le vrai rendu");
  assert(archived.length === 5 && archivedPreview && await exists(archivedPreview), "anciens visuels du terminal sauvegardés");
  assert(proof.scenes?.[2]?.appState?.modeCount === 9 && proof.scenes?.[3]?.appState?.fighters === 14 && proof.scenes?.[3]?.appState?.arenas === 12, "effectifs réels des modes, combattants et arènes");
  const duel = proof.scenes?.[4];
  const view = duel?.visualEvidence;
  assert(duel?.kind === "real-2d-fight" && duel?.visualReview === "arena-framed", "vrai duel Encore cadré et non laboratoire d'entraînement");
  assert(view?.gameScreen === "fight" && view?.phase === "fight" && view?.fighters?.length === 2 && view?.colors >= 10, "combat animé non vide, deux combattants visibles");
  assert(view?.bounds?.height >= 280 && view?.bounds?.top >= 0 && view?.bounds?.bottom <= 720, "vraie arène cadrée dans la capture");
  for (let i = 0; i < 5; i++) {
    const shot = proof.scenes[i], imagePath = gallery.images[i], archivedPath = archived[i];
    assert(shot.path === imagePath && shot.label === gallery.labels[i], `CainOS capture ${i+1} libellé et source alignés`);
    assert(await exists(archivedPath), `CainOS image antérieure ${i+1} archivée`);
    if (await exists(imagePath)) {
      const bytes = await readFile(path.join(root, imagePath));
      assert(createHash("sha256").update(bytes).digest("hex") === shot.sha256, `CainOS capture réelle ${i+1} SHA-256 exact`);
      assert(bytes.subarray(0,8).toString("hex") === "89504e470d0a1a0a" &&
        bytes.readUInt32BE(16) === 1280 && bytes.readUInt32BE(20) === 720,
        `CainOS capture ${i+1} PNG 1280×720 valide`);
    }
  }
}

// AVP HUNT/HIVE: full 1.0.0 real-app chain from a new XENO deck to
// a 3-lane duel, deck building, collection, a revealed booster and campaign.
const avpTcgId = "avp-hunt-hive-tcg";
const avpTcgProofPath = "docs/media-proof/avp-tcg-gameplay-2026-11-01.json";
assert(await exists(avpTcgProofPath), "preuve de cinq captures réelles du TCG disponible");
if (await exists(avpTcgProofPath)) {
  const evidence = JSON.parse(await readFile(path.join(root, avpTcgProofPath), "utf8"));
  const gallery = galleryMap[avpTcgId];
  const archive = archiveDocument.previousScreenshots?.[avpTcgId] || [];
  const archivePreview = archiveDocument.previousPreviews?.[avpTcgId];
  const row = fidelityMatrix.entries?.find((entry) => entry.id === avpTcgId);
  assert(evidence.captureType === "native-browser-card-gameplay" && evidence.notGeneratedArt === true, "AVP TCG a des captures du vrai jeu, non des concepts synthétiques");
  assert(evidence.source === "https://avp-hunt-hive-tcg.vercel.app/" && evidence.version === "1.0.0", "version et production TCG déterminées");
  assert(evidence.releaseRef?.deploymentId === "dpl_7DwmFGBSZeYQm1P6npzrnFqMeeS6", "source Vercel stable du TCG");
  assert(evidence.firstUse?.includes("Selected XENO deck"), "deck d'ouverture choisi dans le jeu réel");
  assert(gallery?.captureType === "real-gameplay" && gallery.presentationReview === "pending-fidelity", "illustration AVP non certifiée masquée côté public");
  assert(gallery?.images?.length === 5 && gallery.labels?.length === 5 && evidence.scenes?.length === 5, "cinq écrans source AVP TCG avec légendes");
  assert(row?.screenshotCaptureProof === avpTcgProofPath && row?.screenshotFreshness === "up-to-date", "matrice AVP mise à jour par les preuves");
  assert(archive.length === 5 && archivePreview && await exists(archivePreview), "cinq anciens screenshots et aperçu AVP conservés");
  assert(evidence.scenes[0]?.appState?.boardLanes === 3 &&
    evidence.scenes[0]?.appState?.hand >= 5 &&
    evidence.scenes[0]?.appState?.lifeBars === 2, "vrai duel TCG à trois voies et deux commandants");
  assert(evidence.scenes[1]?.appState?.cardRows >= 8 && evidence.scenes[2]?.appState?.visibleCards >= 20, "constructeur et collection réels");
  assert(evidence.scenes[3]?.appState?.revealed === 9 && evidence.scenes[4]?.appState?.missions === 8, "neuf cartes booster révélées et huit missions visibles");
  for (let i = 0; i < 5; i++) {
    const shot = evidence.scenes[i],pathImage = gallery.images[i],old = archive[i];
    assert(shot.appState?.valid && shot.path === pathImage && shot.label === gallery.labels[i], `capture TCG ${i + 1} réellement vérifiée`);
    assert(await exists(old), `AVP ancien screenshot ${i + 1} préservé`);
    if (await exists(pathImage)) {
      const bytes = await readFile(path.join(root, pathImage));
      assert(createHash("sha256").update(bytes).digest("hex") === shot.sha256, `capture TCG ${i + 1} SHA256 correct`);
      assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" &&
        bytes.readUInt32BE(16) === 1280 && bytes.readUInt32BE(20) === 720,
        `AVP capture ${i + 1} résolution PNG 1280×720`);
      if(await exists(old)) {
        const previous = await readFile(path.join(root, old));
        assert(!previous.equals(bytes), `capture TCG ${i + 1} différente de la version archivée`);
      }
    }
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
assert(appsWithoutPreviousPresentation.size === 28 + recoveredApps.length,
  "les 28 exceptions historiques et les jeux nouvellement retrouvés n'ont pas d'anciens visuels à inventer");
for (const id of appsWithoutPreviousPresentation) {
  assert(ids.has(id), `exception historique attribuée à une application connue: ${id}`);
}
assert(Object.keys(archiveMap).length === 112, "les archives sont distinctes du manifeste public");
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

assert(images.size === establishedApps.length + recoveredWithNativeMedia.length,
  "aperçus historiques plus vraies captures natives de jeux retrouvés");
assert(presentations.size === establishedApps.length + recoveredWithNativeMedia.length,
  "présentations historiques plus titres de jeu source-native");
assert(galleryPaths.size === 700 + recoveredWithNativeMedia.length * 5,
  "700 captures historiques plus cinq images vérifiées par nouveau jeu illustré");
assert(
  Object.keys(galleryMap).filter((id) => id !== "notes").length === apps.length,
  "une galerie exactement par application"
);
assert(html.includes('fetch("assets/app-gallery-admin.json"'), "le manifeste historique est demandé séparément");
assert(html.includes("if (!adminMode) return;"), "les archives ne sont chargées qu'en mode édition");
assert(html.includes("adminMode && app.previousPresentation"), "la galerie publique masque les anciennes illustrations");
assert(html.includes("sanitizeImageUrl(app.previousPresentation)"), "le visuel historique reste consultable en mode édition");
assert(html.includes("Ancienne illustration · archive"), "le visuel historique est identifié comme archive");
assert(html.includes("Ancienne capture"), "les anciennes captures restent disponibles seulement en mode édition");
assert(html.includes("previousScreenshots"), "l'application supporte les captures historiques séparées");
const iconSprite = await readFile(path.join(root, "assets", "app-icons.svg"), "utf8");
for (const app of apps) {
  if (app.recoveredGame) continue; // Les jeux retrouvés peuvent utiliser leur monogramme en attendant un pictogramme fidèle.
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
assert(serviceWorker.includes('const CACHE_NAME = "launcher-shell-v29"'), "le cache applicatif v1.13 utilise launcher-shell-v29");
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
assert(mediaFiles.length === 1092 + recoveredWithNativeMedia.length * 7,
  "les 1 092 médias historiques restent intacts, avec sept vrais médias par jeu retrouvé illustré");
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
