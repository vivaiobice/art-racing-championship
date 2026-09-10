const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function loadFallback(){
  const context={};vm.createContext(context);
  vm.runInContext(`${fs.readFileSync('data.js','utf8')};globalThis.exported={RACES,LOBBY_SECTIONS,LOCAL_DATA}`,context);
  return context.exported;
}

test('fallback contiene il roster ufficiale di 20 piloti attivi',()=>{
  const {LOCAL_DATA}=loadFallback(),drivers=LOCAL_DATA.piloti;
  assert.equal(drivers.length,20);
  assert.equal(drivers.some(driver=>driver.name==='MAX008'),false);
  assert.deepEqual(drivers.map(driver=>driver.id).filter(Boolean).length,20);
});

test('fallback include EIDEN, GABRY e Nano94 corretti',()=>{
  const {LOCAL_DATA}=loadFallback(),drivers=LOCAL_DATA.piloti;
  const eiden=drivers.find(driver=>driver.id==='eiden'),gabry=drivers.find(driver=>driver.id==='gabry'),nano=drivers.find(driver=>driver.id==='nano94');
  assert.deepEqual({number:eiden.number,psn:eiden.psn,category:eiden.category,team:eiden.team},{number:15,psn:'xiimeet',category:'JUNIOR',team:'Nissan'});
  assert.deepEqual({number:gabry.number,psn:gabry.psn,category:gabry.category,team:gabry.team},{number:34,psn:'GABRY_thecat_',category:'MASTER',team:'Nissan'});
  assert.deepEqual({name:nano.name,number:nano.number,psn:nano.psn},{name:'Nano94',number:2,psn:'AdamantionX94'});
});

test('fallback ha scuderie ufficiali e statistiche a zero',()=>{
  const {LOCAL_DATA}=loadFallback(),DRIVERS=LOCAL_DATA.piloti;
  const teams={Nano94:'Porsche',LELE:'Mercedes',PABLITO75:'Porsche',AVALLONE92:'Porsche',GAEGAE17:'Porsche',EIDEN:'Nissan',CLDC:'Ferrari',ENERGYMAURI:'Ferrari',GABRY:'Nissan',SKIZZO:'Mercedes',CALIBRA63:'Porsche',JOSEPH:'Toyota',SOVRANO:'Mercedes',IVISICH:'Ferrari',GIO:'Porsche',ZYX:'Nissan',YANNIS:'Porsche',FAX:'Porsche',IVAN:'Ferrari',FRA:'Porsche'};
  for(const driver of DRIVERS){assert.equal(driver.team,teams[driver.name],driver.name);for(const key of ['points','races','wins','seconds','thirds','poles','fastest','gr3Points','gr4Points','gr3Races','gr4Races'])assert.equal(driver[key],0,`${driver.name}.${key}`);}
});

test('LOCAL_DATA espone fallback completo e dieci gare',()=>{
  const {RACES,LOCAL_DATA}=loadFallback();
  assert.strictEqual(LOCAL_DATA.gare,RACES);
  assert.equal(RACES.length,10);assert.equal(LOCAL_DATA.qualifiche.length,0);assert.equal(LOCAL_DATA.risultati.length,0);assert.equal(LOCAL_DATA.classifiche.length,0);
});
