#!/usr/bin/env node
/**
 * Read only: enumerate individual in-page titles in the historical 2/4 August
 * game bundles. Never claim a collection page or technical loader as a game.
 */
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openNativeBrowser} from "./browser-capture-common.mjs";

const root=process.cwd();
const bundles=[
 ["august-4-anthology","https://jeux-du-4-aout-2026.vercel.app/"],
 ["august-2-restored-collection","https://jeux-restaures-aout-2026.vercel.app/"],
 ["august-2-playables","https://jeux-du-2-aout-2026-jouables.vercel.app/"],
 ["august-2-base","https://jeux-du-2-aout-2026.vercel.app/"],
 ["august-2-schema","https://games-du-2-aout-2026-schema-test.vercel.app/"]
];
await mkdir(resolve(root,".reports/historical-bundles"),{recursive:true});
for (const [id,url] of bundles) {
 let browser;
 try{
  const response=await fetch(url,{redirect:"follow",signal:AbortSignal.timeout(20000)});
  const body=await response.text();
  const sourceTitle=(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").slice(0,160);
  const protectedLogin=response.url.includes("vercel.com/login");
  const source={url,finalUrl:response.url,status:response.status,htmlLength:body.length,sourceTitle,protectedLogin};
  if(protectedLogin||response.status!==200)throw Error("Not a public bundle "+JSON.stringify(source));
  browser=await openNativeBrowser(url,{width:1280,height:720,timeout:50000});
  await browser.waitFor("document.readyState === 'complete'",25000);
  await browser.sleep(1800);
  const evidence=await browser.evaluate("(()=>{"+
    "const pick=(selector,limit=150)=>[...document.querySelectorAll(selector)].slice(0,limit).map(e=>({tag:e.tagName,id:e.id,cls:String(e.className).slice(0,90),label:(e.innerText||e.textContent||'').trim().replace(/\\s+/g,' ').slice(0,160),href:e.getAttribute('href'),src:e.getAttribute('src')})).filter(x=>x.label||x.href||x.src);"+
    "return {title:document.title,href:location.href,bodyText:document.body?.innerText?.slice(0,5500)||'',"+
    "candidateCards:pick('.card, .game-card, .project-card, [data-game], [data-game-id], [data-project], .list button, .list a, aside button, aside a',190),"+
    "headings:pick('h1,h2,h3,h4',90),links:pick('a[href]',120),frames:pick('iframe',35),buttons:pick('button',90),"+
    "scriptIds:[...document.scripts].map(s=>s.src?s.src.slice(0,180):'[inline:'+s.textContent.length+' characters]').slice(0,24)}"+
    "})()");
  const report={id,collectedAt:new Date().toISOString(),http:source,dom:evidence,scope:"Read-only identity discovery. No gameplay certification, no fabricated captures."};
  await writeFile(resolve(root,".reports/historical-bundles/"+id+".json"),JSON.stringify(report,null,2)+"\n");
  if(["august-4-anthology","august-2-restored-collection"].includes(id)) {
    const targets=id==="august-4-anthology"?["soleil","manga"]:["soleil","maid café"];
    for(const term of targets) {
      const selected=await browser.evaluate("(()=>{const wanted="+JSON.stringify(term)+";const normalize=x=>x.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();const el=[...document.querySelectorAll('.list button,.card')].find(b=>normalize(b.innerText).includes(normalize(wanted)));if(!el)return null;el.click();return el.innerText.trim()})()");
      if(!selected){console.log("AUGUST_DETAIL_MISSING "+JSON.stringify({id,term}));continue;}
      await browser.sleep(650);
      const detail=await browser.evaluate("(()=>({title:document.querySelector('#title')?.textContent||document.title,description:document.querySelector('.desc')?.innerText||'',links:[...document.querySelectorAll('a[href]')].slice(0,10).map(a=>({text:a.textContent.trim().slice(0,90),href:a.href})),frame:[...document.querySelectorAll('iframe')].slice(0,5).map(x=>({src:x.src,title:x.title})),stage:document.querySelector('.stage')?.innerText?.slice(0,1600)||'',body:document.body.innerText.slice(-1300)}))()");
      await writeFile(resolve(root,".reports/historical-bundles/"+id+"-"+term.replace(/[^a-z]+/gi,"-")+".json"),JSON.stringify({source:id,selected,...detail},null,2)+"\\n");
      console.log("AUGUST_DETAIL "+JSON.stringify({id,term,selected,detail}));
    }
  }
  console.log("AUGUST_BUNDLE "+JSON.stringify({id,url,sourceTitle,htmlLength:body.length,pageTitle:evidence.title,headingCount:evidence.headings.length,cardCount:evidence.candidateCards.length,firstCards:evidence.candidateCards.slice(0,35),headings:evidence.headings.slice(0,15),links:evidence.links.slice(0,15),bodyStart:evidence.bodyText.slice(0,700)}));
 }catch(error){console.log("AUGUST_BUNDLE_ERROR "+JSON.stringify({id,url,error:String(error?.message||error)}));}
 finally{if(browser)await browser.close().catch(()=>{});}
}
