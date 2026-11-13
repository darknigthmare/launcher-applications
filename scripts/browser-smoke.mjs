import assert from 'node:assert/strict';
import {writeFile, mkdir, readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve, extname, sep} from 'node:path';
import {openNativeBrowser} from './browser-capture-common.mjs';
// Serve exactly the committed static app when no deployment URL is provided.
const root=process.cwd();
const server=process.env.LAUNCHER_TEST_URL ? null : createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const data=await readFile(file);
  const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'}).end(data);
 } catch {res.writeHead(404).end();}
});
if(server)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {browser=await openNativeBrowser(process.env.LAUNCHER_TEST_URL || 'http://127.0.0.1:'+server.address().port+'/',{width:1440,height:900});}
catch(error){server?.close();throw error;}
const illustrationManifest=JSON.parse(await readFile(resolve(root,'assets/illustration-manifest.json'),'utf8'));
const approvedIllustrations=Object.fromEntries(illustrationManifest.illustrations.filter(x=>x.reviewStatus==='accepted').map(x=>[x.id,x.asset]));
const results=[];
async function verify(expression,label){assert.equal(await browser.evaluate(expression),true,label);results.push(label);}
async function selectMedia(id,label){
 return browser.evaluate(`(()=>{selectApp(${JSON.stringify(id)});const a=apps.find(a=>a.id===${JSON.stringify(id)});const index=mediaTargets(a).findIndex(t=>t.label===${JSON.stringify(label)});if(index<0)throw Error('Missing media '+${JSON.stringify(label)});document.querySelector('.media-dot[data-detail-media="'+index+'"]').click();return index;})()`);
}
try {
 await browser.waitFor("typeof apps !== 'undefined' && illustrationsLoaded && apps.find(a=>a.id==='resident-evil-bow-protocol')?.captureType==='real-module-ui'");
 await verify(`apps.every(a=>a.illustration===(${JSON.stringify(approvedIllustrations)}[a.id] ? new URL(${JSON.stringify(approvedIllustrations)}[a.id],document.baseURI).href : ''))`,'Only reviewed illustrations become official covers');
 await browser.waitFor("(async()=>Boolean(navigator.serviceWorker.controller) && (await caches.keys()).includes('launcher-shell-v33'))()",30000);
 await verify("(async()=>{const c=await caches.open('launcher-shell-v33');return !!(await c.match('/assets/app-gallery.json')) && !!(await c.match('/assets/recent-games.js'));})()",'Updated PWA shell caches current catalogue and gallery');
 await verify("apps.length === starterApps.length && apps.length >= 158",'Complete catalogue renders');
 await verify("apps.filter(a=>a.category==='Jeux').length===apps.length-13",'Game count matches catalogue');
 await verify("!adminMode && apps.every(a=>!a.previousPresentation && !a.previousPreview && !a.previousScreenshots.length)",'Public galleries omit historical archives');
 await selectMedia('resident-evil-bow-protocol','Écran titre réel du jeu');
 await verify("document.querySelector('.detail-media-label').textContent==='Écran titre réel du jeu' && !document.getElementById('details').textContent.includes('Codec, Side Ops')",'BOW native title and captions match game');
 const bowPreview=await selectMedia('resident-evil-bow-protocol','Aperçu de l’interface réelle');
 await verify(`document.querySelector('.detail-media-label').textContent==='Aperçu de l’interface réelle' && document.querySelector('.media-dot[data-detail-media="${bowPreview}"]').getAttribute('aria-pressed')==='true'`,'Gallery controls select the correct native preview');
 await browser.evaluate("selectApp('reclaimed-after-dark')");
 await verify("!document.getElementById('details').textContent.includes('sans GPS') && !document.querySelector('#details .capture-proof')",'Public game prose omits technical QA and unrelated GPS claims');
 await selectMedia('dont-look-when-they-say-soleil','Interface native du jeu');
 await verify("document.querySelector('.detail-media-label').textContent==='Interface native du jeu' && apps.find(a=>a.id==='dont-look-when-they-say-soleil').gallery.length===5",'Restored mini-game interface is not mislabeled as a title screen');
 await browser.evaluate("apps.push(normalizeApp({id:'browser-pending-fixture',name:'Fiche sans médias',category:'Jeux',link:'https://github.com/darknigthmare/launcher-applications',accessPolicy:'local-download',mediaPendingReview:true}));selectApp('browser-pending-fixture')");
 await verify("availabilityFor(apps.find(a=>a.id==='browser-pending-fixture'))==='À confirmer' && document.querySelector('[data-availability=\"À confirmer\"]') && document.querySelector('#details button.primary-button').disabled && document.querySelector('#details button.primary-button').textContent==='Adresse web à confirmer' && !document.querySelector('#details a.primary-button') && !document.getElementById('details').textContent.includes('installation')",'Unverified source repository is never presented as web play or installation');
 await browser.evaluate("apps=apps.filter(a=>a.id!=='browser-pending-fixture');selectApp('deadline-outbreak')");
 await browser.evaluate("selectApp('deadline-outbreak');document.getElementById('adminButton').click()");
 await browser.waitFor("apps.some(a=>a.previousPresentation)");
 await verify("!!document.querySelector('#details .capture-proof')",'Technical capture provenance remains available in edit mode');
 const beforeEdit=await browser.evaluate("(()=>{const a=apps.find(a=>a.id==='deadline-outbreak');return{illustration:a.illustration,gallery:JSON.stringify(a.gallery)}})()");
 await browser.evaluate("document.getElementById('editButton').click();document.getElementById('nameField').value='Nom personnalisé en édition';document.getElementById('submitAppButton').click()");
 await verify(`(()=>{const a=apps.find(a=>a.id==='deadline-outbreak');return a.name==='Nom personnalisé en édition' && a.illustration===${JSON.stringify(beforeEdit.illustration)} && JSON.stringify(a.gallery)===${JSON.stringify(beforeEdit.gallery)}})()`,'Editing a name preserves trusted illustration and native gallery');
 await browser.evaluate("document.getElementById('adminButton').click()");
 await verify("!adminMode && apps.every(a=>!a.previousPresentation && !a.previousPreview && !a.previousScreenshots.length)",'Leaving edit mode clears archives');
 await browser.evaluate("localStorage.setItem(storeKey, JSON.stringify([{id:'deadline-outbreak',name:'Mon nom personnalisé',link:'https://obsolete.invalid',mediaPendingReview:true,image:'',presentation:''}]));localStorage.setItem(favoriteKey,JSON.stringify(['deadline-outbreak']))");
 await browser.call('Page.reload',{ignoreCache:true});
 await browser.waitFor("typeof apps!=='undefined' && apps.find(a=>a.id==='deadline-outbreak')?.captureType==='real-gameplay' && illustrationsLoaded");
 await verify("apps.length===starterApps.length && apps.find(a=>a.id==='deadline-outbreak').mediaPendingReview===false && apps.find(a=>a.id==='deadline-outbreak').image.includes('/previews/') && apps.find(a=>a.id==='deadline-outbreak').link==='https://deadline-outbreak.vercel.app/' && favorites.has('deadline-outbreak') && apps.find(a=>a.id==='deadline-outbreak').name==='Mon nom personnalisé'",'Old stored catalogue receives official media and links while preserving favorite and custom name');
 await browser.evaluate("localStorage.setItem(storeKey, JSON.stringify([{id:'deadline-outbreak',name:'Couverture personnalisée',presentation:'assets/launcher-icon.svg',image:'assets/apple-touch-icon.png',illustration:'assets/illustrations/fake.png'}]))");
 await browser.call('Page.reload',{ignoreCache:true});
 await browser.waitFor("apps.find(a=>a.id==='deadline-outbreak')?.captureType==='real-gameplay' && illustrationsLoaded");
 await browser.evaluate("selectApp('deadline-outbreak')");
 await verify("mediaTargets(apps.find(a=>a.id==='deadline-outbreak'))[0].label==='Présentation personnalisée' && mediaTargets(apps.find(a=>a.id==='deadline-outbreak'))[1].label==='Aperçu personnalisé' && document.querySelector('.detail-media-label').textContent==='Présentation personnalisée' && apps.find(a=>a.id==='deadline-outbreak').presentation.endsWith('/assets/launcher-icon.svg') && !apps.find(a=>a.id==='deadline-outbreak').illustration.includes('fake.png')",'Custom stored media remains personalized after official gallery provenance loads');
 await verify("mediaTargets(apps.find(a=>a.id==='deadline-outbreak')).slice(2).every(t=>t.label!=='Présentation personnalisée' && t.label!=='Aperçu personnalisé') && apps.find(a=>a.id==='deadline-outbreak').gallery.length===5",'Official native screenshots remain available beside personalized images');
 await browser.evaluate("selectApp('massilia-cyberpunk')");
 await verify("!!document.querySelector('#details a[href=\"https://www.openstreetmap.org/copyright\"]') && document.getElementById('details').textContent.includes('OpenStreetMap contributors')",'Generated map-derived illustration retains its source credit');
 await browser.evaluate("document.getElementById('showcaseButton').click()");
 await verify("!!document.querySelector('#showcaseBody a[href=\"https://www.openstreetmap.org/copyright\"]')",'Showcase retains the map source attribution');
 await browser.evaluate("document.getElementById('showcaseDialog').close()");
 await browser.evaluate("localStorage.clear()");
 await browser.call('Page.reload',{ignoreCache:true});
 await browser.waitFor("apps.find(a=>a.id==='deadline-outbreak')?.captureType==='real-gameplay' && illustrationsLoaded");
 await browser.evaluate("selectApp('deadline-outbreak')");
 await mkdir(resolve(root,'.reports'),{recursive:true});
 await writeFile(resolve(root,'.reports/launcher-desktop.png'),await browser.capture());
 await browser.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await verify("document.documentElement.scrollWidth<=390",'Mobile viewport has no page overflow');
 const mobile=await browser.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 await writeFile(resolve(root,'.reports/launcher-mobile.png'),Buffer.from(mobile.data,'base64'));
 const report={testedAt:new Date().toISOString(),target:process.env.LAUNCHER_TEST_URL||'local static source',passed:results.length,results};
 await writeFile(resolve(root,'.reports/browser-smoke.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
} finally {await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
