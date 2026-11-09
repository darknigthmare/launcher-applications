#!/usr/bin/env node
// Capture the actual 0.7.0 public build, not newer unpublished 0.9.x source.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {openNativeBrowser} from './browser-capture-common.mjs';

const sourceDir=process.argv[2];
if(!sourceDir)throw Error('Usage: node scripts/capture-silent-hill-local.mjs <995bd224 checkout> [localhost URL]');
const gameId='silent-hill-halo-of-flesh',source='https://silent-hill-halo-of-flesh-darknigthmares-projects.vercel.app/';
const sourceRepository='https://github.com/darknigthmare/silent-hill-halo-of-flesh';
const sourceCommit=execFileSync('git',['-C',sourceDir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(sourceCommit!=='995bd2243c7326dea09d2da06a21164435ce592b')throw Error('Review changed source before recapture');
const browserSource=process.argv[3]||'http://127.0.0.1:9393/';
if(!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/$/.test(browserSource))throw Error('Expected untouched local source server');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const download=url=>execFileSync('curl',['--fail','--silent','--show-error','--location','--max-time','30',url],{maxBuffer:10*1024*1024});
const files=['index.html','styles.css'];
for(const dir of ['src','modules'])for(const name of await readdir(resolve(sourceDir,dir)))if(['.js','.html','.css'].includes(extname(name)))files.push(dir+'/'+name);
const runtimeFiles=[];
for(const sourcePath of files){const local=await readFile(resolve(sourceDir,sourcePath)),productionUrl=source+sourcePath,published=download(productionUrl);if(sha(local)!==sha(published))throw Error('Published runtime changed: '+sourcePath);runtimeFiles.push({sourcePath,productionUrl,sha256:sha(local),matches:true,bytes:local.length});}
console.log('VERIFIED SILENT HILL RUNTIME '+runtimeFiles.length);
const presentation=`assets/presentations/${gameId}.png`,preview=`assets/previews/${gameId}.jpg`;
const proofPath='docs/media-proof/silent-hill-local-070-2026-11-09.json';
await mkdir(resolve(`assets/screenshots/${gameId}`),{recursive:true});
const b=await openNativeBrowser(browserSource,{width:1280,height:720,timeout:40000});
const scenes=[];
async function click(selector){
  await b.waitFor(`!!document.querySelector(${JSON.stringify(selector)})`,15000);
  await b.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw Error('Missing control');el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();if(r.width<4||r.height<4)throw Error('Hidden control');el.click();return true;})()`);
  await b.call('Page.bringToFront');
  await b.sleep(200);
}
async function shot(slot,label,kind,predicate){
  await b.waitFor(predicate,25000);await b.call('Page.bringToFront');await b.sleep(300);
  const observed=await b.evaluate(`({title:document.title,url:location.href,heading:document.querySelector('#modeTitle')?.textContent||'',rosterPage:document.querySelector('#pageLabel')?.textContent||'',selectedOne:document.querySelector('#p1Info h2')?.textContent||'',selectedTwo:document.querySelector('#p2Info h2')?.textContent||'',stage:document.querySelector('#stageName')?.textContent||'',dossierMoves:document.querySelectorAll('#dossier .move-list>li').length,fightVisible:!!document.querySelector('#fightScreen:not(.hidden)'),trainingPanelVisible:!!document.querySelector('#trainingPanel:not(.hidden)'),qaBridgePresent:!!window.__HALO_QA__})`);
  if(observed.qaBridgePresent)throw Error('QA state bridge must remain disabled');
  const bytes=await b.capture('png'),path=`assets/screenshots/${gameId}/${String(slot).padStart(2,'0')}.png`;
  await writeFile(resolve(path),bytes);scenes.push({slot,label,kind,path,sha256:sha(bytes),bytes:bytes.length,observed});console.log('CAPTURED '+slot+' '+label);return bytes;
}
try{
  await b.call('Page.bringToFront');await b.waitFor("document.querySelector('#commandMenu') && document.body.innerText.includes('V0.7.0')",25000);
  await b.sleep(600);
  const poster=await shot(1,'Halo of Flesh — terminal publié 0.7.0','real-native-title',"!!document.querySelector('#commandMenu')");await writeFile(resolve(presentation),poster);
  await b.call('Page.navigate',{url:browserSource+'modules/unified-versus.html?mode=training'});
  await shot(2,'Observation — sélection des manifestations et du lieu','real-native-fighter-selection',"document.querySelectorAll('.fighter-card').length>0");
  await click('#fighterDossier');
  await shot(3,'Dossier — vingt mouvements du sujet sélectionné','real-native-moveset-dossier',"!!document.querySelector('#dossier:not(.hidden)') && document.querySelectorAll('#dossier .move-list>li').length===20");
  await click('#closeDossier');await click('#launch');
  await b.waitFor("!!document.querySelector('#fightScreen:not(.hidden)')",20000);await b.sleep(3400);
  if(await b.evaluate("!!document.querySelector('#trainingPanel:not(.hidden)')"))await click('#trainingToggle');
  await b.call('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await b.sleep(350);await b.call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await shot(4,'Salle d’observation — duel natif en silhouettes procédurales','real-native-training-gameplay',"!!document.querySelector('#fightScreen:not(.hidden)') && !!document.querySelector('#game')");
  const thumb=await b.capture('jpeg');await writeFile(resolve(preview),thumb);
  await click('#trainingToggle');
  await shot(5,'Observation — commandes publiques du laboratoire de combat','real-native-training-controls',"!!document.querySelector('#trainingPanel:not(.hidden)')");
  if(new Set(scenes.map(x=>x.sha256)).size!==5)throw Error('Duplicate screenshot');
  const rootRuntime=runtimeFiles.find(x=>x.sourcePath==='index.html');
  const proof={captureType:'native-local-browser-gameplay',notGeneratedArt:true,gameId,source,sourceRepository,sourceCommit,browserSource,version:'0.7.0',capturedAt:new Date().toISOString(),viewport:{width:1280,height:720},
    productionByteMatch:{matches:true,productionUrl:source,sourcePath:'index.html',sha256:rootRuntime.sha256},runtimeFiles,
    releaseRef:{deploymentId:'dpl_BPkyMcWHt4yJmys5NgNX17iB5HaS',gitCommit:sourceCommit},
    presentation:{path:presentation,sha256:sha(poster),bytes:poster.length,kind:'actual public 0.7.0 command terminal'},preview:{path:preview,sha256:sha(thumb),bytes:thumb.length,kind:'actual native training fight'},scenes,
    inputEvidence:{action:'ArrowRight held 350ms through actual Chromium keyboard events',qaBridge:false,note:'No internal engine snapshot was exposed in the normal public build; movement distance or hits are not certified.'},
    limitations:['Browser rendered the exact published 0.7.0 source locally, with all root/src/modules runtime HTML, CSS and JavaScript byte-verified over normal HTTPS.','The source repository has newer 0.9.x work. These screenshots intentionally document the older build still served by the public alias.','The published 0.7.0 renderer draws procedural silhouettes. No newer illustrated sprites, canonical 1:1 artwork, full campaign or successful attack sequence is claimed.','Only native selection, dossier, initial training fight and observation controls were inspected. No QA bridge or injected game state was used.']};
  await writeFile(resolve(proofPath),JSON.stringify(proof,null,2)+'\n');console.log('SILENT HILL PROOF READY '+proofPath);
}finally{await b.close();}
