#!/usr/bin/env node
/**
 * Yu-Gi-Oh! 2.5D Hologram Duel — source-native publication proof.
 * Five real views from the published simulator: deck choice, solo campaign,
 * terrain atlas, active compact duel, active Real-View duel.
 * No illustrated card/character likeness or 1:1 fidelity is inferred.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const root=process.cwd(),id="yugioh-25d-holograms";
const url="https://yugioh-25d-holograms.vercel.app/";
const proofPath="docs/media-proof/yugioh-hologram-native-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("Yu-Gi-Oh capture already proven; no overwrite.");process.exit(0);}
const presentation="assets/presentations/"+id+".png";
const preview="assets/previews/"+id+".jpg";
const images=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".png");
const sha=buf=>createHash("sha256").update(buf).digest("hex");
const b=await openNativeBrowser(url,{width:1280,height:720,webgl:true,timeout:145000});
const captures=[];
async function click(selector) {
  const center=await b.evaluate("(()=>{const el=document.querySelector("+JSON.stringify(selector)+");if(!el||el.disabled)throw Error('Missing button "+selector+"');el.scrollIntoView({block:'center',inline:'nearest'});const r=el.getBoundingClientRect();if(r.width<6||r.height<6||r.left>=innerWidth||r.top>=innerHeight)throw Error('Hidden button "+selector+"');return{x:r.left+r.width/2,y:r.top+r.height/2};})()");
  await b.call("Page.bringToFront");
  await b.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:center.x,y:center.y});
  await b.call("Input.dispatchMouseEvent",{type:"mousePressed",x:center.x,y:center.y,button:"left",clickCount:1});
  await b.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:center.x,y:center.y,button:"left",clickCount:1});
}
async function snap(slot,label,kind,visible) {
  const state=await b.evaluate("(()=>({title:document.title,startVisible:!document.getElementById('start-modal')?.classList.contains('hidden'),campaignVisible:!document.getElementById('campaign-modal')?.classList.contains('hidden'),fieldAtlasVisible:!document.getElementById('field-atlas-modal')?.classList.contains('hidden'),board:!!document.getElementById('duel-board'),handCount:document.getElementById('player-hand')?.children.length||0,playerLp:document.getElementById('player-lp')?.textContent.trim(),opponentLp:document.getElementById('opponent-lp')?.textContent.trim(),phaseText:document.getElementById('turn-status')?.textContent.trim().slice(0,90),viewButton:document.getElementById('btn-toggle-view')?.textContent.trim()}))()");
  if(state.title!=="Yu-Gi-Oh! 2.5D Hologram Duel Simulator")throw Error("Not official duel page");
  if(visible==="start"&&!state.startVisible)throw Error("Deck preparation not displayed "+JSON.stringify(state));
  if(visible==="campaign"&&!state.campaignVisible)throw Error("Solo campaign not displayed "+JSON.stringify(state));
  if(visible==="atlas"&&!state.fieldAtlasVisible)throw Error("Field atlas not displayed "+JSON.stringify(state));
  if(visible==="duel"&&(state.startVisible||state.handCount<2||state.phaseText.includes("Choisissez un deck")))throw Error("No live duel state "+JSON.stringify(state));
  const bytes=await b.capture("png");
  if(captures.some(x=>x.sha256===sha(bytes)))throw Error("Duplicate Yu-Gi-Oh frame slot "+slot);
  await mkdir(resolve(root,"assets/screenshots/"+id),{recursive:true});
  await writeFile(resolve(root,images[slot-1]),bytes);
  captures.push({slot,label,kind,path:images[slot-1],sha256:sha(bytes),bytes:bytes.length,observed:state});
}
try {
  await b.call("Page.bringToFront");
  await b.waitFor("document.title==='Yu-Gi-Oh! 2.5D Hologram Duel Simulator' && !document.getElementById('start-modal')?.classList.contains('hidden') && !!document.getElementById('btn-start-duel')",85000);
  await b.sleep(550);
  const poster=await b.capture("png");
  await writeFile(resolve(root,presentation),poster);

  await click('[data-deck-id="yugi"]');
  await b.sleep(300);
  await snap(1,"KaibaCorp — choisir son deck de départ","player-deck-selection","start");

  await click("#btn-open-campaign");
  await b.waitFor("!document.getElementById('campaign-modal')?.classList.contains('hidden')",24000);
  await b.sleep(420);
  await snap(2,"Parcours solo — défis, médailles et progression","real-campaign-menu","campaign");

  await click("#btn-campaign-back");
  await b.waitFor("!document.getElementById('start-modal')?.classList.contains('hidden')",15000);
  // Opening the campaign sometimes focuses the avatar picker after return.
  // Dispatch the actual registered menu button event, allowing openDialog() to
  // close whichever preceding modal owns focus, without editing game state.
  const openedAtlas=await b.evaluate("(()=>{const e=document.getElementById('btn-open-field-atlas');if(!e)throw Error('Missing atlas button');e.click();return {open:!document.getElementById('field-atlas-modal').classList.contains('hidden'),modals:[...document.querySelectorAll('.modal-overlay:not(.hidden)')].map(x=>x.id)}})()");
  console.log("YU-GI-OH ATLAS OPEN ACTION "+JSON.stringify(openedAtlas));
  await b.sleep(700);
  const atlasProbe=await b.evaluate("(()=>({open:!document.getElementById('field-atlas-modal')?.classList.contains('hidden'),start:!document.getElementById('start-modal')?.classList.contains('hidden'),summary:document.getElementById('field-atlas-summary')?.textContent.trim(),itemCount:document.getElementById('field-atlas-list')?.children.length,active:document.activeElement?.id,dialog:[...document.querySelectorAll('.modal-overlay')].filter(x=>!x.classList.contains('hidden')).map(x=>x.id)}))()");
  console.log("YU-GI-OH FIELD ATLAS "+JSON.stringify(atlasProbe));
  await b.waitFor("!document.getElementById('field-atlas-modal')?.classList.contains('hidden')",14000);
  await b.waitFor("document.getElementById('field-atlas-list')?.children.length>0 || document.getElementById('field-atlas-summary')?.textContent?.includes('catalogue n')",27000);
  await b.sleep(350);
  await snap(3,"Atlas des Terrains — illustrations, règles et décors 3D","real-field-atlas","atlas");

  await click("#btn-close-field-atlas");
  await b.waitFor("!document.getElementById('start-modal')?.classList.contains('hidden')",16000);
  await click("#btn-start-duel");
  await b.waitFor("document.getElementById('start-modal')?.classList.contains('hidden') && document.getElementById('player-hand')?.children.length>=2 && document.getElementById('turn-status')?.textContent?.trim()!=='Choisissez un deck pour commencer.'",115000);
  await b.sleep(600);
  await snap(4,"Duel libre — plateau holographique en vue compacte","live-duel-compact","duel");

  const prior=await b.evaluate("document.getElementById('btn-toggle-view')?.textContent.trim()");
  await click("#btn-toggle-view");
  await b.waitFor("document.getElementById('btn-toggle-view')?.textContent.trim()!=="+JSON.stringify(prior),30000);
  await b.sleep(1300);
  await snap(5,"Duel libre — plateau en Vue Réelle 3D","live-duel-real-view","duel");
  const teaser=await b.capture("jpeg");
  await writeFile(resolve(root,preview),teaser);

  const raw=await readFile(resolve(root,"assets/recent-games.js"),"utf8");
  const prefix="window.LAUNCHER_RECENT_GAMES = ";
  if(!raw.startsWith(prefix))throw Error("Catalogue structure changed");
  const catalogue=JSON.parse(raw.slice(prefix.length).replace(/;\s*$/,""));
  const game=catalogue.find(x=>x.id===id);
  if(!game?.recoveredGame||!game.mediaPendingReview||game.presentation||game.image)throw Error("Game not pending media");
  game.presentation=presentation;
  game.image=preview;
  game.mediaPendingReview=false;
  await writeFile(resolve(root,"assets/recent-games.js"),prefix+JSON.stringify(catalogue,null,2)+";\n");

  const galleryPath=resolve(root,"assets/app-gallery.json"),gallery=JSON.parse(await readFile(galleryPath,"utf8"));
  const current=gallery[id];
  if(!current||current.images?.length)throw Error("Expected source-absent new-game gallery");
  Object.assign(current,{images,labels:captures.map(x=>x.label),captureType:"real-ui-navigation",
    captureSource:url,captureVersion:"1.1.0 (source; public build observed)",captureDate:new Date().toISOString().slice(0,10),
    captureProof:proofPath,presentationReview:"source-native-title-screen"});
  delete current.captureNote;
  await writeFile(galleryPath,JSON.stringify(gallery,null,2)+"\n");

  const manifestPath=resolve(root,"assets/source-native-media-manifest.json");
  const assets=JSON.parse(await readFile(manifestPath,"utf8"));
  if(assets.assets.some(x=>x.id===id))throw Error("Duplicate source-media record");
  assets.assets.push({id,provider:"Yu-Gi-Oh game runtime / Chromium CDP",generator:"native-browser-capture",
    presentation,preview,sha256:sha(poster),sourceUrl:url,captureProof:proofPath,
    sourceType:"Actual game configuration, field atlas and duel views, not drawn fan-art",
    version:"GitHub source 1.1.0; deployed identity observed"});
  await writeFile(manifestPath,JSON.stringify(assets,null,2)+"\n");

  const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json");
  const matrix=JSON.parse(await readFile(matrixPath,"utf8"));
  const row=matrix.entries.find(x=>x.id===id);
  if(!row||!row.mediaPendingReview||row.screenshotCount!==0)throw Error("Missing media review row");
  Object.assign(row,{presentation,preview,screenshotCount:5,mediaPendingReview:false,
    previewFidelity:"source-verified",screenshotFreshness:"up-to-date",
    sourceVersionVerified:"GitHub package 1.1.0, linked game interface verified",
    productionVersionVerified:"Duel and UI available at "+url+"; build 2026-10-21 READY SHA aec7dd5",
    captureVerifiedAt:new Date().toISOString(),screenshotCaptureProof:proofPath,
    notes:"5 vues réelles du simulateur : decks, parcours solo, atlas de Terrain, duel compact et Vue Réelle. Ne certifie ni avatars ni modèles 1:1 aux illustrations."});
  matrix.summary.mediaPendingGames=catalogue.filter(x=>x.recoveredGame&&x.mediaPendingReview).length;
  matrix.summary.missingNewGameScreenshots=matrix.summary.mediaPendingGames*5;
  matrix.summary.recapturedScreenshotCount=matrix.entries.filter(x=>x.screenshotCaptureProof).reduce((n,x)=>n+x.screenshotCount,0);
  matrix.summary.sourceVerifiedGalleries=matrix.entries.filter(x=>x.screenshotCaptureProof).length;
  await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");

  const evidence={captureType:"native-browser-duel-2d-3d",notGeneratedArt:true,source:url,
    sourceRepository:"darknigthmare/yugioh-25d-holograms",
    sourceVersion:"1.1.0",deployedCommit:"aec7dd5939773d68c9e66b786d4821cb1301dec3",
    capturedAt:new Date().toISOString(),viewport:"1280x720",
    presentation:{path:presentation,sha256:sha(poster),bytes:poster.length,kind:"source title / startup modal"},
    preview:{path:preview,sha256:sha(teaser),bytes:teaser.length,kind:"live duel Real View"},
    scenes:captures,limitations:["Five real engine/UI views, no reconstructed copyrighted character illustrations",
      "Version 1.1.0 from source; deployment SHA obtained from Vercel production metadata",
      "Holographic figures and avatars are stylized game models, not franchise-wide 1:1 certified likeness"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,proofPath),JSON.stringify(evidence,null,2)+"\n");
  console.log("YU-GI-OH NATIVE MEDIA VERIFIED "+JSON.stringify({shots:captures.length,kinds:captures.map(x=>x.kind),version:evidence.sourceVersion}));
}finally{await b.close();}
