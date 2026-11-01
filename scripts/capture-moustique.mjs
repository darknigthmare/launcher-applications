#!/usr/bin/env node
/**
 * 3D source-faithful screenshots of MOUSTIQUE from real production.
 * Scene 1: actual free-flight gameplay.
 * Scenes 2-5: camera-staged real WebGL2 engine reference captures based
 * on tests/capture_scenes.py in the source game. NOT uncontrolled gameplay.
 */
import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {copyFile,rename,mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(),id="moustique-the-video-game",source="https://moustique-the-video-game.vercel.app/";
const proofPath="docs/media-proof/moustique-webgl2-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("MOUSTIQUE déjà recapturé : aucune régénération.");process.exit(0);}
const newShots=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".png");
const oldShots=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".webp");
const oldDir="assets/screenshots/previous/"+id;
const newPreview="assets/previews/"+id+".jpg";
const oldPreview="assets/previews/"+id+".webp";
const archivedPreview="assets/previews/previous/"+id+".webp";
const sha=x=>createHash("sha256").update(x).digest("hex");
const b=await openNativeBrowser(source+"#debug",{width:1280,height:720,timeout:120000,webgl:true});
const images=[],states=[];
const debugRef="MoustiqueDebug.recovery";
function sceneInfo(){return "(()=>{const d=MoustiqueDebug,r=d.recovery;return {state:r.game.state,freeFlight:!!d.snapshot().freeFlight,rendererMode:r.renderer.qaStub?'logic-stub':'webgl2',webgl2:!!(r.renderer.gl&&r.renderer.gl instanceof WebGL2RenderingContext),time:r.game.realTime,camera:{pos:{...r.camera.pos},target:{...r.camera.target}},spider:!!r.game.mission.spider};})()";}
async function capture(label,kind) {
 const state=await b.evaluate(sceneInfo());
 if(state.rendererMode!=="webgl2"||!state.webgl2)throw Error("Not real WebGL2 "+JSON.stringify(state));
 if(!["playing","paused"].includes(state.state))throw Error("No game rendering "+JSON.stringify(state));
 const bytes=await b.capture("png");
 images.push(bytes);
 states.push({label,kind,slot:images.length,path:newShots[images.length-1],bytes:bytes.length,sha256:sha(bytes),...state});
}
async function stage(cam,target,light,time) {
 await b.evaluate("(()=>{const R=MoustiqueDebug.recovery,H=MoustiqueDebug.house,settings="+JSON.stringify({cam,target,light,time})+";H.HOUSE.light=settings.light;R.game.realTime=settings.time;R.rebuildHumanPoses(settings.time);R.camera.pos={x:settings.cam[0],y:settings.cam[1],z:settings.cam[2]};R.camera.target={x:settings.target[0],y:settings.target[1],z:settings.target[2]};R.renderFrame(settings.time);return true;})()");
 await b.sleep(240);
}
try{
 await b.waitFor("!!window.MoustiqueDebug?.recovery?.renderer && !!document.getElementById('freeFlightBtn')",120000);
 const title=await b.evaluate("document.title");
 if(!title.includes("4.14.1-R11"))throw Error("Unverified runtime title "+title);
 const mode=await b.evaluate("MoustiqueDebug.recovery.renderer.qaStub===true?'stub':MoustiqueDebug.recovery.renderer.gl?.getParameter(MoustiqueDebug.recovery.renderer.gl.VERSION)||'no-gl'");
 if(mode==="stub"||!mode.startsWith("WebGL 2"))throw Error("WebGL2 unavailable; no fake 3D captures: "+mode);
 await b.evaluate("document.getElementById('playHubBtn').click();document.getElementById('freeFlightBtn').click();true");
 await b.waitFor("MoustiqueDebug.snapshot().state==='playing' && MoustiqueDebug.snapshot().freeFlight",14000);
 await b.sleep(330);
 await capture("Maison vivante — vol libre et HUD","real-gameplay");
 // Staging uses the real game's reference camera workflow for perspective review.
 // It does NOT replace objects, textures or game world data.
 await b.evaluate("(()=>{const R=MoustiqueDebug.recovery,H=MoustiqueDebug.house;R.game.state='paused';R.showPanel(null);R.camera.mode=1;H.HOUSE.light='day';for(const id of ['hud','crosshair','houseHud','minimap','statusMessage','tutorialToast','mobileControls','interaction'])document.getElementById(id)?.classList.add('hidden');return true;})()");
 await stage([8.35,6.35,-7.6],[10,7.8,-20.0],"night",4);
 await capture("Maison — fenêtres et profondeur nocturne","qa-camera-real-render");
 await stage([12.5,4.6,5.55],[24,1.0,5.55],"day",18);
 await capture("Balcon — extérieur, végétation et horizon","qa-camera-real-render");
 await stage([-4.5,3.2,9.2],[-3.0,2.6,10.55],"day",24);
 await capture("Meuble de service — supports et mobilier","qa-camera-real-render");
 await b.evaluate("(()=>{const D=MoustiqueDebug,R=D.recovery,H=D.house;R.game.mission.spider=true;D.stageSpider('bedroom');H.HOUSE.light='night';R.camera.pos={x:-10.65,y:7.55,z:3.15};R.camera.target={x:-10.65,y:7.55,z:5.46};R.renderFrame(8);return true;})()");
 await b.sleep(250);
 await capture("Araignée — chambre et anatomie à huit pattes","qa-camera-real-render");
 if(images.length!==5)throw Error("Five valid images required");
 const jpg=await b.capture("jpeg");
 await mkdir(resolve(root,oldDir),{recursive:true});
 await mkdir(resolve(root,"assets/previews/previous"),{recursive:true});
 for(let i=0;i<5;i++){
   const old=oldShots[i],archived=oldDir+"/"+old.split("/").at(-1);
   if(!existsSync(resolve(root,old)))throw Error("Old screenshot missing "+old);
   if(!existsSync(resolve(root,archived)))await rename(resolve(root,old),resolve(root,archived));
   await writeFile(resolve(root,newShots[i]),images[i]);
 }
 if(!existsSync(resolve(root,archivedPreview)))await rename(resolve(root,oldPreview),resolve(root,archivedPreview));
 await writeFile(resolve(root,newPreview),jpg);
 const adminFile=resolve(root,"assets/app-gallery-admin.json"),admin=JSON.parse(await readFile(adminFile,"utf8"));
 admin.previousScreenshots ||= {};admin.previousPreviews ||= {};
 admin.previousScreenshots[id]=oldShots.map(x=>oldDir+"/"+x.split("/").at(-1));
 admin.previousPreviews[id]=archivedPreview;
 await writeFile(adminFile,JSON.stringify(admin,null,2)+"\n");
 const galleryFile=resolve(root,"assets/app-gallery.json"),gallery=JSON.parse(await readFile(galleryFile,"utf8"));
 const entry=gallery[id];if(!entry||entry.images.length!==5)throw Error("Current launcher screenshot record missing");
 Object.assign(entry,{images:newShots,labels:states.map(x=>x.label),captureType:"real-engine-qa",
    captureSource:source,captureVersion:"4.14.1-R11",captureDate:new Date().toISOString().slice(0,10),
    captureProof:proofPath,presentationReview:"pending-fidelity"});
 await writeFile(galleryFile,JSON.stringify(gallery,null,2)+"\n");
 const recentPath=resolve(root,"assets/recent-games.js"),recentSource=await readFile(recentPath,"utf8");
 const prefix="window.LAUNCHER_RECENT_GAMES = ";
 if(!recentSource.startsWith(prefix))throw Error("Unexpected recent games format");
 const games=JSON.parse(recentSource.slice(prefix.length).replace(/;\s*$/,""));
 const app=games.find(x=>x.id===id);if(!app||app.image!==oldPreview)throw Error("MOUSTIQUE preview not matched");
 app.image=newPreview;
 await writeFile(recentPath,prefix+JSON.stringify(games,null,2)+";\n");
 const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json");
 const matrix=JSON.parse(await readFile(matrixPath,"utf8"));const row=matrix.entries.find(x=>x.id===id);
 if(!row)throw Error("MOUSTIQUE media tracking missing");
 row.preview=newPreview;row.sourceVersionVerified="4.14.1-R11 — README et interface de production";
 row.productionVersionVerified="4.14.1-R11 — titre de l'interface Vercel";
 row.screenshotFreshness="up-to-date";row.previewFidelity="source-verified";
 row.screenshotCaptureProof=proofPath;row.captureVerifiedAt=new Date().toISOString();
 row.notes="Une image de vol libre réellement jouable, quatre vues cadrées par les outils QA du vrai moteur WebGL2. Les versions précédentes WebP sont conservées en archive. Ne pas confondre cadrage de caméra QA avec progression naturelle.";
 await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
 const evidence={captureType:"real-webgl2-engine",notGeneratedArt:true,source,version:"4.14.1-R11",capturedAt:new Date().toISOString(),
    viewport:"1280x720",rendererMode:mode,stagingReference:"darknigthmare/moustique-the-video-game/tests/capture_scenes.py",
    stagingDisclosure:"Slot 1 is actual free-flight gameplay. Slots 2-5 are real engine renders with QA camera placement, not screenshots of natural player progression.",
    preview:{path:newPreview,bytes:jpg.length,sha256:sha(jpg)},
    archives:{previousScreenshots:admin.previousScreenshots[id],previousPreview:archivedPreview},
    scenes:states,limitations:["WebGL2 via ANGLE/SwiftShader, no GPU hardware evidence","Camera-framed QA visuals are not uncontrolled gameplay","Promotional keyart 1:1 has not been certified"]};
 await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
 await writeFile(resolve(root,proofPath),JSON.stringify(evidence,null,2)+"\n");
 console.log("MOUSTIQUE WebGL2 native capture OK "+JSON.stringify({version:evidence.version,renderMode:mode,shots:states.length,first:states[0].kind,qa:states.slice(1).map(x=>x.label)}));
}finally{await b.close();}
