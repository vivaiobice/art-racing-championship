const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const pages=['index.html','driver.html','race.html','lobby.html','regolamento.html','404.html'];

test('gli script inline di tutte le pagine hanno sintassi valida',()=>{
  for(const page of pages){
    const html=fs.readFileSync(path.join(root,page),'utf8');
    for(const [index,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
      if(match[1].trim())new vm.Script(match[1],{filename:`${page}:${index}`});
    }
  }
});

test('le pagine dati caricano fallback prima del client live',()=>{
  for(const page of ['index.html','driver.html','race.html','lobby.html']){
    const html=fs.readFileSync(path.join(root,page),'utf8');
    assert.ok(html.indexOf('data.js?v=8')>=0,page);
    assert.ok(html.indexOf('js/live-data.js?v=8')>html.indexOf('data.js?v=8'),page);
    assert.match(html,/ARTLiveData\.getAll\(\)/,page);
  }
});

test('tutti gli asset locali dichiarati in HTML, CSS e manifest esistono',()=>{
  const files=[...pages,'styles.css','manifest.webmanifest','sw.js'];
  const missing=[];
  for(const file of files){
    const text=fs.readFileSync(path.join(root,file),'utf8');
    const refs=[...text.matchAll(/(?:src|href)=["']([^"'#?]+)|url\(["']?([^"')]+)|["']\.\/(assets\/[^"']+)["']/g)].map(m=>m[1]||m[2]||m[3]);
    for(const ref of refs){if(/^(?:https?:|data:)/.test(ref)||ref.includes('${'))continue;const clean=ref.replace(/^\.\//,'');if(clean&&!fs.existsSync(path.join(root,clean)))missing.push(`${file}: ${clean}`);}
  }
  assert.deepEqual(missing,[]);
});

test('nessun dato o riferimento obsoleto viene reintrodotto',()=>{
  const source=pages.concat(['data.js']).map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
  assert.doesNotMatch(source,/MAX008/);
  assert.doesNotMatch(source,/spa-logo|nurburgring-logo|suzuka-logo/);
  assert.match(fs.readFileSync(path.join(root,'race.html'),'utf8'),/\["monza","redbull"\]/);
});

test('il service worker precachea client live e fotografie circuiti ma non intercetta i CSV Google',()=>{
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.match(sw,/js\/live-data\.js/);
  for(const key of ['monza','spa','nurburgring','redbull','suzuka'])assert.match(sw,new RegExp(`assets/circuits/${key}\\.webp`));
  assert.match(sw,/googleusercontent\.com/);
});

test('le cinque panoramiche WebP e i relativi crediti sono presenti',()=>{
  const doc=fs.readFileSync(path.join(root,'DATA_SOURCE.md'),'utf8');
  const credits=fs.readFileSync(path.join(root,'assets/circuits/CREDITS.md'),'utf8');
  for(const key of ['monza','spa','nurburgring','redbull','suzuka']){
    const relative=`assets/circuits/${key}.webp`,file=path.join(root,relative),buffer=fs.readFileSync(file);
    assert.match(doc,new RegExp(relative.replace('.','\\.')));
    assert.ok(buffer.length<600_000,`${relative} pesa ${buffer.length} byte`);
    assert.equal(buffer.subarray(0,4).toString('ascii'),'RIFF',relative);
    assert.equal(buffer.subarray(8,12).toString('ascii'),'WEBP',relative);
    assert.match(credits,new RegExp(`${key}\\.webp`));
  }
});

test('le viste prevedono un riepilogo discreto dello scarto soltanto quando presente',()=>{
  assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/discard-note/);
  assert.match(fs.readFileSync(path.join(root,'driver.html'),'utf8'),/discard-summary/);
  assert.match(fs.readFileSync(path.join(root,'race.html'),'utf8'),/discarded-result/);
});

test('il regolamento espone la regola 9 su 10 e conserva le regole ufficiali',()=>{
  const rules=fs.readFileSync(path.join(root,'regolamento.html'),'utf8');
  for(const text of ['ART TROFEO DUAL-CLASS','Aggiornato al 06/09/2026','migliori 9 risultati su 10','DNF','DNS','DSQ','NON può essere scartato','20 secondi','WhatsApp','21:45'])assert.ok(rules.includes(text),text);
});

test('la documentazione descrive STATO e DSQ non scartabile',()=>{
  const doc=fs.readFileSync(path.join(root,'DATA_SOURCE.md'),'utf8');
  for(const text of ['STATO','FINISH','DNF','DNS','DSQ','non è mai scartabile','9 risultati su 10'])assert.ok(doc.includes(text),text);
});
