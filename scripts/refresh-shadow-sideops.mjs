#!/usr/bin/env node
/**
 * Replace unreadable empty Side Ops screenshot with actual operations board.
 * Real Phaser canvas was booted in the previous proof but Chromium's
 * headless draw showed no representative scenery. Do NOT mislabel as gameplay.
 * Keep original five PNG screenshots from launcher 1.12 in editor archives.
 */
import {createHash} from "node:crypto";
import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd();
const proofPath="docs/media-proof/shadow-codec-3100-modules-2026-11-01.json";
const imagePath="assets/screenshots/shadow-codec-ops/03.png";
const galleryPath="assets/app-gallery.json";
const matrixPath="docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json";
const proof=JSON.parse(await readFile(resolve(root,proofPath),"utf8"));
const source="https://shadow-codec-ops.vercel.app/?module=sideops";
if(proof.version!=="3.10.0"||proof.scenes?.[2]?.module!=="sideops")throw Error("Shadow Codec source proof is not v3.10 Side Ops");
if(proof.scenes[2].kind==="native-sideops-operations") {
 console.log("Side Ops operations preview already revised — no repeat.");
 process.exit(0);
}
const browser=await openNativeBrowser(source,{width:1280,height:720,timeout:100000,webgl:true});
try{
 await browser.waitFor("document.querySelector('.layout-shell')?.dataset.route==='sideops' && !!document.querySelector('#sideops-phaser-root canvas') && !!document.querySelector('.sideops-command-bar button')",90000);
 // The actual game pauses when its own "Operations" control is opened.
 const opened=await browser.evaluate("(()=>{let button=[...document.querySelectorAll('.sideops-command-bar button')].find(x=>x.textContent.trim()==='Opérations');if(!button||button.disabled)throw Error('Operations panel unavailable');button.click();return true;})()");
 if(!opened)throw Error("User-facing operations control did not activate");
 await browser.waitFor("document.querySelector('.sideops-page')?.classList.contains('operations-open') && document.querySelector('.sideops-info-panel')?.getClientRects().length>0 && document.querySelectorAll('.mission-card-button').length>=4",15000);
 await browser.evaluate("(()=>{const main=document.querySelector('#main-content');if(main)main.scrollTop=0;const panel=document.querySelector('.sideops-info-panel');if(panel)panel.scrollTop=0;document.querySelector('.sideops-page')?.scrollIntoView({block:'start',behavior:'instant'});return true;})()");
 await browser.sleep(380);
 const info=await browser.evaluate("(()=>{const app=document.querySelector('.layout-shell'),main=document.querySelector('#main-content'),panel=main.querySelector('.sideops-info-panel'),game=main.querySelector('#sideops-phaser-root canvas'),button=[...main.querySelectorAll('.sideops-command-bar button')].find(x=>x.textContent.trim()==='Opérations');return{route:app?.dataset.route,open:button?.getAttribute('aria-expanded')==='true',visible:panel?.getClientRects().length>0,panelText:panel?.innerText?.length,missions:panel?.querySelectorAll('.mission-card-button').length,paused:main.querySelector('.sideops-page')?.classList.contains('operations-open'),gameExists:!!game,gameWidth:game?.width,gameHeight:game?.height,version:(app?.querySelector('.system-card')?.textContent||'').match(/BUILD:\s*(\d+\.\d+\.\d+)/)?.[1]}})()");
 if(info.route!=="sideops"||info.version!=="3.10.0"||!info.open||!info.visible||!(info.missions>=4)||!(info.panelText>320)||!(info.gameWidth>=400)||!(info.gameHeight>=200))throw Error("Source scene not ready "+JSON.stringify(info));
 const bytes=await browser.capture("png");
 const hash=createHash("sha256").update(bytes).digest("hex");
 await writeFile(resolve(root,imagePath),bytes);
 const label="Side Ops — opérations, infiltration et briefings";
 proof.scenes[2]={slot:3,module:"sideops",label,kind:"native-sideops-operations",path:imagePath,bytes:bytes.length,sha256:hash,
  appState:{route:info.route,version:info.version,operationsVisible:info.visible,missions:info.missions,missionCanvasBooted:info.gameExists,canvasWidth:info.gameWidth,canvasHeight:info.gameHeight},
  visualReview:"La vue précédente de canvas sombre a été remplacée par le tableau d'opérations effectivement ouvert."};
 proof.scenes[2].sourceRoute=source;
 proof.noSyntheticCombat=true;
 proof.sideOpsGameplayCaptured=false;
 proof.sideOpsEngineLoaded=true;
 proof.limitations=[...new Set([...(proof.limitations||[]),
  "La troisième vue est le tableau natif des opérations. Le rendu du niveau Side Ops en mode headless apparaissait presque vide : aucun faux combat n'a été publié."])];
 await writeFile(resolve(root,proofPath),JSON.stringify(proof,null,2)+"\n");
 const gallery=JSON.parse(await readFile(resolve(root,galleryPath),"utf8"));
 const entry=gallery["shadow-codec-ops"];if(!entry||entry.images[2]!==imagePath||entry.captureVersion!=="3.10.0")throw Error("Gallery changed while recapturing");
 entry.labels[2]=label;
 await writeFile(resolve(root,galleryPath),JSON.stringify(gallery,null,2)+"\n");
 const matrix=JSON.parse(await readFile(resolve(root,matrixPath),"utf8"));
 const tracked=matrix.entries.find(x=>x.id==="shadow-codec-ops");
 if(!tracked)throw Error("Media matrix entry missing");
 tracked.notes="Cinq vues réelles Shadow Codec 3.10 : accueil, transmission Codec, panneau de missions Side Ops (pas un combat simulé), Campaign Ops et CQC Versus intégré. Le moteur Phaser est chargé mais son rendu headless était sombre. Original intégral archivé; fidélité des affiches non certifiée.";
 await writeFile(resolve(root,matrixPath),JSON.stringify(matrix,null,2)+"\n");
 console.log("Shadow Codec Side Ops source-faithful UI verified "+JSON.stringify({version:info.version,missions:info.missions,sha256:hash,bytes:bytes.length}));
}finally{await browser.close();}
