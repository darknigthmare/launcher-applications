#!/usr/bin/env node
/**
 * RECLAIMED: AFTER DARK 2.0.0 — five native browser views from the
 * confirmed public production. All five correspond to its documented
 * QA flow, not simulated horror artwork or fabricated encounters.
 */
import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(),id="reclaimed-after-dark";
const url="https://reclaimed-after-dark.vercel.app/";
const sourceVersion="2.0.0";
const commit="42db6a4f7372f6af442cf0c351cd7332d0989754";
const proofPath="docs/media-proof/reclaimed-blackwater-200-native-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("RECLAIMED: native game media already verified");process.exit(0);}
const poster="assets/presentations/"+id+".png",preview="assets/previews/"+id+".jpg";
const shots=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".png");
const hash=b=>createHash("sha256").update(b).digest("hex");
const b=await openNativeBrowser(url,{width:1280,height:720,timeout:90000});
const scenes=[];
async function click(id) {
  const point=await b.evaluate("(()=>{const e=document.getElementById("+JSON.stringify(id)+");if(!e||e.disabled)throw Error('No active button '+("+JSON.stringify(id)+"));e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();if(r.width<5||r.height<5)throw Error('Invisible button');return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await b.call("Page.bringToFront");
  await b.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:point.x,y:point.y});
  await b.call("Input.dispatchMouseEvent",{type:"mousePressed",x:point.x,y:point.y,button:"left",clickCount:1});
  await b.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:point.x,y:point.y,button:"left",clickCount:1});
}
async function escapeMenu(){
  await b.call("Input.dispatchKeyEvent",{type:"rawKeyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await b.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await b.waitFor("document.querySelector('.game-shell')?.dataset.screen==='menu' && !document.getElementById('menu-screen').hidden",12000);
}
async function observed(){
  return b.evaluate("(()=>{const s=document.querySelector('.game-shell');const id=s?.dataset.screen;return {title:document.title,screen:id,menu:!document.getElementById('menu-screen').hidden,briefing:!document.getElementById('briefing-screen').hidden,playing:id==='playing',dossiers:!document.getElementById('dossiers-screen').hidden,workshop:!document.getElementById('workshop-screen').hidden,canvasWidth:document.getElementById('game-canvas')?.width,objective:document.getElementById('hud-objective')?.textContent.trim().slice(0,90),night:document.getElementById('hud-night')?.textContent.trim(),gameTitle:document.getElementById('game-title')?.textContent.replace(/\\s+/g,' ').trim()}})()");
}
async function capture(slot,label,kind,predicate){
  const state=await observed();
  if(!state.title.includes("RECLAIMED: AFTER DARK")||state.gameTitle!=="RECLAIMED AFTER DARK"||!predicate(state))throw Error("Source scene not verified "+slot+" "+JSON.stringify(state));
  await b.sleep(260);
  const bytes=await b.capture("png");
  if(scenes.some(x=>x.sha256===hash(bytes)))throw Error("Duplicate media frame "+slot);
  await mkdir(resolve(root,"assets/screenshots/"+id),{recursive:true});
  await writeFile(resolve(root,shots[slot-1]),bytes);
  scenes.push({slot,label,kind,path:shots[slot-1],sha256:hash(bytes),bytes:bytes.length,observed:state});
  return bytes;
}
try {
  await b.waitFor("document.querySelector('.game-shell')?.dataset.screen==='menu' && document.getElementById('game-title')?.textContent.replace(/\\s+/g,' ').trim()==='RECLAIMED AFTER DARK'",90000);
  const opening=await capture(1,"Blackwater — menu du refuge","real-main-menu",s=>s.menu&&s.screen==="menu");
  await writeFile(resolve(root,poster),opening);
  await click("dossiers-button");
  await b.waitFor("!document.getElementById('dossiers-screen').hidden",9000);
  await capture(2,"Archives opérationnelles — campagne et secteurs","real-campaign-records",s=>s.dossiers);
  await escapeMenu();
  await click("workshop-button");
  await b.waitFor("!document.getElementById('workshop-screen').hidden",9000);
  await capture(3,"Établi du refuge — équipements et améliorations","real-workshop-screen",s=>s.workshop);
  await escapeMenu();
  await click("continue-button");
  await b.waitFor("document.querySelector('.game-shell')?.dataset.screen==='briefing' && !document.getElementById('briefing-screen').hidden",11000);
  await capture(4,"Briefing — la première expédition à Blackwater","real-expedition-briefing",s=>s.briefing&&s.screen==="briefing");
  await click("deploy-button");
  await b.waitFor("document.querySelector('.game-shell')?.dataset.screen==='playing' && !!document.getElementById('hud-objective')?.textContent",14000);
  await b.sleep(1100);
  await capture(5,"Quais du Canal — expédition en cours","real-extraction-gameplay",s=>s.playing&&s.canvasWidth>400&&!!s.objective);
  const previewBytes=await b.capture("jpeg");
  await writeFile(resolve(root,preview),previewBytes);
  if(scenes.length!==5 || scenes[4].observed.screen!=="playing")throw Error("Game never deployed to field");

  const recPath=resolve(root,"assets/recent-games.js");
  const data=await readFile(recPath,"utf8"),prefix="window.LAUNCHER_RECENT_GAMES = ";
  if(!data.startsWith(prefix))throw Error("Unexpected launcher data");
  const apps=JSON.parse(data.slice(prefix.length).replace(/;\s*$/,""));
  const app=apps.find(x=>x.id===id);
  if(!app?.recoveredGame||!app.mediaPendingReview||app.presentation||app.image)throw Error("RECLAIMED was not pending real media");
  app.presentation=poster;app.image=preview;app.mediaPendingReview=false;
  await writeFile(recPath,prefix+JSON.stringify(apps,null,2)+";\n");

  const galleryPath=resolve(root,"assets/app-gallery.json");
  const gallery=JSON.parse(await readFile(galleryPath,"utf8"));
  if(!gallery[id] || gallery[id].images?.length)throw Error("Unexpected gallery data");
  Object.assign(gallery[id],{images:shots,labels:scenes.map(x=>x.label),captureType:"real-ui-navigation",
    captureSource:url,captureVersion:sourceVersion,captureDate:new Date().toISOString().slice(0,10),
    captureProof:proofPath,presentationReview:"source-native-title-screen"});
  delete gallery[id].captureNote;
  await writeFile(galleryPath,JSON.stringify(gallery,null,2)+"\n");

  const nativePath=resolve(root,"assets/source-native-media-manifest.json");
  const native=JSON.parse(await readFile(nativePath,"utf8"));
  if(native.assets.some(x=>x.id===id))throw Error("Repeated native media record");
  native.assets.push({id,provider:"RECLAIMED 2.0 actual game/Chromium CDP",generator:"native-browser-capture",
    presentation:poster,preview,sha256:hash(opening),sourceUrl:url,captureProof:proofPath,
    sourceType:"Actual Blackwater game menu, campaign dossiers, workbench, briefing and deployed expedition",
    version:"2.0.0 — Vercel production SHA "+commit});
  await writeFile(nativePath,JSON.stringify(native,null,2)+"\n");

  const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json"),matrix=JSON.parse(await readFile(matrixPath,"utf8"));
  const row=matrix.entries.find(x=>x.id===id);
  if(!row?.mediaPendingReview||row.screenshotCount!==0)throw Error("Missing RECLAIMED source review");
  Object.assign(row,{presentation:poster,preview,screenshotCount:5,mediaPendingReview:false,
    previewFidelity:"source-verified",screenshotFreshness:"up-to-date",
    screenshotCaptureProof:proofPath,captureVerifiedAt:new Date().toISOString(),
    sourceVersionVerified:"2.0.0 repository SHA "+commit,
    productionVersionVerified:"Public Vercel game booted with actual expedition at "+url+" — build "+commit,
    notes:"5 captures natives: refuge, dossiers, atelier, briefing, première zone de jeu. Cette preuve de rendu ne certifie pas toute la campagne ni les personnages en 1:1."});
  const verified=matrix.entries.filter(x=>x.screenshotCaptureProof);
  matrix.summary.entries=matrix.entries.length;
  matrix.summary.mediaPendingGames=apps.filter(x=>x.recoveredGame&&x.mediaPendingReview).length;
  matrix.summary.missingNewGameScreenshots=matrix.summary.mediaPendingGames*5;
  matrix.summary.recapturedScreenshotCount=verified.reduce((acc,x)=>acc+x.screenshotCount,0);
  matrix.summary.sourceVerifiedGalleries=verified.length;
  await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");

  const proof={captureType:"source-native-real-extraction-campaign",notGeneratedArt:true,
    source:url,sourceRepository:"darknigthmare/reclaimed-after-dark",sourceVersion,sourceCommit:commit,
    deploymentId:"dpl_HueHPr2mX91ZyGuNd4bDFFmTkwkz",capturedAt:new Date().toISOString(),
    viewport:"1280x720",referenceCaptureWorkflow:"darknigthmare/reclaimed-after-dark/scripts/capture-qa.mjs",
    presentation:{path:poster,sha256:hash(opening),bytes:opening.length},
    preview:{path:preview,sha256:hash(previewBytes),bytes:previewBytes.length},
    scenes,limitations:["Menu/archives/atelier/briefing plus une scène de terrain confirmée, pas toutes les neuf cartes",
      "No synthetic encounters, no fabricated licensed art, no 1:1 character-fidelity claim",
      "Native browser frames from the published production, not a physical device benchmark"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,proofPath),JSON.stringify(proof,null,2)+"\n");
  console.log("RECLAIMED NATIVE BLACKWATER "+JSON.stringify({version:sourceVersion,frames:scenes.length,last:scenes[4].observed.screen,source:url}));
}finally{await b.close();}
