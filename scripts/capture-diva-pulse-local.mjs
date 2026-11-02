#!/usr/bin/env node
// Native UI captures of an exact local distribution; no synthetic art or saved-game injection.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "node:http";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const root = process.cwd(), gameId = "diva-pulse";
const sourceDir = resolve(process.env.DIVA_PULSE_SOURCE_DIR || "/tmp/diva-pulse-source");
const source = "https://github.com/darknigthmare/Diva-Pulse";
const sourceCommit = execFileSync("git", ["-C", sourceDir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const version = "37.0.0", htmlPath = "DIVA_PULSE_JOUER.html";
const html = await readFile(resolve(sourceDir, htmlPath));
const committedHtml = execFileSync("git", ["-C", sourceDir, "show", `${sourceCommit}:${htmlPath}`], { maxBuffer: 4 * 1024 * 1024 });
if (!html.equals(committedHtml)) throw Error("Working HTML differs from the recorded source commit");
if (!/^[a-f0-9]{40}$/.test(sourceCommit) || !html.includes(Buffer.from("brouillons protégés V37"))) throw Error("Exact V37 source unavailable");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const proofPath = "docs/media-proof/diva-pulse-local-v37-2026-11-02.json";
if (existsSync(resolve(root, proofPath))) throw Error("Already captured; refuse to overwrite proof");
const presentation = "assets/presentations/diva-pulse.png";
const preview = "assets/previews/diva-pulse.jpg";
const paths = Array.from({ length: 5 }, (_, i) => `assets/screenshots/diva-pulse/${String(i + 1).padStart(2, "0")}.png`);
for (const path of [presentation, preview, ...paths]) if (existsSync(resolve(root, path))) throw Error("Refuse overwrite: " + path);
for (const dir of ["assets/presentations", "assets/previews", "assets/screenshots/diva-pulse", "docs/media-proof"]) await mkdir(resolve(root, dir), { recursive: true });
const server = createServer((req, res) => {
  if (req.url !== "/" && req.url !== "/DIVA_PULSE_JOUER.html") { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); res.end(html);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/DIVA_PULSE_JOUER.html`;
const browser = await openNativeBrowser(url, { width: 1280, height: 720, webgl: true });
const scenes = [];
async function click(selector) {
  const point = await browser.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Control unavailable');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();if(!r.width||!r.height)throw Error('Control hidden');return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await browser.call("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await browser.call("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
}
async function state() {
  return browser.evaluate(`({title:document.title,view:PulseApp.view,paused:!!PulseApp.paused,playing:!!PulseApp.audio.playing,canvas:[...document.querySelectorAll('canvas')].filter(e=>e.getClientRects().length).map(e=>({width:e.width,height:e.height})),song:PulseApp.song?.title,mode:PulseApp.mode||null})`);
}
async function capture(slot, label, expected, kind) {
  const active = await state();
  if (!active.title.includes("V37") || active.view !== expected) throw Error("Wrong native screen: " + JSON.stringify(active));
  const bytes = await browser.capture("png");
  await writeFile(resolve(root, paths[slot - 1]), bytes);
  scenes.push({ slot, path: paths[slot - 1], label, kind, sha256: sha(bytes), bytes: bytes.length, screen: "1280x720", state: active });
  return bytes;
}
try {
  await browser.waitFor("window.PulseApp && !PulseApp.busy && PulseApp.song && PulseApp.stage.available");
  await browser.sleep(500);
  const identity = await state();
  const title = await capture(1, "Bibliothèque — trois instrumentaux originaux et scène de travail", "library", "actual-game-ui");
  await writeFile(resolve(root, presentation), title);
  await click("button.nav[data-view='wardrobe']");
  await browser.waitFor("PulseApp.view==='wardrobe'"); await browser.sleep(400);
  await capture(2, "Modules — scène 3D et silhouettes de travail", "wardrobe", "actual-game-ui");
  await click("button.nav[data-view='editor']");
  await browser.waitFor("PulseApp.view==='editor'"); await browser.sleep(350);
  await capture(3, "Studio — partition et outils d’édition du rythme", "editor", "actual-game-ui");
  await click("button.nav[data-view='library']");
  await browser.waitFor("PulseApp.view==='library'");
  await click("#autoButton");
  await browser.waitFor("PulseApp.view==='game' && PulseApp.audio.playing && !PulseApp.paused");
  await browser.sleep(6500);
  await capture(4, "Neon Promise — démonstration assistée Autoplay du moteur rythmique", "game", "real-gameplay");
  const previewBytes = await browser.capture("jpeg");
  await writeFile(resolve(root, preview), previewBytes);
  await click("#pauseButton");
  await browser.waitFor("PulseApp.paused"); await browser.sleep(250);
  await capture(5, "Live — pause et commandes de reprise", "game", "actual-game-ui");
  const proof = {
    captureType: "native-local-browser-gameplay", notGeneratedArt: true, gameId,
    source, sourceCommit, version, htmlPath, sourceHtmlSha256: sha(html), capturedAt: new Date().toISOString(),
    browser: "Headless Chromium CDP, exact standalone HTML served on localhost; software WebGL SwiftShader",
    overview: { title: identity.title, viewport: "1280x720", nativeControlsOnly: true, liveAudioPlayingConfirmed: true },
    presentation: { path: presentation, sha256: sha(title), bytes: title.length, kind: "Actual game library/title UI; not generated keyart" },
    preview: { path: preview, sha256: sha(previewBytes), bytes: previewBytes.length, kind: "Actual local rhythm-game frame" },
    scenes, noHistoricalMedia: true,
    limitations: [
      "Exact local main source V37 captured; no Vercel deployment is claimed.",
      "Header still displays the historical 34.0 branding; title and package identify V37.",
      "3D figures are the game's procedural work silhouettes, not validated licensed MMD models.",
      "Built-in original instrumental only; no imported licensed music, MMD motion or canonical visual fidelity certification.",
      "The native Autoplay button supplies the assisted rhythm session; no manual-player performance is claimed.",
      "A short assisted session and navigation do not certify all editor, audio latency, replay or hardware behavior."
    ]
  };
  await writeFile(resolve(root, proofPath), JSON.stringify(proof, null, 2) + "\n");
  console.log(JSON.stringify({ gameId, sourceCommit, proofPath, scenes: scenes.length }));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
