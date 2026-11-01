#!/usr/bin/env node
/**
 * CainOS / Digital Circus Encore: replace the training-lab-only fifth image
 * with the real active fight arena. The previous 5-image screenshot series
 * and original launcher images are already archived by capture-cainos.mjs.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const root=process.cwd(),source="https://cainos.vercel.app/combat/";
const proofPath="docs/media-proof/cainos-encore-070-2026-11-01.json";
const imagePath="assets/screenshots/cainos/05.png";
const proof=JSON.parse(await readFile(resolve(root,proofPath),"utf8"));
if(proof.captureType!=="native-browser-multi-module-ui"||proof.scenes?.[4]?.kind!=="real-2d-fight"||proof.releaseRef?.gitCommit!=="146a68cc87ea088a4dbcf76694115118fc9ed775")throw Error("CainOS native combat provenance mismatch");
if(proof.scenes[4].visualReview==="arena-framed"){
 console.log("CainOS game arena already verified and framed; no repeat");
 process.exit(0);
}
const browser=await openNativeBrowser(source,{width:1280,height:720,timeout:80000});
try {
 await browser.call("Page.bringToFront");
 await browser.waitFor("window.Encore?.screen==='home' && document.querySelectorAll('.mode-card[data-mode]').length===9",45000);
 await browser.evaluate("document.querySelector('.mode-card[data-mode=\"training\"]').click();true");
 await browser.waitFor("document.querySelectorAll('.fighter-card').length===14 && document.querySelectorAll('.stage-card').length===12",18000);
 await browser.evaluate("document.querySelector('[data-action=\"start\"]').click();true");
 await browser.waitFor("window.Encore?.ready===true && window.Encore?.snapshot?.phase==='fight' && window.Encore.snapshot?.fighters?.length===2",35000);
 await browser.sleep(550);
 const focus=await browser.evaluate("(()=>{const arena=document.querySelector('.arena-wrap'),canvas=document.querySelector('#arena');if(!arena||!canvas)throw Error('Live arena absent');arena.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});return true})()");
 if(!focus)throw Error("Failed to focus actual rendered arena");
 await browser.sleep(380);
 const observation=await browser.evaluate("(()=>{const arena=document.querySelector('.arena-wrap'),canvas=document.querySelector('#arena'),r=arena.getBoundingClientRect(),e=window.Encore;const sx=canvas.getContext('2d');let pixels=0,groups=new Set();if(sx){const frame=sx.getImageData(0,0,canvas.width,canvas.height).data;const step=Math.max(1,Math.floor(canvas.height/36));for(let y=0;y<canvas.height;y+=step)for(let x=0;x<canvas.width;x+=step){const i=(y*canvas.width+x)*4;groups.add([frame[i]>>4,frame[i+1]>>4,frame[i+2]>>4].join(':'));pixels++;}}return {gameScreen:e.screen,phase:e.snapshot?.phase,frame:e.snapshot?.frame,fighters:e.snapshot?.fighters?.map(f=>f.id),canvas:{width:canvas.width,height:canvas.height},bounds:{top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height},samples:pixels,colors:groups.size};})()");
 if(observation.gameScreen!=="fight"||observation.phase!=="fight"||!(observation.frame>20)||observation.fighters?.length!==2)throw Error("No live fight state "+JSON.stringify(observation));
 if(observation.bounds.height<280||observation.bounds.top<0||observation.bounds.bottom>720||observation.bounds.left<0||observation.bounds.right>1281)throw Error("Arena not adequately visible in screenshot "+JSON.stringify(observation));
 if(observation.colors<10)throw Error("Native rendered combat scene blank "+JSON.stringify(observation));
 const bytes=await browser.capture("png");
 if(bytes.length<80000)throw Error("Unexpectedly empty game screenshot");
 await writeFile(resolve(root,imagePath),bytes);
 proof.scenes[4].bytes=bytes.length;
 proof.scenes[4].sha256=createHash("sha256").update(bytes).digest("hex");
 proof.scenes[4].visualReview="arena-framed";
 proof.scenes[4].visualEvidence=observation;
 proof.limitations=[...new Set([...(proof.limitations||[]),"The camera is centered on the actual game arena; the training laboratory below the arena is not the primary image."])];
 await writeFile(resolve(root,proofPath),JSON.stringify(proof,null,2)+"\n");
 console.log("CainOS fight arena now framed "+JSON.stringify({sha256:proof.scenes[4].sha256,bytes:bytes.length,observation}));
}finally{await browser.close();}
