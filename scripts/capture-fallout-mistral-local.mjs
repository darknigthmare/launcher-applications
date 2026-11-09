#!/usr/bin/env node
// Capture the exact distributed HTML through the game's normal local server.
// Read-only diagnostics attest state; only native controls change the game.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const root = process.cwd(), gameId = "fallout-marseille-mistral";
const sourceDir = resolve(process.env.FALLOUT_MISTRAL_SOURCE_DIR || "/tmp/fallout-marseille-native");
const source = "https://github.com/darknigthmare/fallout-Marseille";
const sourceCommit = execFileSync("git", ["-C", sourceDir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const version = JSON.parse(await readFile(resolve(sourceDir, "package.json"), "utf8")).version;
const htmlPath = "index.html", html = await readFile(resolve(sourceDir, htmlPath));
const committedHtml = execFileSync("git", ["-C", sourceDir, "show", `${sourceCommit}:${htmlPath}`], { maxBuffer: 16 * 1024 * 1024 });
if (!html.equals(committedHtml) || version !== "0.50.0") throw Error("Expected unchanged distributed 0.50.0 HTML");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const proofPath = "docs/media-proof/fallout-mistral-local-050-2026-11-09.json";
const presentation = `assets/presentations/${gameId}.png`, preview = `assets/previews/${gameId}.jpg`;
const paths = Array.from({ length: 5 }, (_, i) => `assets/screenshots/${gameId}/${String(i + 1).padStart(2, "0")}.png`);
for (const path of [proofPath, presentation, preview, ...paths]) if (existsSync(resolve(root, path))) throw Error("Refuse to overwrite existing media: " + path);
const base = process.env.FALLOUT_MISTRAL_LOCAL_URL || "http://127.0.0.1:8098/";
const parsed = new URL(base);
if (!["127.0.0.1", "localhost"].includes(parsed.hostname)) throw Error("A local source server is required");
const served = await fetch(new URL(htmlPath, base));
if (!served.ok || sha(Buffer.from(await served.arrayBuffer())) !== sha(html)) throw Error("Served HTML differs from the exact source file");
const browser = await openNativeBrowser(new URL(htmlPath, base).href, { width: 1280, height: 720, webgl: true });
const scenes = [], captured = [];
async function click(selector) {
  const point = await browser.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Control unavailable');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();if(!r.width||!r.height)throw Error('Control hidden');return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await browser.call("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await browser.call("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
}
async function key(code, key, milliseconds = 80, virtualKeyCode = key.charCodeAt(0)) {
  await browser.call("Input.dispatchKeyEvent", { type: "keyDown", code, key, windowsVirtualKeyCode: virtualKeyCode });
  await browser.sleep(milliseconds);
  await browser.call("Input.dispatchKeyEvent", { type: "keyUp", code, key, windowsVirtualKeyCode: virtualKeyCode });
}
async function state() {
  return browser.evaluate(`(()=>{const d=window.__MISTRAL_DEBUG,s=d.getState();return{title:document.title,mode:d.getMode(),world:d.getWorld(),nativeGameMode:s.mode,player:{position:s.player.pos,level:s.character?.level,zone:s.player.zone},location:document.getElementById('locationName')?.textContent,visibleText:document.body.innerText.slice(0,1800)}})()`);
}
async function capture(slot, label, expected, kind) {
  const active = await state();
  if (!active.title.includes("v0.50") || active.mode !== expected) throw Error("Unexpected native state: " + JSON.stringify(active));
  const bytes = await browser.capture("png");
  captured.push([paths[slot - 1], bytes]);
  scenes.push({ slot, path: paths[slot - 1], label, kind, sha256: sha(bytes), bytes: bytes.length, screen: "1280x720", state: active });
  return bytes;
}
try {
  await browser.waitFor("window.__MISTRAL_DEBUG?.getMode()==='MENU' && document.title.includes('v0.50')");
  await browser.sleep(600);
  const identity = await state(), title = await browser.capture("png");
  await click("#btnChapter");
  await browser.waitFor("window.__MISTRAL_DEBUG?.getMode()==='PLAYING'");
  await browser.sleep(700);
  await capture(1, "Canebière–Belsunce — arrivée du mode exploration libre", "PLAYING", "real-gameplay");
  const before = await state();
  await key("KeyW", "w", 1250, 87);
  await key("KeyD", "d", 650, 68);
  await browser.sleep(250);
  const after = await state();
  if (JSON.stringify(before.player.position) === JSON.stringify(after.player.position)) throw Error("Native movement did not change position");
  await capture(2, "Canebière–Belsunce — déplacement réel dans la scène narrative", "PLAYING", "real-gameplay");
  const previewBytes = await browser.capture("jpeg");
  await key("Tab", "Tab", 80, 9);
  await browser.waitFor("window.__MISTRAL_DEBUG?.getMode()==='PIP'");
  await click("#pipTabs button[data-tab='inventory']"); await browser.sleep(250);
  await capture(3, "Pip-Boy — inventaire de l’exploration libre", "PIP", "actual-game-ui");
  await click("#pipTabs button[data-tab='map']"); await browser.sleep(300);
  await capture(4, "Pip-Boy — carte et lieux du mode libre", "PIP", "actual-game-ui");
  await click("#pipTabs button[data-tab='radio']"); await browser.sleep(250);
  await capture(5, "Pip-Boy — radio et holodisques", "PIP", "actual-game-ui");
  const localData = await fetch(new URL("__mistral/local-data", base)).then(r => r.ok ? r.json() : null).catch(() => null);
  const proof = {
    captureType: "native-local-browser-gameplay", notGeneratedArt: true, gameId,
    source, sourceCommit, version, htmlPath, sourceHtmlSha256: sha(html), capturedAt: new Date().toISOString(),
    browser: "Headless Chromium CDP; native game server on localhost; software WebGL SwiftShader",
    overview: { title: identity.title, viewport: "1280x720", nativeControlsOnly: true, mode: "Official Exploration libre button", nativeMovementObserved: { before: before.player.position, after: after.player.position }, localData },
    presentation: { path: presentation, sha256: sha(title), bytes: title.length, kind: "Actual native game title/menu; not generated keyart" },
    preview: { path: preview, sha256: sha(previewBytes), bytes: previewBytes.length, kind: "Actual local free-exploration gameplay frame" },
    scenes, noHistoricalMedia: true,
    limitations: [
      "Local build at the recorded commit only; no Vercel deployment is claimed.",
      "The official Exploration libre button starts with native prefilled progression and equipment. These images do not represent an earned campaign completion.",
      "The displayed Canebière–Belsunce is the game's authored narrative scene, not a survey-accurate geographical street reconstruction.",
      "Bundled geographic data were prepared offline and audited separately; the two gameplay images do not certify every geographic tile or architectural detail.",
      "Only movement and three Pip-Boy screens are captured. No combat, quest completion, map travel or holotape playback is claimed.",
      "Actual renderer provenance does not certify canonical Fallout models or 1:1 Marseille architecture."
    ]
  };
  for (const dir of ["assets/presentations", "assets/previews", `assets/screenshots/${gameId}`, "docs/media-proof"]) await mkdir(resolve(root, dir), { recursive: true });
  for (const [path, bytes] of [...captured, [presentation, title], [preview, previewBytes]]) await writeFile(resolve(root, path), bytes);
  await writeFile(resolve(root, proofPath), JSON.stringify(proof, null, 2) + "\n");
  console.log(JSON.stringify({ gameId, version, sourceCommit, proofPath, scenes: scenes.length }));
} finally { await browser.close(); }
