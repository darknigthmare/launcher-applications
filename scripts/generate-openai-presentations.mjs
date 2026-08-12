import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(root, "index.html"), "utf8");
const starterMatch = html.match(/const starterApps = (\[[\s\S]*?\n\s*\]);/);
if (!starterMatch) throw new Error("Catalogue starterApps introuvable");

const starterApps = vm.runInNewContext(`(${starterMatch[1]})`, Object.create(null));
const recentSandbox = { window: {} };
vm.runInNewContext(await readFile(path.join(root, "assets", "recent-games.js"), "utf8"), recentSandbox);
const apps = [...starterApps, ...recentSandbox.window.LAUNCHER_RECENT_GAMES];

const promptFor = (app) => [
  "Use case: stylized-concept",
  "Asset type: launcher presentation key art, wide 16:9",
  `Primary request: Create a polished ${app.baseGame ? "non-official fan-made" : "original"} cover illustration for ${app.name}. ${app.pitch || app.description}`,
  `Scene and subject: visually express this concept: ${app.description}`,
  `Style/medium: cinematic premium concept art suited to ${app.category}${app.genre ? `, ${app.genre}` : ""}`,
  "Composition/framing: one wide 16:9 scene, strong focal subject, layered depth, readable at launcher-card size",
  `Constraints: ${app.baseGame ? `transformative original interpretation inspired by ${app.baseGame}; do not copy official key art, logos, costumes, actor likenesses or exact character designs; ` : "entirely original imagery; "}no readable text; no letters; no logo; no user interface; no watermark; no border; no collage.`
].join("\n");

const records = apps.map((app) => ({
  id: app.id,
  presentation: app.presentation,
  provider: "OpenAI",
  generator: "image_gen",
  prompt: promptFor(app)
}));

if (process.argv.includes("--json")) console.log(JSON.stringify(records, null, 2));
else console.log(records.map((record) => `${record.id}\n${record.prompt}`).join("\n\n"));
