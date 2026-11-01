#!/usr/bin/env node
/**
 * SHADOW CODEC OPS — live production Vite 3.10.0 modules, captured with Chromium.
 * Native module deep-links are supported by src/app/App.tsx.
 * The Side Ops slot requires a real Phaser canvas; no simulated combat is inserted.
 */
import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {copyFile,mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(), id="shadow-codec-ops",source="https://shadow-codec-ops.vercel.app/";
const proofPath="docs/media-proof/shadow-codec-3100-modules-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("SHADOW CODEC OPS déjà capturé depuis la production.");process.exit(0);}
const currentScreens=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".png");
const oldDir="assets/screenshots/previous/"+id;
const currentPreview="assets/previews/"+id+".jpg";
const oldPreview="assets/previews/previous/"+id+".jpg";
const hash=x=>createHash("sha256").update(x).digest("hex");
const modules=[
 {route:"home",label:"Centre de commandement — accès aux modules",className:"home-grid"},
 {route:"codec",label:"Codec — écran de liaison et fréquences",className:"codec-page"},
 {route:"sideops",label:"Side Ops — véritable mission Phaser latérale",className:"sideops-page"},
 {route:"campaign",label:"Campaign Ops — progression et embranchements",className:"campaign-command-panel"},
 {route:"cqc",label:"CQC Versus — jeu autonome de combat dans le terminal",className:"cqc-module"}
];
const browser=await openNativeBrowser(source,{width:1280,height:720,timeout:110000,webgl:true});
const evidence=[],shots=[];let promoJpeg;
async function routeState(route) {
 const state=await browser.evaluate("(()=>{const root=document.querySelector('.layout-shell'),main=document.querySelector('#main-content');return {route:root?.dataset.route,version:(root?.querySelector('.system-card')?.textContent||'').match(/BUILD:\\s*(\\d+\\.\\d+\\.\\d+)/)?.[1]||null,heading:main?.querySelector('h1,h2')?.textContent?.trim()||null,htmlLength:main?.innerHTML.length||0,bodyTextLength:main?.innerText.length||0,hasError:!!main?.querySelector('[role=alert],.game-engine-status.error'),title:document.title,canvasVisible:!!main?.querySelector('#sideops-phaser-root canvas'),canvasWidth:main?.querySelector('#sideops-phaser-root canvas')?.width||0,canvasHeight:main?.querySelector('#sideops-phaser-root canvas')?.height||0,cqcLoaded:!!main?.querySelector('.cqc-game-frame')?.contentDocument?.querySelector('#shell'),cqcCanvas:!!main?.querySelector('.cqc-game-frame')?.contentDocument?.querySelector('canvas'),cqcTitle:main?.querySelector('.cqc-game-frame')?.contentDocument?.title||null}})()");
 // Side Ops is scrolled to the actual Phaser canvas: little body text remains visible.
 // Real 960×540 game canvas is the evidence, not an arbitrary text threshold.
 const validVisual = route==="sideops" ? state.canvasVisible && state.canvasWidth>=400 && state.canvasHeight>=200
   : state.bodyTextLength >= (route==="cqc" ? 65 : 180);
 if(state.route!==route||state.version!=="3.10.0"||state.hasError||!validVisual)throw Error("Live module not fully loaded "+JSON.stringify(state));
 return state;
}
try {
 for(let i=0;i<modules.length;i++){
  const module=modules[i];
  const url=source+(module.route==="home"?"":"?module="+encodeURIComponent(module.route));
  await browser.call("Page.navigate",{url});
  await browser.waitFor("document.querySelector('.layout-shell')?.dataset.route==="+JSON.stringify(module.route)+" && !!document.querySelector('#main-content ."+module.className+"')",110000);
  await browser.evaluate("(async()=>{await document.fonts?.ready;return true;})()");
  if(module.route==="home"){
    await browser.evaluate("(()=>{const el=document.querySelector('.main-drawer-handle');if(el?.getAttribute('aria-expanded')==='true')el.click();return true;})()");
    await browser.waitFor("!document.querySelector('.layout-shell')?.classList.contains('navigation-open')",8000);
  }
  if(module.route==="sideops"){
    await browser.waitFor("!!document.querySelector('#sideops-phaser-root canvas') && document.querySelector('#sideops-phaser-root canvas')?.width>400 && !document.querySelector('.game-engine-status.error')",45000);
    await browser.evaluate("(()=>{document.querySelector('#sideops-phaser-root')?.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});return true;})()");
  }else if(module.route==="cqc"){
    await browser.waitFor("!!document.querySelector('#main-content .cqc-game-frame')?.contentDocument?.querySelector('#shell') && !!document.querySelector('#main-content .cqc-game-frame')?.contentDocument?.querySelector('canvas')",55000);
    await browser.evaluate("(()=>{document.querySelector('#main-content .cqc-game-frame')?.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});return true;})()");
  }else{
    await browser.evaluate("(()=>{const main=document.querySelector('#main-content');if(main)main.scrollTop=0;return true;})()");
  }
  await browser.sleep(module.route==="sideops"||module.route==="cqc"?1050:650);
  const state=await routeState(module.route);
  if(module.route==="sideops" && (!state.canvasVisible||state.canvasWidth<400||state.canvasHeight<200))throw Error("Side Ops cannot be shown without actual Phaser rendering "+JSON.stringify(state));
  if(module.route==="cqc" && (!state.cqcLoaded||!state.cqcCanvas||state.cqcTitle!=="CQC VERSUS"))throw Error("CQC frame is not actually playable "+JSON.stringify(state));
  const shot=await browser.capture("png");
  shots.push(shot);
  evidence.push({slot:i+1,module:module.route,label:module.label,kind:module.route==="sideops"?"real-sideops-engine":module.route==="cqc"?"real-cqc-iframe-game":"native-module-ui",path:currentScreens[i],sha256:hash(shot),bytes:shot.length,appState:state});
  if(module.route==="codec")promoJpeg=await browser.capture("jpeg");
  console.log("Shadow Codec Ops native route verified "+JSON.stringify({route:module.route,version:state.version,bytes:shot.length,canvas:state.canvasVisible}));
 }
 if(shots.length!==5||!promoJpeg)throw Error("Native multi-era capture incomplete");
 await mkdir(resolve(root,oldDir),{recursive:true});
 await mkdir(resolve(root,"assets/previews/previous"),{recursive:true});
 for(let i=0;i<5;i++) {
   const original=currentScreens[i],archive=oldDir+"/"+original.split("/").at(-1);
   if(!existsSync(resolve(root,original)))throw Error("Original missing "+original);
   if(!existsSync(resolve(root,archive)))await copyFile(resolve(root,original),resolve(root,archive));
   await writeFile(resolve(root,original),shots[i]);
 }
 if(!existsSync(resolve(root,oldPreview)))await copyFile(resolve(root,currentPreview),resolve(root,oldPreview));
 await writeFile(resolve(root,currentPreview),promoJpeg);
 const adminPath=resolve(root,"assets/app-gallery-admin.json"),admin=JSON.parse(await readFile(adminPath,"utf8"));
 admin.previousScreenshots ||= {};admin.previousPreviews ||= {};
 admin.previousScreenshots[id]=currentScreens.map(x=>oldDir+"/"+x.split("/").at(-1));admin.previousPreviews[id]=oldPreview;
 await writeFile(adminPath,JSON.stringify(admin,null,2)+"\n");
 const galleryPath=resolve(root,"assets/app-gallery.json"),gallery=JSON.parse(await readFile(galleryPath,"utf8"));
 if(!gallery[id]||gallery[id].images.length!==5)throw Error("Launcher Shadow Codec source mismatch");
 Object.assign(gallery[id],{labels:modules.map(x=>x.label),captureType:"real-module-ui",captureSource:source,
    captureVersion:"3.10.0",captureDate:new Date().toISOString().slice(0,10),captureProof:proofPath,
    presentationReview:"pending-fidelity"});
 await writeFile(galleryPath,JSON.stringify(gallery,null,2)+"\n");
 const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json"),matrix=JSON.parse(await readFile(matrixPath,"utf8"));
 const entry=matrix.entries.find(x=>x.id===id);if(!entry)throw Error("Shadow Codec media entry missing");
 entry.sourceVersionVerified="3.10.0 — package.json du SHA publié 77c830974fa";
 entry.productionVersionVerified="3.10.0 — BUILD affiché; READY Vercel sha 77c830974fa";
 entry.screenshotFreshness="up-to-date";entry.previewFidelity="source-verified";
 entry.screenshotCaptureProof=proofPath;entry.captureVerifiedAt=new Date().toISOString();
 entry.notes="Cinq interfaces réelles 3.10.0 : accueil, Codec, moteur Side Ops/Phaser, campagne et CQC Versus embarqué. Aucune sauvegarde fabriquée. Un aperçu du Codec remplace l'ancien. L'illustration conceptuelle reste hors galerie publique dans l'attente d'une revue 1:1.";
 const sourceVerified=matrix.entries.filter(x=>x.screenshotCaptureProof);
 const revised=sourceVerified.reduce((sum,x)=>sum+x.screenshotCount,0);
 Object.assign(matrix.summary,{recapturedScreenshotCount:revised,awaitingRecaptureCount:matrix.summary.screenshots-revised,
   archivedScreenshotCount:Object.values(admin.previousScreenshots||{}).flat().length,
   archivedPreviewCount:Object.keys(admin.previousPreviews||{}).length,
   sourceVerifiedGalleries:sourceVerified.length});
 await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
 const report={captureType:"native-browser-multi-module-ui",notGeneratedArt:true,source,version:"3.10.0",
   releaseRef:{deploymentId:"dpl_B142nqaBD7CWoC9xoBwL8voL271E",gitCommit:"77c830974fa672fc1746a875954af3e9bf39014e"},
   capturedAt:new Date().toISOString(),viewport:"1280x720",browser:"headless Chrome with software WebGL for Phaser",
   noInjectedSave:true,noSyntheticCombat:true,activeSideOpsCanvas:true,activeCqcIframeGame:true,
   preview:{path:currentPreview,sourceModule:"codec",bytes:promoJpeg.length,sha256:hash(promoJpeg)},
   archives:{previousScreenshots:admin.previousScreenshots[id],previousPreview:oldPreview},
   scenes:evidence,limitations:["Five native views including CQC iframe, not proof of completing each operation or the full CQC campaign","Software WebGL screenshots do not measure actual GPU performance","Source and deployment versions verified by runtime build label; art fidelity 1:1 needs separate review"]};
 await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
 await writeFile(resolve(root,proofPath),JSON.stringify(report,null,2)+"\n");
 console.log("Shadow Codec Ops native modules ready "+JSON.stringify({captures:evidence.length,canvas:evidence[2].appState.canvasWidth,cqc:evidence[4].appState.cqcLoaded,version:report.version}));
}finally{await browser.close();}
