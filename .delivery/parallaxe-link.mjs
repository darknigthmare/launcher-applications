import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const id='parallaxe-protocole-9',url='https://parallaxe-protocole-9.vercel.app/';
const context={window:{}};
vm.runInNewContext(fs.readFileSync('assets/recent-games.js','utf8'),context,{timeout:1000});
const cards=context.window.LAUNCHER_RECENT_GAMES.filter(x=>x.id===id);
assert.equal(cards.length,1);
assert.equal(cards[0].link,url);
assert.equal(cards[0].sourceRepository,'https://github.com/darknigthmare/Parallaxe_Protocole9');
const response=await fetch(url,{signal:AbortSignal.timeout(25000),redirect:'follow'});
const body=await response.text();
const title=body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||'';
const http={status:response.status,finalUrl:response.url,title,bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex'),checkedAt:new Date().toISOString()};
fs.mkdirSync(process.env.RUNNER_TEMP+'/launcher-proof',{recursive:true});
fs.writeFileSync(process.env.RUNNER_TEMP+'/launcher-proof/public-http.json',JSON.stringify(http,null,2));
fs.writeFileSync(process.env.RUNNER_TEMP+'/launcher-proof/parallaxe-response.html',body);
assert.equal(http.status,200);assert.equal(http.finalUrl,url);assert.match(title,/PARALLAXE/i);
assert.doesNotMatch(title,/Authentication Required|Login|Connexion Vercel/i);

const helper=[
'    function parallaxeProductionAddress(app) {',
'      const url = "https://parallaxe-protocole-9.vercel.app/";',
'      if (app?.id !== "parallaxe-protocole-9" || app.link !== url || app.accessPolicy) return "";',
'      return `<a href="${url}" target="_blank" rel="noopener noreferrer" data-launch-app="parallaxe-protocole-9">${url}</a>`;',
'    }','',''
].join('\n');
let html=fs.readFileSync('index.html','utf8');
assert.equal(html.split('    function renderDetails(app) {').length,2);
assert.ok(!html.includes('function parallaxeProductionAddress'));
html=html.replace('    function renderDetails(app) {',helper+'    function renderDetails(app) {');
const old='${app.accessPolicy === "local-download" ? "Source" : "Lien"}</span><strong>${escapeHtml(app.link || "A configurer")}';
const replacement='${app.accessPolicy === "local-download" ? "Source" : parallaxeProductionAddress(app) ? "Adresse Vercel" : "Lien"}</span><strong>${parallaxeProductionAddress(app) || escapeHtml(app.link || "A configurer")}';
assert.equal(html.split(old).length,2);
html=html.replace(old,replacement);
for(const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi))if(match[1].trim())new vm.Script(match[1]);
fs.writeFileSync('index.html',html);
const sw=fs.readFileSync('sw.js','utf8');
assert.equal(sw.split('"launcher-shell-v34"').length,2);
fs.writeFileSync('sw.js',sw.replace('"launcher-shell-v34"','"launcher-shell-v35"'));
const audit=fs.readFileSync('scripts/audit.mjs','utf8');
assert.ok(audit.includes('launcher-shell-v34'));
fs.writeFileSync('scripts/audit.mjs',audit.replaceAll('launcher-shell-v34','launcher-shell-v35'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
assert.ok(!pkg.scripts.test.includes('parallaxe-launch-link'));
pkg.scripts.test+=' && node --test scripts/parallaxe-launch-link.test.mjs';
fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
fs.mkdirSync('docs',{recursive:true});
fs.writeFileSync('docs/parallaxe-vercel-20261116.json',JSON.stringify({date:'2026-11-16',cardId:id,url,project:'parallaxe-protocole-9',projectId:'prj_NwhUwKgmysOTq5vuvtNNbwAw2br5',deploymentId:'dpl_2bN9GJhrsAj4m5nu7GVefnQ2GD1n',publishedGameCommit:'23fd9cdbe297cad1d3962c9fa33adb6683899793',sourceBranch:'codex/vercel-coop-hosting-20261113',verifiedBy:'Current connected Vercel domain and READY production, then unauthenticated HTTP',publicHttp:http,change:'Canonical card URL retained; address now clickable and labelled in game details.',preserved:['catalogue data','all other cards','media and capture provenance','favorites','custom names and images'],limits:['HTTP identity is not a complete gameplay test.','Parallaxe PR #5 is not merged or deployed by this change.'],cache:'launcher-shell-v35'},null,2)+'\n');
console.log('PASS: canonical domain confirmed, catalogue unchanged, visible address prepared.');
