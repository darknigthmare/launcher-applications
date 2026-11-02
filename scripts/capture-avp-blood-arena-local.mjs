#!/usr/bin/env node
/** Capture only the real AVP Blood Arena 0.1.0 prototype. Never reconstruct v0.30/v0.36. */
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {existsSync} from "node:fs";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {createServer} from "node:http";
import {resolve,sep,extname} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(),gameId="avp-blood-arena",version="0.1.0";
const source="https://github.com/darknigthmare/avp-blood-arena";
const sourceDirectory=resolve(process.env.AVP_BLOOD_SOURCE_DIR||"reference-avp-blood-arena");
const sourceCommit="c2e2d71f7d87bac2f9065061e99a7a5129d091c6";
const proofPath="docs/media-proof/avp-blood-arena-local-010-2026-11-02.json";
if(existsSync(resolve(root,proofPath))){console.log("AVP Blood Arena already captured; preserving evidence.");process.exit(0);}
if(execFileSync("git",["rev-parse","HEAD"],{cwd:sourceDirectory,encoding:"utf8"}).trim()!==sourceCommit)
  throw Error("Only the exact reviewed prototype commit can supply these frames");
if(execFileSync("git",["status","--porcelain","--untracked-files=no"],{cwd:sourceDirectory,encoding:"utf8"}).trim())
  throw Error("Source working tree must be unmodified");
if(JSON.parse(await readFile(resolve(sourceDirectory,"package.json"),"utf8")).version!==version)
  throw Error("Prototype version mismatch");
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const imagePaths=Array.from({length:5},(_,i)=>`assets/screenshots/${gameId}/${String(i+1).padStart(2,"0")}.png`);
const presentation=`assets/presentations/${gameId}.png`,preview=`assets/previews/${gameId}.jpg`;
for(const path of [...imagePaths,presentation,preview])if(existsSync(resolve(root,path)))throw Error("Refusing to replace existing media: "+path);
const mime={".html":"text/html",".js":"text/javascript",".json":"application/json",".css":"text/css"};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
    const filename=resolve(sourceDirectory,"."+(pathname==="/"?"/index.html":pathname));
    if(!filename.startsWith(sourceDirectory+sep))throw Error("Outside source directory");
    res.setHeader("Content-Type",mime[extname(filename)]||"application/octet-stream");
    res.end(await readFile(filename));
  }catch{res.statusCode=404;res.end("Not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin=`http://127.0.0.1:${server.address().port}/`;
let browser;
const frames=[],viewport="1440x1000";
async function clickAt(x,y){
  await browser.call("Input.dispatchMouseEvent",{type:"mouseMoved",x,y});
  await browser.call("Input.dispatchMouseEvent",{type:"mousePressed",x,y,button:"left",clickCount:1});
  await browser.call("Input.dispatchMouseEvent",{type:"mouseReleased",x,y,button:"left",clickCount:1});
}
async function tap(id){
  const point=await browser.evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(!e||e.disabled)throw Error('Control unavailable');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();if(r.width<2||r.height<2)throw Error('Hidden control');return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
  await clickAt(point.x,point.y);
}
async function cell(x,y){
  const point=await browser.evaluate(`(()=>{const r=document.getElementById('field').getBoundingClientRect();return {x:r.left+(${x}+.5)*r.width/24,y:r.top+(${y}+.5)*r.height/14}})()`);
  await clickAt(point.x,point.y);
}
async function screen(){return browser.evaluate(`(()=>({title:document.title,menu:!document.getElementById('menu').hidden,match:!document.getElementById('match').hidden,data:document.getElementById('dataStatus').textContent,round:document.getElementById('roundNumber').textContent,mode:document.getElementById('modeLabel').textContent,turn:document.getElementById('turnLabel').textContent,unit:document.getElementById('unitCard').textContent,log:document.getElementById('log').innerText,help:!document.getElementById('helpModal').hidden}))()`);}
async function capture(slot,label,kind){
  await browser.sleep(180);
  const observed=await screen();
  if(observed.title!=="AVP Blood Arena — Relance technique"||!observed.data.startsWith("68 références"))throw Error("Wrong game or unloaded data");
  const bytes=await browser.capture("png");
  await writeFile(resolve(root,imagePaths[slot-1]),bytes);
  frames.push({slot,label,path:imagePaths[slot-1],kind,sha256:sha(bytes),bytes:bytes.length,screen:viewport,observed});
}
try{
  browser=await openNativeBrowser(origin,{width:1440,height:1000});
  await browser.waitFor("document.getElementById('teamPick')?.options.length===9 && document.getElementById('dataStatus').textContent.startsWith('68 références')");
  await browser.sleep(250);
  for(const path of [`assets/screenshots/${gameId}`,"assets/presentations","assets/previews","docs/media-proof"])
    await mkdir(resolve(root,path),{recursive:true});
  const identity=await screen(),titleBytes=await browser.capture("png");
  await writeFile(resolve(root,presentation),titleBytes);
  await tap("openHelp");
  await browser.waitFor("!document.getElementById('helpModal').hidden");
  await capture(1,"Règles du Circuit — Nexus, déplacements et conditions de victoire","actual-game-ui");
  await tap("closeHelp");
  await tap("startButton");
  await browser.waitFor("!document.getElementById('match').hidden && document.getElementById('modeLabel').textContent==='CONTRE IA'");
  await cell(2,5);
  await browser.waitFor("document.getElementById('unitCard').textContent.includes('PA 2')");
  const selectedBefore=await screen();
  await capture(2,"Dock 17 — sélection d’un Colonial Marine face à la Ruche","real-gameplay");
  await cell(4,5);
  await browser.waitFor("document.getElementById('unitCard').textContent.includes('PA 1')");
  const moved=await screen();
  await capture(3,"Dock 17 — déplacement réel et dépense d’un point d’action","real-gameplay");
  await tap("actionSpecial");
  await cell(4,5);
  await browser.waitFor("document.getElementById('log').innerText.includes('position défensive')");
  await tap("endTurn");
  await browser.waitFor("document.getElementById('roundNumber').textContent==='MANCHE 2 / 16' && !document.getElementById('endTurn').disabled",10000);
  const afterAi=await screen();
  if(!afterAi.log.includes("position défensive"))throw Error("Native ability was not executed");
  await capture(4,"Deuxième manche — capacité défensive et réponse de l’IA","real-gameplay");
  const previewBytes=await browser.capture("jpeg");
  await writeFile(resolve(root,preview),previewBytes);
  // Abandon through the real confirmation dialog, then select another native mode.
  const returnTap=tap("menuButton");
  await browser.sleep(250);
  await browser.call("Page.handleJavaScriptDialog",{accept:true});
  await returnTap;
  await browser.waitFor("!document.getElementById('menu').hidden");
  await browser.evaluate("(()=>{document.getElementById('teamPick').value='yautja';document.getElementById('opponentPick').value='uscm';document.getElementById('arenaPick').value='temple';document.getElementById('modePick').value='local';for(const id of ['teamPick','opponentPick','arenaPick','modePick'])document.getElementById(id).dispatchEvent(new Event('change',{bubbles:true}));})()");
  await tap("startButton");
  await browser.waitFor("document.getElementById('modeLabel').textContent==='2 JOUEURS LOCAUX'");
  await cell(2,5);
  await capture(5,"Ruines — Clan Yautja et Marines en mode deux joueurs locaux","real-gameplay");
  if(new Set(frames.map(frame=>frame.sha256)).size!==5)throw Error("Duplicate gallery frames");
  const proof={captureType:"native-local-browser-gameplay",notGeneratedArt:true,gameId,source,sourceCommit,version,capturedAt:new Date().toISOString(),htmlPath:"index.html",browser:"Headless Chromium CDP; unmodified GitHub source served on loopback HTTP",viewport:{width:1440,height:1000},
    overview:{title:identity.title,viewport,realMovementConfirmed:true,actionPointsBefore:selectedBefore.unit,actionPointsAfter:moved.unit,defensiveAbilityConfirmed:true,aiRoundAdvanced:afterAi.round,soloAndLocalModesObserved:true},
    presentation:{path:presentation,sha256:sha(titleBytes),bytes:titleBytes.length,kind:"Actual prototype title/setup UI; not generated promotional art"},
    preview:{path:preview,sha256:sha(previewBytes),bytes:previewBytes.length,kind:"Actual tactical prototype after the AI turn"},
    scenes:frames,noHistoricalMedia:true,resolution:viewport,
    limitations:["Only prototype 0.1.0 is captured: original historical v0.30/v0.36 is not restored","Schematics and provisional sport profiles are not certified 1:1 franchise art","One native rules screen and four live tactical states; no completed match or campaign is claimed","Local two-player mode was opened in one browser, not playtested by two human players","No public Vercel deployment and no pause feature are implied"]};
  await writeFile(resolve(root,proofPath),JSON.stringify(proof,null,2)+"\n");
  console.log(JSON.stringify({gameId,version,sourceCommit,proofPath,frames:frames.map(x=>({slot:x.slot,bytes:x.bytes,kind:x.kind}))}));
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
