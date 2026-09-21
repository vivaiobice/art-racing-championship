const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const publicPages=['driver.html','race.html','regolamento.html','lobby.html'];

test('root e 404 mostrano esclusivamente la pagina di sospensione',()=>{
  for(const page of ['index.html','404.html']){
    const html=read(page);
    assert.match(html,/id="site-stop"/i,page);
    assert.match(html,/temporaneamente offline/i,page);
    assert.doesNotMatch(html,/id="dashboard"/i,page);
  }
});

test('le pagine pubbliche reindirizzano alla root prima di mostrare contenuti',()=>{
  for(const page of publicPages){
    const html=read(page);
    const head=html.match(/<head>([\s\S]*?)<\/head>/i)?.[1]||'';
    assert.match(head,/http-equiv="refresh" content="0;url=\.\/"/i,page);
    assert.match(head,/location\.replace\("\.\/"\)/,page);
    assert.ok(head.indexOf('location.replace("./")')<head.indexOf('rel="stylesheet"'),page);
  }
});

test('il service worker usa una cache nuova e serve lo stop a ogni navigazione',()=>{
  const sw=read('sw.js');
  assert.match(sw,/art-racing-offline-v1/);
  assert.match(sw,/request\.mode\s*===\s*["']navigate["']/);
  assert.match(sw,/Response\.redirect/);
  assert.match(sw,/caches\.match\(["']\.\/index\.html["']/);
  assert.match(sw,/client\.navigate\(["']\.\/["']\)/);
  assert.match(sw,/cached\s*\|\|\s*fetch\(event\.request\)/);
  assert.doesNotMatch(sw,/race\.html|driver\.html|lobby\.html|regolamento\.html/);
  new vm.Script(sw,{filename:'sw.js'});
});

test('manifest avvia la PWA dalla root sospesa',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url,'./');
});
