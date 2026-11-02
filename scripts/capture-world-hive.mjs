#!/usr/bin/env node
/**
 * WORLD HIVE WARS: five genuine 0.45.0 production UI screenshots.
 * New campaign created through the real onboarding controls (no injected save),
 * in private simulation mode: no real geolocation requests or user account.
 * These are real campaign interfaces; do NOT call them combat captures.
 */
import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {rename,mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(), id="world-hive-wars",source="https://world-hive-wars.vercel.app/";
const proofPath="docs/media-proof/world-hive-045-campaign-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("WORLD HIVE WARS recapturé; anciennes vues conservées.");process.exit(0);}
const oldScreens=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".webp");
const newScreens=oldScreens.map(p=>p.replace(/\.webp$/,".png"));
const oldDir="assets/screenshots/previous/"+id;
const oldPreview="assets/previews/"+id+".webp";
const newPreview="assets/previews/"+id+".jpg";
const archivedPreview="assets/previews/previous/"+id+".webp";
const sha=x=>createHash("sha256").update(x).digest("hex");
const b=await openNativeBrowser(source,{width:1280,height:720,timeout:145000});
const paths=[
  {screen:"map",label:"Carte tactique — secteur en simulation privée"},
  {screen:"colony",label:"Bastion Kestrel — modules et réserves"},
  {screen:"defense",label:"Périmètre colonial — préparation des défenses"},
  {screen:"squad",label:"Colonial Marines — équipe et équipements"},
  {screen:"codex",label:"Archives MU/TH/UR — recherches et dossiers"}
];
const captured=[];let previewBytes;
async function click(selector) {
  const c=await b.evaluate("(()=>{const el=document.querySelector("+JSON.stringify(selector)+");if(!el||el.disabled)throw Error('Elément de menu inaccessible: "+selector+"');el.scrollIntoView({block:'center',inline:'center',behavior:'instant'});const r=el.getBoundingClientRect();if(r.width<3||r.height<3)throw Error('Elément masqué: "+selector+"');return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()");
  await b.call("Page.bringToFront");
  await b.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:c.x,y:c.y});
  await b.call("Input.dispatchMouseEvent",{type:"mousePressed",x:c.x,y:c.y,button:"left",clickCount:1});
  await b.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:c.x,y:c.y,button:"left",clickCount:1});
}
const realState=()=>b.evaluate("(()=>{const root=document.getElementById('app'),data=localStorage.getItem('world-hive-wars-save-v6'),state=data?JSON.parse(data):null;return{title:document.title,appReady:!root.inert&&root.getAttribute('aria-hidden')!=='true',entryPhase:document.getElementById('game-entry')?.dataset.phase,activeScreen:root.querySelector('#bottom-nav .nav-item.is-active')?.dataset.nav||null,locationMode:state?.ui?.locationMode||null,playerOnboarded:state?.player?.onboardingDone===true,colony:state?.player?.colonyName||'',modalOpen:Boolean(root.querySelector('#modal-root .modal-card')),screenVisible:Boolean(root.querySelector('#screen-root .screen')),resourceCount:root.querySelectorAll('#resource-strip>*').length}})()");
try{
  await b.waitFor("document.getElementById('entry-home')?.hidden===false && !!document.getElementById('entry-primary') && document.getElementById('game-entry')?.dataset.phase!=='boot'",110000);
  const version=await b.evaluate("document.querySelector('.entry-version')?.textContent.trim()");
  if(!version.includes("0.45.0"))throw Error("Unverified production version "+version);
  await click("#entry-primary");
  await b.waitFor("document.getElementById('game-entry')?.dataset.phase==='closed' && document.getElementById('app')?.inert===false",45000);
  await b.waitFor("Boolean(document.querySelector('#modal-root .modal-card'))",17000);
  if(await b.evaluate("Boolean(document.querySelector('#modal-root [data-action=\"induction-skip\"]'))")) {
    await click('#modal-root [data-action="induction-skip"]');
  }
  await b.waitFor("Boolean(document.querySelector('#modal-root [data-action=\"deploy-colony\"]'))",25000);
  // Select the explicit in-game private simulation, not GPS. No live coordinates.
  await b.evaluate("(()=>{const radio=document.querySelector('input[name=\"location-mode\"][value=\"private\"]');if(!radio)throw Error('Private mode missing');radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));return true;})()");
  if(!await b.evaluate("document.querySelector('input[name=\"location-mode\"]:checked')?.value==='private'"))throw Error("Private simulation not selected");
  await click('#modal-root [data-action="deploy-colony"]');
  await b.waitFor("document.getElementById('app')?.inert===false && !document.querySelector('#modal-root .modal-card') && document.querySelector('#bottom-nav .nav-item.is-active')",23000);
  const first=await realState();
  if(!first.appReady||!first.playerOnboarded||first.locationMode!=="private"||first.modalOpen)throw Error("Real private campaign failed "+JSON.stringify(first));
  for(let i=0;i<paths.length;i++) {
    const entry=paths[i];
    await click('#bottom-nav [data-nav="'+entry.screen+'"]');
    await b.waitFor("document.querySelector('#bottom-nav [data-nav="+JSON.stringify(entry.screen)+"]')?.classList.contains('is-active') && !!document.querySelector('#screen-root .screen-'+ "+JSON.stringify(entry.screen)+")",21000);
    await b.sleep(350);
    const state=await realState();
    if(!state.playerOnboarded||state.locationMode!=="private"||state.modalOpen||state.activeScreen!==entry.screen||!state.screenVisible)throw Error("Invalid campaign view "+JSON.stringify({entry,state}));
    const screenshot=await b.capture("png");
    captured.push({slot:i+1,label:entry.label,kind:"real-campaign-interface",screen:entry.screen,path:newScreens[i],bytes:screenshot.length,sha256:sha(screenshot),uiState:state,bytesBuffer:screenshot});
    if(i===0)previewBytes=await b.capture("jpeg");
    console.log("WORLD HIVE WARS native 0.45 interface captured "+JSON.stringify({screen:entry.screen,bytes:screenshot.length}));
  }
  if(captured.length!==5||!previewBytes)throw Error("Campaign evidence incomplete");
  // Preserve 6 original WebP files first; never treat a QA screenshot as AI art.
  await mkdir(resolve(root,oldDir),{recursive:true});
  await mkdir(resolve(root,"assets/previews/previous"),{recursive:true});
  for(let i=0;i<5;i++) {
    if(!existsSync(resolve(root,oldScreens[i])))throw Error("Old image missing "+oldScreens[i]);
    const archived=oldDir+"/"+oldScreens[i].split("/").at(-1);
    if(!existsSync(resolve(root,archived)))await rename(resolve(root,oldScreens[i]),resolve(root,archived));
    await writeFile(resolve(root,newScreens[i]),captured[i].bytesBuffer);
  }
  if(!existsSync(resolve(root,archivedPreview)))await rename(resolve(root,oldPreview),resolve(root,archivedPreview));
  await writeFile(resolve(root,newPreview),previewBytes);
  const adminPath=resolve(root,"assets/app-gallery-admin.json");
  const admin=JSON.parse(await readFile(adminPath,"utf8"));
  admin.previousScreenshots ||= {};admin.previousPreviews ||= {};
  admin.previousScreenshots[id]=oldScreens.map(p=>oldDir+"/"+p.split("/").at(-1));
  admin.previousPreviews[id]=archivedPreview;
  await writeFile(adminPath,JSON.stringify(admin,null,2)+"\n");
  const galleryPath=resolve(root,"assets/app-gallery.json");
  const gallery=JSON.parse(await readFile(galleryPath,"utf8"));
  if(!gallery[id]||gallery[id].images?.length!==5)throw Error("Catalogue public WORLD HIVE WARS absent");
  Object.assign(gallery[id],{images:newScreens,labels:paths.map(p=>p.label),captureType:"real-ui-navigation",
    captureSource:source,captureVersion:"0.45.0",captureDate:new Date().toISOString().slice(0,10),
    captureProof:proofPath,presentationReview:"pending-fidelity"});
  await writeFile(galleryPath,JSON.stringify(gallery,null,2)+"\n");
  const recentPath=resolve(root,"assets/recent-games.js");
  const raw=await readFile(recentPath,"utf8"),prefix="window.LAUNCHER_RECENT_GAMES = ";
  if(!raw.startsWith(prefix))throw Error("Unexpected recent catalogue");
  const apps=JSON.parse(raw.slice(prefix.length).replace(/;\s*$/,""));
  const app=apps.find(x=>x.id===id);
  if(!app||app.image!==oldPreview)throw Error("Public preview identity mismatch");
  app.image=newPreview;
  await writeFile(recentPath,prefix+JSON.stringify(apps,null,2)+";\n");
  const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json");
  const matrix=JSON.parse(await readFile(matrixPath,"utf8")),entry=matrix.entries.find(x=>x.id===id);
  if(!entry)throw Error("Media matrix missing WORLD HIVE WARS");
  entry.preview=newPreview;entry.sourceVersionVerified="0.45.0 — package et écran de production";
  entry.productionVersionVerified="0.45.0 affichée; déploiement READY SHA 80ce99282b12 (Vercel)";
  entry.screenshotFreshness="up-to-date";entry.previewFidelity="source-verified";
  entry.screenshotCaptureProof=proofPath;entry.captureVerifiedAt=new Date().toISOString();
  entry.notes="Cinq interfaces natives de la campagne réellement déployée, créée depuis l'onboarding en simulation privée (aucune injection de sauvegarde, aucune position GPS). Représente carte, Bastion, défense en attente, équipe et Codex; ne prouve pas l'exécution des raids CONTACT.";
  await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
  const evidence={captureType:"native-browser-campaign-ui",notGeneratedArt:true,source,sourceRuntimeVersion:"0.45.0",
    sourceDeployment:{gitSha:"80ce99282b12",vercelId:"dpl_AiQV6pxL4fRpuigUUrJ268qSsNyw",status:"READY"},
    capturedAt:new Date().toISOString(),viewport:"1280x720",browser:"headless Chromium / CDP",
    initialState:first,privateSimulation:true,saveInjected:false,realOnboarding:true,
    preview:{path:newPreview,sha256:sha(previewBytes),bytes:previewBytes.length,sourceScreen:"map"},
    archives:{previousScreenshots:admin.previousScreenshots[id],previousPreview:archivedPreview},
    scenes:captured.map(({bytesBuffer,...rest})=>rest),
    limitations:["Interface de campagne réelle, pas scènes CONTACT en combat","Aucune garantie de fidélité 1:1 des illustrations promotionnelles","Aucune position réelle ni compte connecté","Le runtime 0.45.0 est identifié par son écran, non prouvé directement par un SHA interne"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,proofPath),JSON.stringify(evidence,null,2)+"\n");
  console.log("WORLD HIVE WARS native 0.45.0 capture successful "+JSON.stringify({screenshots:captured.length,modes:captured.map(s=>s.screen),privateSimulation:true}));
}finally{await b.close();}
