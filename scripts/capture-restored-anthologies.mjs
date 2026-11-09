#!/usr/bin/env node
/** Reproduce two native mini-game galleries from a pinned, self-contained public
 * collection HTML. Run from launcher root. Ordinary controls only; no hidden
 * state, score, timer or source injection. Capture is local, not a hosted browser.
 */
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {openNativeBrowser} from './browser-capture-common.mjs';
const sourcePath='docs/media-proof/source/august-restored-2026-11-09.html';
const bytes=await readFile(sourcePath);
const digest=b=>createHash('sha256').update(b).digest('hex');
const expectedHash='a5faf85a88441deb2f2adac9c209a30c33500be6dd2ef773333b956a3bbf6de6';
if(digest(bytes)!==expectedHash)throw Error('Pinned source HTML changed');
const sourceWitness=JSON.parse(await readFile('docs/media-proof/source/august-restored-2026-11-09.json','utf8'));
if(sourceWitness.sha256!==expectedHash||sourceWitness.httpStatus!==200)throw Error('Invalid production retrieval witness');
const html=bytes.toString('utf8');
if(/<script[^>]+src=|<link[^>]+(?:href|src)=|<img[^>]+src=|\bimport\s*\(|\bfetch\s*\(|https?:\/\//g.test(html.replace(/"u":"https:[^"]*"/g,'"u":""')))throw Error('Unexpected external runtime dependency');
const server=createServer((req,res)=>res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}).end(bytes));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/`;
const production='https://jeux-restaures-aout-2026.vercel.app/';
const specs=[
 {id:'dont-look-when-they-say-soleil',anchor:'soleil',title:'DON’T LOOK WHEN THEY SAY',proof:'soleil-restored-local-2026-11-09.json'},
 {id:'maid-cafe-simulator-deluxe',anchor:'maid-cafe',title:'Maid Café Simulator Deluxe',proof:'maid-cafe-restored-local-2026-11-09.json'}
];
let b;
async function click(selector){
 const p=await b.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Missing control');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
 await b.call('Page.bringToFront');
 await b.call('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});
 await b.call('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});
}
async function state(){return b.evaluate(`({anchor:location.hash.slice(1),title:document.querySelector('#title')?.textContent,mode:cur?.m,score:Number(document.querySelector('#s')?.textContent),life:Number(document.querySelector('#l')?.textContent),time:Number(document.querySelector('#t')?.textContent),primary:document.querySelector('#a')?.textContent,secondary:document.querySelector('#b')?.textContent,log:document.querySelector('#log')?.innerText,advancing:state.on,phase:state.phase,canvas:{width:document.querySelector('#cv')?.width,height:document.querySelector('#cv')?.height},text:document.querySelector('#mount')?.innerText})`);}
try {
 for(const spec of specs){
  b=await openNativeBrowser(base+'#'+spec.anchor,{width:1600,height:1000,timeout:30000});
  await b.waitFor(`document.querySelector('#title')?.textContent.includes(${JSON.stringify(spec.title)}) && !!document.querySelector('#cv')`,20000);
  await b.call('Page.bringToFront');
  const frames=[]; const output=[];
  const posterPath=`assets/presentations/${spec.id}.png`,previewPath=`assets/previews/${spec.id}.jpg`;
  async function shot(label,kind,predicate){
   const observed=await state();if(!predicate(observed))throw Error('Wrong native state for '+label+' '+JSON.stringify(observed));
   const pixels=await b.capture();const sha256=digest(pixels);
   if(frames.some(x=>x.sha256===sha256))throw Error('Duplicate frame');
   const path=`assets/screenshots/${spec.id}/${String(frames.length+1).padStart(2,'0')}.png`;
   frames.push({slot:frames.length+1,label,kind,path,sha256,bytes:pixels.length,observed});output.push({path,pixels});
   console.log(JSON.stringify({id:spec.id,slot:frames.length,label,score:observed.score,life:observed.life}));
   return pixels;
  }
  const poster=await shot(spec.anchor==='soleil'?'SOLEIL — épreuve restaurée et commandes Avancer / Stop':'Maid Café — service restauré et commandes natives','native-initial-game-interface',s=>s.score===0&&s.life===100);
  let preview;
  if(spec.anchor==='soleil'){
   await click('#a');await b.waitFor('score>7 && life===100',10000);
   await shot('Avancer — progression du score avant la zone de pénalité','native-advancing-state',s=>s.score>0&&s.life===100&&s.advancing);
   await b.waitFor('life<95',15000);
   await shot('Signal — pénalités réellement affichées pendant le mouvement','native-signal-penalty',s=>s.life<100&&s.log.includes('Le signal vous voit.'));
   await click('#b');const stopped=await state();await b.sleep(450);
   await shot('Stop — mouvement interrompu et points de vie stabilisés','native-stop-control',s=>!s.advancing&&s.life===stopped.life);
   preview=await b.capture('jpeg');
  }else{
   await click('#a');
   await shot('Premier service — commande honorée et 80 points','native-first-service',s=>s.score===80&&s.life===100&&s.log.includes('servi.'));
   await click('#a');
   await shot('Second service — commandes enchaînées et 160 points','native-second-service',s=>s.score===160&&s.life===100);
   preview=await b.capture('jpeg');
   await click('#b');
   await shot('Incident — conséquence native et vie réduite à 95','native-incident-control',s=>s.score===160&&s.life===95&&s.log.includes('Incident mal géré.'));
  }
  await click('#reset');
  await shot('Recommencer — score, vie et chronomètre réinitialisés','native-reset-control',s=>s.score===0&&s.life===100&&s.time>=69);
  output.push({path:posterPath,pixels:poster},{path:previewPath,pixels:preview});
  for(const x of output){await mkdir(resolve(x.path,'..'),{recursive:true});await writeFile(x.path,x.pixels);}
  const proof={captureType:'native-local-production-html',notGeneratedArt:true,gameId:spec.id,source:production+'#'+spec.anchor,
   browserSource:base+'#'+spec.anchor,capturedAt:new Date().toISOString(),version:'Collection restaurée août 2026',viewport:{width:1600,height:1000},
   selfContainedHtml:true,sourceHtmlSha256:expectedHash,sourceSnapshotPath:sourcePath,sourceRetrievalProof:'docs/media-proof/source/august-restored-2026-11-09.json',
   productionByteMatch:{productionUrl:production+'#'+spec.anchor,sourcePath,sha256:expectedHash,matches:true,checkedAt:sourceWitness.retrievedAt,method:'TLS-verified HTTP GET of public collection; URL fragment selects native game from unchanged self-contained HTML'},
   presentation:{path:posterPath,sha256:digest(poster),bytes:poster.length,kind:'Actual game interface including native title; no separate title menu exists'},
   preview:{path:previewPath,sha256:digest(preview),bytes:preview.length,kind:'Actual mini-game interface after ordinary control input'},scenes:frames,
   limitations:['Captured from a byte-identical local copy of the public self-contained anthology HTML, not a browser visiting the hosted origin.',
    'This is the small restored 2D anthology mini-game. Its canvas is intentionally simple; no standalone 3D edition or invented environment is represented.',
    spec.anchor==='soleil'?'The source penalizes movement in a timed phase; the canvas does not draw a separate SOLEIL warning. Only actual controls, score, health and penalty log are pictured.':'Serving and incidents are ordinary native buttons. No customers, recipes or complex cafe simulation were added.',
    'Five observable UI states only: no full 70-second session, victory, complete campaign, music or network mode certification.',
    'No direct game-state, score, health, timer or gameplay-source mutation was used.']};
  await writeFile('docs/media-proof/'+spec.proof,JSON.stringify(proof,null,2)+'\n');
  await b.close();b=null;
 }
} finally {if(b)await b.close();await new Promise(resolve=>server.close(resolve));}
