#!/usr/bin/env node
/**
 * Native capture from the actual TRIARCHE production, not synthetic artwork.
 * Fails closed when the live game, its runtime version, or a mission is missing.
 * The old launcher images are preserved as editor-view archives.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const URL_GAME = "https://triarche-ciel-rouge.vercel.app/";
const root = process.cwd();
const id = "triarche-ciel-rouge";
const dir = "assets/screenshots/" + id;
const archiveDir = "assets/screenshots/previous/" + id;
const preview = "assets/previews/" + id + ".jpg";
const archivePreview = "assets/previews/previous/" + id + ".jpg";
const proofPath = "docs/media-proof/triarch-gameplay-2026-11-01.json";
const browser = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(existsSync);
if (!browser) throw new Error("Chrome/Chromium absent : aucune capture factice autorisée");
const profile = await mkdtemp(join(tmpdir(), "launcher-triarche-"));
const port = 9300 + process.pid % 700;
const child = spawn(browser, ["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--no-first-run","--no-default-browser-check","--hide-scrollbars","--window-size=1280,720","--force-device-scale-factor=1","--remote-allow-origins=*","--remote-debugging-port="+port,"--user-data-dir="+profile,"about:blank"], { stdio: ["ignore","ignore","pipe"] });
let stderr = "";
child.stderr.on("data", c => { stderr += String(c).slice(0,250); });
async function target() {
  for (let attempt=0;attempt<120;attempt++) {
    try {
      const res=await fetch("http://127.0.0.1:"+port+"/json/list");
      if (res.ok) {
        const items=await res.json();
        const page=items.find(x=>x.type==="page");
        if (page?.webSocketDebuggerUrl) return page;
      }
    } catch {}
    await sleep(100);
  }
  throw new Error("CDP indisponible "+stderr.slice(-700));
}
function connect(url) {
  const ws=new WebSocket(url);
  let next=0;
  const pending=new Map();
  const ready=new Promise((ok,fail)=>{
    ws.addEventListener("open",ok,{once:true});
    ws.addEventListener("error",fail,{once:true});
  });
  ws.addEventListener("message", ev=>{
    const msg=JSON.parse(ev.data);
    if (!msg.id || !pending.has(msg.id)) return;
    const {ok,fail}=pending.get(msg.id);
    pending.delete(msg.id);
    msg.error?fail(new Error(JSON.stringify(msg.error))):ok(msg.result||{});
  });
  return { ready, close:()=>ws.close(), call(method,params={}){
    const id=++next;
    ws.send(JSON.stringify({id,method,params}));
    return new Promise((ok,fail)=>pending.set(id,{ok,fail}));
  }};
}
async function evaluate(cdp,source) {
  const out=await cdp.call("Runtime.evaluate",{expression:source,awaitPromise:true,returnByValue:true,userGesture:true});
  if(out.exceptionDetails)throw new Error(out.exceptionDetails.exception?.description||out.exceptionDetails.text||"JS error");
  return out.result?.value;
}
async function waitFor(cdp,expr,timeout=17000) {
  const stop=Date.now()+timeout;
  while(Date.now()<stop){try{if(await evaluate(cdp,expr))return;}catch{}await sleep(120);}
  throw new Error("Condition non satisfaite : "+expr);
}
async function screenshot(cdp,kind="png") {
  const result=await cdp.call("Page.captureScreenshot",{format:kind,quality:kind==="jpeg"?89:undefined,captureBeyondViewport:false,fromSurface:true});
  const bytes=Buffer.from(result.data||"","base64");
  if (bytes.length<12000)throw new Error("Capture trop petite ou vide: "+kind+" "+bytes.length);
  if(kind==="png" && (bytes.toString("hex",0,8)!=="89504e470d0a1a0a" || bytes.readUInt32BE(16)!==1280 || bytes.readUInt32BE(20)!==720))
    throw new Error("Capture PNG non conforme (1280x720)");
  return bytes;
}
const scenes = [
  {n:1,id:"a01-arrival",label:"Campagne Alien — arrivée",kind:"alienCampaign",faction:"alien",missionKind:"alien",missionIndex:0,weather:"clear"},
  {n:2,id:"h01-first-shadow",label:"Campagne humaine — première ombre",kind:"humanCampaign",faction:"human",missionKind:"human",missionIndex:0,weather:"night"},
  {n:3,id:"sector-conquest",label:"Opération — conquête urbaine",kind:"operation",faction:"alien",missionKind:"operation",missionKey:"sector-conquest",weather:"clear"},
  {n:4,id:"convoy",label:"Opération — convoi d'évacuation",kind:"operation",faction:"human",missionKind:"operation",missionKey:"convoy",weather:"clear"},
  {n:5,id:"boss-rush-human",label:"Opération — chasse aux colosses",kind:"operation",faction:"human",missionKind:"operation",missionKey:"boss-rush-human",weather:"night"}
];
let cdp;
const captureLog=[];
try {
  cdp=connect((await target()).webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Emulation.setDeviceMetricsOverride",{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  await cdp.call("Page.navigate",{url:URL_GAME});
  await waitFor(cdp,"Boolean(window.TRIARCHE && window.__TRIARCHE_DEBUG__ && window.TRIARCHE.content.campaigns.alien.length===7)");
  const version=await evaluate(cdp,"document.getElementById('versionLabel')?.textContent.trim()");
  if (version!=="1.0.0") throw new Error("Version runtime inattendue, refaire le contrat de capture : "+version);
  const counts=await evaluate(cdp,"window.__TRIARCHE_DEBUG__.contentCounts()");
  if(counts.alienMissions!==7||counts.humanMissions!==7||counts.operations!==13)throw new Error("Contenu déployé incomplet : "+JSON.stringify(counts));
  const screenPaths = Array.from({length:5},(_,i)=>dir+"/"+String(i+1).padStart(2,"0")+".png");
  // Do not delete any old screenshot. Preserve originals BEFORE writing.
  await mkdir(resolve(root,archiveDir),{recursive:true});
  await mkdir(resolve(root,"assets/previews/previous"),{recursive:true});
  for(const p of screenPaths)await copyFile(resolve(root,p),resolve(root,archiveDir,p.split("/").at(-1)));
  await copyFile(resolve(root,preview),resolve(root,archivePreview));
  for(const scene of scenes){
    const result=await evaluate(cdp,"(() => {"+
      "const T=window.TRIARCHE;"+
      "const spec="+JSON.stringify(scene)+";"+
      "const mission=spec.missionKind==='alien'?T.content.campaigns.alien[spec.missionIndex]:spec.missionKind==='human'?T.content.campaigns.human[spec.missionIndex]:T.content.operations[spec.missionKey];"+
      "if(!mission) throw Error('Mission absente: '+spec.id);"+
      "T.beginMission({kind:spec.kind,mission,faction:spec.faction,difficultyId:'normal',weatherId:spec.weather,alienClassId:'triarch',humanSpecId:'scout',skin:'obsidian',glow:'mint'});"+
      "for(let i=0;i<24;i++)T.update(0.016);T.render();"+
      "return {state:T.game.state,gameMission:T.game.mission?.id,faction:T.game.faction,menuHidden:!document.getElementById('menu').classList.contains('active'),hudVisible:!document.getElementById('hud').classList.contains('hidden'),enemies:T.game.enemies.length,boss:Boolean(T.game.boss),convoy:T.game.convoy.length,sectors:T.game.sectors.length};"+
      "})()");
    if(result.state!=="playing"||result.faction!==scene.faction||!result.menuHidden||!result.hudVisible)throw new Error("Capture non jouable : "+scene.id+" "+JSON.stringify(result));
    if(scene.missionKey==="convoy"&&result.convoy!==3)throw new Error("Trois véhicules requis");
    if(scene.missionKey==="boss-rush-human"&&!result.boss)throw new Error("Boss absent");
    if(scene.missionKey==="sector-conquest"&&result.sectors!==12)throw new Error("Secteurs absents");
    await sleep(180);
    const shot=await screenshot(cdp);
    const path=screenPaths[scene.n-1];
    await writeFile(resolve(root,path),shot);
    captureLog.push({slot:scene.n,label:scene.label,mission:result.gameMission,faction:result.faction,mode:scene.kind,path,sha256:createHash("sha256").update(shot).digest("hex"),bytes:shot.length,verifiedState:"playing",boss:result.boss,convoy:result.convoy,sectors:result.sectors});
  }
  // Capture a true gameplay overview, not the previous menu image.
  await evaluate(cdp,"window.TRIARCHE.beginMission({kind:'alienCampaign',mission:window.TRIARCHE.content.campaigns.alien[1],faction:'alien',difficultyId:'normal',weatherId:'clear',alienClassId:'harvester',humanSpecId:'scout',skin:'bone',glow:'cyan'});for(let i=0;i<24;i++)window.TRIARCHE.update(0.016);window.TRIARCHE.render();true");
  await waitFor(cdp,"window.TRIARCHE.game.state==='playing'");
  const previewBytes=await screenshot(cdp,"jpeg");
  await writeFile(resolve(root,preview),previewBytes);
  const errors=await evaluate(cdp,"window.__TRIARCHE_DEBUG__.errors");
  if(errors.length)throw new Error("Erreurs du jeu pendant capture "+errors.join(" / "));
  const galleryAdminPath=resolve(root,"assets/app-gallery-admin.json");
  const admin=JSON.parse(await readFile(galleryAdminPath,"utf8"));
  admin.previousScreenshots ||= {};
  admin.previousPreviews ||= {};
  admin.previousScreenshots[id]=screenPaths.map(p=>archiveDir+"/"+p.split("/").at(-1));
  admin.previousPreviews[id]=archivePreview;
  await writeFile(galleryAdminPath,JSON.stringify(admin,null,2)+"\n");
  const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json");
  const matrix=JSON.parse(await readFile(matrixPath,"utf8"));
  const entry=matrix.entries.find(x=>x.id===id);
  if(!entry)throw new Error("Dossier de suivi absent");
  entry.sourceVersionVerified="1.0.0 (interface de production, API du jeu)";
  entry.productionVersionVerified="1.0.0, "+URL_GAME;
  entry.screenshotFreshness="up-to-date";
  entry.previewFidelity="source-verified";
  entry.captureVerifiedAt=new Date().toISOString();
  entry.screenshotCaptureProof=proofPath;
  entry.notes="Cinq véritables scènes de gameplay Canvas 2D recapturées depuis l'alias de production. Révision esthétique humaine 1:1 encore ouverte; anciennes captures sauvegardées en archives.";
  await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
  const proof={captureType:"native-browser-gameplay",notGeneratedArt:true,source:URL_GAME,capturedAt:new Date().toISOString(),runtimeVersion:version,contentCounts:counts,viewport:"1280x720",browser:"headless Chrome/Chromium through CDP",preview:{path:preview,sha256:createHash("sha256").update(previewBytes).digest("hex"),bytes:previewBytes.length},archivedOriginalScreenshots:admin.previousScreenshots[id],archivedOriginalPreview:archivePreview,scenes:captureLog,limitations:["Captures issues du déploiement public à l'instant du test","Ne garantissent pas une fidélité d'illustration promotionnelle 1:1","Ne prouvent pas les performances sur GPU physique"]};
  await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
  await writeFile(resolve(root,proofPath),JSON.stringify(proof,null,2)+"\n");
  console.log(JSON.stringify({success:true,game:id,version,captures:captureLog.length,bytes:captureLog.map(c=>c.bytes),source:URL_GAME}));
} finally {
  cdp?.close();
  child.kill("SIGTERM");
  await sleep(250);
  await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
