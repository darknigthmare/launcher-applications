#!/usr/bin/env node
/**
 * Evidence-based CainOS / Digital Circus — Encore screen refresh.
 * Uses real buttons, true first-use calibration, a real running combat
 * renderer and the shipped Vercel production. Never synthesizes artwork.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const root = process.cwd(), id = "cainos";
const source = "https://cainos.vercel.app/";
const evidencePath = "docs/media-proof/cainos-encore-070-2026-11-01.json";
if (existsSync(resolve(root, evidencePath))) {
  console.log("CainOS already captured and proven; no historical media overwritten.");
  process.exit(0);
}
const shotPaths = Array.from({length:5}, (_,i) =>
  "assets/screenshots/cainos/" + String(i+1).padStart(2,"0") + ".png");
const oldDir = "assets/screenshots/previous/cainos";
const previewPath = "assets/previews/cainos.jpg";
const archivePreview = "assets/previews/previous/cainos.jpg";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const browser = await openNativeBrowser(source, {width:1280,height:720,timeout:110000});
const scenes = [];
let previewBytes;
async function click(selector, count=1) {
  const coords=await browser.evaluate("(()=>{const el=document.querySelector("+JSON.stringify(selector)+");if(!el||el.disabled)throw Error('Missing/disabled UI "+selector+"');el.scrollIntoView({block:'center',inline:'center'});const r=el.getBoundingClientRect();if(r.width<6||r.height<6||r.left>=innerWidth||r.top>=innerHeight)throw Error('Hidden UI "+selector+"');return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()");
  await browser.call("Page.bringToFront");
  await browser.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:coords.x,y:coords.y});
  for (let i=1;i<=count;i++){
    await browser.call("Input.dispatchMouseEvent",{type:"mousePressed",x:coords.x,y:coords.y,button:"left",clickCount:i});
    await browser.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:coords.x,y:coords.y,button:"left",clickCount:i});
    if (i<count) await browser.sleep(110);
  }
}
async function enter(){
  await browser.call("Input.dispatchKeyEvent",{type:"rawKeyDown",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
  await browser.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
}
async function saveSlot(label,kind,check) {
  const state=await browser.evaluate(check);
  if(!state?.valid) throw new Error("Scene "+(scenes.length+1)+" failed native UI verification: "+JSON.stringify(state));
  await browser.sleep(300);
  const bytes=await browser.capture("png");
  scenes.push({slot:scenes.length+1,label,kind,path:shotPaths[scenes.length],sha256:sha(bytes),bytes:bytes.length,appState:state});
  return bytes;
}
const actualShots=[];
try{
  await browser.waitFor("(()=>{const x=document.getElementById('boot-init-button');return !!x && x.getClientRects().length>0})()",30000);
  await click("#boot-init-button");
  await browser.waitFor("document.querySelector('#btn-start-simulation')?.getClientRects().length>0",25000);
  await click("#btn-start-simulation");
  await browser.waitFor("document.querySelector('#btn-story-skip')?.getClientRects().length>0",30000);
  await click("#btn-story-skip");
  await browser.waitFor("document.querySelector('#ep0-canvas')?.getClientRects().length>0",25000);
  for(let i=0;i<3;i++){await enter();await browser.sleep(180);}
  await browser.waitFor("!document.querySelector('#power-led')?.classList.contains('active')",25000);
  await click("#power-button");
  await browser.waitFor("document.querySelector('.desktop-icon[data-window=\"combat\"]')?.getClientRects().length>0",25000);
  actualShots.push(await saveSlot(
    "CainOS — bureau C&A après calibration",
    "real-os-desktop",
    "(()=>({valid:!!document.querySelector('.desktop-icon[data-window=\"combat\"]')?.getClientRects().length && getComputedStyle(document.getElementById('desktop-workspace')).display!=='none',osTitle:document.title,hasArchives:!!document.querySelector('.desktop-icon[data-window=\"files\"]'),hasCombat:!!document.querySelector('#win-combat')}))()"
  ));
  previewBytes=await browser.capture("jpeg");
  await click('.desktop-icon[data-window="files"]',2);
  await browser.waitFor("(()=>{const x=document.getElementById('win-files');return !!x&&getComputedStyle(x).display!=='none'&&x.getClientRects().length>0})()",13000);
  actualShots.push(await saveSlot(
    "CainOS — explorateur et archives C&A",
    "real-os-files",
    "(()=>({valid:getComputedStyle(document.querySelector('#win-files')).display!=='none',openedWindow:'win-files',filesListed:document.querySelectorAll('#win-files .file-list > *').length}))()"
  ));
  await browser.call("Page.navigate",{url:source+"combat/"});
  await browser.waitFor("window.Encore?.screen==='home' && document.querySelectorAll('.mode-card[data-mode]').length===9",35000);
  actualShots.push(await saveSlot(
    "Encore — neuf modes de jeu",
    "standalone-real-combat-home",
    "(()=>({valid:window.Encore?.screen==='home'&&document.querySelectorAll('.mode-card[data-mode]').length===9,gameTitle:document.title,modeCount:document.querySelectorAll('.mode-card[data-mode]').length}))()"
  ));
  await click('.mode-card[data-mode="training"]');
  await browser.waitFor("document.querySelectorAll('.fighter-card').length===14 && document.querySelectorAll('.stage-card').length===12",20000);
  actualShots.push(await saveSlot(
    "Encore — quatorze combattants et douze arènes",
    "real-combat-selection",
    "(()=>({valid:document.querySelectorAll('.fighter-card').length===14&&document.querySelectorAll('.stage-card').length===12&&document.querySelector('[data-action=\"start\"]')!==null,fighters:document.querySelectorAll('.fighter-card').length,arenas:document.querySelectorAll('.stage-card').length}))()"
  ));
  await click('[data-action="start"]');
  await browser.waitFor("window.Encore?.ready===true && window.Encore?.snapshot?.phase==='fight' && window.Encore.snapshot?.fighters?.length===2",35000);
  await browser.sleep(900);
  actualShots.push(await saveSlot(
    "Encore — affrontement réel en entraînement",
    "real-2d-fight",
    "(()=>({valid:window.Encore?.ready===true&&window.Encore?.snapshot?.phase==='fight'&&window.Encore.snapshot?.fighters?.length===2&&window.Encore.snapshot?.frame>0,mode:window.Encore?.screen,phase:window.Encore?.snapshot?.phase,frame:window.Encore?.snapshot?.frame,fighters:window.Encore?.snapshot?.fighters?.map(f=>f.id)}))()"
  ));
  if(actualShots.length!==5)throw new Error("Five real screens required");
  // Do not replace the old images until all five scenes have been validated.
  await mkdir(resolve(root,oldDir),{recursive:true});
  await mkdir(resolve(root,"assets/previews/previous"),{recursive:true});
  for(let i=0;i<5;i++){
    const file=shotPaths[i],archived=oldDir+"/"+file.split("/").at(-1);
    if(!existsSync(resolve(root,archived)))await copyFile(resolve(root,file),resolve(root,archived));
    await writeFile(resolve(root,file),actualShots[i]);
  }
  if(!existsSync(resolve(root,archivePreview)))await copyFile(resolve(root,previewPath),resolve(root,archivePreview));
  await writeFile(resolve(root,previewPath),previewBytes);
  const adminPath=resolve(root,"assets/app-gallery-admin.json");
  const admin=JSON.parse(await readFile(adminPath,"utf8"));
  admin.previousScreenshots ||= {};admin.previousPreviews ||= {};
  admin.previousScreenshots[id]=shotPaths.map(x=>oldDir+"/"+x.split("/").at(-1));
  admin.previousPreviews[id]=archivePreview;
  await writeFile(adminPath,JSON.stringify(admin,null,2)+"\n");
  const galleryPath=resolve(root,"assets/app-gallery.json"), gallery=JSON.parse(await readFile(galleryPath,"utf8"));
  const item=gallery[id];
  if(!item||item.images?.length!==5)throw new Error("Existing gallery entry is not five images");
  Object.assign(item,{labels:scenes.map(x=>x.label),captureType:"real-module-ui",captureSource:source,
    captureVersion:"CainOS v0.98 · Encore 0.7 (source)",captureDate:new Date().toISOString().slice(0,10),
    captureProof:evidencePath,presentationReview:"pending-fidelity"});
  await writeFile(galleryPath,JSON.stringify(gallery,null,2)+"\n");
  const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json");
  const matrix=JSON.parse(await readFile(matrixPath,"utf8"));
  const tracked=matrix.entries.find(x=>x.id===id);if(!tracked)throw new Error("Matrix entry CainOS missing");
  tracked.sourceVersionVerified="CainOS v0.98 / Digital Circus Encore 0.7.0 — source README and official UI";
  tracked.productionVersionVerified="Vercel READY commit 146a68cc87ea / runtime CainOS terminal and Encore screens observed";
  tracked.screenshotFreshness="up-to-date";
  tracked.previewFidelity="source-verified";
  tracked.screenshotCaptureProof=evidencePath;
  tracked.captureVerifiedAt=new Date().toISOString();
  tracked.notes="CainOS 0.98 : bureau et archives après calibration effectuée via UI. Encore 0.7 source : 9 modes, 14 combattants, 12 arènes, vrai duel en entraînement. Les anciens cinq menus sont conservés. Aucune prétention de fidélité canon 1:1.";
  await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
  const proof={captureType:"native-browser-multi-module-ui",notGeneratedArt:true,source,
    releaseRef:{deploymentId:"dpl_EFQiRKV6Vsdo7yrxqA4182NHuFDz",gitCommit:"146a68cc87ea088a4dbcf76694115118fc9ed775"},
    capturedAt:new Date().toISOString(),viewport:"1280x720",firstUseCalibration:"completed with real OS button and Enter key events",
    combatPath:source+"combat/",combatVersionEvidence:"CainOS README Digital Circus Encore 0.7.0 plus latest READY Vercel commit",
    preview:{path:previewPath,bytes:previewBytes.length,sha256:sha(previewBytes),sourceScene:"CainOS desktop"},
    archives:{previousScreenshots:admin.previousScreenshots[id],previousPreview:archivePreview},scenes,
    limitations:["Only one training fight started and rendered, not certification of all nine modes","Game art is source-native but not 1:1 canonical proof","CainOS first-use calibration uses a fresh temporary browser profile"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,evidencePath),JSON.stringify(proof,null,2)+"\n");
  console.log("CainOS and Encore REAL native capture "+JSON.stringify({scenes:scenes.length,combat:scenes[4].appState,release:proof.releaseRef}));
} finally {await browser.close();}
