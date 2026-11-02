#!/usr/bin/env node
// Native browser views of an untouched checkout, with a byte comparison to the
// published HTML. Localhost is intentional: no browser certificate exceptions.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {openNativeBrowser} from './browser-capture-common.mjs';

const sourceDir=process.argv[2];
if(!sourceDir)throw Error('Usage: node scripts/capture-riftcasters-anglers.mjs <source-checkout> [local-url]');
const source='https://riftcasters-chaos-anglers.vercel.app/';
const sourceRepository='https://github.com/darknigthmare/riftcasters-chaos-anglers';
const sourceCommit=execFileSync('git',['-C',sourceDir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const expectedCommit='52ced7248d5a2586aa00aef866a2cd54b881b24f';
if(sourceCommit!==expectedCommit)throw Error('Source changed; review before capturing');
const sourcePath='pwa/index.html',sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const local=await readFile(resolve(sourceDir,sourcePath));
const published=execFileSync('curl',['--fail','--silent','--show-error','--location','--max-time','45',source],{maxBuffer:20*1024*1024});
if(sha(local)!==sha(published))throw Error('Production HTML no longer matches this checkout');
const browserSource=process.argv[3]||'http://127.0.0.1:9377/';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/$/.test(browserSource))throw Error('Expect a local HTTP server serving source pwa directory');
const id='riftcasters-chaos-anglers';
const presentation=`assets/presentations/${id}.png`,preview=`assets/previews/${id}.jpg`;
const proofPath='docs/media-proof/riftcasters-anglers-local-860-2026-11-02.json';
const b=await openNativeBrowser(browserSource,{width:1280,height:720,timeout:120000,webgl:true});
const scenes=[];
async function state(){return b.evaluate(`({title:document.title,version:window.__MODERN_SKIES_V860__?.version,legacyVersionLabel:window.__RIFTCASTERS_VERSION__,dialogue:document.querySelector('#dialogue:not(.hidden)')?.innerText||null,phase:window.Riftcasters3D?.game?.state,world:window.__GREYWATER_CONFLICT_V830__?.state?.world,modal:document.querySelector('#modal:not(.hidden)')?document.querySelector('#modalContent')?.innerText?.slice(0,700):null,menuVisible:!!document.querySelector('#menu:not(.hidden)'),player:window.Riftcasters3D?.game?.player?{hp:window.Riftcasters3D.game.player.hp,pos:{...window.Riftcasters3D.game.player.pos}}:null,webgl:window.Riftcasters3D?.game?.renderer?.rendererName,skies:window.__MODERN_SKIES_V860__?.audit()?.skyLoaded})`);}
async function click(selector){
  await b.waitFor(`!!document.querySelector(${JSON.stringify(selector)})`,15000);
  await b.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw Error('Missing control');el.click();return true;})()`);
  await b.sleep(450);
}
async function capture(slot,label,kind,predicate){
  await b.call('Page.bringToFront');
  await b.waitFor(predicate,30000);
  const observed=await state();
  if(observed.version!=='8.6.0')throw Error('Runtime version mismatch');
  const bytes=await b.capture('png');
  if(scenes.some(x=>x.sha256===sha(bytes)))throw Error('Duplicate gallery screenshot');
  const path=`assets/screenshots/${id}/${String(slot).padStart(2,'0')}.png`;
  await mkdir(resolve(`assets/screenshots/${id}`),{recursive:true});
  await writeFile(resolve(path),bytes);
  scenes.push({slot,label,kind,path,sha256:sha(bytes),bytes:bytes.length,observed});
  console.log('CAPTURED '+slot+' '+label);
}
try{
  await b.call('Page.bringToFront');
  await b.call('Emulation.setFocusEmulationEnabled',{enabled:true});
  await b.waitFor("window.__MODERN_SKIES_V860__?.version==='8.6.0' && !!document.querySelector('[data-v860-action=new]')",120000).catch(async error=>{console.log('INITIAL FAILURE '+JSON.stringify(await state()));throw error;});
  await b.sleep(1200);
  await b.call('Page.bringToFront');
  const poster=await b.capture('png');await writeFile(resolve(presentation),poster);
  await mkdir(resolve(`assets/screenshots/${id}`),{recursive:true});
  const titlePath=`assets/screenshots/${id}/01.png`;await writeFile(resolve(titlePath),poster);
  scenes.push({slot:1,label:'Menu Modern Skies — préparation de la relève',kind:'real-title-menu',path:titlePath,sha256:sha(poster),bytes:poster.length,observed:await state()});
  console.log('TITLE READY '+JSON.stringify(await state()));
  await click('[data-v860-tab=options]');await click('[data-v860-action=settings]');
  await capture(2,'Paramètres — commandes, rendu et vue de l’expédition','real-settings-ui',"!!document.querySelector('#setQuality')");
  await click('#modalClose');await click('[data-v860-tab=progression]');await click('[data-v860-action=career]');
  await capture(3,'Carrière — progression et rang de relève','real-career-ui',"/CARRIÈRE|Carrière|carrière/.test(document.querySelector('#modalContent')?.innerText||'')");
  await click('#modalClose');await click('[data-v860-tab=play]');await click('[data-v860-action=new]');
  await capture(4,'Affectation — choix de K-13 ou du Bassin Gris-17','real-world-selection',"!!document.querySelector('#gwLaunch')");
  await click('[data-gw-world=k13]');await click('#gwLaunch');
  console.log('AFTER LAUNCH '+JSON.stringify(await state()));
  // Advance only actual authored dialogue/modal buttons; never change game state.
  for(let i=0;i<18;i++){
    const s=await state();if(s.phase==='playing'&&!s.modal&&!s.dialogue)break;
    const control=await b.evaluate(`(()=>{const root=document.querySelector('#dialogue:not(.hidden)')||document.querySelector('#modal:not(.hidden)');return root?[...root.querySelectorAll('button')].filter(x=>x.offsetWidth&&!x.disabled&&x.id!=='modalClose').map(x=>({id:x.id,text:x.textContent.trim(),selector:x.id?'#'+x.id:null})):[];})()`);
    console.log('INTRO CONTROLS '+JSON.stringify(control));
    if(s.dialogue){await click('#dialogueContinue');continue;}
    const chosen=control.find(x=>/COMMENCER|CONTINUER|ACCEPTER|REJOINDRE|TERMINER|Compris|Suite|Suivant/i.test(x.text))||control.find(x=>x.selector);
    if(chosen?.selector)await click(chosen.selector);else if(control.length)await b.evaluate(`(()=>{const root=document.querySelector('#dialogue:not(.hidden)')||document.querySelector('#modal:not(.hidden)');[...root.querySelectorAll('button')].find(x=>x.offsetWidth&&!x.disabled&&x.id!=='modalClose')?.click();return true;})()`);else await b.sleep(700);
  }
  await b.waitFor("window.Riftcasters3D?.game?.state==='playing' && !document.querySelector('#modal:not(.hidden),#dialogue:not(.hidden)')",30000);
  await b.sleep(900);
  await capture(5,'K-13 — première relève en vue subjective','real-local-3d-gameplay',"window.Riftcasters3D?.game?.state==='playing' && !document.querySelector('#modal:not(.hidden),#dialogue:not(.hidden)')");
  const thumb=await b.capture('jpeg');await writeFile(resolve(preview),thumb);
  const report={captureType:'native-local-browser-gameplay',notGeneratedArt:true,source,sourceRepository,sourceCommit,browserSource,
    capturedAt:new Date().toISOString(),version:'8.6.0',viewport:'1280x720',
    productionByteMatch:{productionUrl:source,sourcePath,sha256:sha(local),matches:true},
    deploymentId:'dpl_4coHKeSDsxuznUftmsRBJ4jPqWC4',
    presentation:{path:presentation,sha256:sha(poster),bytes:poster.length,kind:'native local title menu'},
    preview:{path:preview,sha256:sha(thumb),bytes:thumb.length,kind:'native local K-13 gameplay'},scenes,
    limitations:['The browser rendered an untouched local checkout; its HTML was byte-identical to the HTTPS production response at capture time.',
      'Chromium software WebGL; no physical GPU performance certification.',
      'The legacy global version/title can revert to 8.4.0 while the installed Modern Skies module remains 8.6.0; both values are recorded without overriding the source.',
      'Only initial K-13 gameplay, title and menus were observed. No fishing catch, boss, Greywater campaign or full-game completion is claimed.']};
  await writeFile(resolve(proofPath),JSON.stringify(report,null,2)+'\n');
  console.log('RIFTCASTERS ANGLERS PROOF READY '+proofPath);
}finally{await b.close();}
