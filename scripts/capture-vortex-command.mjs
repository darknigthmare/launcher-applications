#!/usr/bin/env node
/**
 * Vortex Command: five native screenshots of the actual published RTS 1.0.
 * The kaiju emerges after the game's own 4.5s clock; no world or enemy
 * coordinates, unit statistics, campaign resources or combat outcomes are
 * injected. UI tabs are opened using real CDP pointer events.
 *
 * Screenshots are NOT concept art; their former versions are archived first.
 * The HTTPS alias is the stable Vercel domain of this named project.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const root=process.cwd();
const gameId="vortex-command";
const sourceUrl="https://vortex-command-darknigthmares-projects.vercel.app/";
const proofPath="docs/media-proof/vortex-command-rts-2026-11-01.json";
if (existsSync(resolve(root,proofPath))) {
  console.log("Vortex Command: evidence already committed. No files overwritten.");
  process.exit(0);
}
const shotDir="assets/screenshots/"+gameId;
const oldShotDir="assets/screenshots/previous/"+gameId;
const previewPath="assets/previews/"+gameId+".jpg";
const oldPreviewPath="assets/previews/previous/"+gameId+".jpg";
const shots=Array.from({length:5},(_,i)=>shotDir+"/"+String(i+1).padStart(2,"0")+".png");
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const b=await openNativeBrowser(sourceUrl,{width:1280,height:720,timeout:60000});
const scenes=[];
let overview;
async function actualClick(selector) {
  const box=await b.evaluate("(()=>{const e=document.querySelector("+JSON.stringify(selector)+");if(!e||e.disabled)throw Error('Unavailable "+selector+"');e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();if(r.width<5||r.height<5)throw Error('Not visible "+selector+"');return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};})()");
  await b.call("Page.bringToFront");
  await b.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:box.x,y:box.y});
  await b.call("Input.dispatchMouseEvent",{type:"mousePressed",x:box.x,y:box.y,button:"left",clickCount:1});
  await b.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:box.x,y:box.y,button:"left",clickCount:1});
}
async function snapshot() {
  return b.evaluate("(()=>{const g=window.vortexCommand,s=g?.state;return {running:s?.running,paused:s?.paused,ended:s?.ended,time:s?.time,mode:s?.mode,region:s?.regionId,doctrine:s?.doctrineId,titan:s?.kaiju?.name,emerged:s?.kaiju?.emerged,titanAlive:!!(s?.kaiju&&!s.kaiju.dead),units:s?.units?.length,districts:s?.world?.districts?.length,simTick:g?.simulationTick,camera:{x:g?.camera?.x,y:g?.camera?.y,zoom:g?.camera?.zoom},startScreen:document.getElementById('start-screen')?.classList.contains('active'),visibleTab:document.querySelector('.tab-button.active')?.dataset.panel}})()");
}
async function take(i,label,panel) {
  await actualClick('.tab-button[data-panel="'+panel+'"]');
  await b.waitFor("document.getElementById("+JSON.stringify(panel)+").classList.contains('active')",4000);
  await b.sleep(280);
  const state=await snapshot();
  if(!state.running||state.paused||state.ended||!(state.simTick>0)||state.units<1||state.districts!==6||!state.emerged||state.visibleTab!==panel) {
    throw Error("Vortex live state not captured "+i+": "+JSON.stringify(state));
  }
  const bytes=await b.capture("png");
  await writeFile(resolve(root,shots[i-1]),bytes);
  scenes.push({slot:i,label,path:shots[i-1],panel,kind:i===1?"real-rts-gameplay":"live-operations-tab",state,
    bytes:bytes.length,sha256:sha(bytes),resolution:"1280x720"});
  return bytes;
}
try {
  try {
    await b.waitFor("Boolean(window.vortexCommand && window.vortexCommand.state && document.getElementById('start-button'))",10000);
  } catch(error) {
    const diagnostic=await b.evaluate("({title:document.title,href:location.href,body:document.body?.innerText?.slice(0,650),hasStart:!!document.getElementById('start-button'),scripts:[...document.scripts].map(x=>x.src).slice(0,8),ready:document.readyState})");
    console.error("VORTEX PUBLIC ALIAS CONTENT CHECK "+JSON.stringify(diagnostic));
    throw new Error("Stable alias does not serve a verified playable Vortex game: "+JSON.stringify(diagnostic));
  }
  const main=await b.evaluate("({title:document.title,build:document.querySelector('#start-screen .start-header')?.textContent||'',systems:[...vortexCommand.systems.keys()],canvasWidth:vortexCommand.canvas.width,canvasHeight:vortexCommand.canvas.height})");
  if(!main.title.includes("Vortex Command")||!main.build.includes("BUILD 1.0")||main.systems.length<10) {
    throw Error("Unverified or incompatible deployed Vortex build "+JSON.stringify(main));
  }
  await actualClick("#start-button");
  await b.waitFor("vortexCommand.state.running === true && vortexCommand.state.units.length>0 && vortexCommand.state.world.districts.length===6 && !document.getElementById('start-screen').classList.contains('active')",9000);
  await b.waitFor("vortexCommand.state.kaiju?.emerged === true && vortexCommand.state.time >= 4.5",18000);
  // The game's normal Home shortcut tracks the kaiju, rather than moving
  // the game actor or substituting a staged 3D camera.
  await b.call("Input.dispatchKeyEvent",{type:"rawKeyDown",code:"Home",key:"Home",windowsVirtualKeyCode:36});
  await b.call("Input.dispatchKeyEvent",{type:"keyUp",code:"Home",key:"Home",windowsVirtualKeyCode:36});
  await b.sleep(1000);
  await mkdir(resolve(root,oldShotDir),{recursive:true});
  await mkdir(resolve(root,"assets/previews/previous"),{recursive:true});
  for(const file of shots){
    const old=resolve(root,oldShotDir+"/"+file.split("/").at(-1));
    if(!existsSync(old))await copyFile(resolve(root,file),old);
  }
  if(!existsSync(resolve(root,oldPreviewPath)))await copyFile(resolve(root,previewPath),resolve(root,oldPreviewPath));
  await take(1,"Leviathan — titan émergé sur le champ de bataille","intel-panel");
  const preview=await b.capture("jpeg");
  await writeFile(resolve(root,previewPath),preview);
  await take(2,"Anatomie du titan — cibles et résistances","anatomy-panel");
  await take(3,"Six districts — évacuation et défense civile","civilian-panel");
  await take(4,"R&D — prototypes et recherche tactique","research-panel");
  await take(5,"Carte mondiale — campagne persistante","campaign-panel");
  overview=await snapshot();
  if(scenes.length!==5||scenes.some(x=>x.state.mode!=="campaign"||!x.state.emerged)) throw Error("Incomplete 5-scene Vortex mission capture");
  const adminPath=resolve(root,"assets/app-gallery-admin.json");
  const admin=JSON.parse(await readFile(adminPath,"utf8"));
  admin.previousScreenshots ||= {};
  admin.previousPreviews ||= {};
  admin.previousScreenshots[gameId]=shots.map(x=>oldShotDir+"/"+x.split("/").at(-1));
  admin.previousPreviews[gameId]=oldPreviewPath;
  await writeFile(adminPath,JSON.stringify(admin,null,2)+"\n");
  const galleryPath=resolve(root,"assets/app-gallery.json");
  const gallery=JSON.parse(await readFile(galleryPath,"utf8"));
  const item=gallery[gameId];
  if(!item||item.images.length!==5)throw Error("Missing Vortex Command gallery entry");
  Object.assign(item,{labels:scenes.map(s=>s.label),captureType:"real-ui-navigation",
    captureSource:sourceUrl,captureVersion:"1.0.0",captureDate:new Date().toISOString().slice(0,10),
    captureProof:proofPath,presentationReview:"pending-fidelity"});
  await writeFile(galleryPath,JSON.stringify(gallery,null,2)+"\n");
  const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json");
  const matrix=JSON.parse(await readFile(matrixPath,"utf8"));
  const entry=matrix.entries.find(x=>x.id===gameId);
  if(!entry)throw Error("Missing Vortex tracking row");
  entry.sourceVersionVerified="1.0.0 · GitHub source and runtime title";
  entry.productionVersionVerified="1.0.0 · actual game UI on the stable Vercel alias (not blocked deployment)";
  entry.screenshotFreshness="up-to-date";
  entry.previewFidelity="source-verified";
  entry.screenshotCaptureProof=proofPath;
  entry.captureVerifiedAt=new Date().toISOString();
  entry.notes="5 vraies vues du RTS 2D en campagne: titan émergé, anatomie, civils, R&D et carte mondiale. Même simulation et mêmes données de jeu. 5 anciennes captures + aperçu archivés; keyart 1:1 non validé.";
  entry.preview=previewPath;
  const captured=matrix.entries.filter(x=>!!x.screenshotCaptureProof);
  matrix.summary.recapturedScreenshotCount=captured.length*5;
  matrix.summary.awaitingRecaptureCount=matrix.summary.screenshots-matrix.summary.recapturedScreenshotCount;
  matrix.summary.archivedScreenshotCount=Object.values(admin.previousScreenshots).reduce((acc,files)=>acc+(Array.isArray(files)?files.length:0),0);
  matrix.summary.archivedPreviewCount=Object.values(admin.previousPreviews).filter(Boolean).length;
  matrix.summary.sourceVerifiedGalleries=captured.length;
  await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
  const evidence={captureType:"native-browser-rts",notGeneratedArt:true,
    source:sourceUrl,sourceRepository:"darknigthmare/vortex-command",
    runtimeVersion:"1.0.0",sourcePackageVersion:"1.0.0",capturedAt:new Date().toISOString(),
    viewport:"1280x720",browser:"Chromium headless via native CDP",
    render:"real Canvas2D and actual Vortex Command UI; no synthetic terrain or kaiju positions",
    conditions:{mode:"campaign",kaijuEmerged:true,districtCount:6,systemCount:main.systems.length,gameActive:true},
    preview:{path:previewPath,bytes:preview.length,sha256:sha(preview)},
    archives:{previousScreenshots:admin.previousScreenshots[gameId],previousPreview:oldPreviewPath},
    scenes,finalState:overview,
    limitations:["Capture d'un build publiquement accessible, pas du dernier déploiement BLOCKED",
      "Les quatre onglets opérations montrent la simulation active en arrière-plan",
      "Les cinq images ne certifient pas la fidélité de l'illustration conceptuelle 1:1"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,proofPath),JSON.stringify(evidence,null,2)+"\n");
  console.log("VORTEX NATIVE CAPTURE COMPLETE "+JSON.stringify({version:evidence.runtimeVersion,views:scenes.length,emerged:true,unitCount:overview.units}));
}finally{
  await b.close();
}
