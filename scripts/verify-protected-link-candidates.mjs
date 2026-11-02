#!/usr/bin/env node
/**
 * Side-by-side verification of the four former public aliases and the
 * currently registered Vercel team aliases. No redirects are changed here.
 * A 200 may still be a login page; only matching game identity is a candidate.
 */
const candidates=[
  {id:"multiverse-breach",old:"https://multiverse-breach.vercel.app/",registered:"https://multiverse-breach-darknigthmares-projects.vercel.app/",match:"multiverse|br[eè]che"},
  {id:"vortex-command",old:"https://vortex-command.vercel.app/",registered:"https://vortex-command-darknigthmares-projects.vercel.app/",match:"vortex.command|protocole.l[eé]viathan"},
  {id:"yautja-hive-warriors",old:"https://yautja-hive-warriors.vercel.app/",registered:"https://yautja-hive-warriors-darknigthmares-projects.vercel.app/",match:"hive.warriors|yautja"},
  {id:"malaise-party",old:"https://malaise-party.vercel.app/",registered:"https://malaise-party-darknigthmares-projects.vercel.app/",match:"malaise.party|studio.des.absents"}
];
async function probe(id,kind,link,pattern) {
  const timestamp=new Date().toISOString();
  try {
    const response=await fetch(link,{method:"GET",redirect:"follow",signal:AbortSignal.timeout(18000),
      headers:{"user-agent":"LauncherLinkIdentityAudit/1.13"}});
    let html="";
    try {
      const reader=response.body?.getReader();
      if(reader){
        while(html.length<75000) {
          const step=await reader.read();
          if(step.done)break;
          html+=new TextDecoder().decode(step.value);
        }
        await reader.cancel();
      }
    } catch{}
    const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/\s+/g," ").slice(0,160);
    const normalized=(title+" "+html.slice(0,2800)).toLowerCase();
    const identityMatches=new RegExp(pattern,"i").test(normalized);
    const login=/(?:^|\/\/)(?:www\.)?vercel\.com\/login|(?:vercel\.com\/sso-api)/i.test(response.url)
      || /login\s*[–|-]\s*vercel/i.test(title);
    const result={id,kind,requested:link,effective:response.url,httpStatus:response.status,
      title,identityMatches,login,contentType:response.headers.get("content-type"),date:timestamp,
      outcome:login?"VERCEL_AUTH":response.status!==200?"HTTP_"+response.status:identityMatches?"IDENTITY_CANDIDATE":"UNVERIFIED_GAME"};
    console.log("CANDIDATE "+JSON.stringify(result));
  } catch(error) {
    console.log("CANDIDATE "+JSON.stringify({id,kind,requested:link,outcome:"REQUEST_FAILED",reason:String(error?.message||error)}));
  }
}
for(const item of candidates){
  await probe(item.id,"prior",item.old,item.match);
  await probe(item.id,"registered",item.registered,item.match);
}
