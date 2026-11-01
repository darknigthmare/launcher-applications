#!/usr/bin/env node
/**
 * Source-native 3D images from live RIFTCASTERS — Convergence.
 * No QA injection, free camera, or synthetic graphics. Screens from
 * character preparation, game journal, real arena, spell and actual pause.
 */
import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(),id="riftcasters-3d",url="https://riftcasters-3d.vercel.app/";
const proofPath="docs/media-proof/riftcasters-convergence-native-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("RIFTCASTERS native images already validated");process.exit(0);}
const presentation="assets/presentations/"+id+".png",preview="assets/previews/"+id+".jpg";
const shots=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".png");
const digest=x=>createHash("sha256").update(x).digest("hex");
const browser=await openNativeBrowser(url,{width:1280,height:720,timeout:115000,webgl:true});
const frames=[];
async function click(selector) {
  const p=await browser.evaluate("(()=>{const el=document.querySelector("+JSON.stringify(selector)+");if(!el||el.disabled)throw Error('Unavailable "+selector+"');el.scrollIntoView({block:'center',inline:'nearest'});const r=el.getBoundingClientRect();if(r.width<5||r.height<5||r.left>=innerWidth||r.top>=innerHeight)throw Error('Not visible "+selector+"');return{x:r.left+r.width/2,y:r.top+r.height/2};})()");
  await browser.call("Page.bringToFront");
  await browser.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:p.x,y:p.y});
  await browser.call("Input.dispatchMouseEvent",{type:"mousePressed",x:p.x,y:p.y,button:"left",clickCount:1});
  await browser.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:p.x,y:p.y,button:"left",clickCount:1});
}
const byName=text=>"button";
async function actionButton(name) {
  const js="(()=>{const list=[...document.querySelectorAll('button')];const b=list.find(x=>x.textContent?.trim().replace(/\\s+/g,' ') === "+JSON.stringify(name)+");if(!b||b.disabled)throw Error('Button unavailable: "+name+"');b.click();return true;})()";
  return browser.evaluate(js);
}
async function state() {
  return browser.evaluate("(()=>{const p=document.querySelector('[data-testid=\"riftcasters-game\"]');return{phase:p?.dataset.gameState,ready:p?.dataset.gameReady,webglError:p?.dataset.webglError,canvas:document.querySelector('[data-testid=\"game-canvas\"]')?.width,menu:!!document.querySelector('[data-testid=\"start-game\"]'),mana:Number(document.querySelector('progress[aria-label=\"Mana\"]')?.value||0),hudWave:document.querySelector('[data-testid=\"hud-wave\"]')?.textContent.trim().slice(0,30)||'',journal:!![...document.querySelectorAll('button')].find(x=>x.textContent?.trim()==='Fermer le journal'),paused:!!document.body.textContent?.includes('TRANSMISSION SUSPENDUE')};})()");
}
async function shot(slot,label,kind,requiredPhase) {
  const result=await state();
  if(result.ready!=="true"||result.webglError!=="false"||!(result.canvas>500)||result.phase!==requiredPhase)throw Error("RIFTCASTERS state mismatch "+JSON.stringify(result));
  const buf=await browser.capture("png");
  if(frames.some(f=>f.sha256===digest(buf)))throw Error("Duplicate RIFTCASTERS screenshot "+slot);
  await mkdir(resolve(root,"assets/screenshots/"+id),{recursive:true});
  await writeFile(resolve(root,shots[slot-1]),buf);
  frames.push({slot,label,kind,path:shots[slot-1],sha256:digest(buf),bytes:buf.length,observed:result});
}
try {
  await browser.call("Page.bringToFront");
  await browser.waitFor("document.querySelector('[data-testid=\"riftcasters-game\"]')?.dataset.gameReady==='true' && document.querySelector('[data-testid=\"riftcasters-game\"]')?.dataset.webglError==='false' && document.querySelector('[data-testid=\"start-game\"]') && document.title.includes('RIFTCASTERS')",95000);
  await browser.sleep(500);
  const poster=await browser.capture("png");
  await writeFile(resolve(root,presentation),poster);
  // The in-game caster has an aria-hidden glyph before the name, so raw
  // textContent is not the same as its accessible Playwright name.
  await browser.evaluate("(()=>{const b=[...document.querySelectorAll('.caster-grid button')].find(x=>x.querySelector('strong')?.textContent.trim()==='Elias Quill');if(!b||b.disabled)throw Error('Elias Quill selection unavailable');b.click();return true;})()");
  await browser.waitFor("!![...document.querySelectorAll('.caster-grid button')].find(b=>b.querySelector('strong')?.textContent.trim()==='Elias Quill'&&b.getAttribute('aria-pressed')==='true')",10000);
  await browser.sleep(260);
  await shot(1,"Arche — préparation de l'arcaniste Elias Quill","character-selection","menu");
  await browser.evaluate("(()=>{const x=document.querySelector('[data-journal-trigger]');if(!x||x.disabled)throw Error('Journal not present');x.click();return true;})()");
  await actionButton("Paramètres");
  await browser.waitFor("!![...document.querySelectorAll('button')].find(x=>x.textContent?.trim()==='Fermer le journal')",16000);
  await browser.sleep(270);
  await shot(2,"Journal — paramètres et aide à la survie","actual-configuration-journal","menu");
  await actionButton("Fermer le journal");
  await browser.waitFor("document.querySelector('[data-testid=\"start-game\"]') && ![...document.querySelectorAll('button')].find(x=>x.textContent?.trim()==='Fermer le journal')",10000);
  await click('[data-testid="start-game"]');
  await browser.waitFor("document.querySelector('[data-testid=\"riftcasters-game\"]')?.dataset.gameState==='playing'",16000);
  await browser.sleep(480);
  await shot(3,"Convergence — première vague et cockpit de sorts","live-arena-gameplay","playing");
  const jpg=await browser.capture("jpeg");
  await writeFile(resolve(root,preview),jpg);
  const manaBefore=await state();
  await browser.call("Input.dispatchKeyEvent",{type:"rawKeyDown",key:"f",code:"KeyF",windowsVirtualKeyCode:70});
  await browser.call("Input.dispatchKeyEvent",{type:"keyUp",key:"f",code:"KeyF",windowsVirtualKeyCode:70});
  await browser.sleep(420);
  const manaAfter=await state();
  if(manaAfter.phase!=="playing"||manaAfter.mana>=manaBefore.mana) {
    throw Error("RIFTCASTERS live aegis spell not demonstrated "+JSON.stringify({before:manaBefore,after:manaAfter}));
  }
  await shot(4,"Convergence — égide arcanique et dépense de mana","real-ability-usage","playing");
  await browser.call("Input.dispatchKeyEvent",{type:"rawKeyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await browser.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await browser.waitFor("document.querySelector('[data-testid=\"riftcasters-game\"]')?.dataset.gameState==='paused'",12000);
  await browser.sleep(260);
  await shot(5,"Convergence — transmission suspendue","real-pause-menu","paused");

  const gameSource=await readFile(resolve(root,"assets/recent-games.js"),"utf8");
  const prefix="window.LAUNCHER_RECENT_GAMES = ";
  if(!gameSource.startsWith(prefix))throw Error("Unknown launcher catalogue");
  const catalogue=JSON.parse(gameSource.slice(prefix.length).replace(/;\s*$/,""));
  const target=catalogue.find(x=>x.id===id);
  if(!target?.recoveredGame||!target.mediaPendingReview||target.presentation||target.image)throw Error("RIFTCASTERS is not in pending media");
  target.presentation=presentation;target.image=preview;target.mediaPendingReview=false;
  await writeFile(resolve(root,"assets/recent-games.js"),prefix+JSON.stringify(catalogue,null,2)+";\n");
  const galleryFile=resolve(root,"assets/app-gallery.json"),gallery=JSON.parse(await readFile(galleryFile,"utf8"));
  const entry=gallery[id];
  if(!entry||entry.images?.length)throw Error("Expect empty pending gallery");
  Object.assign(entry,{images:shots,labels:frames.map(z=>z.label),captureType:"real-gameplay",
    captureSource:url,captureVersion:"1.0.0-rc.1 (source)",captureDate:new Date().toISOString().slice(0,10),
    captureProof:proofPath,presentationReview:"source-native-title-screen"});
  delete entry.captureNote;
  await writeFile(galleryFile,JSON.stringify(gallery,null,2)+"\n");

  const sourcePath=resolve(root,"assets/source-native-media-manifest.json");
  const manifest=JSON.parse(await readFile(sourcePath,"utf8"));
  if(manifest.assets.some(x=>x.id===id))throw Error("Duplicated native asset source");
  manifest.assets.push({id,provider:"RIFTCASTERS 3D game runtime / Chromium CDP",
    generator:"native-browser-capture",presentation,preview,sha256:digest(poster),
    sourceUrl:url,captureProof:proofPath,sourceType:"Real game selection and active arena; no generated promotional concept",
    version:"GitHub source 1.0.0-rc.1; Vercel production READY SHA 21ef0c45"});
  await writeFile(sourcePath,JSON.stringify(manifest,null,2)+"\n");

  const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json"),matrix=JSON.parse(await readFile(matrixPath,"utf8"));
  const row=matrix.entries.find(x=>x.id===id);
  if(!row||!row.mediaPendingReview||row.screenshotCount!==0)throw Error("RIFTCASTERS missing pending review row");
  Object.assign(row,{presentation,preview,screenshotCount:5,mediaPendingReview:false,
    previewFidelity:"source-verified",screenshotFreshness:"up-to-date",
    sourceVersionVerified:"GitHub package 1.0.0-rc.1, WebGL engine and UI",
    productionVersionVerified:"WebGL enabled and playable at "+url+"; Vercel READY production SHA 21ef0c45",
    captureVerifiedAt:new Date().toISOString(),screenshotCaptureProof:proofPath,
    notes:"5 vues réelles : sélection arcaniste, journal de bord, arène 3D, égide consommant du mana, pause. Pas de boss ni campagne complète certifiés par les images."});
  matrix.summary.mediaPendingGames=catalogue.filter(x=>x.recoveredGame&&x.mediaPendingReview).length;
  matrix.summary.missingNewGameScreenshots=matrix.summary.mediaPendingGames*5;
  matrix.summary.recapturedScreenshotCount=matrix.entries.filter(x=>x.screenshotCaptureProof).reduce((n,x)=>n+x.screenshotCount,0);
  matrix.summary.sourceVerifiedGalleries=matrix.entries.filter(x=>x.screenshotCaptureProof).length;
  await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");

  const report={captureType:"native-webgl-arena",notGeneratedArt:true,source:url,capturedAt:new Date().toISOString(),
    sourceVersion:"1.0.0-rc.1",deploymentId:"dpl_4SZsxJCF6GgJMXwhvuVLJecS3pkg",
    deploymentCommit:"21ef0c45a50ff8f2ccd655d7549c4e6758990186",viewport:"1280x720",
    presentation:{path:presentation,sha256:digest(poster),bytes:poster.length},
    preview:{path:preview,sha256:digest(jpg),bytes:jpg.length},scenes:frames,
    spellEvidence:{manaBefore:manaBefore.mana,manaAfter:manaAfter.mana,phase:"playing"},
    limitations:["WebGL scenes rendered via Chromium SwiftShader, not physical GPU benchmark",
      "Only first wave, character creation, real active spell and pause are proven",
      "No claim of completed boss encounter or comprehensive fidelity 1:1 of all arcanists"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,proofPath),JSON.stringify(report,null,2)+"\n");
  console.log("RIFTCASTERS REAL GAME MEDIA "+JSON.stringify({shots:frames.length,source:url,manaBefore:manaBefore.mana,manaAfter:manaAfter.mana}));
}finally{await browser.close();}
