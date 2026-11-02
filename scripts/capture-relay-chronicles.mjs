#!/usr/bin/env node
/**
 * Recover Mass Effect — Relay Chronicles with real source-native captures:
 * title, commander creation, customization, Normandy briefing, 3D Normandy
 * gameplay and equipment. Only five named gallery screenshots; no forged art.
 *
 * The public Vite build disables the developer __RELAY_TEST__ harness.
 * This script uses the actual production UI, real pointer clicks and
 * the actual WebGL renderer, never a QA-injected fake game state.
 */
import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(),id="mass-effect-relay-chronicles";
const url="https://masseffectrelaychronicles.vercel.app/";
const proofPath="docs/media-proof/mass-effect-relay-native-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("Mass Effect: native proof already present; refusing to overwrite.");process.exit(0);}
const presentationPath="assets/presentations/"+id+".png";
const previewPath="assets/previews/"+id+".jpg";
const screenshots=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".png");
const digest=bytes=>createHash("sha256").update(bytes).digest("hex");
const b=await openNativeBrowser(url,{width:1280,height:720,timeout:125000,webgl:true});
const scenes=[];
let runtimeVersion="";
async function click(selector) {
  const p=await b.evaluate("(()=>{const el=document.querySelector("+JSON.stringify(selector)+");if(!el||el.disabled)throw Error('Control missing or disabled: "+selector+"');el.scrollIntoView({block:'center',inline:'center'});const r=el.getBoundingClientRect();if(r.width<5||r.height<5||r.left>=innerWidth||r.top>=innerHeight)throw Error('Control hidden: "+selector+"');return{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};})()");
  await b.call("Page.bringToFront");
  await b.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:p.x,y:p.y});
  await b.call("Input.dispatchMouseEvent",{type:"mousePressed",x:p.x,y:p.y,button:"left",clickCount:1});
  await b.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:p.x,y:p.y,button:"left",clickCount:1});
}
async function capture(slot,label,kind,required) {
  const data=await b.evaluate("(()=>({title:document.title,overlayTitle:document.querySelector('#overlay .screen-head h2')?.textContent.trim()||'',overlayText:document.querySelector('#overlay')?.textContent?.trim()?.slice(0,150)||'',worldCanvas:document.querySelector('#world canvas')?.width||0,hud:document.querySelector('#hud')?.innerText?.slice(0,130)||'',transitionActive:document.getElementById('transition')?.classList.contains('active')}))()");
  if(!data.title.includes("Mass Effect")||data.transitionActive)throw Error("Not a verified Mass Effect scene "+JSON.stringify(data));
  if(required==="world" && (!(data.worldCanvas>100)||!data.hud.includes("Normandy")))throw Error("Real 2D/3D Normandy stage missing "+JSON.stringify(data));
  if(required==="dialogue" && !/Anderson|briefing/i.test(data.overlayText))throw Error("Actual Normandy dialogue missing "+JSON.stringify(data));
  if(required==="equipment" && !/Équipement|equipement/i.test(data.overlayTitle))throw Error("Equipment view missing "+JSON.stringify(data));
  const bytes=await b.capture("png");
  if(scenes.some(x=>x.sha256===digest(bytes)))throw Error("Duplicate Mass Effect screen "+slot);
  await mkdir(resolve(root,"assets/screenshots/"+id),{recursive:true});
  await writeFile(resolve(root,screenshots[slot-1]),bytes);
  scenes.push({slot,label,kind,path:screenshots[slot-1],sha256:digest(bytes),bytes:bytes.length,observed:data});
}
try {
  await b.call("Page.bringToFront");
  await b.waitFor("document.title.includes('Mass Effect') && !!document.querySelector('[data-do=\"new\"]') && !!document.querySelector('.title-footer')",120000);
  const build=await b.evaluate("document.querySelector('.title-footer')?.textContent.trim()||''");
  runtimeVersion=build.match(/Version\s*([0-9.]+)/i)?.[1]||"";
  if(!runtimeVersion||!/^\d+\.\d+\.\d+$/.test(runtimeVersion))throw Error("Runtime Mass Effect version missing: "+build);
  if(runtimeVersion!=="0.3.0")throw Error("Deployed version differs from known source 0.3.0: "+runtimeVersion);
  await b.sleep(450);
  const title=await b.capture("png");
  await writeFile(resolve(root,presentationPath),title);
  await click('[data-do="new"]');
  await b.waitFor("!!document.querySelector('#commander-name') && !!document.querySelector('[data-do=\"begin\"]')",12000);
  await b.sleep(250);
  await capture(1,"Dossier Alliance — création du commandant Shepard","real-creation-ui","creation");
  await click('[data-do="customization-create"]');
  await b.waitFor("!!document.querySelector('.customization-screen [data-do=\"custom-tab\"]')",18000);
  await b.sleep(480);
  await capture(2,"Atelier du commandant — apparence, armure et équipement","real-customization-ui","customization");
  await click('[data-do="custom-cancel"]');
  await b.waitFor("!!document.querySelector('#commander-name') && !!document.querySelector('[data-do=\"begin\"]')",11000);
  await b.evaluate("(()=>{const n=document.getElementById('commander-name');n.value='Shepard';n.dispatchEvent(new Event('input',{bubbles:true}));return true;})()");
  await click('[data-do="begin"]');
  await b.waitFor("!!document.querySelector('#overlay [data-do=\"dialogue-choice\"]') && /Anderson|briefing/i.test(document.querySelector('#overlay')?.textContent||'')",75000);
  await b.sleep(280);
  await capture(3,"Transmission — Anderson donne l'ordre de briefing","real-story-dialogue","dialogue");
  await click('#overlay [data-do="dialogue-choice"]');
  await b.waitFor("!!document.querySelector('#hud [data-do=\"equipment\"]') && !document.getElementById('transition')?.classList.contains('active') && !!document.querySelector('#world canvas')",50000);
  await b.sleep(1100);
  await capture(4,"SSV Normandy — exploration en sprites 2D et décor 3D","real-2d-3d-exploration","world");
  const preview=await b.capture("jpeg");
  await writeFile(resolve(root,previewPath),preview);
  await click('#hud [data-do="equipment"]');
  await b.waitFor("!!document.querySelector('#overlay .screen-head h2') && /Équipement|equipement/i.test(document.querySelector('#overlay .screen-head h2')?.textContent||'')",18000);
  await b.sleep(400);
  await capture(5,"Inventaire — équipement de l'escouade et ressources","real-equipment-ui","equipment");

  const recentPath=resolve(root,"assets/recent-games.js"),raw=await readFile(recentPath,"utf8"),prefix="window.LAUNCHER_RECENT_GAMES = ";
  if(!raw.startsWith(prefix))throw Error("Unexpected launcher game catalogue");
  const games=JSON.parse(raw.slice(prefix.length).replace(/;\s*$/,""));
  const game=games.find(x=>x.id===id);
  if(!game?.recoveredGame||!game.mediaPendingReview||game.presentation||game.image)throw Error("Game already approved or missing");
  game.mediaPendingReview=false;
  game.presentation=presentationPath;
  game.image=previewPath;
  await writeFile(recentPath,prefix+JSON.stringify(games,null,2)+";\n");
  const galleryPath=resolve(root,"assets/app-gallery.json"),gallery=JSON.parse(await readFile(galleryPath,"utf8"));
  const item=gallery[id];
  if(!item||!Array.isArray(item.images)||item.images.length)throw Error("Gallery is not a pending empty record");
  Object.assign(item,{images:screenshots,labels:scenes.map(z=>z.label),captureType:"real-ui-navigation",
    captureSource:url,captureVersion:runtimeVersion,captureDate:new Date().toISOString().slice(0,10),
    captureProof:proofPath,presentationReview:"source-native-title-screen"});
  delete item.captureNote;
  await writeFile(galleryPath,JSON.stringify(gallery,null,2)+"\n");

  const sourcePath=resolve(root,"assets/source-native-media-manifest.json");
  const art=JSON.parse(await readFile(sourcePath,"utf8"));
  if(art.assets.some(x=>x.id===id))throw Error("Duplicate source native presentation");
  art.assets.push({id,provider:"Mass Effect Game Runtime / Chromium CDP",generator:"native-browser-capture",
    presentation:presentationPath,preview:previewPath,sha256:digest(title),sourceUrl:url,
    captureProof:proofPath,sourceType:"Actual title screen + 5 player UI/Normandy views, not fabricated canon keyart",
    version:runtimeVersion});
  await writeFile(sourcePath,JSON.stringify(art,null,2)+"\n");

  const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json"),matrix=JSON.parse(await readFile(matrixPath,"utf8"));
  const row=matrix.entries.find(x=>x.id===id);
  if(!row||row.screenshotCount!==0||!row.mediaPendingReview)throw Error("Missing source pending row");
  Object.assign(row,{presentation:presentationPath,preview:previewPath,screenshotCount:5,mediaPendingReview:false,
    sourceVersionVerified:"GitHub source 0.3.0; exact version printed by deployed game",
    productionVersionVerified:"Live "+runtimeVersion+" displayed in title and actual Normandy initialized",
    previewFidelity:"source-verified",screenshotFreshness:"up-to-date",
    captureVerifiedAt:new Date().toISOString(),screenshotCaptureProof:proofPath,
    notes:"Vrai titre, création, personnalisation, dialogue d'Anderson, Normandy 2D/3D et équipement capturés sur le jeu public. Aucune prétention de Mass Effect intégral ou sprites 1:1."});
  matrix.summary.mediaPendingGames=games.filter(x=>x.recoveredGame&&x.mediaPendingReview).length;
  matrix.summary.missingNewGameScreenshots=matrix.summary.mediaPendingGames*5;
  matrix.summary.recapturedScreenshotCount=matrix.entries.filter(x=>x.screenshotCaptureProof).reduce((a,x)=>a+x.screenshotCount,0);
  matrix.summary.sourceVerifiedGalleries=matrix.entries.filter(x=>x.screenshotCaptureProof).length;
  await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
  const report={captureType:"native-browser-rpg-ui-and-world",notGeneratedArt:true,source:url,version:runtimeVersion,
    capturedAt:new Date().toISOString(),resolution:"1280x720",browser:"Chromium CDP with software WebGL renderer",
    presentation:{path:presentationPath,sha256:digest(title),bytes:title.length,kind:"real in-game title"},
    preview:{path:previewPath,sha256:digest(preview),bytes:preview.length,kind:"real playable Normandy world"},
    scenes,limitations:["The 2D/3D game is a Mass Effect adaptation, not 1:1 canon recreation",
      "Only the introductory Normandy route, creation and equipment are evidenced",
      "No combat ATB shown; gameplay and balance outside these scenes not certified"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,proofPath),JSON.stringify(report,null,2)+"\n");
  console.log("MASS EFFECT RELAY CAPTURES READY "+JSON.stringify({screenshots:scenes.length,version:runtimeVersion,labels:scenes.map(s=>s.label)}));
}finally{await b.close();}
