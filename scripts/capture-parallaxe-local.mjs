#!/usr/bin/env node
/** Capture the released PC/LAN 0.4.1 package through its unmodified solo UI.
 * Extract the official ZIP, launch `sh lancer_jeu.sh`, then run:
 * node scripts/capture-parallaxe-local.mjs /path/to/extracted/package
 * No cloud session, microphone permission, hidden state or synthetic scene.
 */
import {createHash} from "node:crypto";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const portableRoot=process.argv[2];
if(!portableRoot)throw Error("Pass the extracted official PARALLAXE PC/LAN v0.4.1 package directory");
const sourceCommit=(await readFile(resolve(portableRoot,"COMMIT.txt"),"utf8")).trim();
if(sourceCommit!=="fa9cf6306705c750106467d0d6caddf96767b0e7")throw Error("Unexpected portable source revision");
const version="0.4.1",id="parallaxe-protocole-9",url="http://127.0.0.1:4174/";
const source="https://github.com/darknigthmare/Parallaxe_Protocole9";
const proofPath="docs/media-proof/parallaxe-local-041-2026-11-02.json";
const presentationPath=`assets/presentations/${id}.png`,previewPath=`assets/previews/${id}.jpg`;
const digest=bytes=>createHash("sha256").update(bytes).digest("hex");
const frames=[],pending=[];
const b=await openNativeBrowser(url,{webgl:true,timeout:90000});
async function click(selector){
  const point=await b.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Missing UI control');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await b.call("Input.dispatchMouseEvent",{type:"mousePressed",...point,button:"left",clickCount:1});
  await b.call("Input.dispatchMouseEvent",{type:"mouseReleased",...point,button:"left",clickCount:1});
}
async function clickText(text){
  const selector=await b.evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(x=>x.innerText.includes(${JSON.stringify(text)}));if(!e||e.disabled)throw Error('Missing named control');e.dataset.captureControl='target';return '[data-capture-control="target"]';})()`);
  await click(selector);
  await b.evaluate("document.querySelector('[data-capture-control]')?.removeAttribute('data-capture-control')");
}
async function state(){return b.evaluate("({title:document.title,phase:document.querySelector('.inspection-label strong')?.textContent||'',place:document.querySelector('.place-label')?.textContent||'',perception:document.querySelector('.perception')?.innerText||'',modal:document.querySelector('#modal-title')?.textContent||'',canvas:document.querySelector('canvas')?.width||0,graphicsError:!!document.querySelector('.graphics-error'),text:document.body.innerText.slice(0,2200)})");}
async function shot(slot,label,kind,required){
  const observed=await state();
  if(observed.graphicsError||observed.canvas!==1280||!observed.title.includes("PARALLAXE"))throw Error("Native scene unavailable "+JSON.stringify(observed));
  if(required&&!JSON.stringify(observed).includes(required))throw Error("Wrong scene for "+label);
  const bytes=await b.capture("png");
  const sha256=digest(bytes);
  if(frames.some(x=>x.sha256===sha256))throw Error("Duplicate scene");
  const path=`assets/screenshots/${id}/${String(slot).padStart(2,"0")}.png`;
  pending.push({path,bytes});frames.push({slot,label,kind,path,sha256,bytes:bytes.length,observed});
  console.log("PARALLAXE_SCENE "+JSON.stringify({slot,label,bytes:bytes.length,phase:observed.phase,perception:observed.perception}));
}
try{
  await b.waitFor("!!document.querySelector('.menu-footer') && !document.querySelector('.loading-scene') && !document.querySelector('.graphics-error')",90000);
  if(!await b.evaluate("document.querySelector('.menu-footer').innerText.includes('0.4.1')"))throw Error("Version not shown by runtime");
  await clickText("Chalet de service");await b.sleep(1000);
  const presentation=await b.capture("png");
  await clickText("S’exercer seul");
  await b.waitFor("!!document.querySelector('.modal-start')");
  await clickText("Lieu au choix");
  await b.waitFor("!!document.querySelector('.location-choices')");
  await click('.location-choices button:last-child');await b.sleep(350);
  await shot(1,"Choix du parcours — entraînement solo au Chalet de service","real-mission-setup","Apprendre à douter");
  await clickText("Entrer dans l’observatoire");
  await b.waitFor("!!document.querySelector('.reference-banner') && document.querySelector('.place-label')?.textContent.includes('Chalet')");
  await b.sleep(1200);
  await shot(2,"Chalet de service — passage de référence en perception Alpha","real-solo-webgl-reference","PASSAGE DE RÉFÉRENCE");
  const preview=await b.capture("jpeg");
  await click('[aria-label="Carnet de référence (J)"]');await b.sleep(350);
  await shot(3,"Carnet — références du chalet et règles de comparaison","real-reference-journal","Chalet de service · référence");
  await click('[aria-label="Fermer"]');
  await clickText("Référence mémorisée");
  await b.waitFor("!!document.querySelector('.inspection-hint')");
  await click('.switch-perception');
  await b.waitFor("document.querySelector('.perception')?.innerText.includes('BÊTA')");
  await b.sleep(800);
  await shot(4,"Inspection 01 — comparaison réelle en perception Bêta","real-solo-perception-switch","BÊTA");
  await click('.diagnostic-button');await b.sleep(300);
  await shot(5,"Terminal de diagnostic — décision entre anomalie et conformité","real-diagnosis-ui","La réalité concorde-t-elle");

  for(const item of [...pending,{path:presentationPath,bytes:presentation},{path:previewPath,bytes:preview}]){
    await mkdir(resolve(item.path,".."),{recursive:true});await writeFile(item.path,item.bytes);
  }
  const proof={captureType:"native-local-browser-gameplay",notGeneratedArt:true,gameId:"parallaxe-protocole-9",source,sourceCommit,version,
    capturedAt:new Date().toISOString(),localUrl:url,resolution:"1280x720",browser:"Chromium CDP / SwiftShader WebGL 2",
    distribution:{type:"official-precompiled-pc-lan-zip",file:"PARALLAXE_Jeu_PC_LAN_v0.4.1.zip",
      url:source+"/blob/main/public/downloads/PARALLAXE_Jeu_PC_LAN_v0.4.1.zip",
      sha256:"7b19158d79e326e4bf3b753679221eb27f67dfb1a7ec16b3449ebf366dca21f6",
      repositoryHeadAtRetrieval:"569bdedfab3a46f7753ac08c70651a2b399ff60d",sourceCommit},
    presentation:{path:presentationPath,sha256:digest(presentation),bytes:presentation.length,kind:"real native title with Chalet preview"},
    preview:{path:previewPath,sha256:digest(preview),bytes:preview.length,kind:"real solo Chalet reference"},scenes:frames,
    overview:{runtimeVersionPrinted:true,soloReferenceEntered:true,perceptionBetaObserved:true,diagnosticOpened:true},
    limitations:["Official portable 0.4.1 build, not the hosted private edition or an unreleased source revision",
      "Solo training at the Chalet only; no LAN multiplayer, microphone, TURN or campaign-completion certification",
      "Software WebGL rendering proves native scenes, not performance on a physical GPU",
      "No direct game state, anomaly or progress injection; ordinary UI controls only"]};
  await mkdir(resolve("docs/media-proof"),{recursive:true});await writeFile(proofPath,JSON.stringify(proof,null,2)+"\n");
  console.log("PARALLAXE_CAPTURE_READY "+JSON.stringify({proofPath,sourceCommit,frames:frames.length}));
}finally{await b.close();}
