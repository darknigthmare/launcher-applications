#!/usr/bin/env node
/**
 * Candidate probe: look for the actual product's HTML identity, not just 200.
 * Does not mark a game playable without browser QA.
 */
import {mkdir,writeFile} from "node:fs/promises";
const candidates=[
  {id:"mass-effect-relay-chronicles",url:"https://masseffectrelaychronicles.vercel.app/",regex:"mass.effect|relay.chronicles",project:"mass_effect_relay_chronicles"},
  {id:"resident-evil-bow-protocol",url:"https://resident-evil-bow-protocol.vercel.app/",regex:"resident.evil|b.o.w. protocol",project:"resident-evil-bow-protocol"},
  {id:"resident-evil-bow-protocol-live",url:"https://resident-evil-bow-protocol-live.vercel.app/",regex:"resident.evil|b.o.w. protocol",project:"resident-evil-bow-protocol-live"},
  {id:"digital-circus-encore",url:"https://digital-circus-encore.vercel.app/",regex:"circus|encore|ca[iï]nos",project:"digital-circus-encore"},
  {id:"yugioh-25d-holograms",url:"https://yugioh-25d-holograms.vercel.app/",regex:"yu.gi.oh|duel|hologram",project:"yugioh-25d-holograms"},
  {id:"riftcasters-3d",url:"https://riftcasters-3d.vercel.app/",regex:"riftcasters|convergence",project:"riftcasters-3d"},
  {id:"riftcasters-chaos-anglers",url:"https://riftcasters-chaos-anglers.vercel.app/",regex:"riftcasters|modern.skies|greywater",project:"riftcasters-chaos-anglers"},
  {id:"reclaimed-after-dark",url:"https://reclaimed-after-dark.vercel.app/",regex:"reclaimed|after.dark|blackwater",project:"reclaimed-after-dark"},
  {id:"deadline-outbreak",url:"https://deadline-outbreak.vercel.app/",regex:"deadline|outbreak",project:"deadline-outbreak"},
  {id:"ragtime-rumble-complete-tour",url:"https://ragtime-rumble-complete-tour.vercel.app/",regex:"ragtime|complete.tour",project:"ragtime-rumble-complete-tour"},
  {id:"silent-hill-halo-of-flesh",url:"https://silent-hill-halo-of-flesh-darknigthmares-projects.vercel.app/",regex:"silent.hill|halo.of.flesh",project:"silent-hill-halo-of-flesh"}
];
const rows=[];
for(const item of candidates){
  try{
    const response=await fetch(item.url,{redirect:"follow",method:"GET",signal:AbortSignal.timeout(18000),headers:{"user-agent":"LauncherGames-Discovery/1.13"}});
    const content=await response.text();
    const title=(content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/\s+/g," ").trim().slice(0,180);
    const identity=new RegExp(item.regex,"i").test(title+" "+content.slice(0,9000));
    const login=/^https:\/\/(?:www\.)?vercel\.com\/(?:login|sso-api)/i.test(response.url)||/^login\s*[–|-]\s*vercel/i.test(title);
    const result=login?"auth-required":response.status>=400?"http-"+response.status:identity?"identity-confirmed":"identity-unverified";
    rows.push({id:item.id,vercelProject:item.project,url:item.url,finalUrl:response.url,status:response.status,title,contentType:response.headers.get("content-type"),identityConfirmed:identity&&!login,protected:login,result});
  }catch(e){rows.push({id:item.id,url:item.url,result:"network-error",reason:String(e?.message||e)});}
}
const summary=Object.fromEntries([...new Set(rows.map(x=>x.result))].map(k=>[k,rows.filter(x=>x.result===k).length]));
const report={checkedAt:new Date().toISOString(),scope:"Public product identity check only; no claim that latest code or all gameplay modes are deployed",summary,rows};
await mkdir(".reports",{recursive:true});
await writeFile(".reports/missing-game-candidates.json",JSON.stringify(report,null,2)+"\n");
console.log("Discovery summary "+JSON.stringify(summary));
for(const r of rows)console.log("DISCOVERY "+JSON.stringify(r));
