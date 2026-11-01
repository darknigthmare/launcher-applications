#!/usr/bin/env node
/**
 * Source-proven five-scene capture of Dernière Ligne — Zéro Repli v0.44.2.
 * Uses only the full playable local HTML at its real GitHub source commit.
 * Never modifies game engine, injects enemies, forces animations or invents art.
 */
import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(),gameId="derniere-ligne-zero-repli";
const sourceRepo="https://github.com/darknigthmare/The-Horde-The-Last-Stand";
const originalFile=resolve(root,"reference-the-horde/game/JOUER_DERNIERE_LIGNE.html");
const proofPath="docs/media-proof/derniere-ligne-local-0442-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("Dernière Ligne déjà intégrée : aucune nouvelle capture écrasée.");process.exit(0);}
if(!existsSync(originalFile))throw Error("Missing source game HTML: cannot synthesize captures");
const sourceCommit=(process.env.HORDE_SOURCE_SHA||"").trim();
if(!/^[a-f0-9]{40}$/.test(sourceCommit))throw Error("Source commit SHA40 missing — the exact build must be recorded");
const version="0.44.2",viewport="1280x720";
const sha=x=>createHash("sha256").update(x).digest("hex");
const imageDir="assets/screenshots/"+gameId;
const imagePaths=Array.from({length:5},(_,i)=>imageDir+"/"+String(i+1).padStart(2,"0")+".png");
const presentation="assets/presentations/"+gameId+".png",preview="assets/previews/"+gameId+".jpg";
for(const name of [...imagePaths,presentation,preview])if(existsSync(resolve(root,name)))throw Error("Unexpected existing asset; do not silently overwrite: "+name);
const browser=await openNativeBrowser(pathToFileURL(originalFile).href,{width:1280,height:720,timeout:140000});
const frames=[];
async function phase() {
 return browser.evaluate("(()=>({phase:document.getElementById('shell')?.dataset?.phase,title:document.title,night:document.body.innerText.match(/NUIT\\s*0?1\\s*\\/\\s*24/i)?.[0]||null,canvas:document.getElementById('game')?.getBoundingClientRect().width||0,ready:document.readyState}))()");
}
async function tap(id) {
 const center=await browser.evaluate("(()=>{const el=document.getElementById("+JSON.stringify(id)+");if(!el||el.disabled)throw Error('Control unavailable');const r=el.getBoundingClientRect();if(r.width<6||r.height<6)throw Error('Control hidden');return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()");
 await browser.call("Page.bringToFront");
 await browser.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:center.x,y:center.y});
 await browser.call("Input.dispatchMouseEvent",{type:"mousePressed",x:center.x,y:center.y,button:"left",clickCount:1});
 await browser.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:center.x,y:center.y,button:"left",clickCount:1});
}
async function view(slot,label,required) {
 const active=await phase();
 if(!active.title.includes(version)||active.phase!==required||!active.canvas)throw Error("Image rejected: not real runtime "+label+" "+JSON.stringify(active));
 const bytes=await browser.capture("png");
 await writeFile(resolve(root,imagePaths[slot-1]),bytes);
 frames.push({slot,label,path:imagePaths[slot-1],kind:required==="combat"?"real-gameplay":"actual-game-ui",phase:active.phase,sha256:sha(bytes),bytes:bytes.length,screen:viewport});
}
try{
 await browser.waitFor("document.title.includes('0.44.2') && document.getElementById('dl403-play') && document.getElementById('game')",120000);
 await browser.sleep(750);
 const identity=await phase();
 if(!identity.title.startsWith("Dernière Ligne"))throw Error("Source game identity mismatch "+JSON.stringify(identity));
 const titleBytes=await browser.capture("png");
 await mkdir(resolve(root,"assets/presentations"),{recursive:true});
 await mkdir(resolve(root,imageDir),{recursive:true});
 await writeFile(resolve(root,presentation),titleBytes);
 await tap("dl403-play");
 await browser.waitFor("document.getElementById('newCampaign')?.getClientRects().length>0",12000);
 await browser.sleep(300);
 await view(1,"Campagnes — les neuf fronts de la dernière ligne","menu");
 await tap("newCampaign");
 await browser.waitFor("document.getElementById('shell')?.dataset?.phase==='confirm' && document.getElementById('v20SkipTrain')",10000);
 await tap("v20SkipTrain");
 await browser.waitFor("document.getElementById('shell')?.dataset?.phase==='camp' && document.getElementById('startWaveBtn')",12000);
 await browser.sleep(420);
 await view(2,"Dépôt 07 — préparation des défenses et du convoi","camp");
 await tap("startWaveBtn");
 await browser.waitFor("document.getElementById('shell')?.dataset?.phase==='cinematic' && document.getElementById('v18CinemaSkip')",10000);
 await tap("v18CinemaSkip");
 await browser.waitFor("document.getElementById('shell')?.dataset?.phase==='combat' && !document.getElementById('pauseBtn').disabled",12000);
 await browser.sleep(850);
 await view(3,"Nuit 01 — le premier assaut du Dépôt 07","combat");
 await browser.sleep(2200);
 await view(4,"Dépôt 07 — maintien des deux voies","combat");
 await browser.sleep(2600);
 await view(5,"Nuit 01 — ligne de défense et HUD tactique","combat");
 const active=await phase();
 if(active.phase!=="combat")throw Error("Final frame is not playable combat");
 const previewBytes=await browser.capture("jpeg");
 await mkdir(resolve(root,"assets/previews"),{recursive:true});
 await writeFile(resolve(root,preview),previewBytes);
 const recentPath=resolve(root,"assets/recent-games.js"),src=await readFile(recentPath,"utf8");
 const prefix="window.LAUNCHER_RECENT_GAMES = ";
 if(!src.startsWith(prefix))throw Error("Official catalogue format changed");
 const list=JSON.parse(src.slice(prefix.length).replace(/;\s*$/,"")),app=list.find(x=>x.id===gameId);
 if(!app||app.accessPolicy!=="local-download"||app.mediaPendingReview!==true||app.image||app.presentation)throw Error("Game is not pending source review");
 app.image=preview;app.presentation=presentation;app.mediaPendingReview=false;
 await writeFile(recentPath,prefix+JSON.stringify(list,null,2)+";\n");
 const galleryPath=resolve(root,"assets/app-gallery.json"),gallery=JSON.parse(await readFile(galleryPath,"utf8"));
 const item=gallery[gameId];
 if(!item||!Array.isArray(item.images)||item.images.length!==0)throw Error("Cannot overwrite an existing gallery");
 gallery[gameId]={images:imagePaths,labels:frames.map(x=>x.label),captureType:"real-local-gameplay",
   captureSource:sourceRepo,captureVersion:version,captureDate:new Date().toISOString().slice(0,10),
   captureProof:proofPath,presentationReview:"source-verified",
   captureNote:"Trois captures de vraie phase combat et deux écrans de navigation/briefing du build local 0.44.2."};
 await writeFile(galleryPath,JSON.stringify(gallery,null,2)+"\n");
 const nativePath=resolve(root,"assets/source-native-media-manifest.json"),native=JSON.parse(await readFile(nativePath,"utf8"));
 if(native.assets.some(x=>x.id===gameId))throw Error("Already has source-native presentation");
 native.assets.push({id:gameId,provider:"Game Runtime / Chromium CDP",generator:"native-local-file-capture",
   presentation,preview,sha256:sha(titleBytes),sourceUrl:sourceRepo,sourceCommit,
   captureProof:proofPath,sourceType:"Actual 0.44.2 game title UI and gameplay; not invented keyart",version});
 await writeFile(nativePath,JSON.stringify(native,null,2)+"\n");
 const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json"),matrix=JSON.parse(await readFile(matrixPath,"utf8"));
 const row=matrix.entries.find(x=>x.id===gameId);
 if(!row||row.screenshotCount!==0||row.screenshotCaptureProof)throw Error("Matrix already has a claim for this game");
 row.preview=preview;row.presentation=presentation;row.screenshotCount=5;
 row.sourceVersionVerified="0.44.2 · repository "+sourceCommit.slice(0,12);
 row.productionVersionVerified=null;row.captureVerifiedAt=new Date().toISOString();
 row.screenshotFreshness="up-to-date";row.previewFidelity="source-verified";row.screenshotCaptureProof=proofPath;
 row.notes="Capture native du véritable HTML 0.44.2 (5 PNG et aperçu JPEG) : menu campagnes, préparation et trois scènes de combat. Pas de production Vercel inventée, aucune fidélité inter-franchise 1:1 présumée.";
 const verified=matrix.entries.filter(x=>x.screenshotCaptureProof);
 matrix.summary.recapturedScreenshotCount=verified.reduce((sum,x)=>sum+x.screenshotCount,0);
 matrix.summary.sourceVerifiedGalleries=verified.length;
 const pending=matrix.entries.filter(x=>x.screenshotFreshness==="awaiting-first-capture");
 matrix.summary.mediaPendingGames=pending.length;matrix.summary.missingNewGameScreenshots=pending.length*5;
 matrix.summary.expectedScreenshotSlots=matrix.entries.length*5;
 await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
 const proof={captureType:"native-local-browser-gameplay",notGeneratedArt:true,gameId,
  source:sourceRepo,sourceCommit,version,capturedAt:new Date().toISOString(),
  htmlPath:"game/JOUER_DERNIERE_LIGNE.html",browser:"Headless Chromium CDP with file:// origin",
  overview:{title:identity.title,viewport,realCombatPhaseConfirmed:true},
  presentation:{path:presentation,sha256:sha(titleBytes),bytes:titleBytes.length,
    kind:"Actual in-game title/menu artwork, not an image model generation"},
  preview:{path:preview,sha256:sha(previewBytes),bytes:previewBytes.length,kind:"Actual night combat screenshot"},
  scenes:frames,
  noHistoricalMedia:true,
  limitations:["Five frames from one real 0.44.2 campaign, not all nine campaigns",
    "No assumption of Vercel hosting","Authentic runtime views do not establish absolute visual fidelity to external works"]};
 await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
 await writeFile(resolve(root,proofPath),JSON.stringify(proof,null,2)+"\n");
 console.log("HORDE LIVE GAME MEDIA COMPLETE "+JSON.stringify({title:identity.title,source:sourceRepo,version,sourceCommit:sourceCommit.slice(0,12),frames:frames.map(x=>({slot:x.slot,phase:x.phase,bytes:x.bytes}))}));
} finally{await browser.close();}
