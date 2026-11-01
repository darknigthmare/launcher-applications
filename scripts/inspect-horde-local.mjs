#!/usr/bin/env node
/**
 * Inspect the CURRENT self-contained Dernière Ligne game without inventing
 * or publishing screenshots before the actual browser test.
 */
import { existsSync } from "node:fs";
import { mkdir,writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openNativeBrowser } from "./browser-capture-common.mjs";

const root=process.cwd();
const game=resolve(root,"reference-the-horde/game/JOUER_DERNIERE_LIGNE.html");
if(!existsSync(game))throw Error("Le jeu source 0.44.2 n'a pas été téléchargé");
const url=pathToFileURL(game).href;
const browser=await openNativeBrowser(url,{width:1280,height:720,timeout:160000});
try {
  await browser.waitFor("document.readyState==='complete' && document.querySelectorAll('button').length>3",160000);
  await browser.sleep(1100);
  const expression="(()=>({title:document.title,urlProtocol:location.protocol,readyState:document.readyState,"+
    "text:document.body.innerText.slice(0,1800),"+
    "buttons:[...document.querySelectorAll('button')].slice(0,80).map(x=>({id:x.id,text:x.innerText?.trim().slice(0,100),class:x.className,disabled:x.disabled,hidden:!!x.closest('[hidden],.hidden')})),"+
    "canvases:[...document.querySelectorAll('canvas')].map(x=>({id:x.id,width:x.width,height:x.height})),"+
    "scripts:document.scripts.length,bodyClass:document.body.className,"+
    "visibleSections:[...document.querySelectorAll('main,section,[role=dialog]')].filter(x=>x.getBoundingClientRect().width>100&&x.getBoundingClientRect().height>100).slice(0,20).map(x=>({id:x.id,cls:x.className,tag:x.tagName})),"+
    "errorTexts:[...document.querySelectorAll('[role=alert],.fatal-error')].filter(x=>x.offsetHeight>0).map(x=>x.textContent.trim().slice(0,200))}))()";
  const report=await browser.evaluate(expression);
  const bytes=await browser.capture("png");
  await mkdir(resolve(root,".reports/horde-current"),{recursive:true});
  await writeFile(resolve(root,".reports/horde-current/inspection.json"),JSON.stringify({source:"darknigthmare/The-Horde-The-Last-Stand",sourceBuild:"0.44.2 according to README",capturedAt:new Date().toISOString(),...report},null,2)+"\n");
  await writeFile(resolve(root,".reports/horde-current/initial-native.png"),bytes);
  console.log("HORDE LOCAL INSPECTION "+JSON.stringify({title:report.title,protocol:report.urlProtocol,buttons:report.buttons.slice(0,30),canvases:report.canvases,scripts:report.scripts,sections:report.visibleSections,errorTexts:report.errorTexts}));
  if(!report.title.toLowerCase().includes("dernière")&&!report.text.toLowerCase().includes("dernière ligne"))throw Error("Local HTML not identifiable as Dernière Ligne");
} finally {await browser.close();}
