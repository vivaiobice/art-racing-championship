const test=require('node:test');
const assert=require('node:assert/strict');
const LiveData=require('../js/live-data.js');

const fallback={
  piloti:[{id:'local',number:99,name:'Locale',active:true}],
  gare:[{n:1,c:'Locale'}],qualifiche:[],risultati:[],classifiche:[],config:{}
};

test('parseCSV gestisce campi quotati, virgole, virgolette, CRLF, Unicode e vuoti',()=>{
  const rows=LiveData.parseCSV('ID,NOTE,EMPTY\r\nuno,"test, con ""virgolette""",\r\ndue,è,\r\n');
  assert.deepEqual(rows,[
    {ID:'uno',NOTE:'test, con "virgolette"',EMPTY:''},
    {ID:'due',NOTE:'è',EMPTY:''}
  ]);
});

test('normalizza numeri e boolean senza convertire celle vuote',()=>{
  assert.equal(LiveData.normalizeNumber(' 34 '),34);
  assert.equal(LiveData.normalizeNumber(''),null);
  assert.equal(LiveData.normalizeNumber('abc'),null);
  assert.equal(LiveData.normalizeBoolean('SÌ'),true);
  assert.equal(LiveData.normalizeBoolean('FALSE'),false);
  assert.equal(LiveData.normalizeBoolean(''),null);
});

test('mappa roster e gare nella shape del sito',()=>{
  const piloti=LiveData.mapPiloti(LiveData.parseCSV('ID,N°,PILOTA,PSN,PAESE,CATEGORIA,SCUDERIA,ATTIVO\neiden,15,EIDEN,xiimeet,ES,JUNIOR,Nissan,TRUE\nmax,3,MAX008,max,IT,JUNIOR,,FALSE'));
  assert.equal(piloti.length,1);
  for(const [key,value] of Object.entries({id:'eiden',number:15,name:'EIDEN',psn:'xiimeet',flag:'🇪🇸',category:'JUNIOR',team:'Nissan',points:0,races:0}))assert.equal(piloti[0][key],value);
  const gare=LiveData.mapGare(LiveData.parseCSV('GARA,DATA,ORA,CIRCUITO,PAESE,CLASSE,GIRI,CARBURANTE_X,GOMME_X,QUALIFICA_MIN,PIOGGIA_POSSIBILE,STATO\n10,2026-11-13,21:45,Suzuka,JP,GR.4,13,2,3,10,FALSE,IN PROGRAMMA'));
  for(const [key,value] of Object.entries({n:10,c:'Suzuka',key:'suzuka',flag:'🇯🇵',cat:'GR4',laps:13,fuel:2,tyres:3,qual:10,heroImage:'assets/circuits/suzuka.webp'}))assert.equal(gare[0][key],value);
});

test('heroImage usa il circuito come fallback e accetta soltanto override locali sicuri',()=>{
  const names=['Autodromo Nazionale Monza','Spa-Francorchamps','Nürburgring GP','Red Bull Ring','Suzuka'];
  const rows=names.map((CIRCUITO,index)=>({GARA:String(index+1),DATA:'2026-09-10',ORA:'21:45',CIRCUITO,PAESE:'IT',CLASSE:'GR.3',HERO_IMAGE:index===1?'https://example.com/spa.jpg':''}));
  rows.push({GARA:'6',DATA:'2026-09-10',ORA:'21:45',CIRCUITO:'Nürburgring GP',PAESE:'DE',CLASSE:'GR.3',HERO_IMAGE:'assets/circuits/redbull.webp'});
  rows.push({GARA:'7',DATA:'2026-09-10',ORA:'21:45',CIRCUITO:'Monza',PAESE:'IT',CLASSE:'GR.3',HERO_IMAGE:'assets/circuits/custom.webp'});
  rows.push({GARA:'8',DATA:'2026-09-10',ORA:'21:45',CIRCUITO:'Circuito sconosciuto',PAESE:'IT',CLASSE:'GR.3',HERO_IMAGE:'../secret.jpg'});
  assert.deepEqual(LiveData.mapGare(rows).map(race=>race.heroImage),[
    'assets/circuits/monza.webp','assets/circuits/spa.webp','assets/circuits/nurburgring.webp','assets/circuits/redbull.webp','assets/circuits/suzuka.webp','assets/circuits/redbull.webp','assets/circuits/monza.webp',null
  ]);
});

test('filtra qualifiche, risultati e classifiche su piloti del roster',()=>{
  const ids=new Set(['eiden']);
  const q=LiveData.mapQualifiche(LiveData.parseCSV('GARA,POS,PILOTA_ID,TEMPO,POLE,NOTE\n1,1,eiden,1:20.000,TRUE,ok\n1,2,estraneo,1:21.000,FALSE,no'),ids);
  const r=LiveData.mapRisultati(LiveData.parseCSV('GARA,POS,PILOTA_ID,TEMPO_DISTACCO,GIRO_VELOCE,PENALITA_SEC,PRESENTE,PUNTI_BASE,BONUS_POLE,BONUS_GV,PUNTI_TOTALI,NOTE\n1,1,eiden,0,TRUE,0,TRUE,25,1,1,27,ok\n1,2,estraneo,+1,FALSE,0,TRUE,18,0,0,18,no'),ids);
  const c=LiveData.mapClassifiche(LiveData.parseCSV('POS,PILOTA_ID,PILOTA,CATEGORIA,SCUDERIA,PUNTI,GARE,VITTORIE,PODI,POLE,GIRI_VELOCI,ASSENZE\n1,eiden,EIDEN,JUNIOR,Nissan,0,0,0,0,0,0,0\n2,estraneo,X,MASTER,X,10,1,1,1,0,0,0'),ids);
  assert.equal(q.length,1);assert.equal(r.length,1);assert.equal(c.length,1);
  assert.equal(r[0].points,27);assert.equal(r[0].fastest,true);
});

test('risultati normalizzano FINISH, DNF, DNS, DSQ e calcolano i bonus mancanti',()=>{
  const rows=LiveData.mapRisultati([
    {GARA:'1',PILOTA_ID:'uno',PRESENTE:'TRUE',PUNTI_BASE:'25',BONUS_POLE:'1',BONUS_GV:'1',PUNTI_TOTALI:'',STATO:''},
    {GARA:'2',PILOTA_ID:'uno',PRESENTE:'TRUE',PUNTI_TOTALE:'0',STATO:'dnf'},
    {GARA:'3',PILOTA_ID:'uno',PRESENTE:'FALSE',PUNTI_TOTALI:'0',STATO:''},
    {GARA:'4',PILOTA_ID:'uno',PRESENTE:'TRUE',PUNTI_TOTALI:'0',STATO:'DSQ'}
  ],new Set(['uno']));
  assert.deepEqual(rows.map(row=>row.status),['FINISH','DNF','DNS','DSQ']);
  assert.equal(rows[0].points,27);
});

test('con dieci FINISH scarta il round con meno punti',()=>{
  const summary=LiveData.calculateChampionship([25,18,15,12,10,8,6,4,2,1].map((points,index)=>({race:index+1,status:'FINISH',points})));
  assert.deepEqual({gross:summary.grossPoints,discard:summary.discardPoints,valid:summary.validPoints,round:summary.discardedRound},{gross:101,discard:1,valid:100,round:10});
});

test('DNS e DNF sono scartabili',()=>{
  const positive=Array.from({length:9},(_,index)=>({race:index+1,status:'FINISH',points:index+1}));
  const dns=LiveData.calculateChampionship([...positive,{race:10,status:'DNS',points:0}]);
  const dnf=LiveData.calculateChampionship([{race:1,status:'DNF',points:0},...positive.map(row=>({...row,race:row.race+1}))]);
  assert.equal(dns.discardedRound,10);assert.equal(dns.discardPoints,0);
  assert.equal(dnf.discardedRound,1);assert.equal(dnf.discardPoints,0);
});

test('DSQ non è mai scartabile anche quando vale zero',()=>{
  const rounds=[{race:1,status:'DSQ',points:0},{race:2,status:'FINISH',points:1},...Array.from({length:8},(_,index)=>({race:index+3,status:'FINISH',points:index+2}))];
  const summary=LiveData.calculateChampionship(rounds);
  assert.equal(summary.discardedRound,2);assert.equal(summary.discardPoints,1);assert.equal(summary.rounds.find(row=>row.race===1).discarded,false);
});

test('pole e giro veloce entrano nel round prima dello scarto',()=>{
  const rounds=[{race:1,status:'FINISH',basePoints:1,poleBonus:1,fastestBonus:1},...Array.from({length:9},(_,index)=>({race:index+2,status:'FINISH',points:index+4}))];
  const summary=LiveData.calculateChampionship(rounds);
  assert.equal(summary.rounds[0].points,3);assert.equal(summary.discardedRound,1);assert.equal(summary.discardPoints,3);
});

test('fino a nove round non scarta e dal decimo scarta esattamente un candidato',()=>{
  const nine=Array.from({length:9},(_,index)=>({race:index+1,status:'FINISH',points:index}));
  const before=LiveData.calculateChampionship(nine),after=LiveData.calculateChampionship([...nine,{race:10,status:'DSQ',points:0}]);
  assert.equal(before.discardedRound,null);assert.equal(before.validPoints,before.grossPoints);
  assert.equal(after.rounds.filter(row=>row.discarded).length,1);assert.equal(after.discardedRound,1);
});

test('applyStats applica lo stesso scarto a generale, categorie e GR3/GR4',()=>{
  const drivers=[
    {id:'master',number:1,name:'Master',category:'MASTER'},
    {id:'junior',number:2,name:'Junior',category:'JUNIOR'}
  ];
  const races=Array.from({length:10},(_,index)=>({n:index+1,cat:index<5?'GR3':'GR4'}));
  const results=drivers.flatMap((driver,driverIndex)=>races.map((race,index)=>({race:race.n,driverId:driver.id,status:'FINISH',present:true,pos:driverIndex+1,points:index+1,fastest:false})));
  const ranked=LiveData.applyStats(drivers,races,[],results,[]);
  for(const driver of ranked){assert.equal(driver.grossPoints,55);assert.equal(driver.discardPoints,1);assert.equal(driver.points,54);assert.equal(driver.gr3Points,14);assert.equal(driver.gr4Points,40);}
  assert.equal(ranked.filter(d=>d.category==='MASTER').length,1);assert.equal(ranked.filter(d=>d.category==='JUNIOR').length,1);
});

test('tie-break confronta vittorie, piazzamenti successivi e ultima gara comune',()=>{
  const base={points:100,number:1,placements:{},rounds:[]};
  assert.ok(LiveData.compareDrivers({...base,wins:1,placements:{1:1}},{...base,number:2,wins:2,placements:{1:2}})>0);
  assert.ok(LiveData.compareDrivers({...base,wins:1,placements:{1:1,2:1}},{...base,number:2,wins:1,placements:{1:1,2:2}})>0);
  const a={...base,wins:1,placements:{1:1,2:1},rounds:[{race:1,status:'FINISH',pos:1},{race:2,status:'FINISH',pos:2}]};
  const b={...base,number:2,wins:1,placements:{1:1,2:1},rounds:[{race:1,status:'FINISH',pos:2},{race:2,status:'FINISH',pos:1}]};
  assert.ok(LiveData.compareDrivers(a,b)>0);
});

test('una richiesta per dataset viene condivisa e getAll restituisce dati live',async()=>{
  const csv={
    piloti:'ID,N°,PILOTA,PSN,PAESE,CATEGORIA,SCUDERIA,ATTIVO\neiden,15,EIDEN,xiimeet,ES,JUNIOR,Nissan,TRUE',
    gare:'GARA,DATA,ORA,CIRCUITO,PAESE,CLASSE,GIRI,CARBURANTE_X,GOMME_X,QUALIFICA_MIN,PIOGGIA_POSSIBILE,STATO\n1,2026-09-11,21:45,Monza,IT,GR.3,18,3,4,10,FALSE,PROSSIMA',
    qualifiche:'GARA,POS,PILOTA_ID,TEMPO,POLE,NOTE',risultati:'GARA,POS,PILOTA_ID,TEMPO_DISTACCO,GIRO_VELOCE,PENALITA_SEC,PRESENTE,PUNTI_BASE,BONUS_POLE,BONUS_GV,PUNTI_TOTALI,NOTE',
    classifiche:'POS,PILOTA_ID,PILOTA,CATEGORIA,SCUDERIA,PUNTI,GARE,VITTORIE,PODI,POLE,GIRI_VELOCI,ASSENZE',config:'CHIAVE,VALORE\nbonus_pole,1'
  };
  let calls=0;
  const client=LiveData.createClient({fallback,fetchImpl:async url=>{calls++;const key=Object.keys(LiveData.ENDPOINTS).find(k=>url===LiveData.ENDPOINTS[k]);return {ok:true,headers:{get:()=> 'text/csv'},text:async()=>csv[key]};}});
  const [a,b]=await Promise.all([client.getPiloti(),client.getPiloti()]);
  assert.strictEqual(a,b);assert.equal(calls,1);
  const all=await client.getAll();assert.equal(all.piloti[0].name,'EIDEN');assert.equal(calls,6);
});

test('errore rete usa fallback non vuoto senza rigettare',async()=>{
  const client=LiveData.createClient({fallback,fetchImpl:async()=>{throw new Error('offline')}});
  const all=await client.getAll();
  assert.equal(all.piloti[0].id,'local');assert.equal(all.piloti[0].points,0);assert.deepEqual(all.gare,fallback.gare);
});
