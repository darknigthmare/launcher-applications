#!/usr/bin/env node
// Native screenshot capture of Yautja: Apex Hunt 3D. Fail closed if WebGL,
// vaisseau-mère, mission UI or playable hunt does not load as actually published.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const root=process.cwd(),id="yautja-apex-hunt",source="https://yautja-apex-hunt.vercel.app/";
const pathProof="docs/media-proof/yautja-apex-gameplay-2026-11-01.json";
if(existsSync(resolve(root,pathProof))){console.log("Yautja déjà recapturé et vérifié; aucune image remplacée.");process.exit(0);}
const screenshotDir="assets/screenshots/"+id,oldDir="assets/screenshots/previous/"+id;
const shots=Array.from({length:5},(_,i)=>screenshotDir+"/"+String(i+1).padStart(2,"0")+".png");
const preview="assets/previews/"+id+".jpg",oldPreview="assets/previews/previous/"+id+".jpg";
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const gameRef="window.__YAUTJA_APEX_HUNT__";
const b=await openNativeBrowser(source,{width:1280,height:720,timeout:150000,webgl:true});
const scenes=[];
async function click(selector) {
  const center=await b.evaluate("(()=>{let el=document.querySelector("+JSON.stringify(selector)+");if(!el||el.disabled)throw Error('Control unavailable "+selector+"');el.scrollIntoView({block:'center',inline:'nearest'});const r=el.getBoundingClientRect();if(r.width<8||r.height<8||r.left>innerWidth||r.top>innerHeight)throw Error('Control outside viewport "+selector+"');return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};})()");
  await b.call("Page.bringToFront");
  await b.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:center.x,y:center.y});
  await b.call("Input.dispatchMouseEvent",{type:"mousePressed",x:center.x,y:center.y,button:"left",clickCount:1});
  await b.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:center.x,y:center.y,button:"left",clickCount:1});
}
async function check3d() {
  const state=await b.evaluate("(()=>{const g="+gameRef+";return {loaded:!!g,isGameStarted:g?.isGameStarted,gameState:g?.gameState,hasRendered:g?.hasRendered,sceneChildren:g?.scene?.children?.length,glReady:!document.getElementById('fatal-error')?.classList.contains('hidden'),webglVersion:g?.renderer?.getContext?.()?.getParameter(g.renderer.getContext().VERSION)||null,modal:!document.getElementById('mission-modal')?.classList.contains('hidden'),isHubExploring:g?.isHubExploring,activeBoss:!!g?.activeBoss,activeHunt:g?.currentHuntType};})()");
  if(!state.loaded||!state.hasRendered||!(state.sceneChildren>3)||state.glReady)throw Error("Invalid WebGL engine state "+JSON.stringify(state));
  return state;
}
async function shot(n,label,kind,required) {
  const state=await check3d();
  if(state.gameState!==required)throw Error("Wrong game phase "+n+" "+JSON.stringify(state));
  const bytes=await b.capture("png");
  await writeFile(resolve(root,shots[n-1]),bytes);
  scenes.push({slot:n,label,kind,path:shots[n-1],sha256:hash(bytes),bytes:bytes.length,phase:state.gameState,isGameStarted:state.isGameStarted,sceneChildren:state.sceneChildren,hasRendered:state.hasRendered,activeBoss:state.activeBoss,isHubExploring:state.isHubExploring});
}
try {
  await b.call("Page.bringToFront");
  await b.waitFor("Boolean(window.__YAUTJA_APEX_HUNT__?.hasRendered && document.getElementById('btn-start-game') && document.getElementById('mission-modal'))",150000);
  const initial=await check3d();
  if(initial.gameState!=="HUB")throw Error("Production booted in unexpected mode "+initial.gameState);
  await click("#btn-start-game");
  await b.waitFor("window.__YAUTJA_APEX_HUNT__.isGameStarted && !document.getElementById('mission-modal').classList.contains('hidden')",18000);
  await click("#btn-explore-hub");
  await b.waitFor("window.__YAUTJA_APEX_HUNT__.isHubExploring && document.getElementById('mission-modal').classList.contains('hidden')",12000);
  await b.sleep(1100);
  const view=await check3d();
  if(!view.isHubExploring||view.gameState!=="HUB")throw Error("Not exploring real mothership");
  await mkdir(resolve(root,oldDir),{recursive:true});
  await mkdir(resolve(root,"assets/previews/previous"),{recursive:true});
  for(const file of shots){
    const old=resolve(root,oldDir+"/"+file.split("/").at(-1));
    if(!existsSync(old))await copyFile(resolve(root,file),old);
  }
  if(!existsSync(resolve(root,oldPreview)))await copyFile(resolve(root,preview),resolve(root,oldPreview));
  await shot(1,"Croiseur — exploration du vaisseau-mère","hub-exploration","HUB");
  await b.call("Page.bringToFront");
  await b.evaluate("document.getElementById('game-canvas').focus();true");
  const before=await b.evaluate("({x:window.__YAUTJA_APEX_HUNT__.player.position.x,z:window.__YAUTJA_APEX_HUNT__.player.position.z})");
  let after=before,moved=0;const attempts=[];
  for(const [code,key] of [["KeyW","w"],["KeyD","d"],["KeyS","s"],["KeyA","a"]]){
    await b.call("Input.dispatchKeyEvent",{type:"rawKeyDown",code,key,windowsVirtualKeyCode:key.toUpperCase().charCodeAt(0)});
    await b.sleep(800);
    const mid=await b.evaluate("(()=>{const g=window.__YAUTJA_APEX_HUNT__;return {keys:[...g.pressedKeyboardCodes],input:{...g.inputDir},isPaused:g.isPaused,hidden:document.hidden,hasFocus:document.hasFocus(),hub:g.isHubExploring,position:{x:g.player.position.x,z:g.player.position.z}}})()");
    await b.call("Input.dispatchKeyEvent",{type:"keyUp",code,key,windowsVirtualKeyCode:key.toUpperCase().charCodeAt(0)});
    await b.sleep(240);
    after=await b.evaluate("({x:window.__YAUTJA_APEX_HUNT__.player.position.x,z:window.__YAUTJA_APEX_HUNT__.player.position.z})");
    moved=Math.hypot(before.x-after.x,before.z-after.z);
    attempts.push({code,moved,mid});
    if(moved>0.2)break;
  }
  console.log("Yautja native hub movement probes "+JSON.stringify(attempts));
  if(moved<0.2)throw Error("No authentic hub movement "+JSON.stringify({before,after,attempts}));
  await shot(2,"Croiseur — progression dans les compartiments","hub-exploration","HUB");
  await b.call("Input.dispatchKeyEvent",{type:"rawKeyDown",code:"Escape",key:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
  await b.call("Input.dispatchKeyEvent",{type:"keyUp",code:"Escape",key:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
  await b.waitFor("!document.getElementById('mission-modal').classList.contains('hidden')",18000);
  await click("#tab-btn-missions");
  await b.sleep(280);
  await shot(3,"Console de chasse — contrats disponibles","mission-board","HUB");
  await click('.btn-launch-hunt[data-hunt="goliath"]');
  await b.waitFor("window.__YAUTJA_APEX_HUNT__.pendingHunt?.huntType === 'goliath' && document.getElementById('tab-btn-loadout').getAttribute('aria-selected')==='true'",18000);
  await b.sleep(300);
  await shot(4,"Paquetage — préparation du contrat Goliath","equipment-ui","HUB");
  await click("#btn-loadout-recommended");
  await b.sleep(250);
  await click("#btn-loadout-deploy");
  await b.waitFor("window.__YAUTJA_APEX_HUNT__.gameState==='HUNT' && window.__YAUTJA_APEX_HUNT__.activeBoss",35000);
  await b.sleep(900);
  await shot(5,"Jungle — chasse au Goliath","real-hunt","HUNT");
  const previewBytes=await b.capture("jpeg");
  await writeFile(resolve(root,preview),previewBytes);
  if(scenes.length!==5||scenes[4].phase!=="HUNT")throw Error("Incomplete proof");
  const aPath=resolve(root,"assets/app-gallery-admin.json");
  const archive=JSON.parse(await readFile(aPath,"utf8"));
  archive.previousScreenshots ||= {};archive.previousPreviews ||= {};
  archive.previousScreenshots[id]=shots.map(x=>oldDir+"/"+x.split("/").at(-1));
  archive.previousPreviews[id]=oldPreview;
  await writeFile(aPath,JSON.stringify(archive,null,2)+"\n");
  const matrixFile=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json");
  const matrix=JSON.parse(await readFile(matrixFile,"utf8"));
  const record=matrix.entries.find(x=>x.id===id);
  if(!record)throw Error("Apex Hunt missing from launcher matrix");
  record.productionVersionVerified="Production GitHub/Vercel master 5e386e0 (2026-10-31)";
  record.sourceVersionVerified="Package 1.13.0, source master; build Vercel 5e386e0";
  record.screenshotFreshness="up-to-date";
  record.previewFidelity="source-verified";
  record.screenshotCaptureProof=pathProof;
  record.captureVerifiedAt=new Date().toISOString();
  record.notes="5 photos natives du vrai renderer 3D : hub, déplacement constaté, console de contrats, paquetage, chasse en 3D. L'illustration promotionnelle reste non évaluée 1:1.";
  await writeFile(matrixFile,JSON.stringify(matrix,null,2)+"\n");
  const proof={captureType:"native-browser-gameplay",notGeneratedArt:true,source,
    releaseRef:{deploymentId:"dpl_3bVUaoiRC2tSoXUeJ6YGUnySwwPu",gitCommit:"5e386e0c1efc5c5401fbe66848cbc82130668002",source:"Vercel production listing"},
    capturedAt:new Date().toISOString(),viewport:"1280x720",renderer:"real Three.js WebGL, Chromium SwiftShader",
    hubMovement:{before,after,metres:moved},preview:{path:preview,sha256:hash(previewBytes),bytes:previewBytes.length},
    archives:{previousScreenshots:archive.previousScreenshots[id],previousPreview:oldPreview},scenes,
    limitations:["Les scènes WebGL sont rendues par SwiftShader, non par GPU physique","Version référencée au déploiement Vercel READY et au code, distincte d'un marquage runtime natif","L'illustration conceptuelle 1:1 n'est pas certifiée"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,pathProof),JSON.stringify(proof,null,2)+"\n");
  console.log("Yautja Apex native WebGL game capture successful "+JSON.stringify({screenshots:scenes.length,phase:scenes[4].phase,hubMovement:moved}));
}finally{await b.close();}
