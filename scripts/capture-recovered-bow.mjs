#!/usr/bin/env node
/**
 * Capture actual Resident Evil B.O.W. Protocol R20 player menu.
 * The five images are real UI states (not fabricated combat animation).
 * Do not claim full canonical creature likeness or 1:1 fighter animation.
 */
import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(),id="resident-evil-bow-protocol",source="https://resident-evil-bow-protocol.vercel.app/";
const proofPath="docs/media-proof/resident-evil-bow-r20-2026-11-01.json";
if(existsSync(resolve(root,proofPath))) { console.log("Resident Evil B.O.W. Protocol already has native screenshot proof"); process.exit(0); }
const titleImage="assets/presentations/"+id+".png";
const previewImage="assets/previews/"+id+".jpg";
const gallery=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".png");
const digest=x=>createHash("sha256").update(x).digest("hex");
const browser=await openNativeBrowser(source,{width:1280,height:720,timeout:70000});
const entries=[];
async function click(selector){
  const coords=await browser.evaluate("(()=>{const n=document.querySelector("+JSON.stringify(selector)+");if(!n||n.disabled)throw Error('Missing button "+selector+"');const r=n.getBoundingClientRect();if(r.width<5||r.height<5)throw Error('Hidden button "+selector+"');return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()");
  await browser.call("Page.bringToFront");
  await browser.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:coords.x,y:coords.y});
  await browser.call("Input.dispatchMouseEvent",{type:"mousePressed",x:coords.x,y:coords.y,button:"left",clickCount:1});
  await browser.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:coords.x,y:coords.y,button:"left",clickCount:1});
}
async function take(slot,label,view,expectedSubject=null){
  await browser.waitFor("window.RE_GAME_MENU_R20?.view==="+JSON.stringify(view)+" && !!document.querySelector('.menu-view[data-view="+JSON.stringify(view)+"]:not([hidden])')",10000);
  await browser.sleep(400);
  const state=await browser.evaluate("(()=>({view:RE_GAME_MENU_R20.view,title:document.title,bootHidden:document.getElementById('bootScreen').hidden,specimen:document.getElementById('specimenName')?.textContent.trim(),origin:document.getElementById('specimenOrigin')?.textContent.trim(),imageLoaded:(()=>{const im=document.getElementById('menuSpecimen');return !!im?.complete && im.naturalWidth>0})(),menuItems:document.querySelectorAll('#modesView .operation-list a').length,archives:document.querySelectorAll('#archivesView .archive-list a').length}))()");
  if(!state.bootHidden||state.view!==view||state.title!=="Resident Evil — B.O.W. Protocol")throw Error("Not the verified player UI "+JSON.stringify(state));
  if(expectedSubject && (state.specimen!==expectedSubject||!state.imageLoaded))throw Error("Specimen art not fully rendered "+JSON.stringify(state));
  if(view==="modes"&&state.menuItems<7)throw Error("Not the real modes menu");
  if(view==="archives"&&state.archives<3)throw Error("Not the real archives menu");
  const bytes=await browser.capture("png");
  if(entries.some(e=>e.sha256===digest(bytes)))throw Error("Duplicate menu screenshot "+label);
  await mkdir(resolve(root,"assets/screenshots/"+id),{recursive:true});
  await writeFile(resolve(root,gallery[slot-1]),bytes);
  entries.push({slot,label,kind:"native-player-menu",view,subject:expectedSubject||null,path:gallery[slot-1],sha256:digest(bytes),bytes:bytes.length,state});
  return bytes;
}
try{
  await browser.waitFor("document.title==='Resident Evil — B.O.W. Protocol' && !!window.RE_GAME_MENU_R20 && !!document.getElementById('enterProtocol')",60000);
  await browser.waitFor("!document.getElementById('bootScreen').hidden",10000);
  await browser.sleep(300);
  const title=await browser.capture("png");
  await writeFile(resolve(root,titleImage),title);
  await click("#enterProtocol");
  await take(1,"Confinement — Tyrant et terminal principal","home","TYRANT");
  const preview=await browser.capture("jpeg");
  await writeFile(resolve(root,previewImage),preview);
  await click("#nextSpecimen");
  await take(2,"Confinement — Licker, dossier RE2","home","LICKER");
  await click("#nextSpecimen");
  await click("#nextSpecimen");
  await take(3,"Confinement — Nemesis, dossier RE3","home","NEMESIS");
  await click('[data-open="modes"]');
  await take(4,"Engagement — sept protocoles d'affrontement","modes");
  await click('#modesView [data-back]');
  await browser.waitFor("RE_GAME_MENU_R20.view==='home'");
  await click('[data-open="archives"]');
  await take(5,"Archives biologiques — bestiaire et techniques","archives");
  const raw=await readFile(resolve(root,"assets/recent-games.js"),"utf8");
  const prefix="window.LAUNCHER_RECENT_GAMES = ";
  if(!raw.startsWith(prefix))throw Error("Unexpected recovered-game catalogue");
  const catalog=JSON.parse(raw.slice(prefix.length).replace(/;\s*$/,""));
  const app=catalog.find(x=>x.id===id);
  if(!app?.recoveredGame||!app.mediaPendingReview)throw Error("Recovered game no longer pending");
  app.image=previewImage;app.presentation=titleImage;app.mediaPendingReview=false;
  await writeFile(resolve(root,"assets/recent-games.js"),prefix+JSON.stringify(catalog,null,2)+";\n");
  const galleryPath=resolve(root,"assets/app-gallery.json");
  const manifest=JSON.parse(await readFile(galleryPath,"utf8"));
  const record=manifest[id];
  if(!record||record.images?.length)throw Error("Not an empty placeholder gallery");
  Object.assign(record,{images:gallery,labels:entries.map(x=>x.label),captureType:"real-module-ui",
    captureSource:source,captureVersion:"v0.7.3 · R20 (source)",captureDate:new Date().toISOString().slice(0,10),
    captureProof:proofPath,presentationReview:"source-native-title-screen"});
  delete record.captureNote;
  await writeFile(galleryPath,JSON.stringify(manifest,null,2)+"\n");
  const nativePath=resolve(root,"assets/source-native-media-manifest.json");
  const provenance=JSON.parse(await readFile(nativePath,"utf8"));
  if(provenance.assets.some(x=>x.id===id))throw Error("Duplicate source-native art");
  provenance.assets.push({id,provider:"Game Runtime / Chromium CDP",generator:"native-browser-capture",
    presentation:titleImage,preview:previewImage,sha256:digest(title),sourceUrl:source,
    captureProof:proofPath,sourceType:"Actual game's R20 entry screen and menus; not hand-drawn BOW art",
    version:"0.7.3 (GitHub source, runtime version not signed)"});
  await writeFile(nativePath,JSON.stringify(provenance,null,2)+"\n");
  const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json");
  const matrix=JSON.parse(await readFile(matrixPath,"utf8"));
  const row=matrix.entries.find(x=>x.id===id);
  if(!row||row.screenshotCount!==0)throw Error("Missing media-review row");
  Object.assign(row,{presentation:titleImage,preview:previewImage,screenshotCount:5,mediaPendingReview:false,
    sourceVersionVerified:"GitHub README v0.7.3 R20; actual live UI R20 structures",
    productionVersionVerified:"Deployed player menu verified; exact release hash not certified",
    previewFidelity:"source-verified",screenshotFreshness:"up-to-date",
    captureVerifiedAt:new Date().toISOString(),screenshotCaptureProof:proofPath,
    notes:"Cinq vraies vues de l'interface joueur B.O.W. Protocol (spécimens, modes et archives) ; il ne s'agit pas de captures de combat ni de sprites certifiés 1:1."});
  // The active catalogue is authoritative: four local-only history rows do
  // not carry an explicit mediaPendingReview property in the older matrix.
  matrix.summary.mediaPendingGames=catalog.filter(x=>x.recoveredGame&&x.mediaPendingReview).length;
  matrix.summary.missingNewGameScreenshots=matrix.summary.mediaPendingGames*5;
  matrix.summary.recapturedScreenshotCount=matrix.entries.filter(x=>x.screenshotCaptureProof).reduce((n,x)=>n+x.screenshotCount,0);
  matrix.summary.sourceVerifiedGalleries=matrix.entries.filter(x=>x.screenshotCaptureProof).length;
  await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
  const evidence={captureType:"native-browser-game-player-menu",notGeneratedArt:true,source,
    sourceVersion:"v0.7.3 R20",runtimeVersion:null,
    capturedAt:new Date().toISOString(),viewport:"1280x720",
    presentation:{path:titleImage,sha256:digest(title),bytes:title.length,kind:"actual entry screen"},
    preview:{path:previewImage,sha256:digest(preview),bytes:preview.length,kind:"real Tyrant menu"},
    scenes:entries,
    disclosure:"Images are actual player menu / specimen / operations / archives views. No claim of animated fights, canon-complete BOW roster, or visual franchise 1:1.",
    limitations:["R20 menu validated, no live versus fight captured", "Creature PNGs are provided by the game; their likeness is not externally certified","One combat roster is not proof of all 115 fighters"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,proofPath),JSON.stringify(evidence,null,2)+"\n");
  console.log("RESIDENT EVIL BOW NATIVE MENU CAPTURE "+JSON.stringify({views:entries.length,subjects:entries.map(x=>x.subject).filter(Boolean),title:evidence.presentation.sha256}));
}finally{await browser.close();}
