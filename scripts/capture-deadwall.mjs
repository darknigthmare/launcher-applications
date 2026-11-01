#!/usr/bin/env node
// Real production screenshots: do not impersonate the game's latest source branch.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const root=process.cwd(), id="deadwall-last-enclosure";
const source="https://deadwall-last-enclosure.vercel.app/";
const proofPath="docs/media-proof/deadwall-gameplay-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("DEADWALL déjà recapturé dans la PR; aucune modification.");process.exit(0);}
const pathBase="assets/screenshots/"+id,archiveBase="assets/screenshots/previous/"+id;
const preview="assets/previews/"+id+".png",archivedPreview="assets/previews/previous/"+id+".png";
const originals=Array.from({length:5},(_,i)=>pathBase+"/"+String(i+1).padStart(2,"0")+".png");
const digest=b=>createHash("sha256").update(b).digest("hex");
const browser=await openNativeBrowser(source,{width:1280,height:720,timeout:120000});
const scenes=[];
async function scene(number,label,kind) {
 const file=originals[number-1];
 const bytes=await browser.capture("png");
 await writeFile(resolve(root,file),bytes);
 scenes.push({slot:number,label,kind,path:file,bytes:bytes.length,sha256:digest(bytes),state:await browser.evaluate("DEADWALL.state"),
  campaignSeed:await browser.evaluate("DEADWALL.world.seed"),
  gamePaused:await browser.evaluate("DEADWALL.paused")});
}
try {
 await browser.waitFor("Boolean(globalThis.DEADWALL?.campaignIntro132 && DEADWALL.frontierUI && DEADWALL.fieldAtlasUI && !document.getElementById('newGameButton').disabled)",120000);
 await browser.evaluate("(async()=>{await DEADWALL.art.ready;return true;})()");
 const version=await browser.evaluate("document.getElementById('mainMenu')?.textContent.match(/VERSION\\s+([0-9.]+)/)?.[1] || ''");
 if(version!=="1.74.0")throw new Error("La production DEADWALL n'est pas la 1.74.0 attendue: "+version);
 await browser.evaluate("(()=>{const seed=document.getElementById('mapSeed');seed.value='17117';seed.dispatchEvent(new Event('input',{bubbles:true}));seed.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('newGameButton').click();return true;})()");
 await browser.waitFor("DEADWALL.state==='playing' && DEADWALL.campaignIntro132.isOpen()",120000);
 for(let i=0;i<4;i++){
   const ok=await browser.evaluate("(()=>{let next=document.getElementById('campaignIntro132Next');if(!next)return false;next.click();return true;})()");
   if(!ok)throw new Error("Bouton de prologue absent "+i);
   await browser.sleep(160);
 }
 await browser.waitFor("DEADWALL.state==='playing' && !DEADWALL.paused && !DEADWALL.activeOverlay && !DEADWALL.campaignIntro132.isOpen()",120000);
 await browser.sleep(450);
 await mkdir(resolve(root,archiveBase),{recursive:true});
 await mkdir(resolve(root,"assets/previews/previous"),{recursive:true});
 for(const src of originals){const old=resolve(root,archiveBase+"/"+src.split("/").at(-1));if(!existsSync(old))await copyFile(resolve(root,src),old);}
 if(!existsSync(resolve(root,archivedPreview)))await copyFile(resolve(root,preview),resolve(root,archivedPreview));
 const start=await browser.evaluate("({seed:DEADWALL.world.seed,playerX:DEADWALL.player.x,playerY:DEADWALL.player.y,buildings:DEADWALL.world.buildings.size})");
 if(start.seed!==17117||!start.buildings)throw new Error("Campagne réelle non installée "+JSON.stringify(start));
 await scene(1,"D-17 — première garde","gameplay");
 await browser.key("KeyD","d","keyDown");
 await browser.sleep(850);
 await browser.key("KeyD","d","keyUp");
 await browser.waitFor("DEADWALL.input.keys.size===0",5000);
 const after=await browser.evaluate("({playerX:DEADWALL.player.x,playerY:DEADWALL.player.y})");
 if(Math.hypot(after.playerX-start.playerX,after.playerY-start.playerY)<5)throw new Error("Déplacement natif non confirmé");
 await browser.sleep(250);
 await scene(2,"D-17 — exploration à pied","gameplay");
 const poster=await browser.capture("png");
 await writeFile(resolve(root,preview),poster);
 await browser.evaluate("document.getElementById('cityCommandButton').click(); true");
 await browser.waitFor("!document.getElementById('commandModal').classList.contains('hidden')");
 await browser.sleep(250);
 await scene(3,"D-17 — poste de commandement","in-game-panel");
 await browser.evaluate("document.getElementById('commandTab-field').click(); true");
 await browser.waitFor("document.getElementById('commandTab-field').getAttribute('aria-selected')==='true'");
 await browser.sleep(250);
 await scene(4,"D-17 — dossiers du territoire","in-game-panel");
 await browser.evaluate("document.getElementById('commandTab-research').click(); true");
 await browser.waitFor("document.getElementById('commandTab-research').getAttribute('aria-selected')==='true'");
 await browser.sleep(250);
 await scene(5,"D-17 — doctrines et recherche","in-game-panel");
 if(scenes.some(x=>x.state!=="playing"||x.campaignSeed!==17117))throw new Error("Une capture n'appartient pas à la campagne active");
 const adminFile=resolve(root,"assets/app-gallery-admin.json");
 const admin=JSON.parse(await readFile(adminFile,"utf8"));
 admin.previousScreenshots ||= {};admin.previousPreviews ||= {};
 admin.previousScreenshots[id]=originals.map(x=>archiveBase+"/"+x.split("/").at(-1));
 admin.previousPreviews[id]=archivedPreview;
 await writeFile(adminFile,JSON.stringify(admin,null,2)+"\n");
 const matrixFile=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json");
 const matrix=JSON.parse(await readFile(matrixFile,"utf8"));
 const target=matrix.entries.find(x=>x.id===id);
 if(!target)throw Error("Suivi DEADWALL manquant");
 target.sourceVersionVerified="README source 1.74.0 (GitHub)";
 target.productionVersionVerified=version+" (interface du site de production)";
 target.screenshotFreshness="up-to-date";
 target.previewFidelity="source-verified";
 target.captureVerifiedAt=new Date().toISOString();
 target.screenshotCaptureProof=proofPath;
 target.notes="Deux scènes de terrain, trois écrans authentiques du poste de commandement 1.74.0. Mise en situation native sans téléporter le joueur; archives conservées. Contrôle graphique 1:1 de l'illustration encore ouvert.";
 await writeFile(matrixFile,JSON.stringify(matrix,null,2)+"\n");
 const report={captureType:"native-browser-gameplay",notGeneratedArt:true,source,version,capturedAt:new Date().toISOString(),viewport:"1280x720",
  scenario:{seed:17117,playerStart:start,playerAfterMove:after,actorMotionConfirmed:true},
  preview:{path:preview,bytes:poster.length,sha256:digest(poster)},
  archives:{preview:archivedPreview,screenshots:admin.previousScreenshots[id]},scenes,
  limitations:["Deux vues de gameplay et trois panneaux de jeu","Capture du build effectivement publié, pas des branches plus récentes non déployées","Ne prouve pas la fidélité 1:1 de l'illustration promotionnelle"]};
 await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
 await writeFile(resolve(root,proofPath),JSON.stringify(report,null,2)+"\n");
 console.log("DEADWALL native capture OK "+JSON.stringify({version,seed:start.seed,scenes:scenes.length,actorMotionConfirmed:true}));
} finally {await browser.close();}
