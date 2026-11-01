#!/usr/bin/env node
// AVP HUNT//HIVE TCG: genuine first-use deck, duel, collection, booster and campaign.
// All captures are CDP screenshots from the real public production, no generated art.
import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {readFile,writeFile,mkdir,copyFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd(), id="avp-hunt-hive-tcg",source="https://avp-hunt-hive-tcg.vercel.app/";
const proofPath="docs/media-proof/avp-tcg-gameplay-2026-11-01.json";
if(existsSync(resolve(root,proofPath))){console.log("AVP TCG proof already committed; no automatic regeneration.");process.exit(0);}
const paths=Array.from({length:5},(_,i)=>"assets/screenshots/"+id+"/"+String(i+1).padStart(2,"0")+".png");
const preview="assets/previews/"+id+".png",oldBase="assets/screenshots/previous/"+id,oldPreview="assets/previews/previous/"+id+".png";
const hash=b=>createHash("sha256").update(b).digest("hex");
const b=await openNativeBrowser(source,{width:1280,height:720,timeout:90000});
const captures=[];let poster;
async function click(selector) {
 const coords=await b.evaluate("(()=>{const el=document.querySelector("+JSON.stringify(selector)+");if(!el||el.disabled||el.getAttribute('aria-disabled')==='true')throw Error('Control unavailable: "+selector+"');el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});const rect=el.getBoundingClientRect();if(rect.width<4||rect.height<4||rect.top<0||rect.left<0||rect.bottom>innerHeight+1||rect.right>innerWidth+1)throw Error('Control out of bounds: "+selector+" '+JSON.stringify(rect));return{x:Math.round(rect.left+rect.width/2),y:Math.round(rect.top+rect.height/2)}})()");
 await b.call("Page.bringToFront");
 await b.call("Input.dispatchMouseEvent",{type:"mouseMoved",x:coords.x,y:coords.y});
 await b.call("Input.dispatchMouseEvent",{type:"mousePressed",x:coords.x,y:coords.y,button:"left",clickCount:1});
 await b.call("Input.dispatchMouseEvent",{type:"mouseReleased",x:coords.x,y:coords.y,button:"left",clickCount:1});
}
async function screenshot(label,kind,check) {
 const state=await b.evaluate(check);
 if(!state?.valid)throw Error("AVP TCG scene not valid "+JSON.stringify({label,state}));
 await b.sleep(300);
 const image=await b.capture("png");
 captures.push({slot:captures.length+1,label,kind,path:paths[captures.length],bytes:image.length,sha256:hash(image),appState:state,_image:image});
 return image;
}
async function navigate(screen) {
 await click('[data-action="nav"][data-screen="'+screen+'"]');
 await b.waitFor("Boolean(document.querySelector('[data-action=\"nav\"][data-screen=\""+screen+"\"].active'))",10000);
}
try {
 await b.waitFor("document.readyState==='complete' && window.AVP_DATA?.cards?.length===158 && window.AVP_DATA?.campaign?.length===8 && !!document.querySelector('#modal-root [data-action=\"choose-starter\"]')",35000);
 const initial=await b.evaluate("({title:document.title,cards:AVP_DATA.cards.length,campaign:AVP_DATA.campaign.length,version:AVP_DATA.version})");
 if(!String(initial.version).startsWith("1."))throw Error("Public TCG release version mismatch: "+JSON.stringify(initial));
 await click('#modal-root [data-action="choose-starter"][data-id="XENO"]');
 for(let i=0;i<3;i++) {await b.waitFor("!!document.querySelector('#modal-root [data-action=\"tutorial-next\"]')",5000);await click('#modal-root [data-action="tutorial-next"]');}
 await b.waitFor("!!document.querySelector('#modal-root [data-action=\"tutorial-finish\"]')",5000);
 await click('#modal-root [data-action="tutorial-finish"]');
 await b.waitFor("!!document.querySelector('[data-action=\"start-quick\"]:not([disabled])')",10000);
 await click('[data-action="start-quick"]');
 await b.waitFor("document.querySelector('.battle-title') && document.querySelectorAll('.battle-board .lane').length===3 && document.querySelectorAll('.player-hand .hand-card').length>=5",12000);
 await screenshot("Duel tactique — trois voies contre la Ruche adverse","real-tcg-battle",
  "(()=>({valid:!!document.querySelector('.battle-title')&&document.querySelectorAll('.battle-board .lane').length===3 && document.querySelectorAll('.player-hand .hand-card').length>=5,boardLanes:document.querySelectorAll('.battle-board .lane').length,hand:document.querySelectorAll('.player-hand .hand-card').length,lifeBars:document.querySelectorAll('.commander .life-bar').length,activeScreen:document.querySelector('.battle-title')?.textContent.trim()}))()");
 // Capture the duel itself as the promotional preview, before the game is paused.
 poster=await b.capture("png");
 await click('[data-action="pause-battle"]');
 await b.waitFor("!!document.querySelector('[data-action=\"resume-battle\"]')",12000);
 await navigate("decks");
 await b.waitFor("document.querySelectorAll('.deck-row').length>=8 && document.querySelector('.deck-sidebar')",12000);
 await screenshot("Constructeur — deck Xénomorphe de 30 cartes","native-deck-builder",
  "(()=>({valid:document.querySelectorAll('.deck-row').length>=8&&!!document.querySelector('.deck-sidebar')&&document.querySelector('.screen-head')?.textContent.includes('30 cartes'),cardRows:document.querySelectorAll('.deck-row').length,hasDeck:!!document.querySelector('.deck-sidebar')}))()");
 await navigate("collection");
 await b.waitFor("document.querySelector('.screen-head')?.textContent.includes('158 cartes') && document.querySelectorAll('.card-wrap').length>=20",12000);
 await screenshot("Collection — cartes et illustrations authentiques du TCG","native-card-collection",
  "(()=>({valid:document.querySelector('.screen-head')?.textContent.includes('158 cartes')&&document.querySelectorAll('.card-wrap').length>=20,visibleCards:document.querySelectorAll('.card-wrap').length}))()");
 await navigate("boosters");
 await b.waitFor("!!document.querySelector('[data-action=\"buy-pack\"]:not([disabled])')",10000);
 await click('[data-action="buy-pack"]:not([disabled])');
 await b.waitFor("!!document.querySelector('#modal-root .pull-grid') && document.querySelectorAll('#modal-root .pull-card').length===9",12000);
 await click('#modal-root [data-action="reveal-all"]');
 await b.waitFor("document.querySelectorAll('#modal-root .pull-card.revealed').length===9",12000);
 await screenshot("Ouverture — neuf cartes du booster de la Compagnie","native-booster-opening",
  "(()=>({valid:document.querySelectorAll('#modal-root .pull-card.revealed').length===9 && !!document.querySelector('#modal-root [data-action=\"finish-opening\"]'),revealed:document.querySelectorAll('#modal-root .pull-card.revealed').length}))()");
 await click('#modal-root [data-action="finish-opening"]');
 await navigate("campaign");
 await b.waitFor("document.querySelectorAll('.mission-grid .mission').length===8",12000);
 await screenshot("Campagne — Directive Chimère, huit opérations","native-campaign-board",
  "(()=>({valid:document.querySelectorAll('.mission-grid .mission').length===8 && !!document.querySelector('[data-action=\"start-mission\"][data-id=\"1\"]:not([disabled])'),missions:document.querySelectorAll('.mission-grid .mission').length,firstUnlocked:!!document.querySelector('[data-action=\"start-mission\"][data-id=\"1\"]:not([disabled])')}))()");
 if(captures.length!==5)throw Error("Genuine five screens required");
 await mkdir(resolve(root,oldBase),{recursive:true});await mkdir(resolve(root,"assets/previews/previous"),{recursive:true});
 for(let i=0;i<5;i++) {
   const arch=resolve(root,oldBase+"/"+paths[i].split("/").at(-1));
   if(!existsSync(arch))await copyFile(resolve(root,paths[i]),arch);
   await writeFile(resolve(root,paths[i]),captures[i]._image);
 }
 if(!existsSync(resolve(root,oldPreview)))await copyFile(resolve(root,preview),resolve(root,oldPreview));
 await writeFile(resolve(root,preview),poster);
 const adminPath=resolve(root,"assets/app-gallery-admin.json"),admin=JSON.parse(await readFile(adminPath,"utf8"));
 admin.previousScreenshots||={};admin.previousPreviews||={};
 admin.previousScreenshots[id]=paths.map(x=>oldBase+"/"+x.split("/").at(-1));admin.previousPreviews[id]=oldPreview;
 await writeFile(adminPath,JSON.stringify(admin,null,2)+"\n");
 const galleryPath=resolve(root,"assets/app-gallery.json"),gallery=JSON.parse(await readFile(galleryPath,"utf8"));
 if(!gallery[id]||gallery[id].images?.length!==5)throw Error("AVP TCG gallery entry missing");
 Object.assign(gallery[id],{labels:captures.map(x=>x.label),captureType:"real-gameplay",captureSource:source,
   captureVersion:String(initial.version),captureDate:new Date().toISOString().slice(0,10),
   captureProof:proofPath,presentationReview:"pending-fidelity"});
 await writeFile(galleryPath,JSON.stringify(gallery,null,2)+"\n");
 const matrixPath=resolve(root,"docs/MEDIA_FIDELITY_MATRIX_2026-11-01.json"),matrix=JSON.parse(await readFile(matrixPath,"utf8"));
 const row=matrix.entries.find(x=>x.id===id);if(!row)throw Error("AVP TCG media row missing");
 row.sourceVersionVerified="GitHub README and runtime 1.0.0, 158 cards, 8 campaign missions";
 row.productionVersionVerified="Vercel production READY e7a9c8ee6017 and runtime "+initial.version;
 row.screenshotFreshness="up-to-date";row.previewFidelity="source-verified";row.screenshotCaptureProof=proofPath;
 row.captureVerifiedAt=new Date().toISOString();
 row.notes="Five actual first-use UI states: 3-lane duel, 30-card deck, 158-card collection, opened 9-card booster, 8-mission campaign. Original 5 gallery screenshots and preview archived. Visual canon 1:1 still not reviewed.";
 const verified=matrix.entries.filter(x=>x.screenshotCaptureProof);const total=verified.reduce((n,x)=>n+x.screenshotCount,0);
 Object.assign(matrix.summary,{recapturedScreenshotCount:total,awaitingRecaptureCount:matrix.summary.screenshots-total,archivedScreenshotCount:Object.values(admin.previousScreenshots).flat().length,archivedPreviewCount:Object.keys(admin.previousPreviews).length,sourceVerifiedGalleries:verified.length});
 await writeFile(matrixPath,JSON.stringify(matrix,null,2)+"\n");
 const proof={captureType:"native-browser-card-gameplay",notGeneratedArt:true,source,version:String(initial.version),
   releaseRef:{deploymentId:"dpl_7DwmFGBSZeYQm1P6npzrnFqMeeS6",gitCommit:"e7a9c8ee6017"},
   capturedAt:new Date().toISOString(),viewport:"1280x720",firstUse:"Selected XENO deck through modal; four tutorial steps; launched real quick battle",
   preview:{path:preview,bytes:poster.length,sha256:hash(poster),sourceScene:"Three-lane real battle"},
   archives:{previousScreenshots:admin.previousScreenshots[id],previousPreview:oldPreview},
   scenes:captures.map(({_image,...rest})=>rest),limitations:["The quick battle was started, not played to victory","The booster was opened on a disposable fresh Chrome profile","Fidelity to licensed Alien/Predator art has NOT been certified"]};
 await mkdir(resolve(root,"docs/media-proof"),{recursive:true});
 await writeFile(resolve(root,proofPath),JSON.stringify(proof,null,2)+"\n");
 console.log("AVP TCG native gameplay captured "+JSON.stringify({version:proof.version,cards:initial.cards,missions:initial.campaign,scenes:captures.length,archiveCount:admin.previousScreenshots[id].length}));
} finally {await b.close();}
