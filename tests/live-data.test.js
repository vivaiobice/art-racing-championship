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
  for(const [key,value] of Object.entries({n:10,c:'Suzuka',key:'suzuka',flag:'🇯🇵',cat:'GR4',laps:13,fuel:2,tyres:3,qual:10,heroImage:null}))assert.equal(gare[0][key],value);
});

test('heroImage accetta soltanto asset locali per circuiti',()=>{
  const rows=[
    {GARA:'1',DATA:'2026-09-10',ORA:'21:45',CIRCUITO:'Monza',PAESE:'IT',CLASSE:'GR.3',HERO_IMAGE:'assets/circuits/monza.webp'},
    {GARA:'2',DATA:'2026-09-17',ORA:'21:45',CIRCUITO:'Spa',PAESE:'BE',CLASSE:'GR.3',HERO_IMAGE:'https://example.com/spa.jpg'}
  ];
  assert.equal(LiveData.mapGare(rows)[0].heroImage,'assets/circuits/monza.webp');
  assert.equal(LiveData.mapGare(rows)[1].heroImage,null);
});

test('filtra qualifiche, risultati e classifiche su piloti del roster',()=>{
  const ids=new Set(['eiden']);
  const q=LiveData.mapQualifiche(LiveData.parseCSV('GARA,POS,PILOTA_ID,TEMPO,POLE,NOTE\n1,1,eiden,1:20.000,TRUE,ok\n1,2,estraneo,1:21.000,FALSE,no'),ids);
  const r=LiveData.mapRisultati(LiveData.parseCSV('GARA,POS,PILOTA_ID,TEMPO_DISTACCO,GIRO_VELOCE,PENALITA_SEC,PRESENTE,PUNTI_BASE,BONUS_POLE,BONUS_GV,PUNTI_TOTALI,NOTE\n1,1,eiden,0,TRUE,0,TRUE,25,1,1,27,ok\n1,2,estraneo,+1,FALSE,0,TRUE,18,0,0,18,no'),ids);
  const c=LiveData.mapClassifiche(LiveData.parseCSV('POS,PILOTA_ID,PILOTA,CATEGORIA,SCUDERIA,PUNTI,GARE,VITTORIE,PODI,POLE,GIRI_VELOCI,ASSENZE\n1,eiden,EIDEN,JUNIOR,Nissan,0,0,0,0,0,0,0\n2,estraneo,X,MASTER,X,10,1,1,1,0,0,0'),ids);
  assert.equal(q.length,1);assert.equal(r.length,1);assert.equal(c.length,1);
  assert.equal(r[0].points,27);assert.equal(r[0].fastest,true);
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
