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
    assert.ok(html.indexOf('data.js?v=7')>=0,page);
    assert.ok(html.indexOf('js/live-data.js?v=7')>html.indexOf('data.js?v=7'),page);
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

test('il service worker precachea il client live ma non intercetta i CSV Google',()=>{
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.match(sw,/js\/live-data\.js/);
  assert.match(sw,/googleusercontent\.com/);
});

test('heroImage è documentato senza creare panoramiche fittizie',()=>{
  const doc=fs.readFileSync(path.join(root,'DATA_SOURCE.md'),'utf8');
  for(const key of ['monza','spa','nurburgring','redbull','suzuka'])assert.match(doc,new RegExp(`assets/circuits/${key}\\.webp`));
  assert.equal(fs.existsSync(path.join(root,'assets/circuits')),false);
});
