#!/usr/bin/env node
/**
 * Real local-source Massilia gallery. Prepare the exact clone with
 * `python3 lancer.py --prepare-only`, serve its game/ directory locally, then:
 * node scripts/capture-massilia-cyberpunk-local.mjs /path/to/clone [http://127.0.0.1:9396]
 * No saved-state, entity, camera-pose or route injection is used.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const sourceDir = process.argv[2];
if (!sourceDir) throw Error("Pass the exact prepared Massilia source clone");
const root = process.cwd(), gameId = "massilia-cyberpunk", version = "0.76.0";
const source = "https://github.com/darknigthmare/massilia-cyberpunk";
const sourceCommit = execFileSync("git", ["-C", sourceDir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw Error("Exact source commit unavailable");
if (execFileSync("git", ["-C", sourceDir, "diff", "HEAD", "--name-only"], { encoding: "utf8" }).trim()) throw Error("Tracked game sources have local modifications");
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const htmlPath = "game/SOMA_MASSILIA_URBAIN_v0_76.html";
const html = await readFile(resolve(sourceDir, htmlPath));
const buildReport = JSON.parse(await readFile(resolve(sourceDir, "game/data/v76/BUILD_REPORT.json"), "utf8"));
if (buildReport.version !== version || buildReport.sha256 !== digest(html) || buildReport.bytes !== html.length) throw Error("Generated HTML differs from native build report");
const proofPath = "docs/media-proof/massilia-cyberpunk-local-076-2026-11-09.json";
const presentationPath = `assets/presentations/${gameId}.png`, previewPath = `assets/previews/${gameId}.jpg`;
const paths = Array.from({ length: 5 }, (_, i) => `assets/screenshots/${gameId}/${String(i + 1).padStart(2, "0")}.png`);
for (const path of [proofPath, presentationPath, previewPath, ...paths]) if (existsSync(resolve(root, path))) throw Error("Refuse to overwrite existing media: " + path);
const url = new URL("SOMA_MASSILIA_URBAIN_v0_76.html", (process.argv[3] || "http://127.0.0.1:9396") + "/").href;
const b = await openNativeBrowser(url, { webgl: true, timeout: 150000 });
const scenes = [], pending = [];
async function click(selector) {
  const point = await b.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Native control unavailable');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();if(!r.width||!r.height)throw Error('Native control hidden');return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await b.call("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await b.call("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
}
async function key(code, key, virtual, type = "keyDown", modifiers = 0) {
  await b.call("Input.dispatchKeyEvent", { type, code, key, windowsVirtualKeyCode: virtual, modifiers });
}
async function tapKey(code, value, virtual) { await key(code, value, virtual); await key(code, value, virtual, "keyUp"); }
async function snapshot() {
  return b.evaluate(`({title:document.title,version:window.__SOMA_V76__?.version,zone:typeof zone==='object'?zone?.id:null,geographicDistrict:typeof zone==='object'?!!zone?.v52District:false,paused:typeof paused==='boolean'?paused:null,position:typeof camera==='object'?{x:camera.x,y:camera.y,z:camera.z}:null,selectedPlace:document.querySelector('#v62-details h3')?.textContent||null,openPanels:[...document.querySelectorAll('.modal.open,.modal.active')].filter(e=>e.getBoundingClientRect().width).map(e=>({id:e.id,title:e.querySelector('h2,h3')?.textContent||''})),body:document.body.innerText.slice(0,2500)})`);
}
async function shot(slot, label, kind, check) {
  const observed = await snapshot();
  if (observed.version !== version || !observed.title.includes("0.76") || (check && !check(observed))) throw Error("Wrong native scene for " + label + ": " + JSON.stringify(observed));
  const bytes = await b.capture("png"), sha256 = digest(bytes);
  if (scenes.some(scene => scene.sha256 === sha256)) throw Error("Duplicate native frame");
  const path = paths[slot - 1];
  pending.push({ path, bytes });
  scenes.push({ slot, label, kind, path, sha256, bytes: bytes.length, screen: "1280x720", observed });
  console.log("MASSILIA_SCENE " + JSON.stringify({ slot, label, bytes: bytes.length }));
}
try {
  await b.waitFor("window.__SOMA_V76__?.ready && !!document.getElementById('v54-explore')", 150000);
  await b.sleep(650);
  const identity = await snapshot(), presentation = await b.capture("png");
  await click("#v54-explore");
  await b.waitFor("typeof zone==='object' && zone?.v52District && !paused", 120000);
  await b.sleep(900);
  await shot(1, "Marseille réelle — arrivée dans la cellule de départ", "real-local-webgl-exploration", s => s.geographicDistrict && !s.paused);
  const beforeWalk = (await snapshot()).position;
  const movementInputs = [];
  let afterWalk = beforeWalk;
  for (const [code, value, virtual] of [["KeyW", "w", 87], ["KeyD", "d", 68], ["KeyS", "s", 83]]) {
    movementInputs.push({ code, durationMs: 850 });
    await key(code, value, virtual); await b.sleep(850); await key(code, value, virtual, "keyUp");
    await b.sleep(300); afterWalk = (await snapshot()).position;
    if (Math.hypot(afterWalk.x - beforeWalk.x, afterWalk.z - beforeWalk.z) >= 0.05) break;
  }
  if (Math.hypot(afterWalk.x - beforeWalk.x, afterWalk.z - beforeWalk.z) < 0.05) throw Error("Native walking did not move the player");
  await shot(2, "Rue du centre — déplacement à pied et HUD du jeu", "real-local-webgl-exploration", s => s.geographicDistrict && !s.paused);
  const preview = await b.capture("jpeg");
  await key("ShiftLeft", "Shift", 16, "keyDown", 8);
  await key("F1", "F1", 112, "keyDown", 8); await key("F1", "F1", 112, "keyUp", 8);
  await key("ShiftLeft", "Shift", 16, "keyUp");
  await b.waitFor("document.getElementById('v70-tactics')?.classList.contains('open')"); await b.sleep(250);
  await shot(3, "Cortex tactique — protocoles et état du cyberdeck", "actual-game-ui", s => s.openPanels.some(p => p.id === "v70-tactics"));
  await click("[data-v70-close]");
  await b.waitFor("!document.getElementById('v70-tactics')?.classList.contains('open')");
  await tapKey("KeyM", "m", 77);
  await b.waitFor("document.getElementById('exploration62')?.classList.contains('open')"); await b.sleep(350);
  await shot(4, "Carte du joueur — lieux et itinéraires disponibles", "actual-game-ui", s => s.paused && s.openPanels.some(p => p.id === "exploration62"));
  await click("#v62-list button.v62-place");
  await b.waitFor("!!document.querySelector('#v62-details h3')"); await b.sleep(250);
  await shot(5, "Cartographie — fiche d’un lieu réellement découvert", "actual-game-ui", s => s.paused && !!s.selectedPlace && s.openPanels.some(p => p.id === "exploration62"));
  const proof = {
    captureType: "native-local-browser-gameplay", notGeneratedArt: true, gameId, source, sourceCommit, version,
    capturedAt: new Date().toISOString(), localUrl: url, htmlPath, sourceHtmlSha256: digest(html),
    browser: "Chromium CDP / SwiftShader WebGL 2, fresh local profile", resolution: "1280x720",
    build: { command: "python3 lancer.py --prepare-only", report: "game/data/v76/BUILD_REPORT.json", version: buildReport.version, sha256: buildReport.sha256, bytes: buildReport.bytes, originalFilesVerified: buildReport.originalFilesVerified },
    presentation: { path: presentationPath, sha256: digest(presentation), bytes: presentation.length, kind: "Actual native v0.76 title/menu screen" },
    preview: { path: previewPath, sha256: digest(preview), bytes: preview.length, kind: "Actual local centre-street exploration" },
    scenes, noHistoricalMedia: true,
    overview: { runtimeVersionPrinted: identity.title, geographicDistrictEntered: true, nativeWalk: { before: beforeWalk, after: afterWalk, inputs: movementInputs }, nativeControlsOnly: true },
    limitations: [
      "Exact v0.76 source-built local distribution; no Vercel hosting is claimed.",
      "The clone includes 168 centre cells (10.5 km²); the external full metropolitan cache was not installed or certified.",
      "The captured street HUD explicitly labels its data STAGED NON CERTIFIÉ and uses the historical 25 m grid; no certified NGF scene or 5 m pilot is claimed.",
      "Only a short initial walk and native menus are captured; no full campaign, mission completion, combat or 92-commune traversal is claimed.",
      "Source geography, estimated architecture and artistic facades remain distinct; screenshots do not establish architectural 1:1 fidelity.",
      "SwiftShader is software WebGL, not evidence of performance on player hardware."
    ]
  };
  for (const item of [...pending, { path: presentationPath, bytes: presentation }, { path: previewPath, bytes: preview }]) {
    await mkdir(resolve(root, item.path, ".."), { recursive: true }); await writeFile(resolve(root, item.path), item.bytes);
  }
  await mkdir(resolve(root, "docs/media-proof"), { recursive: true });
  await writeFile(resolve(root, proofPath), JSON.stringify(proof, null, 2) + "\n");
  console.log("MASSILIA_CAPTURE_READY " + JSON.stringify({ proofPath, sourceCommit, scenes: scenes.length }));
} finally { await b.close(); }
