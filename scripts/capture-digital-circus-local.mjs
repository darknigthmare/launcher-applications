#!/usr/bin/env node
// Render the exact published Encore source locally with normal browser TLS
// settings. The standalone redirect and every combat runtime file are verified.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {openNativeBrowser} from './browser-capture-common.mjs';

const sourceDir=process.argv[2];
if(!sourceDir)throw Error('Usage: node scripts/capture-digital-circus-local.mjs <CainOS 146a68c checkout> [local URL]');
const gameId='digital-circus-encore',source='https://digital-circus-encore.vercel.app/';
const sourceRepository='https://github.com/darknigthmare/CainOS';
const sourceCommit=execFileSync('git',['-C',sourceDir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(sourceCommit!=='146a68cc87ea088a4dbcf76694115118fc9ed775')throw Error('Review changed build before recapturing');
const browserSource=process.argv[3]||'http://127.0.0.1:9392/combat/index.html?standalone=1';
if(!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/combat\//.test(browserSource))throw Error('Expected local source server');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const download=url=>execFileSync('curl',['--fail','--silent','--show-error','--location','--max-time','30',url],{maxBuffer:10*1024*1024});
const rootHtml=download(source);
if(!rootHtml.toString().includes('combat/index.html?standalone=1'))throw Error('Standalone root no longer routes to Encore');
const productionHtml='docs/media-proof/production-html/digital-circus-entry-2026-11-09.html';
await mkdir(resolve('docs/media-proof/production-html'),{recursive:true});
await writeFile(resolve(productionHtml),rootHtml);
const runtimeFiles=[];
for(const file of await readdir(resolve(sourceDir,'combat'))){
  if(!['.mjs','.css','.html','.svg','.webmanifest'].includes(extname(file)))continue;
  const sourcePath='combat/'+file,productionUrl=source+sourcePath;
  const local=await readFile(resolve(sourceDir,sourcePath)),published=download(productionUrl);
  if(sha(local)!==sha(published))throw Error('Runtime no longer matches deployed source: '+sourcePath);
  runtimeFiles.push({sourcePath,productionUrl,sha256:sha(local),matches:true,bytes:local.length});
}
console.log('VERIFIED RUNTIME '+runtimeFiles.length+' files');
const presentation=`assets/presentations/${gameId}.png`,preview=`assets/previews/${gameId}.jpg`;
const proofPath='docs/media-proof/digital-circus-local-070-2026-11-09.json';
await mkdir(resolve(`assets/screenshots/${gameId}`),{recursive:true});
const b=await openNativeBrowser(browserSource,{width:1280,height:720,timeout:45000});
const scenes=[];
async function click(selector){
  await b.waitFor(`!!document.querySelector(${JSON.stringify(selector)})`,15000);
  const p=await b.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw Error('Missing control');el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();if(r.width<4||r.height<4)throw Error('Hidden control');return{x:r.left+r.width/2,y:r.top+r.height/2}})()`);
  await b.call('Page.bringToFront');
  await b.call('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
  await b.call('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
  await b.sleep(200);
}
async function state(){return b.evaluate(`({title:document.title,version:window.Encore?.version,screen:window.Encore?.screen,ready:window.Encore?.ready,paused:window.Encore?.paused,phase:window.Encore?.snapshot?.phase,frame:window.Encore?.snapshot?.frame,fighters:window.Encore?.snapshot?.fighters?.map(x=>({id:x.id,x:x.x,y:x.y,health:x.health,state:x.state})),modeCount:document.querySelectorAll('.mode-card[data-mode]').length,fighterCount:document.querySelectorAll('.fighter-card').length,arenaCount:document.querySelectorAll('.stage-card').length,dialog:document.querySelector('#modal[open] #modal-title')?.textContent||null})`);}
async function shot(slot,label,kind,predicate){
  await b.waitFor(predicate,25000);await b.call('Page.bringToFront');
  const observed=await state();if(observed.version!=='0.7.0')throw Error('Unexpected Encore version');
  await b.sleep(250);const bytes=await b.capture('png');
  const path=`assets/screenshots/${gameId}/${String(slot).padStart(2,'0')}.png`;
  await writeFile(resolve(path),bytes);
  scenes.push({slot,label,kind,path,sha256:sha(bytes),bytes:bytes.length,observed});
  console.log('CAPTURED '+slot+' '+label);return bytes;
}
try{
  await b.call('Page.bringToFront');
  await b.waitFor("window.Encore?.screen==='home' && document.querySelectorAll('.mode-card[data-mode]').length===9",30000);
  await b.sleep(700);
  const poster=await shot(1,'Encore — accueil autonome et neuf modes de jeu','real-standalone-title',"window.Encore?.screen==='home'");
  await writeFile(resolve(presentation),poster);
  await click('[data-nav=codex]');
  await shot(2,'Combattants — dossier de Pomni et techniques adaptées','real-fighter-codex',"window.Encore?.screen==='codex'");
  await click('[data-nav=home]');await click('.mode-card[data-mode=training]');
  await shot(3,'Répétitions — sélection parmi quatorze artistes et douze arènes','real-fighter-and-arena-selection',"document.querySelectorAll('.fighter-card').length===14 && document.querySelectorAll('.stage-card').length===12");
  await click('[data-action=start]');
  await b.waitFor("window.Encore?.ready===true && window.Encore?.snapshot?.phase==='fight'",30000);
  // Exercise a real keyboard action on the running engine. Never inject state.
  await click('#arena');
  const before=await state();
  await b.call('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
  await b.sleep(550);
  await b.call('Input.dispatchKeyEvent',{type:'keyUp',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
  const after=await state();
  const moved=after.fighters?.[0]?.x!==before.fighters?.[0]?.x;
  if(!moved)throw Error('Real fighter movement not demonstrated');
  await shot(4,'Entraînement — déplacement réel de Pomni face à Jax','real-native-training-gameplay',"window.Encore?.snapshot?.phase==='fight' && window.Encore?.snapshot?.frame>0");
  const thumb=await b.capture('jpeg');await writeFile(resolve(preview),thumb);
  await click('[data-action=movelist]');
  await shot(5,'Techniques — commandes du combattant dans le vrai duel','real-movelist-interface',"!!document.querySelector('#modal[open]')");
  if(new Set(scenes.map(x=>x.sha256)).size!==5)throw Error('Duplicate native scene');
  const proof={captureType:'native-local-browser-gameplay',notGeneratedArt:true,gameId,source,sourceRepository,sourceCommit,browserSource,version:'0.7.0',capturedAt:new Date().toISOString(),viewport:{width:1280,height:720},
    productionByteMatch:{matches:true,productionUrl:source,sourcePath:productionHtml,sha256:sha(rootHtml)},runtimeFiles,
    releaseRef:{deploymentId:'dpl_26QLt1718rKDBnbYPCkC6JfNtTgm',gitCommit:sourceCommit},
    presentation:{path:presentation,sha256:sha(poster),bytes:poster.length,kind:'actual standalone native home'},
    preview:{path:preview,sha256:sha(thumb),bytes:thumb.length,kind:'actual training duel'},scenes,
    inputEvidence:{action:'KeyD held 550ms through Chromium Input.dispatchKeyEvent',before,after,moved},
    limitations:['Browser rendered the exact published combat revision locally; public HTTPS root response and all combat HTML/CSS/modules were byte-verified.','Only the introductory training duel and native interfaces are evidenced. No tournament, story completion, finale or full roster animation review is claimed.','Illustrations belong to the shipped fan-game source. Native screenshots do not certify canonical 1:1 costumes, characters or animation.']};
  await writeFile(resolve(proofPath),JSON.stringify(proof,null,2)+'\n');
  console.log('DIGITAL CIRCUS PROOF READY '+proofPath);
}finally{await b.close();}
